package bookingctrl

import (
	"context"
	"fmt"
	"ticpin-backend/config"
	"ticpin-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetBookingHistory(c *fiber.Ctx) error {
	email := c.Query("email")
	phone := c.Query("phone")
	userId := c.Query("userId")

	if email == "" && phone == "" && userId == "" {
		return c.Status(400).JSON(fiber.Map{"error": "at least one identifier is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var allBookings []fiber.Map

	// Construct dynamic filter
	var orFilters []bson.M
	if email != "" {
		orFilters = append(orFilters, bson.M{"user_email": email})
	}
	if phone != "" {
		orFilters = append(orFilters, bson.M{"user_id": phone}) // If it was saved as phone
	}
	if userId != "" {
		orFilters = append(orFilters, bson.M{"user_id": userId})
	}

	filter := bson.M{"$or": orFilters}

	// 1. Fetch Event Bookings
	cursor, err := config.BookingsCol.Find(ctx, filter)
	if err == nil {
		var events []models.Booking
		if cursor.All(ctx, &events) == nil {
			for _, b := range events {
				allBookings = append(allBookings, fiber.Map{
					"id":           b.BookingID, // Use booking_id instead of ObjectId
					"booking_id":   b.BookingID, // Include booking_id explicitly
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
	cursor, err = config.DiningBookingsCol.Find(ctx, filter)
	if err == nil {
		var dinings []models.DiningBooking
		if cursor.All(ctx, &dinings) == nil {
			for _, b := range dinings {
				allBookings = append(allBookings, fiber.Map{
					"id":           b.BookingID, // Use booking_id instead of ObjectId
					"booking_id":   b.BookingID, // Include booking_id explicitly
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
	cursor, err = config.PlayBookingsCol.Find(ctx, filter)
	if err == nil {
		var plays []models.PlayBooking
		if cursor.All(ctx, &plays) == nil {
			for _, b := range plays {
				allBookings = append(allBookings, fiber.Map{
					"id":           b.BookingID, // Use booking_id instead of ObjectId
					"booking_id":   b.BookingID, // Include booking_id explicitly
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

func GetBookingsByEmail(c *fiber.Ctx) error {
	email := c.Params("email")
	if email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "email or phone param is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var allBookings []fiber.Map

	filter := bson.M{
		"$or": []bson.M{
			{"user_email": email},
			{"user_id": email},
		},
	}

	// 1. Fetch Event Bookings
	cursor, err := config.BookingsCol.Find(ctx, filter)
	if err == nil {
		var events []models.Booking
		if cursor.All(ctx, &events) == nil {
			for _, b := range events {
				allBookings = append(allBookings, fiber.Map{
					"id":           b.BookingID, // Use booking_id instead of ObjectId
					"booking_id":   b.BookingID, // Include booking_id explicitly
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
	cursor, err = config.DiningBookingsCol.Find(ctx, filter)
	if err == nil {
		var dinings []models.DiningBooking
		if cursor.All(ctx, &dinings) == nil {
			for _, b := range dinings {
				allBookings = append(allBookings, fiber.Map{
					"id":           b.BookingID, // Use booking_id instead of ObjectId
					"booking_id":   b.BookingID, // Include booking_id explicitly
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
	cursor, err = config.PlayBookingsCol.Find(ctx, filter)
	if err == nil {
		var plays []models.PlayBooking
		if cursor.All(ctx, &plays) == nil {
			for _, b := range plays {
				allBookings = append(allBookings, fiber.Map{
					"id":           b.BookingID, // Use booking_id instead of ObjectId
					"booking_id":   b.BookingID, // Include booking_id explicitly
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
	userID := c.Query("user_id")

	fmt.Printf("DEBUG: CancelBooking called - ID: %s, Category: %s, UserID: %s\n", id, category, userID)

	if id == "" {
		return c.Status(400).JSON(fiber.Map{"error": "booking id is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var col *mongo.Collection
	switch category {
	case "events", "event":
		col = config.BookingsCol
	case "dining":
		col = config.DiningBookingsCol
	case "play":
		col = config.PlayBookingsCol
	default:
		// Try to find in all collections using booking_id - same logic as GetBookingDetails
		var booking interface{}

		// Check main bookings (events)
		booking = &models.Booking{}
		err := config.BookingsCol.FindOne(ctx, bson.M{"booking_id": id}).Decode(booking)
		if err == nil {
			col = config.BookingsCol
			category = "events"
		} else {
			// Check play bookings
			booking = &models.PlayBooking{}
			err = config.PlayBookingsCol.FindOne(ctx, bson.M{"booking_id": id}).Decode(booking)
			if err == nil {
				col = config.PlayBookingsCol
				category = "play"
			} else {
				// Check dining bookings
				booking = &models.DiningBooking{}
				err = config.DiningBookingsCol.FindOne(ctx, bson.M{"booking_id": id}).Decode(booking)
				if err == nil {
					col = config.DiningBookingsCol
					category = "dining"
				} else {
					return c.Status(404).JSON(fiber.Map{"error": "booking not found"})
				}
			}
		}
	}

	// Verify user access if userID provided
	if userID != "" {
		var hasAccess bool
		switch category {
		case "events":
			var booking models.Booking
			col.FindOne(ctx, bson.M{"booking_id": id}).Decode(&booking)
			hasAccess = booking.UserID == userID || booking.UserEmail == c.Query("email")
		case "play":
			var booking models.PlayBooking
			col.FindOne(ctx, bson.M{"booking_id": id}).Decode(&booking)
			hasAccess = booking.UserID == userID || booking.UserEmail == c.Query("email")
		case "dining":
			var booking models.DiningBooking
			col.FindOne(ctx, bson.M{"booking_id": id}).Decode(&booking)
			hasAccess = booking.UserID == userID || booking.UserEmail == c.Query("email")
		}

		if !hasAccess {
			return c.Status(403).JSON(fiber.Map{"error": "access denied"})
		}
	}

	// Check if already cancelled
	var existingBooking interface{}
	switch category {
	case "events":
		existingBooking = &models.Booking{}
		col.FindOne(ctx, bson.M{"booking_id": id}).Decode(existingBooking)
	case "play":
		existingBooking = &models.PlayBooking{}
		col.FindOne(ctx, bson.M{"booking_id": id}).Decode(existingBooking)
	case "dining":
		existingBooking = &models.DiningBooking{}
		col.FindOne(ctx, bson.M{"booking_id": id}).Decode(existingBooking)
	}

	var isCancelled bool
	switch b := existingBooking.(type) {
	case *models.Booking:
		isCancelled = b.Status == "cancelled"
	case *models.PlayBooking:
		isCancelled = b.Status == "cancelled"
	case *models.DiningBooking:
		isCancelled = b.Status == "cancelled"
	}

	if isCancelled {
		return c.Status(400).JSON(fiber.Map{"error": "booking already cancelled"})
	}

	update := bson.M{
		"$set": bson.M{
			"status":       "cancelled",
			"cancelled_at": time.Now(),
		},
	}

	_, err := col.UpdateOne(ctx, bson.M{"booking_id": id}, update)
	if err != nil {
		fmt.Printf("DEBUG: Error updating booking status: %v\n", err)
		return c.Status(500).JSON(fiber.Map{"error": "failed to cancel booking"})
	}

	fmt.Printf("DEBUG: Successfully cancelled booking %s in collection %s\n", id, category)

	return c.JSON(fiber.Map{
		"message":      "booking cancelled successfully",
		"booking_id":   id,
		"status":       "cancelled",
		"cancelled_at": time.Now(),
	})
}
