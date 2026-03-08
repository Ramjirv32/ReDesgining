package bookingctrl

import (
	"ticpin-backend/models"
	bookingsvc "ticpin-backend/services/booking"
	couponsvc "ticpin-backend/services/coupon"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateDiningBooking(c *fiber.Ctx) error {
	var req struct {
		UserEmail      string  `json:"user_email"`
		DiningID       string  `json:"dining_id"`
		VenueName      string  `json:"venue_name"`
		Date           string  `json:"date"`
		TimeSlot       string  `json:"time_slot"`
		Guests         int     `json:"guests"`
		OrderAmount    float64 `json:"order_amount"`
		BookingFee     float64 `json:"booking_fee"`
		CouponCode     string  `json:"coupon_code"`
		OfferID        string  `json:"offer_id"`
		UserID         string  `json:"user_id"`
		PaymentID      string  `json:"payment_id"`
		PaymentGateway string  `json:"payment_gateway"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request: " + err.Error()})
	}
	if req.UserEmail == "" {
		return c.Status(400).JSON(fiber.Map{"error": "user_email is required"})
	}
	if req.DiningID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "dining_id is required"})
	}
	if req.Date == "" || req.TimeSlot == "" {
		return c.Status(400).JSON(fiber.Map{"error": "date and time_slot are required"})
	}
	if req.Guests <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "guests must be at least 1"})
	}

	diningObjID, err := primitive.ObjectIDFromHex(req.DiningID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid dining_id"})
	}

	var discountAmount float64
	var appliedCouponCode string
	var couponIDToIncrement primitive.ObjectID
	var couponMaxUses int
	if req.CouponCode != "" {
		result, err := couponsvc.Validate(req.CouponCode, req.DiningID, req.OrderAmount, req.UserID)
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

	if !couponIDToIncrement.IsZero() {
		_ = couponsvc.IncrementUsage(couponIDToIncrement, couponMaxUses)
	}

	return c.Status(201).JSON(fiber.Map{
		"message":         "dining booking confirmed",
		"booking_id":      booking.ID.Hex(),
		"grand_total":     grandTotal,
		"discount_amount": discountAmount,
	})
}
