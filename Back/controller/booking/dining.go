package bookingctrl

import (
	"context"
	"fmt"
	"ticpin-backend/config"
	"ticpin-backend/models"
	bookingsvc "ticpin-backend/services/booking"
	couponsvc "ticpin-backend/services/coupon"
	"ticpin-backend/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateDiningBooking(c *fiber.Ctx) error {
	var req struct {
		UserEmail      string  `json:"user_email" validate:"required,email"`
		UserName       string  `json:"user_name" validate:"required,min=3,max=50"`
		UserPhone      string  `json:"user_phone"`
		Address        string  `json:"address"`
		City           string  `json:"city"`
		State          string  `json:"state"`
		Pincode        string  `json:"pincode"`
		Nationality    string  `json:"nationality"`
		DiningID       string  `json:"dining_id" validate:"required"`
		VenueName      string  `json:"venue_name" validate:"required,min=2,max=100"`
		Date           string  `json:"date" validate:"required"`
		TimeSlot       string  `json:"time_slot" validate:"required"`
		Guests         int     `json:"guests" validate:"required,min=1,max=20"`
		OrderAmount    float64 `json:"order_amount" validate:"required,min=0"`
		BookingFee     float64 `json:"booking_fee" validate:"min=0"`
		CouponCode     string  `json:"coupon_code" validate:"omitempty,max=20"`
		OfferID        string  `json:"offer_id" validate:"omitempty"`
		UserID         string  `json:"user_id" validate:"omitempty"`
		PaymentID      string  `json:"payment_id" validate:"required"`
		PaymentGateway string  `json:"payment_gateway" validate:"required,min=2,max=50"`
	}

	if err := utils.ParseAndValidate(c, &req); err != nil {
		return err
	}

	fmt.Printf("DEBUG: CreateDiningBooking - DiningID: %s, User: %s, PaymentID: %s\n",
		req.DiningID, req.UserEmail, req.PaymentID)

	// Check if booking with this payment_id already exists
	if req.PaymentID != "" {
		var existing models.DiningBooking
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := config.DiningBookingsCol.FindOne(ctx, bson.M{"payment_id": req.PaymentID}).Decode(&existing); err == nil {
			return c.Status(200).JSON(fiber.Map{
				"message":         "dining booking already confirmed",
				"booking_id":      existing.BookingID,
				"id":              existing.ID.Hex(),
				"grand_total":     existing.GrandTotal,
				"discount_amount": existing.DiscountAmount,
				"status":          existing.Status,
			})
		}
	}
	diningObjID, err := primitive.ObjectIDFromHex(req.DiningID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid dining_id"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingBooking bson.M
	err = config.DiningBookingsCol.FindOne(ctx, bson.M{
		"user_email": req.UserEmail,
		"dining_id":  diningObjID,
		"date":       req.Date,
		"time_slot":  req.TimeSlot,
		"status":     bson.M{"$ne": "cancelled"},
	}).Decode(&existingBooking)
	if err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "you already have a booking for this time slot"})
	}
	if req.Date == "" || req.TimeSlot == "" {
		return c.Status(400).JSON(fiber.Map{"error": "date and time_slot are required"})
	}
	if req.Guests <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "guests must be at least 1"})
	}

	var discountAmount float64
	var appliedCouponCode string
	var couponIDToIncrement primitive.ObjectID
	var couponMaxUses int
	if req.CouponCode != "" {
		result, err := couponsvc.Validate(req.CouponCode, req.DiningID, req.OrderAmount, req.UserID, req.UserEmail)
		if err == nil {
			discountAmount = result.DiscountAmount
			appliedCouponCode = result.Coupon.Code
			couponIDToIncrement = result.Coupon.ID
			couponMaxUses = result.Coupon.MaxUses
		}
	}

	var offerObjID primitive.ObjectID
	if req.OfferID != "" {
		offerObjID, _ = primitive.ObjectIDFromHex(req.OfferID)
	}

	grandTotal := req.OrderAmount + req.BookingFee - discountAmount
	if grandTotal < 0 {
		grandTotal = 0
	}

	booking := &models.DiningBooking{
		UserEmail:      req.UserEmail,
		UserName:       req.UserName,
		UserPhone:      req.UserPhone,
		UserID:         req.UserID,
		Address:        req.Address,
		City:           req.City,
		State:          req.State,
		Pincode:        req.Pincode,
		Nationality:    req.Nationality,
		DiningID:       diningObjID,
		VenueName:      req.VenueName,
		Date:           req.Date,
		TimeSlot:       req.TimeSlot,
		Guests:         req.Guests,
		OrderAmount:    req.OrderAmount,
		BookingFee:     req.BookingFee,
		DiscountAmount: discountAmount,
		CouponCode:     appliedCouponCode,
		OfferID:        offerObjID,
		GrandTotal:     grandTotal,
		PaymentID:      req.PaymentID,
		PaymentGateway: req.PaymentGateway,
		Status:         "booked",
	}

	if err := bookingsvc.CreateDining(booking); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	bookingID := booking.ID.Hex()

	if !couponIDToIncrement.IsZero() {
		_ = couponsvc.IncrementUsage(couponIDToIncrement, couponMaxUses, req.UserID, req.UserEmail, bookingID, grandTotal)
	}

	return c.Status(201).JSON(fiber.Map{
		"message":         "dining booking confirmed",
		"booking_id":      booking.BookingID,
		"id":              booking.ID.Hex(),
		"grand_total":     grandTotal,
		"discount_amount": discountAmount,
		"status":          "booked",
	})
}
