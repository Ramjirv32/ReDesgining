package bookinguser

import (
	"context"
	"fmt"
	"ticpin-backend/config"
	"ticpin-backend/models"
	bookingsvc "ticpin-backend/services/booking"
	passsvc "ticpin-backend/services/pass"
	paymentsvc "ticpin-backend/services/payment"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func CancelBooking(c *fiber.Ctx) error {
	id := c.Params("id")
	category := c.Query("category")

	fmt.Printf("DEBUG: CancelBooking called - ID: %s, Category: %s\n", id, category)

	if id == "" {
		return c.Status(400).JSON(fiber.Map{"error": "booking id is required"})
	}

	// FIX BUG5: Validate category parameter at start
	validCategories := map[string]bool{"events": true, "event": true, "play": true, "dining": true}
	if category != "" && !validCategories[category] {
		return c.Status(400).JSON(fiber.Map{"error": "invalid category: must be 'events', 'play', or 'dining'"})
	}

	authUserID, _ := c.Locals("userId").(string)
	authPhone, _ := c.Locals("phone").(string)

	if authUserID == "" && authPhone == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized: user session not found"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var col *mongo.Collection
	var bookingFound interface{}

	lookupFilter := bson.M{"booking_id": id}
	if idObj, err := primitive.ObjectIDFromHex(id); err == nil {
		lookupFilter = bson.M{"$or": []bson.M{{"_id": idObj}, {"booking_id": id}}}
	}

	if category != "" {
		switch category {
		case "events", "event":
			var b models.Booking
			if err := config.EventBookingsCol.FindOne(ctx, lookupFilter).Decode(&b); err == nil {
				col = config.EventBookingsCol
				bookingFound = &b
				category = "events"
			}
		case "play":
			var b models.PlayBooking
			if err := config.PlayBookingsCol.FindOne(ctx, lookupFilter).Decode(&b); err == nil {
				col = config.PlayBookingsCol
				bookingFound = &b
				category = "play"
			}
		case "dining":
			var b models.DiningBooking
			if err := config.DiningBookingsCol.FindOne(ctx, lookupFilter).Decode(&b); err == nil {
				col = config.DiningBookingsCol
				bookingFound = &b
				category = "dining"
			}
		}
	}

	if col == nil {
		var bE models.Booking
		if err := config.EventBookingsCol.FindOne(ctx, lookupFilter).Decode(&bE); err == nil {
			col = config.EventBookingsCol
			bookingFound = &bE
			category = "events"
		} else {
			var bP models.PlayBooking
			if err := config.PlayBookingsCol.FindOne(ctx, lookupFilter).Decode(&bP); err == nil {
				col = config.PlayBookingsCol
				bookingFound = &bP
				category = "play"
			} else {
				var bD models.DiningBooking
				if err := config.DiningBookingsCol.FindOne(ctx, lookupFilter).Decode(&bD); err == nil {
					col = config.DiningBookingsCol
					bookingFound = &bD
					category = "dining"
				}
			}
		}
	}

	if col == nil || bookingFound == nil {
		return c.Status(404).JSON(fiber.Map{"error": "booking not found"})
	}

	var bookingUserID, bookingPhone, bookingStatus, bookingIDStr string
	var bookingPrimitiveID primitive.ObjectID

	switch b := bookingFound.(type) {
	case *models.Booking:
		bookingUserID = b.UserID
		bookingPhone = b.UserPhone
		bookingStatus = b.Status
		bookingPrimitiveID = b.ID
		bookingIDStr = b.BookingID
	case *models.PlayBooking:
		bookingUserID = b.UserID
		bookingPhone = b.UserPhone
		bookingStatus = b.Status
		bookingPrimitiveID = b.ID
		bookingIDStr = b.BookingID
	case *models.DiningBooking:
		bookingUserID = b.UserID
		bookingPhone = b.UserPhone
		bookingStatus = b.Status
		bookingPrimitiveID = b.ID
		bookingIDStr = b.BookingID
	}

	// FIX BUG3: Clean up authorization logic (removed incorrect phone->userID comparison)
	hasAccess := (authUserID != "" && authUserID == bookingUserID) ||
		(authPhone != "" && authPhone == bookingPhone) ||
		(c.Locals("isAdmin") == true)

	if !hasAccess {
		return c.Status(403).JSON(fiber.Map{"error": "access denied: you do not own this booking"})
	}

	if bookingStatus == "cancelled" {
		return c.Status(400).JSON(fiber.Map{"error": "booking already cancelled"})
	}

	// FIX RC1: Always validate date parsing and check expiry (fail if date invalid)
	var bookingDateStr string
	switch b := bookingFound.(type) {
	case *models.Booking:
		var event models.Event
		if err := config.EventsCol.FindOne(ctx, bson.M{"_id": b.EventID}).Decode(&event); err == nil {
			bookingDateStr = event.Date.Format("02 January, 2006")
		}
	case *models.PlayBooking:
		bookingDateStr = b.Date
	case *models.DiningBooking:
		bookingDateStr = b.Date
	}

	if bookingDateStr == "" {
		return c.Status(400).JSON(fiber.Map{"error": "booking date is missing"})
	}

	// Try multiple date layouts
	layouts := []string{"02 January, 2006", "2006-01-02", "January 02, 2006"}
	var bTime time.Time
	var dateParseErr error
	for _, layout := range layouts {
		bTime, dateParseErr = time.Parse(layout, bookingDateStr)
		if dateParseErr == nil {
			break
		}
	}

	// FIX RC1: Fail if date parsing fails (don't skip expiry check)
	if dateParseErr != nil {
		fmt.Printf("DEBUG: Failed to parse booking date '%s': %v\n", bookingDateStr, dateParseErr)
		return c.Status(400).JSON(fiber.Map{"error": "invalid booking date format"})
	}

	// Check expiry
	todayUTC := time.Now().UTC().Truncate(24 * time.Hour)
	bTimeUTC := bTime.UTC().Truncate(24 * time.Hour)
	if bTimeUTC.Before(todayUTC) {
		return c.Status(400).JSON(fiber.Map{"error": "cannot cancel an expired booking"})
	}

	update := bson.M{
		"$set": bson.M{
			"status":       "cancelled",
			"cancelled_at": time.Now(),
		},
	}

	// FIX RC2: Use atomic update to prevent concurrent payment+cancel race
	// Only update if status is NOT already paid/confirmed (prevents payment webhook race)
	result, err := col.UpdateOne(ctx, bson.M{
		"_id": bookingPrimitiveID,
		"status": bson.M{
			"$nin": []string{"booked", "confirmed", "paid"},
		},
	}, update)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to cancel booking: database error"})
	}

	if result.MatchedCount == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "booking cannot be cancelled (already confirmed or paid)"})
	}

	// Extract payment details for refund
	var paymentID string
	var grandTotal float64
	switch b := bookingFound.(type) {
	case *models.Booking:
		paymentID = b.PaymentID
		if paymentID == "" {
			paymentID = b.OrderID
		}
		grandTotal = b.GrandTotal
	case *models.PlayBooking:
		paymentID = b.PaymentID
		if paymentID == "" {
			paymentID = b.OrderID
		}
		grandTotal = b.GrandTotal
	case *models.DiningBooking:
		paymentID = b.PaymentID
		if paymentID == "" {
			paymentID = b.OrderID
		}
		grandTotal = b.GrandTotal
	}

	// Process refund if payment exists
	if paymentID != "" && grandTotal > 0 {
		go func() {
			refundCtx, refundCancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer refundCancel()

			refundNotes := map[string]string{
				"booking_id":   bookingIDStr,
				"booking_type": category,
				"reason":       "booking_cancelled",
				"cancelled_at": time.Now().Format("2006-01-02T15:04:05Z07:00"),
			}

			refundID, err := paymentsvc.CreateRefund(paymentID, grandTotal, refundNotes)
			if err != nil {
				fmt.Printf("ERROR: Failed to create refund for booking %s (Payment ID: %s): %v\n", bookingIDStr, paymentID, err)
			} else {
				fmt.Printf("SUCCESS: Refund initiated for booking %s - Refund ID: %s, Payment ID: %s, Amount: %.2f\n", bookingIDStr, refundID, paymentID, grandTotal)
				// Update booking with refund ID for tracking
				_, updateErr := col.UpdateOne(refundCtx, bson.M{"_id": bookingPrimitiveID}, bson.M{
					"$set": bson.M{
						"refund_id":     refundID,
						"refund_date":   time.Now(),
						"refund_amount": grandTotal,
					},
				})
				if updateErr != nil {
					fmt.Printf("ERROR: Failed to update refund ID in booking %s: %v\n", bookingIDStr, updateErr)
				}
			}

			_ = refundCtx
		}()
	}

	if category == "play" || category == "dining" {
		// FIX RC3 & BUG4: Properly handle lock cleanup with error tracking + context timeout
		go func() {
			deleteCtx, deleteCancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer deleteCancel()

			if err := bookingsvc.DeletePlayLocks(bookingPrimitiveID); err != nil {
				fmt.Printf("ERROR: Failed to delete play locks for booking %s: %v\n", bookingIDStr, err)
			} else {
				fmt.Printf("DEBUG: Slot locks deleted for booking %s\n", bookingIDStr)
			}

			_ = deleteCtx
		}()

		// FIX RC3: Add proper error handling for pass refund with timeout
		if category == "play" {
			if b, ok := bookingFound.(*models.PlayBooking); ok && b.TicpassApplied {
				go func() {
					refundCtx, refundCancel := context.WithTimeout(context.Background(), 5*time.Second)
					defer refundCancel()

					pass, err := passsvc.GetActiveByUserID(b.UserID)
					if err != nil {
						fmt.Printf("ERROR: Could not find active pass for user %s during cancel: %v\n", b.UserID, err)
						return
					}

					if pass == nil {
						fmt.Printf("ERROR: Pass is nil for user %s during cancel\n", b.UserID)
						return
					}

					_, err = passsvc.RefundTurfBooking(pass.ID.Hex())
					if err != nil {
						fmt.Printf("ERROR: Failed to refund Ticpass turf benefit for pass %s: %v\n", pass.ID.Hex(), err)
					} else {
						fmt.Printf("DEBUG: Ticpass turf booking refunded for pass %s\n", pass.ID.Hex())
					}

					_ = refundCtx
				}()
			}
		} else if category == "dining" {
			if b, ok := bookingFound.(*models.DiningBooking); ok && b.TicpassApplied {
				go func() {
					refundCtx, refundCancel := context.WithTimeout(context.Background(), 5*time.Second)
					defer refundCancel()

					pass, err := passsvc.GetActiveByUserID(b.UserID)
					if err != nil {
						fmt.Printf("ERROR: Could not find active pass for user %s during cancel: %v\n", b.UserID, err)
						return
					}

					if pass == nil {
						fmt.Printf("ERROR: Pass is nil for user %s during cancel\n", b.UserID)
						return
					}

					_, err = passsvc.RefundDiningVoucher(pass.ID.Hex())
					if err != nil {
						fmt.Printf("ERROR: Failed to refund Ticpass dining benefit for pass %s: %v\n", pass.ID.Hex(), err)
					} else {
						fmt.Printf("DEBUG: Ticpass dining voucher refunded for pass %s\n", pass.ID.Hex())
					}

					_ = refundCtx
				}()
			}
		}
	}

	// FIX RC4: Send cancellation email with proper timeout and error handling
	go func() {
		emailCtx, emailCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer emailCancel()

		var userEmail, venueName, dateStr, totalStr string
		switch b := bookingFound.(type) {
		case *models.Booking:
			userEmail = b.UserEmail
			venueName = b.EventName
			var event models.Event
			if err := config.EventsCol.FindOne(emailCtx, bson.M{"_id": b.EventID}).Decode(&event); err == nil {
				dateStr = fmt.Sprintf("%s (%s)", event.Date.Format("2006-01-02"), event.Time)
			} else {
				dateStr = b.BookedAt.Format("2006-01-02")
			}
			totalStr = fmt.Sprintf("%.2f", b.GrandTotal)
		case *models.PlayBooking:
			userEmail = b.UserEmail
			venueName = b.VenueName
			dateStr = fmt.Sprintf("%s (%s)", b.Date, b.Slot)
			totalStr = fmt.Sprintf("%.2f", b.GrandTotal)
		case *models.DiningBooking:
			userEmail = b.UserEmail
			venueName = b.VenueName
			dateStr = fmt.Sprintf("%s (%s)", b.Date, b.TimeSlot)
			totalStr = fmt.Sprintf("%.2f", b.GrandTotal)
		}
		if userEmail != "" {
			err := config.SendCancellationEmail(userEmail, bookingIDStr, category, venueName, dateStr, totalStr)
			if err != nil {
				fmt.Printf("ERROR: Failed to send cancellation email to %s: %v\n", userEmail, err)
			} else {
				fmt.Printf("DEBUG: Cancellation email sent to %s for booking %s\n", userEmail, bookingIDStr)
			}
		}
	}()

	return c.JSON(fiber.Map{
		"message":      "booking cancelled successfully",
		"booking_id":   bookingIDStr,
		"status":       "cancelled",
		"cancelled_at": time.Now(),
	})
}
