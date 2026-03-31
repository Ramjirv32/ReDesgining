package bookingctrl

import (
	"context"
	"fmt"
	"net/url"
	"ticpin-backend/config"
	"ticpin-backend/models"
	bookingsvc "ticpin-backend/services/booking"
	couponsvc "ticpin-backend/services/coupon"
	offersvc "ticpin-backend/services/offer"
	passsvc "ticpin-backend/services/pass"
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
		OrderID        string                 `json:"order_id"`
		PaymentID      string                 `json:"payment_id" validate:"required"`
		PaymentGateway string                 `json:"payment_gateway" validate:"required"`
		Status         string                 `json:"status"`
		UseTicpass     bool                   `json:"use_ticpass"`
		LockKey        string                 `json:"lock_key" validate:"omitempty"`
	}

	if err := utils.ParseAndValidate(c, &req); err != nil {
		return err
	}

	fmt.Printf("DEBUG: CreatePlayBooking - PlayID: %s, User: %s, PaymentID: %s\n",
		req.PlayID, req.UserEmail, req.PaymentID)

	if req.PaymentID != "" || req.OrderID != "" {
		var existing models.PlayBooking
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		filter := bson.M{}
		if req.PaymentID != "" && req.OrderID != "" {
			filter["$or"] = []bson.M{
				{"payment_id": req.PaymentID},
				{"order_id": req.OrderID},
			}
		} else if req.PaymentID != "" {
			filter["payment_id"] = req.PaymentID
		} else {
			filter["order_id"] = req.OrderID
		}

		if err := config.PlayBookingsCol.FindOne(ctx, filter).Decode(&existing); err == nil {

			if existing.Status == "booked" {
				return c.Status(200).JSON(fiber.Map{
					"message":         "play booking already confirmed",
					"booking_id":      existing.BookingID,
					"id":              existing.ID.Hex(),
					"grand_total":     existing.GrandTotal,
					"discount_amount": existing.DiscountAmount,
					"status":          existing.Status,
				})
			}

			// 2. If it exists as "pending" and we are now confirming it (status "booked" or empty)
			if existing.Status == "pending" && (req.Status == "booked" || req.Status == "") {
				// Check if Ticpass should be applied and decremented for this pending booking confirmation
				if req.UseTicpass && req.UserID != "" && !existing.TicpassApplied {
					pass, err := passsvc.GetActiveByUserID(req.UserID)
					if err == nil && pass != nil && pass.Benefits.TurfBookings.Remaining > 0 {
						// Decrement Ticpass for this pending booking confirmation
						_, err = passsvc.UseTurfBooking(pass.ID.Hex())
						if err != nil {
							fmt.Printf("ERROR: Failed to decrement Ticpass for pending booking confirmation: %v\n", err)
						} else {
							fmt.Printf("DEBUG: Used 1 Ticpass turf benefit for user %s on pending booking confirmation. Booking ID: %s\n", req.UserID, existing.BookingID)
							// Update the booking to reflect Ticpass usage
							updateWithTicpass := bson.M{
								"$set": bson.M{
									"status":          "booked",
									"payment_id":      req.PaymentID,
									"booked_at":       time.Now(),
									"ticpass_applied": true,
									"discount_amount": existing.OrderAmount, // Free booking
									"grand_total":     0,                    // Free booking
								},
							}
							_, _ = config.PlayBookingsCol.UpdateOne(ctx, bson.M{"_id": existing.ID}, updateWithTicpass)
							return c.Status(200).JSON(fiber.Map{
								"message":         "play booking confirmed with Ticpass",
								"booking_id":      existing.BookingID,
								"id":              existing.ID.Hex(),
								"grand_total":     0,
								"discount_amount": existing.OrderAmount,
								"status":          "booked",
							})
						}
					}
				}

				update := bson.M{
					"$set": bson.M{
						"status":     "booked",
						"payment_id": req.PaymentID, // Update to the real pay_... ID
						"booked_at":  time.Now(),
					},
				}
				_, _ = config.PlayBookingsCol.UpdateOne(ctx, bson.M{"_id": existing.ID}, update)
				return c.Status(200).JSON(fiber.Map{
					"message":         "play booking confirmed",
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
					"message":         "play booking pending",
					"booking_id":      existing.BookingID,
					"id":              existing.ID.Hex(),
					"grand_total":     existing.GrandTotal,
					"discount_amount": existing.DiscountAmount,
					"status":          existing.Status,
				})
			}

			// 4. If booking exists but user cancelled/failed payment, clean up locks
			if existing.Status == "pending" && (req.Status == "cancelled" || req.Status == "failed") {
				// Clean up slot locks for this cancelled booking
				cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer cleanupCancel()

				playObjID, _ := primitive.ObjectIDFromHex(req.PlayID)
				_, _ = config.SlotLocksCol.DeleteMany(cleanupCtx, bson.M{
					"play_id":    playObjID,
					"date":       existing.Date,
					"slot":       existing.Slot,
					"booking_id": existing.ID,
				})

				// Update booking status
				update := bson.M{
					"$set": bson.M{
						"status": req.Status,
					},
				}
				_, _ = config.PlayBookingsCol.UpdateOne(ctx, bson.M{"_id": existing.ID}, update)

				return c.Status(200).JSON(fiber.Map{
					"message": "play booking cancelled and slot released",
					"status":  req.Status,
				})
			}
		}
	}

	playObjID, err := primitive.ObjectIDFromHex(req.PlayID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid play_id"})
	}

	// Clean up expired locks (older than 15 minutes) to prevent stale locks
	cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cleanupCancel()

	fifteenMinutesAgo := time.Now().Add(-15 * time.Minute)
	_, _ = config.SlotLocksCol.DeleteMany(cleanupCtx, bson.M{
		"created_at": bson.M{"$lt": fifteenMinutesAgo},
	})

	// Clean up orphaned locks for this specific play, date, and slot combination ONLY if we're booking the same slot
	cleanupPlayObjID, err := primitive.ObjectIDFromHex(req.PlayID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid play_id"})
	}

	if req.Date != "" && req.Slot != "" {
		orphanedLocksFilter := bson.M{
			"play_id": cleanupPlayObjID,
			"date":    req.Date,
			"slot":    req.Slot,
		}
		cursor, _ := config.SlotLocksCol.Find(cleanupCtx, orphanedLocksFilter)
		var locks []bson.M
		cursor.All(cleanupCtx, &locks)

		for _, lock := range locks {
			bookingID := lock["booking_id"]
			var booking models.PlayBooking
			err := config.PlayBookingsCol.FindOne(cleanupCtx, bson.M{"_id": bookingID}).Decode(&booking)
			if err != nil || (booking.Status == "cancelled" || booking.Status == "failed" || booking.Status == "refunded") {
				// This lock is orphaned - remove it
				config.SlotLocksCol.DeleteOne(cleanupCtx, bson.M{"_id": lock["_id"]})
			}
		}
	}

	if req.PlayID == "" || req.Date == "" || req.Slot == "" {
		return c.Status(400).JSON(fiber.Map{"error": "play_id, date and slot are required"})
	}
	if len(req.Tickets) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "at least one court/ticket is required"})
	}

	// 1. Fetch play area to verify prices
	play, err := playservice.GetByID(req.PlayID, true)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "play not found"})
	}

	// 2. Verify subtotal (OrderAmount) against database prices
	var expectedSubtotal float64
	for _, reqTicket := range req.Tickets {
		found := false
		for _, dbTicket := range play.Courts {
			if dbTicket.Name == reqTicket.Category {
				expectedSubtotal += dbTicket.Price * float64(reqTicket.Quantity)
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
		fmt.Printf("SECURITY ALERT: Price mismatch for user %s. Expected: %f, Got: %f\n",
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
		result, err := couponsvc.Validate(req.CouponCode, "play", req.OrderAmount, req.UserID, req.UserEmail)
		if err == nil {
			discountAmount = result.DiscountAmount
			appliedCouponCode = result.Coupon.Code
			couponIDToIncrement = result.Coupon.ID
			couponMaxUses = result.Coupon.MaxUses
		}
	}

	var offerObjID primitive.ObjectID
	if req.OfferID != "" {
		offerResult, err := offersvc.ValidateOffer(req.OfferID, req.PlayID, req.OrderAmount)
		if err == nil {
			offerObjID = offerResult.Offer.ID
			discountAmount += offerResult.DiscountAmount
		}
	}

	// Cap total discount to order subtotal
	if discountAmount > req.OrderAmount {
		discountAmount = req.OrderAmount
	}

	grandTotal := (req.OrderAmount + req.BookingFee) - discountAmount
	if grandTotal < 0 {
		grandTotal = 0
	}

	// Check if user wants to use Ticpass benefits (but don't decrement yet - wait for successful booking)
	var ticpassApplied bool
	var ticpassToDecrement bool
	var passID string
	if req.UseTicpass && req.UserID != "" {
		pass, err := passsvc.GetActiveByUserID(req.UserID)
		if err == nil && pass != nil {
			if pass.Benefits.TurfBookings.Remaining > 0 {
				// Free Turf Booking Benefit: 100% discount on order amount
				discountAmount = req.OrderAmount
				ticpassApplied = true
				ticpassToDecrement = true
				passID = pass.ID.Hex()
				fmt.Printf("DEBUG: Ticpass will be applied for user %s if booking succeeds. Pass ID: %s\n", req.UserID, passID)
			} else {
				// Fallback to 10% discount if all free bookings are used (optional, but keep it for goodwill)
				ticpassDiscount := req.OrderAmount * 0.10
				discountAmount += ticpassDiscount
				ticpassApplied = true
				fmt.Printf("DEBUG: Applied 10%% Ticpass discount: %.2f for user %s (no free bookings left)\n", ticpassDiscount, req.UserID)
			}
		}
	}

	// Re-calculate grand total with Ticpass
	grandTotal = (req.OrderAmount + req.BookingFee) - discountAmount
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
		OrderID:        req.OrderID,
		PaymentID:      req.PaymentID,
		PaymentGateway: req.PaymentGateway,
		Status:         req.Status,
		BookedAt:       time.Now(),
		TicpassApplied: ticpassApplied,
		LockKey:        req.LockKey,
	}
	if booking.Status == "" {
		booking.Status = "booked"
	}

	if err := bookingsvc.CreatePlay(booking); err != nil {
		// ROLLBACK: If booking fails, restore Ticpass if it was marked for decrement
		if ticpassToDecrement && passID != "" {
			fmt.Printf("INFO: Booking failed, attempting to restore Ticpass benefit for user %s\n", req.UserID)
			_, restoreErr := passsvc.RestoreTurfBooking(passID)
			if restoreErr != nil {
				fmt.Printf("ERROR: Failed to restore Ticpass benefit: %v\n", restoreErr)
			} else {
				fmt.Printf("DEBUG: Successfully restored Ticpass benefit for user %s\n", req.UserID)
			}
		}

		// Clean up any slot locks that might have been created during this failed attempt
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cleanupCancel()

		if req.PlayID != "" && req.Date != "" && req.Slot != "" {
			cleanupPlayObjID, err := primitive.ObjectIDFromHex(req.PlayID)
			if err == nil {
				// Remove any locks for this booking attempt
				config.SlotLocksCol.DeleteMany(cleanupCtx, bson.M{
					"play_id":    cleanupPlayObjID,
					"date":       req.Date,
					"slot":       req.Slot,
					"booking_id": booking.ID, // Remove locks for this booking ID
				})
			}
		}

		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Only decrement Ticpass benefit AFTER successful booking creation (for new bookings, not pending confirmations)
	if ticpassToDecrement && passID != "" && (booking.Status == "booked" || booking.Status == "confirmed") {
		_, err = passsvc.UseTurfBooking(passID)
		if err != nil {
			fmt.Printf("ERROR: Failed to decrement Ticpass turf benefit after successful booking: %v\n", err)
			// Don't fail the booking since it's already created, but log the error
		} else {
			fmt.Printf("DEBUG: Successfully used 1 Ticpass turf benefit for user %s. Booking ID: %s\n", req.UserID, booking.BookingID)
		}
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
