package bookingctrl

import (
	"context"
	"ticpin-backend/config"
	"ticpin-backend/models"
	bookingsvc "ticpin-backend/services/booking"
	couponsvc "ticpin-backend/services/coupon"
	"time"

	"ticpin-backend/worker"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateEventBooking(c *fiber.Ctx) error {
	var req struct {
		UserEmail      string                 `json:"user_email"`
		EventID        string                 `json:"event_id"`
		EventName      string                 `json:"event_name"`
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
		PaymentID:      req.PaymentID,
		PaymentGateway: req.PaymentGateway,
		Status:         "booked",
	}

	if err := bookingsvc.Create(booking); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if !couponIDToIncrement.IsZero() {
		_ = couponsvc.IncrementUsage(couponIDToIncrement, couponMaxUses)
	}

	bookingID := booking.ID.Hex()
	bookingEventObjID := eventObjID
	bookingUserEmail := req.UserEmail
	bookingGrandTotal := grandTotal
	worker.Submit(func() {
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
	})

	return c.Status(201).JSON(fiber.Map{
		"message":         "booking confirmed",
		"booking_id":      bookingID,
		"grand_total":     grandTotal,
		"discount_amount": discountAmount,
		"status":          "booked",
	})
}

func GetEventAvailability(c *fiber.Ctx) error {
	eventID := c.Params("id")
	availability, err := bookingsvc.GetAvailability(eventID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"booked": availability})
}
