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
	"ticpin-backend/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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
		OrderID        string  `json:"order_id"`
		PaymentGateway string  `json:"payment_gateway" validate:"required"`
		Status         string  `json:"status"`
		UseTicpass     bool    `json:"use_ticpass"`
	}

	if err := utils.ParseAndValidate(c, &req); err != nil {
		return err
	}

	fmt.Printf("DEBUG: CreateDiningBooking - DiningID: %s, User: %s, PaymentID: %s\n",
		req.DiningID, req.UserEmail, req.PaymentID)

	// Check if booking with this payment_id already exists
	// Check for existing booking (by payment_id or order_id)
	var existing models.DiningBooking
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	filter := bson.M{
		"$or": []bson.M{
			{"payment_id": req.PaymentID},
			{"order_id": req.OrderID},
		},
	}
	if req.OrderID != "" || req.PaymentID != "" {
		if err := config.DiningBookingsCol.FindOne(ctx, filter).Decode(&existing); err == nil {
			// 1. If it exists and status is already booked, just return it (Idempotency)
			if existing.Status == "booked" {
				return c.Status(200).JSON(fiber.Map{
					"message":         "dining booking already confirmed",
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
				_, _ = config.DiningBookingsCol.UpdateOne(ctx, bson.M{"_id": existing.ID}, update)
				return c.Status(200).JSON(fiber.Map{
					"message":         "dining booking confirmed",
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
					"message":         "dining booking pending",
					"booking_id":      existing.BookingID,
					"id":              existing.ID.Hex(),
					"grand_total":     existing.GrandTotal,
					"discount_amount": existing.DiscountAmount,
					"status":          existing.Status,
				})
			}
		}
	}
	diningObjID, err := primitive.ObjectIDFromHex(req.DiningID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid dining_id"})
	}

	ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Clean up expired locks (older than 10 minutes) to prevent stale locks
	cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cleanupCancel()

	fifteenMinutesAgo := time.Now().Add(-15 * time.Minute)
	_, _ = config.SlotLocksCol.DeleteMany(cleanupCtx, bson.M{
		"created_at": bson.M{"$lt": fifteenMinutesAgo},
	})

	// Check if user already has a booking for this time slot
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

	// 1. Fetch dining area to verify prices
	ctx, cancel = context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var dining models.Dining
	if err := config.DiningsCol.FindOne(ctx, bson.M{"_id": diningObjID}).Decode(&dining); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "dining venue not found"})
	}

	// 2. Verify subtotal (OrderAmount)
	// Dining usually calculates as PriceStartsFrom * Guests
	expectedSubtotal := dining.PriceStartsFrom * float64(req.Guests)

	// Compare with tolerance
	if req.OrderAmount < expectedSubtotal-1 || req.OrderAmount > expectedSubtotal+1 {
		fmt.Printf("SECURITY ALERT: Dining Price mismatch for user %s. Expected: %f, Got: %f\n",
			req.UserEmail, expectedSubtotal, req.OrderAmount)
		return c.Status(400).JSON(fiber.Map{"error": "invalid order amount"})
	}

	// 3. Verify booking fee (Dining is typically 0 at the moment)
	if req.BookingFee > 50 { // Basic check, adjust if you implement dining fees later
		fmt.Printf("SECURITY ALERT: Unexpected booking fee for dining: %f\n", req.BookingFee)
		return c.Status(400).JSON(fiber.Map{"error": "invalid booking fee"})
	}

	var discountAmount float64
	var appliedCouponCode string
	var couponIDToIncrement primitive.ObjectID
	var couponMaxUses int
	if req.CouponCode != "" {
		result, err := couponsvc.Validate(req.CouponCode, "dining", req.OrderAmount, req.UserID, req.UserEmail)
		if err == nil {
			discountAmount = result.DiscountAmount
			appliedCouponCode = result.Coupon.Code
			couponIDToIncrement = result.Coupon.ID
			couponMaxUses = result.Coupon.MaxUses
		}
	}

	var offerObjID primitive.ObjectID
	if req.OfferID != "" {
		offerResult, err := offersvc.ValidateOffer(req.OfferID, req.DiningID, req.OrderAmount)
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

	// Check if user wants to use Ticpass dining benefits
	var ticpassApplied bool
	if req.UseTicpass && req.UserID != "" {
		pass, err := passsvc.GetActiveByUserID(req.UserID)
		if err == nil && pass != nil {
			if pass.Benefits.DiningVouchers.Remaining > 0 {
				// Dining Voucher Benefit: Deduct voucher value (e.g. 250)
				voucherVal := float64(pass.Benefits.DiningVouchers.ValueEach)
				if voucherVal <= 0 {
					voucherVal = 250
				} // Fallback

				discountAmount += voucherVal
				ticpassApplied = true

				// Decrement the benefit usage in DB
				_, err = passsvc.UseDiningVoucher(pass.ID.Hex())
				if err != nil {
					fmt.Printf("ERROR: Failed to decrement Ticpass dining benefit: %v\n", err)
				} else {
					fmt.Printf("DEBUG: Used 1 Ticpass dining voucher (₹%.2f) for user %s.\n", voucherVal, req.UserID)
				}
			}
		}
	}

	// Re-calculate grand total with Ticpass
	grandTotal = (req.OrderAmount + req.BookingFee) - discountAmount
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
		TicpassApplied: ticpassApplied,
	}

	booking.ID = primitive.NewObjectID()
	booking.BookingID = utils.HashObjectID(booking.ID)
	booking.BookedAt = time.Now()

	// CRITICAL: Lock the time slot only after payment verification to prevent false errors
	lockDoc := bson.M{
		"dining_id":  diningObjID,
		"date":       req.Date,
		"time_slot":  req.TimeSlot,
		"booking_id": booking.ID,
		"created_at": time.Now(),
	}

	// Try to insert lock - if fails, slot is already being booked by someone else
	_, err = config.SlotLocksCol.InsertOne(ctx, lockDoc)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return c.Status(400).JSON(fiber.Map{
				"error": "This time slot was just booked by someone else. Please select a different time.",
			})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Failed to reserve time slot"})
	}

	if err := bookingsvc.CreateDining(booking); err != nil {
		// Clean up the lock if booking fails
		_, _ = config.SlotLocksCol.DeleteOne(ctx, bson.M{"booking_id": booking.ID})
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	bookingIDStr := booking.ID.Hex()

	if !couponIDToIncrement.IsZero() {
		_ = couponsvc.IncrementUsage(couponIDToIncrement, couponMaxUses, req.UserID, req.UserEmail, bookingIDStr, grandTotal)
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
