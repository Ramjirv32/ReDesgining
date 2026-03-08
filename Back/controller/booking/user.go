package bookingctrl

import (
	"context"
	"ticpin-backend/config"
	"ticpin-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetBookingsByEmail(c *fiber.Ctx) error {
	email := c.Params("email")
	if email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "email param is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var allBookings []fiber.Map

	// 1. Fetch Event Bookings
	cursor, err := config.BookingsCol.Find(ctx, bson.M{"user_email": email})
	if err == nil {
		var events []models.Booking
		if cursor.All(ctx, &events) == nil {
			for _, b := range events {
				allBookings = append(allBookings, fiber.Map{
					"id":           b.ID.Hex(),
					"category":     "events",
					"event_name":   b.EventName,
					"order_amount": b.OrderAmount,
					"grand_total":  b.GrandTotal,
					"status":       b.Status,
					"date":         b.BookedAt.Format("2006-01-02"),
					"booked_at":    b.BookedAt,
				})
			}
		}
	}

	// 2. Fetch Dining Bookings
	cursor, err = config.DiningBookingsCol.Find(ctx, bson.M{"user_email": email})
	if err == nil {
		var dinings []models.DiningBooking
		if cursor.All(ctx, &dinings) == nil {
			for _, b := range dinings {
				allBookings = append(allBookings, fiber.Map{
					"id":           b.ID.Hex(),
					"category":     "dining",
					"venue_name":   b.VenueName,
					"date":         b.Date,
					"time_slot":    b.TimeSlot,
					"order_amount": b.OrderAmount,
					"grand_total":  b.GrandTotal,
					"status":       b.Status,
					"booked_at":    b.BookedAt,
				})
			}
		}
	}

	// 3. Fetch Play Bookings
	cursor, err = config.PlayBookingsCol.Find(ctx, bson.M{"user_email": email})
	if err == nil {
		var plays []models.PlayBooking
		if cursor.All(ctx, &plays) == nil {
			for _, b := range plays {
				allBookings = append(allBookings, fiber.Map{
					"id":           b.ID.Hex(),
					"category":     "play",
					"venue_name":   b.VenueName,
					"date":         b.Date,
					"slot":         b.Slot,
					"order_amount": b.OrderAmount,
					"grand_total":  b.GrandTotal,
					"status":       b.Status,
					"booked_at":    b.BookedAt,
				})
			}
		}
	}

	return c.JSON(allBookings)
}

func CancelBooking(c *fiber.Ctx) error {
	id := c.Params("id")
	category := c.Query("category") // events, dining, play

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid booking id"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var col *mongo.Collection
	switch category {
	case "events":
		col = config.BookingsCol
	case "dining":
		col = config.DiningBookingsCol
	case "play":
		col = config.PlayBookingsCol
	default:
		return c.Status(400).JSON(fiber.Map{"error": "invalid category"})
	}

	_, err = col.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": bson.M{"status": "cancelled"}})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to cancel booking"})
	}

	// For play bookings: release the slot-lock documents so the slots can be rebooked.
	// Cancelling the booking without removing these locks would permanently block those slots
	// because the unique index on play_slot_locks would reject any future InsertMany attempt.
	if category == "play" {
		_, _ = config.SlotLocksCol.DeleteMany(ctx, bson.M{"booking_id": objID})
	}

	return c.JSON(fiber.Map{"message": "booking cancelled successfully"})
}
