package bookingctrl

import (
	"context"
	"ticpin-backend/config"
	"ticpin-backend/models"
	bookingsvc "ticpin-backend/services/booking"
	couponsvc "ticpin-backend/services/coupon"
	playservice "ticpin-backend/services/play"
	"time"

	"net/url"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreatePlayBooking(c *fiber.Ctx) error {
	var req struct {
		UserEmail      string                 `json:"user_email"`
		UserName       string                 `json:"user_name"`
		PlayID         string                 `json:"play_id"`
		VenueName      string                 `json:"venue_name"`
		Date           string                 `json:"date"`
		Slot           string                 `json:"slot"`
		Duration       int                    `json:"duration"`
		Tickets        []models.BookingTicket `json:"tickets"`
		OrderAmount    float64                `json:"order_amount"`
		BookingFee     float64                `json:"booking_fee"`
		CouponCode     string                 `json:"coupon_code"`
		OfferID        string                 `json:"offer_id"`
		UserID         string                 `json:"user_id"`
		PaymentID      string                 `json:"payment_id"`
		PaymentGateway string                 `json:"payment_gateway"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request: " + err.Error()})
	}
	if req.UserEmail == "" {
		return c.Status(400).JSON(fiber.Map{"error": "user_email is required"})
	}
	if req.UserName == "" || len(req.UserName) < 3 {
		return c.Status(400).JSON(fiber.Map{"error": "name must be at least 3 characters"})
	}

	// Check email uniqueness - must NOT exist in users or organizers collection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingUser bson.M
	err := config.UsersCol.FindOne(ctx, bson.M{"email": req.UserEmail}).Decode(&existingUser)
	if err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "email already registered as a user. please login or use a different email"})
	}

	var existingOrg bson.M
	err = config.OrgsCol.FindOne(ctx, bson.M{"email": req.UserEmail}).Decode(&existingOrg)
	if err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "email already registered as an organizer. please use a different email"})
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
		result, err := couponsvc.Validate(req.CouponCode, req.PlayID, req.OrderAmount, req.UserID)
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
		UserID:         req.UserID,
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

	if !couponIDToIncrement.IsZero() {
		_ = couponsvc.IncrementUsage(couponIDToIncrement, couponMaxUses)
	}

	return c.Status(201).JSON(fiber.Map{
		"message":         "play booking confirmed",
		"booking_id":      booking.ID.Hex(),
		"grand_total":     grandTotal,
		"discount_amount": discountAmount,
	})
}

func GetPlaySlotAvailability(c *fiber.Ctx) error {
	playID := c.Params("id")
	// Robustly decode the ID to handle single or double encoding (e.g. %20 or %2520)
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
