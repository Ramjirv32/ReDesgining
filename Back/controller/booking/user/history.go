package bookinguser

import (
	"context"
	"ticpin-backend/config"
	"ticpin-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
)

func GetBookingHistory(c *fiber.Ctx) error {

	authUserID, _ := c.Locals("userId").(string)
	authPhone, _ := c.Locals("phone").(string)

	if authUserID == "" && authPhone == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized: user session not found"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var allBookings []fiber.Map

	var orFilters []bson.M
	if authUserID != "" {
		orFilters = append(orFilters, bson.M{"user_id": authUserID})
	}
	if authPhone != "" {
		orFilters = append(orFilters, bson.M{"user_phone": authPhone})
		orFilters = append(orFilters, bson.M{"user_id": authPhone})
	}

	filter := bson.M{"$or": orFilters}

	cursor, err := config.EventBookingsCol.Find(ctx, filter)
	if err == nil {
		var events []models.Booking
		if cursor.All(ctx, &events) == nil {
			for _, b := range events {
				allBookings = append(allBookings, fiber.Map{
					"id":           b.BookingID,
					"booking_id":   b.BookingID,
					"category":     "events",
					"event_name":   b.EventName,
					"order_amount": b.OrderAmount,
					"grand_total":  b.GrandTotal,
					"status":       b.Status,
					"date":         b.BookedAt.Format("2006-01-02"),
					"booked_at":    b.BookedAt,
					"user_name":    b.UserName,
					"user_phone":   b.UserPhone,
					"address":      b.Address,
					"city":         b.City,
					"state":        b.State,
					"pincode":      b.Pincode,
					"nationality":  b.Nationality,
				})
			}
		}
	}

	cursor, err = config.DiningBookingsCol.Find(ctx, filter)
	if err == nil {
		var dinings []models.DiningBooking
		if cursor.All(ctx, &dinings) == nil {
			for _, b := range dinings {
				allBookings = append(allBookings, fiber.Map{
					"id":           b.BookingID,
					"booking_id":   b.BookingID,
					"category":     "dining",
					"venue_name":   b.VenueName,
					"date":         b.Date,
					"time_slot":    b.TimeSlot,
					"order_amount": b.OrderAmount,
					"grand_total":  b.GrandTotal,
					"status":       b.Status,
					"booked_at":    b.BookedAt,
					"user_name":    b.UserName,
					"user_phone":   b.UserPhone,
					"address":      b.Address,
					"city":         b.City,
					"state":        b.State,
					"pincode":      b.Pincode,
					"nationality":  b.Nationality,
				})
			}
		}
	}

	cursor, err = config.PlayBookingsCol.Find(ctx, filter)
	if err == nil {
		var plays []models.PlayBooking
		if cursor.All(ctx, &plays) == nil {
			for _, b := range plays {
				allBookings = append(allBookings, fiber.Map{
					"id":           b.BookingID,
					"booking_id":   b.BookingID,
					"category":     "play",
					"venue_name":   b.VenueName,
					"date":         b.Date,
					"slot":         b.Slot,
					"order_amount": b.OrderAmount,
					"grand_total":  b.GrandTotal,
					"status":       b.Status,
					"booked_at":    b.BookedAt,
					"user_name":    b.UserName,
					"user_phone":   b.UserPhone,
					"address":      b.Address,
					"city":         b.City,
					"state":        b.State,
					"pincode":      b.Pincode,
					"nationality":  b.Nationality,
				})
			}
		}
	}

	return c.JSON(allBookings)
}

func GetBookingsByEmail(c *fiber.Ctx) error {
	emailParam := c.Params("email")

	authUserID, _ := c.Locals("userId").(string)
	authPhone, _ := c.Locals("phone").(string)

	if authUserID == "" && authPhone == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized: user session not found"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var allBookings []fiber.Map

	filter := bson.M{
		"$or": []bson.M{
			{"user_id": authUserID},
			{"user_phone": authPhone},
			{"user_id": authPhone},
			{"user_email": emailParam},
		},
	}

	cursor, err := config.EventBookingsCol.Find(ctx, filter)
	if err == nil {
		var events []models.Booking
		if cursor.All(ctx, &events) == nil {
			for _, b := range events {
				if b.UserID != authUserID && b.UserPhone != authPhone && b.UserEmail != emailParam {
					continue
				}

				allBookings = append(allBookings, fiber.Map{
					"id":           b.BookingID,
					"booking_id":   b.BookingID,
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

	cursor, err = config.DiningBookingsCol.Find(ctx, filter)
	if err == nil {
		var dinings []models.DiningBooking
		if cursor.All(ctx, &dinings) == nil {
			for _, b := range dinings {
				if b.UserID != authUserID && b.UserPhone != authPhone && b.UserEmail != emailParam {
					continue
				}
				allBookings = append(allBookings, fiber.Map{
					"id":           b.BookingID,
					"booking_id":   b.BookingID,
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

	cursor, err = config.PlayBookingsCol.Find(ctx, filter)
	if err == nil {
		var plays []models.PlayBooking
		if cursor.All(ctx, &plays) == nil {
			for _, b := range plays {
				if b.UserID != authUserID && b.UserPhone != authPhone && b.UserEmail != emailParam {
					continue
				}
				allBookings = append(allBookings, fiber.Map{
					"id":           b.BookingID,
					"booking_id":   b.BookingID,
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
