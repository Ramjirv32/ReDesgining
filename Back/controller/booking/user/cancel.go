package bookinguser

import (
	"context"
	"fmt"
	"ticpin-backend/config"
	"ticpin-backend/models"
	bookingsvc "ticpin-backend/services/booking"
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

	hasAccess := (authUserID != "" && authUserID == bookingUserID) ||
		(authPhone != "" && authPhone == bookingPhone) ||
		(authPhone != "" && authPhone == bookingUserID) ||
		(c.Locals("isAdmin") == true)

	if !hasAccess {
		return c.Status(403).JSON(fiber.Map{"error": "access denied: you do not own this booking"})
	}

	if bookingStatus == "cancelled" {
		return c.Status(400).JSON(fiber.Map{"error": "booking already cancelled"})
	}

	update := bson.M{
		"$set": bson.M{
			"status":       "cancelled",
			"cancelled_at": time.Now(),
		},
	}

	_, err := col.UpdateOne(ctx, bson.M{"_id": bookingPrimitiveID}, update)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to cancel booking"})
	}

	if category == "play" {
		go func() {
			_ = bookingsvc.DeletePlayLocks(bookingPrimitiveID)
		}()
	}

	go func() {
		var userEmail, venueName, dateStr, totalStr string
		switch b := bookingFound.(type) {
		case *models.Booking:
			userEmail = b.UserEmail
			venueName = b.EventName
			var event models.Event
			if err := config.EventsCol.FindOne(context.Background(), bson.M{"_id": b.EventID}).Decode(&event); err == nil {
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
				fmt.Printf("DEBUG: Failed to send cancellation email to %s: %v\n", userEmail, err)
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
