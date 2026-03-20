package bookingctrl

import (
	"context"
	"fmt"
	"ticpin-backend/config"
	"ticpin-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
)

func GetBookingDetails(c *fiber.Ctx) error {
	bookingID := c.Params("id")
	userID := c.Query("user_id")

	fmt.Printf("DEBUG: GetBookingDetails called - ID: %s, UserID: %s\n", bookingID, userID)

	if bookingID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "booking ID is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Try different collections based on booking type - search by booking_id instead of _id
	var booking interface{}
	var bookingType string

	// Check main bookings collection first (for event bookings)
	fmt.Printf("DEBUG: Checking main bookings collection for booking_id: %s\n", bookingID)
	mainBooking := &models.Booking{}
	err := config.BookingsCol.FindOne(ctx, bson.M{"booking_id": bookingID}).Decode(mainBooking)
	if err == nil {
		fmt.Printf("DEBUG: Found in main bookings collection\n")
		booking = mainBooking
		bookingType = "event"
	} else {
		fmt.Printf("DEBUG: Not found in main bookings: %v\n", err)
	}

	// If not found, check event_bookings collection
	if booking == nil {
		fmt.Printf("DEBUG: Checking event_bookings collection for booking_id: %s\n", bookingID)
		eventBooking := &models.Booking{}
		err = config.EventBookingsCol.FindOne(ctx, bson.M{"booking_id": bookingID}).Decode(eventBooking)
		if err == nil {
			fmt.Printf("DEBUG: Found in event_bookings collection\n")
			booking = eventBooking
			bookingType = "event"
		} else {
			fmt.Printf("DEBUG: Not found in event_bookings: %v\n", err)
		}
	}

	// If not found, check play bookings
	if booking == nil {
		playBooking := &models.PlayBooking{}
		err = config.PlayBookingsCol.FindOne(ctx, bson.M{"booking_id": bookingID}).Decode(playBooking)
		if err == nil {
			booking = playBooking
			bookingType = "play"
		}
	}

	// If not found, check dining bookings
	if booking == nil {
		diningBooking := &models.DiningBooking{}
		err = config.DiningBookingsCol.FindOne(ctx, bson.M{"booking_id": bookingID}).Decode(diningBooking)
		if err == nil {
			booking = diningBooking
			bookingType = "dining"
		}
	}

	if booking == nil {
		fmt.Printf("DEBUG: Booking not found with ID: %s\n", bookingID)
		return c.Status(404).JSON(fiber.Map{"error": "booking not found"})
	}

	// Check user access (if user_id provided)
	if userID != "" {
		var hasAccess bool
		switch b := booking.(type) {
		case *models.Booking:
			hasAccess = b.UserID == userID || b.UserEmail == c.Query("email")
		case *models.PlayBooking:
			hasAccess = b.UserID == userID || b.UserEmail == c.Query("email")
		case *models.DiningBooking:
			hasAccess = b.UserID == userID || b.UserEmail == c.Query("email")
		}

		if !hasAccess {
			return c.Status(403).JSON(fiber.Map{"error": "access denied"})
		}
	}

	// Build response
	response := fiber.Map{
		"id":        bookingID, // Use booking_id instead of _id
		"type":      bookingType,
		"status":    "booked", // Default, will be overridden below
		"booked_at": time.Now(),
	}

	switch bookingType {
	case "event":
		b := booking.(*models.Booking)
		var event models.Event
		config.EventsCol.FindOne(ctx, bson.M{"_id": b.EventID}).Decode(&event)

		response["event_name"] = event.Name
		response["event_image_url"] = event.PortraitImageURL
		response["venue_name"] = event.VenueName
		response["venue_address"] = event.VenueAddress
		response["date"] = event.Date  // Use event date
		response["time"] = event.Time  // Use event time
		response["user_name"] = "User" // Would need to get from user profile
		response["user_email"] = b.UserEmail
		response["user_phone"] = b.UserPhone
		response["tickets"] = b.Tickets
		response["order_amount"] = b.OrderAmount
		response["booking_fee"] = b.BookingFee
		response["discount_amount"] = b.DiscountAmount
		response["grand_total"] = b.GrandTotal
		response["payment_method"] = b.PaymentGateway
		response["booked_at"] = b.BookedAt
		response["status"] = b.Status // Include actual status from booking

	case "play":
		b := booking.(*models.PlayBooking)
		var play models.Play
		config.PlaysCol.FindOne(ctx, bson.M{"_id": b.PlayID}).Decode(&play)

		response["event_name"] = play.Name
		response["event_image_url"] = play.PortraitImageURL
		response["venue_name"] = b.VenueName
		response["venue_address"] = b.VenueName
		response["date"] = b.Date
		response["time"] = b.Slot
		response["user_name"] = "User" // Would need to get from user profile
		response["user_email"] = b.UserEmail
		response["user_phone"] = "" // Would need to get from user profile
		response["tickets"] = b.Tickets
		response["order_amount"] = b.OrderAmount
		response["booking_fee"] = b.BookingFee
		response["discount_amount"] = b.DiscountAmount
		response["grand_total"] = b.GrandTotal
		response["payment_method"] = b.PaymentGateway
		response["booked_at"] = b.BookedAt
		response["status"] = b.Status // Include actual status from booking

	case "dining":
		b := booking.(*models.DiningBooking)
		var dining models.Dining
		config.DiningsCol.FindOne(ctx, bson.M{"_id": b.DiningID}).Decode(&dining)

		response["event_name"] = dining.Name
		response["event_image_url"] = dining.PortraitImageURL
		response["venue_name"] = dining.VenueName
		response["venue_address"] = dining.VenueAddress
		response["date"] = b.Date
		response["time"] = b.TimeSlot
		response["user_name"] = "User" // Would need to get from user profile
		response["user_email"] = b.UserEmail
		response["user_phone"] = "" // Would need to get from user profile
		response["tickets"] = []map[string]interface{}{
			{"category": "Table", "quantity": b.Guests, "price": b.OrderAmount},
		}
		response["order_amount"] = b.OrderAmount
		response["booking_fee"] = b.BookingFee
		response["discount_amount"] = b.DiscountAmount
		response["grand_total"] = b.GrandTotal
		response["payment_method"] = b.PaymentGateway
		response["booked_at"] = b.BookedAt
		response["status"] = b.Status // Include actual status from booking
	}

	fmt.Printf("DEBUG: Returning booking details response\n")
	return c.JSON(response)
}
