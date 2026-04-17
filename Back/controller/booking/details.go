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
	fmt.Printf("DEBUG: GetBookingDetails called - ID: %s\n", bookingID)

	if bookingID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "booking ID is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var booking interface{}
	var bookingType string

	fmt.Printf("DEBUG: Checking event_bookings collection for booking_id: %s\n", bookingID)
	eventBooking := &models.Booking{}
	err := config.EventBookingsCol.FindOne(ctx, bson.M{"booking_id": bookingID}).Decode(eventBooking)
	if err == nil {
		fmt.Printf("DEBUG: Found in event_bookings collection\n")
		booking = eventBooking
		bookingType = "event"
	} else {
		fmt.Printf("DEBUG: Not found in event_bookings: %v\n", err)
	}

	if booking == nil {
		playBooking := &models.PlayBooking{}
		err = config.PlayBookingsCol.FindOne(ctx, bson.M{"booking_id": bookingID}).Decode(playBooking)
		if err == nil {
			booking = playBooking
			bookingType = "play"
		}
	}

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

	authUserID, _ := c.Locals("userId").(string)
	authPhone, _ := c.Locals("phone").(string)

	isOwner := false
	switch b := booking.(type) {
	case *models.Booking:
		isOwner = (b.UserID != "" && b.UserID == authUserID) || (b.UserPhone != "" && b.UserPhone == authPhone)
	case *models.PlayBooking:
		isOwner = (b.UserID != "" && b.UserID == authUserID) || (b.UserPhone != "" && b.UserPhone == authPhone)
	case *models.DiningBooking:
		isOwner = (b.UserID != "" && b.UserID == authUserID) || (b.UserPhone != "" && b.UserPhone == authPhone)
	}

	if !isOwner {
		fmt.Printf("SECURITY ALERT: Unauthorized access attempt to booking %s by user %s/%s\n", bookingID, authUserID, authPhone)
		return c.Status(403).JSON(fiber.Map{"error": "access denied: you do not own this booking"})
	}

	response := buildBookingResponse(booking, bookingType)
	fmt.Printf("DEBUG: Returning booking details response\n")
	return c.JSON(response)
}

func GetPublicBookingDetails(c *fiber.Ctx) error {
	bookingID := c.Params("id")
	fmt.Printf("DEBUG: GetPublicBookingDetails called - ID: %s\n", bookingID)

	if bookingID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "booking ID is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var booking interface{}
	var bookingType string

	eventBooking := &models.Booking{}
	err := config.EventBookingsCol.FindOne(ctx, bson.M{"booking_id": bookingID}).Decode(eventBooking)
	if err == nil {
		booking = eventBooking
		bookingType = "event"
	}

	if booking == nil {
		playBooking := &models.PlayBooking{}
		err = config.PlayBookingsCol.FindOne(ctx, bson.M{"booking_id": bookingID}).Decode(playBooking)
		if err == nil {
			booking = playBooking
			bookingType = "play"
		}
	}

	if booking == nil {
		diningBooking := &models.DiningBooking{}
		err = config.DiningBookingsCol.FindOne(ctx, bson.M{"booking_id": bookingID}).Decode(diningBooking)
		if err == nil {
			booking = diningBooking
			bookingType = "dining"
		}
	}

	if booking == nil {
		return c.Status(404).JSON(fiber.Map{"error": "booking not found"})
	}

	response := buildBookingResponse(booking, bookingType)
	// Remove potentially sensitive info for public view if needed, but for now return all as requested
	fmt.Printf("DEBUG: Returning public booking details response\n")
	return c.JSON(response)
}

func buildBookingResponse(booking interface{}, bookingType string) fiber.Map {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	response := fiber.Map{
		"id":        "",
		"type":      bookingType,
		"status":    "booked",
		"booked_at": time.Now(),
	}

	switch bookingType {
	case "event":
		b := booking.(*models.Booking)
		var event models.Event
		config.EventsCol.FindOne(ctx, bson.M{"_id": b.EventID}).Decode(&event)

		formattedDate := ""
		if !event.Date.IsZero() {
			formattedDate = event.Date.Format("2006-01-02")
		}

		response["id"] = b.BookingID
		response["event_name"] = event.Name
		response["event_image_url"] = event.PortraitImageURL
		response["venue_name"] = event.VenueName
		response["venue_address"] = event.VenueAddress
		response["date"] = formattedDate
		response["time"] = event.Time
		response["user_name"] = "User"
		response["user_email"] = b.UserEmail
		response["user_phone"] = b.UserPhone
		response["tickets"] = b.Tickets
		response["order_amount"] = b.OrderAmount
		response["booking_fee"] = b.BookingFee
		response["discount_amount"] = b.DiscountAmount
		response["grand_total"] = b.GrandTotal
		response["payment_method"] = b.PaymentGateway
		response["booked_at"] = b.BookedAt
		response["status"] = b.Status
		response["coupon_code"] = b.CouponCode
		response["offer_id"] = b.OfferID.Hex()
		response["ticpass_applied"] = b.TicpassApplied

	case "play":
		b := booking.(*models.PlayBooking)
		var play models.Play
		config.PlaysCol.FindOne(ctx, bson.M{"_id": b.PlayID}).Decode(&play)

		response["id"] = b.BookingID
		response["event_name"] = play.Name
		response["event_image_url"] = play.PortraitImageURL
		response["venue_name"] = b.VenueName
		response["venue_address"] = b.VenueName
		response["date"] = b.Date
		response["time"] = b.Slot
		response["duration"] = b.Duration
		response["user_name"] = "User"
		response["user_email"] = b.UserEmail
		response["user_phone"] = b.UserPhone
		response["tickets"] = b.Tickets
		response["order_amount"] = b.OrderAmount
		response["booking_fee"] = b.BookingFee
		response["discount_amount"] = b.DiscountAmount
		response["grand_total"] = b.GrandTotal
		response["payment_method"] = b.PaymentGateway
		response["booked_at"] = b.BookedAt
		response["status"] = b.Status
		response["coupon_code"] = b.CouponCode
		response["offer_id"] = b.OfferID.Hex()
		response["ticpass_applied"] = b.TicpassApplied

	case "dining":
		b := booking.(*models.DiningBooking)
		var dining models.Dining
		config.DiningsCol.FindOne(ctx, bson.M{"_id": b.DiningID}).Decode(&dining)

		response["id"] = b.BookingID
		response["event_name"] = dining.Name
		response["event_image_url"] = dining.PortraitImageURL
		response["venue_name"] = dining.VenueName
		response["venue_address"] = dining.VenueAddress
		response["date"] = b.Date
		response["time"] = b.TimeSlot
		response["user_name"] = "User"
		response["user_email"] = b.UserEmail
		response["user_phone"] = b.UserPhone
		response["tickets"] = []map[string]interface{}{
			{"category": "Table", "quantity": b.Guests, "price": b.OrderAmount},
		}
		response["order_amount"] = b.OrderAmount
		response["booking_fee"] = b.BookingFee
		response["discount_amount"] = b.DiscountAmount
		response["grand_total"] = b.GrandTotal
		response["payment_method"] = b.PaymentGateway
		response["booked_at"] = b.BookedAt
		response["status"] = b.Status
		response["coupon_code"] = b.CouponCode
		response["offer_id"] = b.OfferID.Hex()
		response["ticpass_applied"] = b.TicpassApplied
	}

	return response
}
