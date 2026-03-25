package bookingctrl

import (
	"context"
	"fmt"
	"ticpin-backend/config"
	"ticpin-backend/models"
	bookingsvc "ticpin-backend/services/booking"
	couponsvc "ticpin-backend/services/coupon"
	offersvc "ticpin-backend/services/offer"
	passsvc "ticpin-backend/services/pass"
	"time"

	"ticpin-backend/worker"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateEventBooking(c *fiber.Ctx) error {
	var req struct {
		UserEmail      string                 `json:"user_email"`
		UserName       string                 `json:"user_name"`
		UserPhone      string                 `json:"user_phone"`
		Address        string                 `json:"address"`
		City           string                 `json:"city"`
		State          string                 `json:"state"`
		Pincode        string                 `json:"pincode"`
		Nationality    string                 `json:"nationality"`
		EventID        string                 `json:"event_id"`
		EventName      string                 `json:"event_name"`
		Tickets        []models.BookingTicket `json:"tickets"`
		OrderAmount    float64                `json:"order_amount"`
		BookingFee     float64                `json:"booking_fee"`
		CouponCode     string                 `json:"coupon_code"`
		OfferID        string                 `json:"offer_id"`
		UserID         string                 `json:"user_id"`
		PaymentID      string                 `json:"payment_id"`
		OrderID        string                 `json:"order_id"`
		Status         string                 `json:"status"`
		PaymentGateway string                 `json:"payment_gateway"`
		UseTicpass     bool                   `json:"use_ticpass"` // New field for Ticpass discount
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request: " + err.Error()})
	}

	fmt.Printf("DEBUG: CreateEventBooking - EventID: %s, OrderAmount: %.2f, PaymentGateway: %s\n",
		req.EventID, req.OrderAmount, req.PaymentGateway)

	// Check for existing booking (by payment_id or order_id)
	var existing models.Booking
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"$or": []bson.M{
			{"payment_id": req.PaymentID},
			{"order_id": req.OrderID},
		},
	}

	if req.OrderID != "" || req.PaymentID != "" {
		if err := config.EventBookingsCol.FindOne(ctx, filter).Decode(&existing); err == nil {
			// 1. If it exists and status is already booked, just return it (Idempotency)
			if existing.Status == "booked" || existing.Status == "confirmed" {
				return c.Status(200).JSON(fiber.Map{
					"message":         "booking already confirmed",
					"booking_id":      existing.BookingID,
					"id":              existing.ID.Hex(),
					"grand_total":     existing.GrandTotal,
					"discount_amount": existing.DiscountAmount,
					"status":          existing.Status,
				})
			}

			// 2. If it exists as "pending" and we are now confirming it (status "booked" or empty)
			if existing.Status == "pending" && (req.Status == "booked" || req.Status == "") {
				update := bson.M{
					"$set": bson.M{
						"status":     "booked",
						"payment_id": req.PaymentID,
						"booked_at":  time.Now(),
					},
				}
				_, _ = config.EventBookingsCol.UpdateOne(ctx, bson.M{"_id": existing.ID}, update)
				return c.Status(200).JSON(fiber.Map{
					"message":         "booking confirmed",
					"booking_id":      existing.BookingID,
					"id":              existing.ID.Hex(),
					"grand_total":     existing.GrandTotal,
					"discount_amount": existing.DiscountAmount,
					"status":          "booked",
				})
			}

			// 3. If it is already pending and we're staging it again (e.g. retry)
			if existing.Status == "pending" && req.Status == "pending" {
				return c.Status(200).JSON(fiber.Map{
					"message":         "booking pending",
					"booking_id":      existing.BookingID,
					"id":              existing.ID.Hex(),
					"grand_total":     existing.GrandTotal,
					"discount_amount": existing.DiscountAmount,
					"status":          existing.Status,
				})
			}

			// 4. If booking exists but user cancelled/failed payment, update status
			if existing.Status == "pending" && (req.Status == "cancelled" || req.Status == "failed") {
				// Update booking status
				update := bson.M{
					"$set": bson.M{
						"status": req.Status,
					},
				}
				_, _ = config.EventBookingsCol.UpdateOne(ctx, bson.M{"_id": existing.ID}, update)

				return c.Status(200).JSON(fiber.Map{
					"message": "event booking cancelled",
					"status":  req.Status,
				})
			}
		}
	}

	if req.UserEmail == "" {
		return c.Status(400).JSON(fiber.Map{"error": "user_email is required"})
	}
	if req.UserName == "" || len(req.UserName) < 3 {
		return c.Status(400).JSON(fiber.Map{"error": "name must be at least 3 characters"})
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

	// CRITICAL: Check event capacity to prevent overselling
	ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var event models.Event
	if err := config.EventsCol.FindOne(ctx, bson.M{"_id": eventObjID}).Decode(&event); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "event not found"})
	}

	// Calculate current total tickets booked for this event
	pipeline := []bson.M{
		{"$match": bson.M{
			"event_id": eventObjID,
			"status":   bson.M{"$in": []string{"booked", "confirmed"}},
		}},
		{"$unwind": "$tickets"},
		{"$group": bson.M{
			"_id":   "$tickets.category",
			"count": bson.M{"$sum": "$tickets.quantity"},
		}},
	}

	cursor, err := config.EventBookingsCol.Aggregate(ctx, pipeline)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to check availability"})
	}
	defer cursor.Close(ctx)

	var categoryBookings []struct {
		Category string `bson:"_id"`
		Count    int    `bson:"count"`
	}
	if err := cursor.All(ctx, &categoryBookings); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to parse availability"})
	}

	// Check capacity for each ticket category being booked
	for _, requestedTicket := range req.Tickets {
		var categoryCapacity int
		var currentBooked int

		// Find capacity for this ticket category
		for _, tc := range event.TicketCategories {
			if tc.Name == requestedTicket.Category {
				categoryCapacity = tc.Capacity
				break
			}
		}

		// Find current bookings for this category
		for _, booking := range categoryBookings {
			if booking.Category == requestedTicket.Category {
				currentBooked = booking.Count
				break
			}
		}

		if currentBooked+requestedTicket.Quantity > categoryCapacity {
			fmt.Printf("DEBUG: Capacity exceeded for category %s. Current: %d, Requested: %d, Capacity: %d\n",
				requestedTicket.Category, currentBooked, requestedTicket.Quantity, categoryCapacity)
			return c.Status(400).JSON(fiber.Map{
				"error": fmt.Sprintf("Only %d tickets available for %s category",
					categoryCapacity-currentBooked, requestedTicket.Category),
			})
		}
	}

	fmt.Printf("DEBUG: Capacity check passed for EventID: %s\n", req.EventID)

	// 2. Verify subtotal (OrderAmount) against database prices
	var expectedSubtotal float64
	for _, reqTicket := range req.Tickets {
		found := false
		for _, tc := range event.TicketCategories {
			if tc.Name == reqTicket.Category {
				expectedSubtotal += tc.Price * float64(reqTicket.Quantity)
				found = true
				break
			}
		}
		if !found {
			return c.Status(400).JSON(fiber.Map{"error": "invalid ticket category: " + reqTicket.Category})
		}
	}

	// Compare with tolerance for floating point
	if req.OrderAmount < expectedSubtotal-1 || req.OrderAmount > expectedSubtotal+1 {
		fmt.Printf("SECURITY ALERT: Event Price mismatch for user %s. Expected: %f, Got: %f\n",
			req.UserEmail, expectedSubtotal, req.OrderAmount)
		return c.Status(400).JSON(fiber.Map{"error": "invalid order amount"})
	}

	// 3. Verify booking fee (10% standard)
	expectedFee := float64(int(expectedSubtotal * 0.1))
	if req.BookingFee < expectedFee-1 || req.BookingFee > expectedFee+1 {
		req.BookingFee = expectedFee // Force correct fee
	}

	var discountAmount float64
	var appliedCouponCode string
	var couponIDToIncrement primitive.ObjectID
	var couponMaxUses int
	if req.CouponCode != "" {
		result, err := couponsvc.Validate(req.CouponCode, "event", req.OrderAmount, req.UserID, req.UserEmail)
		if err == nil {
			fmt.Printf("DEBUG: Coupon validation successful - Code: %s, Discount: %.2f\n",
				result.Coupon.Code, result.DiscountAmount)
			discountAmount = result.DiscountAmount
			appliedCouponCode = result.Coupon.Code
			couponIDToIncrement = result.Coupon.ID
			couponMaxUses = result.Coupon.MaxUses
		} else {
			fmt.Printf("DEBUG: Coupon validation failed - %s\n", err.Error())
		}
	}

	var offerObjID primitive.ObjectID
	if req.OfferID != "" {
		offerResult, err := offersvc.ValidateOffer(req.OfferID, req.EventID, req.OrderAmount)
		if err != nil {
			fmt.Printf("DEBUG: Offer validation failed - %s\n", err.Error())
		} else {
			offerObjID = offerResult.Offer.ID
			discountAmount += offerResult.DiscountAmount
		}
	}

	// Check if user wants to use Ticpass benefits
	var ticpassApplied bool
	if req.UseTicpass && req.UserID != "" {
		pass, err := passsvc.GetActiveByUserID(req.UserID)
		if err == nil && pass != nil && pass.Benefits.EventsDiscountActive {
			// Apply 10% discount for Ticpass holders
			ticpassDiscount := req.OrderAmount * 0.10 // 10% discount
			discountAmount += ticpassDiscount
			ticpassApplied = true
			fmt.Printf("DEBUG: Applied Ticpass discount: %.2f for user %s\n", ticpassDiscount, req.UserID)
		} else {
			fmt.Printf("DEBUG: No active Ticpass found for user %s\n", req.UserID)
		}
	}

	// Cap total discount to order subtotal (don't discount the fee completely or allow negative)
	if discountAmount > req.OrderAmount {
		discountAmount = req.OrderAmount
	}

	grandTotal := (req.OrderAmount + req.BookingFee) - discountAmount
	if grandTotal < 0 {
		grandTotal = 0
	}
	if grandTotal < 0 {
		grandTotal = 0
	}

	fmt.Printf("DEBUG: Final calculation - OrderAmount: %.2f, BookingFee: %.2f, DiscountAmount: %.2f, GrandTotal: %.2f\n",
		req.OrderAmount, req.BookingFee, discountAmount, grandTotal)

	booking := &models.Booking{
		UserEmail:      req.UserEmail,
		UserName:       req.UserName,
		UserPhone:      req.UserPhone,
		UserID:         req.UserID,
		Address:        req.Address,
		City:           req.City,
		State:          req.State,
		Pincode:        req.Pincode,
		Nationality:    req.Nationality,
		EventID:        eventObjID,
		EventName:      req.EventName,
		Tickets:        req.Tickets,
		OrderAmount:    req.OrderAmount,
		BookingFee:     req.BookingFee,
		DiscountAmount: discountAmount,
		CouponCode:     appliedCouponCode,
		OfferID:        offerObjID,
		OrderID:        req.OrderID, // Added OrderID support
		GrandTotal:     grandTotal,
		PaymentID:      req.PaymentID,
		PaymentGateway: req.PaymentGateway,
		Status:         "booked",
		BookedAt:       time.Now(),
		TicpassApplied: ticpassApplied, // Persist Ticpass usage
	}
	if req.Status != "" {
		booking.Status = req.Status
	}

	if err := bookingsvc.Create(booking); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	bookingID := booking.ID.Hex()

	if !couponIDToIncrement.IsZero() {
		_ = couponsvc.IncrementUsage(couponIDToIncrement, couponMaxUses, req.UserID, req.UserEmail, bookingID, grandTotal)
	}

	bookingEventObjID := eventObjID
	bookingUserEmail := req.UserEmail
	bookingGrandTotal := grandTotal
	worker.Submit(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		var ev models.Event
		if err := config.GetDB().Collection("events").FindOne(ctx, bson.M{"_id": bookingEventObjID}).Decode(&ev); err == nil {

			if ev.SalesNotifications != nil {
				for _, sc := range ev.SalesNotifications {
					if sc.Email != "" {
						_ = config.SendSaleNotification(sc.Email, booking.EventName, bookingUserEmail, bookingGrandTotal, bookingID)
					}
				}
			}
		}
	})

	return c.Status(201).JSON(fiber.Map{
		"message":         "booking confirmed",
		"booking_id":      booking.BookingID,
		"id":              booking.ID.Hex(),
		"grand_total":     grandTotal,
		"discount_amount": discountAmount,
		"status":          "booked",
		"ticpass_applied": ticpassApplied,
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
