package bookingctrl

import (
	"context"
	"fmt"
	"net/url"
	"ticpin-backend/config"
	"ticpin-backend/models"
	bookingsvc "ticpin-backend/services/booking"
	couponsvc "ticpin-backend/services/coupon"
	playservice "ticpin-backend/services/play"
	"ticpin-backend/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreatePlayBooking(c *fiber.Ctx) error {
	var req struct {
		UserEmail      string                 `json:"user_email" validate:"required,email"`
		UserName       string                 `json:"user_name" validate:"required,min=3,max=50"`
		UserPhone      string                 `json:"user_phone"`
		Address        string                 `json:"address"`
		City           string                 `json:"city"`
		State          string                 `json:"state"`
		Pincode        string                 `json:"pincode"`
		Nationality    string                 `json:"nationality"`
		PlayID         string                 `json:"play_id" validate:"required"`
		VenueName      string                 `json:"venue_name" validate:"required,min=2,max=100"`
		Date           string                 `json:"date" validate:"required"`
		Slot           string                 `json:"slot" validate:"required"`
		Duration       int                    `json:"duration" validate:"min=1,max=16"`
		Tickets        []models.BookingTicket `json:"tickets" validate:"required,min=1,dive"`
		OrderAmount    float64                `json:"order_amount" validate:"required,min=0"`
		BookingFee     float64                `json:"booking_fee" validate:"min=0"`
		CouponCode     string                 `json:"coupon_code" validate:"omitempty,max=20"`
		OfferID        string                 `json:"offer_id" validate:"omitempty"`
		UserID         string                 `json:"user_id" validate:"omitempty"`
		PaymentID      string                 `json:"payment_id" validate:"required"`
		PaymentGateway string                 `json:"payment_gateway" validate:"required,min=2,max=50"`
	}

	if err := utils.ParseAndValidate(c, &req); err != nil {
		return err
	}

	fmt.Printf("DEBUG: CreatePlayBooking - PlayID: %s, User: %s, PaymentID: %s\n", 
		req.PlayID, req.UserEmail, req.PaymentID)

	// Check if booking with this payment_id already exists
	if req.PaymentID != "" {
		var existing models.PlayBooking
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := config.PlayBookingsCol.FindOne(ctx, bson.M{"payment_id": req.PaymentID}).Decode(&existing); err == nil {
			return c.Status(200).JSON(fiber.Map{
				"message":         "play booking already confirmed",
				"booking_id":      existing.BookingID,
				"id":              existing.ID.Hex(),
				"grand_total":     existing.GrandTotal,
				"discount_amount": existing.DiscountAmount,
				"status":          existing.Status,
			})
		}
	}

	if req.PlayID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "play_id is required"})
	}
	if req.Date == "" || req.Slot == "" {
		return c.Status(400).JSON(fiber.Map{"error": "date and slot are required"})
	}
	if len(req.Tickets) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "at least one court/ticket is required"})
	}

	play, err := playservice.GetByID(req.PlayID, false)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "play not found"})
	}
	playObjID := play.ID

	var discountAmount float64
	var appliedCouponCode string
	var couponIDToIncrement primitive.ObjectID
	var couponMaxUses int
	if req.CouponCode != "" {
		result, err := couponsvc.Validate(req.CouponCode, req.PlayID, req.OrderAmount, req.UserID, req.UserEmail)
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

	duration := req.Duration
	if duration <= 0 {
		duration = 1
	}

	booking := &models.PlayBooking{
		UserEmail:      req.UserEmail,
		UserName:       req.UserName,
		UserPhone:      req.UserPhone,
		UserID:         req.UserID,
		Address:        req.Address,
		City:           req.City,
		State:          req.State,
		Pincode:        req.Pincode,
		Nationality:    req.Nationality,
		PlayID:         playObjID,
		VenueName:      req.VenueName,
		Date:           req.Date,
		Slot:           req.Slot,
		Duration:       duration,
		Tickets:        req.Tickets,
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

	if err := bookingsvc.CreatePlay(booking); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	bookingID := booking.ID.Hex()

	if !couponIDToIncrement.IsZero() {
		_ = couponsvc.IncrementUsage(couponIDToIncrement, couponMaxUses, req.UserID, req.UserEmail, bookingID, grandTotal)
	}

	return c.Status(201).JSON(fiber.Map{
		"message":         "play booking confirmed",
		"booking_id":      booking.BookingID,
		"id":              booking.ID.Hex(),
		"grand_total":     grandTotal,
		"discount_amount": discountAmount,
		"status":          "booked",
	})
}

func GetPlaySlotAvailability(c *fiber.Ctx) error {
	playID := c.Params("id")

	for {
		decoded, err := url.PathUnescape(playID)
		if err != nil || decoded == playID {
			break
		}
		playID = decoded
	}

	date := c.Query("date")
	if date == "" {
		return c.Status(400).JSON(fiber.Map{"error": "date query param is required (YYYY-MM-DD)"})
	}

	play, err := playservice.GetByID(playID, false)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "play not found"})
	}

	slots, err := bookingsvc.GetPlayBookedSlots(play.ID.Hex(), date)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"booked_slots": slots})
}
