package bookingctrl

import (
	"context"
	"ticpin-backend/config"
	"ticpin-backend/models"
	bookingsvc "ticpin-backend/services/booking"
	couponsvc "ticpin-backend/services/coupon"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CreateEventBooking handles POST /api/bookings/events
func CreateEventBooking(c *fiber.Ctx) error {
	var req struct {
		UserEmail   string                 `json:"user_email"`
		EventID     string                 `json:"event_id"`
		EventName   string                 `json:"event_name"`
		Tickets     []models.BookingTicket `json:"tickets"`
		OrderAmount float64                `json:"order_amount"`
		BookingFee  float64                `json:"booking_fee"`
		CouponCode  string                 `json:"coupon_code"`
		OfferID     string                 `json:"offer_id"`
		UserID      string                 `json:"user_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request: " + err.Error()})
	}
	if req.UserEmail == "" {
		return c.Status(400).JSON(fiber.Map{"error": "user_email is required"})
	}
	if req.EventID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "event_id is required"})
	}
	if len(req.Tickets) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "at least one ticket is required"})
	}

	eventObjID, err := primitive.ObjectIDFromHex(req.EventID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid event_id"})
	}

	// Apply coupon discount if provided
	var discountAmount float64
	var appliedCouponCode string
	var couponIDToIncrement primitive.ObjectID
	var couponMaxUses int
	if req.CouponCode != "" {
		result, err := couponsvc.Validate(req.CouponCode, req.EventID, req.OrderAmount, req.UserID)
		if err == nil {
			discountAmount = result.DiscountAmount
			appliedCouponCode = result.Coupon.Code
			couponIDToIncrement = result.Coupon.ID
			couponMaxUses = result.Coupon.MaxUses
		}
	}

	// Parse optional offer ID
	var offerObjID primitive.ObjectID
	if req.OfferID != "" {
		offerObjID, _ = primitive.ObjectIDFromHex(req.OfferID)
	}

	grandTotal := req.OrderAmount + req.BookingFee - discountAmount
	if grandTotal < 0 {
		grandTotal = 0
	}

	booking := &models.Booking{
		UserEmail:      req.UserEmail,
		EventID:        eventObjID,
		EventName:      req.EventName,
		Tickets:        req.Tickets,
		OrderAmount:    req.OrderAmount,
		BookingFee:     req.BookingFee,
		DiscountAmount: discountAmount,
		CouponCode:     appliedCouponCode,
		OfferID:        offerObjID,
		GrandTotal:     grandTotal,
		Status:         "booked",
	}

	if err := bookingsvc.Create(booking); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Increment coupon usage only after the booking is confirmed in the DB
	if !couponIDToIncrement.IsZero() {
		_ = couponsvc.IncrementUsage(couponIDToIncrement, couponMaxUses)
	}

	// Send sale notification emails to organizer's sales_notifications (non-blocking)
	bookingID := booking.ID.Hex()
	bookingEventObjID := eventObjID
	bookingUserEmail := req.UserEmail
	bookingGrandTotal := grandTotal
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		var ev models.Event
		if err := config.GetDB().Collection("events").FindOne(ctx, bson.M{"_id": bookingEventObjID}).Decode(&ev); err == nil {
			for _, sc := range ev.SalesNotifications {
				if sc.Email != "" {
					_ = config.SendSaleNotification(sc.Email, booking.EventName, bookingUserEmail, bookingGrandTotal, bookingID)
				}
			}
		}
	}()

	return c.Status(201).JSON(fiber.Map{
		"message":         "booking confirmed",
		"booking_id":      bookingID,
		"grand_total":     grandTotal,
		"discount_amount": discountAmount,
		"status":          "booked",
	})
}

// CreateDiningBooking handles POST /api/bookings/dining
func CreateDiningBooking(c *fiber.Ctx) error {
	var req struct {
		UserEmail   string  `json:"user_email"`
		DiningID    string  `json:"dining_id"`
		VenueName   string  `json:"venue_name"`
		Date        string  `json:"date"`
		TimeSlot    string  `json:"time_slot"`
		Guests      int     `json:"guests"`
		OrderAmount float64 `json:"order_amount"`
		BookingFee  float64 `json:"booking_fee"`
		CouponCode  string  `json:"coupon_code"`
		OfferID     string  `json:"offer_id"`
		UserID      string  `json:"user_id"`
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
		Status:         "booked",
	}

	if err := bookingsvc.CreateDining(booking); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Increment coupon usage only after the booking is confirmed in the DB
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

// CreatePlayBooking handles POST /api/bookings/play
func CreatePlayBooking(c *fiber.Ctx) error {
	var req struct {
		UserEmail   string                 `json:"user_email"`
		PlayID      string                 `json:"play_id"`
		VenueName   string                 `json:"venue_name"`
		Date        string                 `json:"date"`
		Slot        string                 `json:"slot"`
		Tickets     []models.BookingTicket `json:"tickets"`
		OrderAmount float64                `json:"order_amount"`
		BookingFee  float64                `json:"booking_fee"`
		CouponCode  string                 `json:"coupon_code"`
		OfferID     string                 `json:"offer_id"`
		UserID      string                 `json:"user_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request: " + err.Error()})
	}
	if req.UserEmail == "" {
		return c.Status(400).JSON(fiber.Map{"error": "user_email is required"})
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

	playObjID, err := primitive.ObjectIDFromHex(req.PlayID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid play_id"})
	}

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

	booking := &models.PlayBooking{
		UserEmail:      req.UserEmail,
		PlayID:         playObjID,
		VenueName:      req.VenueName,
		Date:           req.Date,
		Slot:           req.Slot,
		Tickets:        req.Tickets,
		OrderAmount:    req.OrderAmount,
		BookingFee:     req.BookingFee,
		DiscountAmount: discountAmount,
		CouponCode:     appliedCouponCode,
		OfferID:        offerObjID,
		GrandTotal:     grandTotal,
		Status:         "booked",
	}

	if err := bookingsvc.CreatePlay(booking); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Increment coupon usage only after the booking is confirmed in the DB
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

// GetEventAvailability handles GET /api/events/:id/availability
func GetEventAvailability(c *fiber.Ctx) error {
	eventID := c.Params("id")
	availability, err := bookingsvc.GetAvailability(eventID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"booked": availability})
}
