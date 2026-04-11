package booking

import (
	"context"
	"fmt"
	"ticpin-backend/config"
	"ticpin-backend/models"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func SendConfirmationEmail(orderID string, category string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var col *mongo.Collection
	switch category {
	case "play":
		col = config.PlayBookingsCol
	case "events":
		col = config.EventBookingsCol
	default:
		return fmt.Errorf("invalid category: %s", category)
	}

	filter := bson.M{
		"$or": []bson.M{
			{"order_id": orderID},
			{"payment_id": orderID},
		},
	}

	if category == "play" {
		var b models.PlayBooking
		err := col.FindOne(ctx, filter).Decode(&b)
		if err != nil {
			return err
		}

		// Fetch Play details for image
		var play models.Play
		var playImageURL string
		err = config.PlaysCol.FindOne(ctx, bson.M{"_id": b.PlayID}).Decode(&play)
		if err == nil {
			if play.LandscapeImageURL != "" {
				playImageURL = play.LandscapeImageURL
			} else {
				playImageURL = play.PortraitImageURL
			}
		}

		// Format data for email
		data := config.BookingEmailData{
			Day:          b.BookedAt.Format("Monday"),
			Date:         b.BookedAt.Format("02"),
			Month:        b.BookedAt.Format("January"),
			Time:         b.Slot,
			PlayName:     b.VenueName,
			VenueAddress: b.Address,
			Location:     b.City,
			BookingID:    b.BookingID,
			Duration:     b.Duration,
			UserPhone:    b.UserPhone,
			PlayImageURL: playImageURL,
		}

		return config.SendBookingConfirmation(b.UserEmail, "play", data)
	} else {
		var b models.Booking
		err := col.FindOne(ctx, filter).Decode(&b)
		if err != nil {
			return err
		}

		// Fetch Event details for Venue, Time and Image
		var event models.Event
		err = config.EventsCol.FindOne(ctx, bson.M{"_id": b.EventID}).Decode(&event)
		if err != nil {
			// Fallback if event not found
			event.VenueName = "Venue"
			event.Time = "All Day"
		}

		eventImageURL := event.PortraitImageURL
		if eventImageURL == "" {
			eventImageURL = event.LandscapeImageURL
		}

		// Format data for email
		data := config.BookingEmailData{
			Day:           b.BookedAt.Format("Monday"),
			Date:          b.BookedAt.Format("02"),
			Month:         b.BookedAt.Format("January"),
			Time:          event.Time,
			EventName:     b.EventName,
			Venue:         event.VenueName,
			Location:      b.City,
			BookingID:     b.BookingID,
			TicketCount:   0,
			UserPhone:     b.UserPhone,
			EventImageURL: eventImageURL,
		}
		for _, t := range b.Tickets {
			data.TicketCount += t.Quantity
		}

		return config.SendBookingConfirmation(b.UserEmail, "events", data)
	}
}
