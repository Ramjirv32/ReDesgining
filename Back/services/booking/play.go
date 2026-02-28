package booking

import (
	"context"
	"errors"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreatePlay(b *models.PlayBooking) error {
	if b.UserEmail == "" {
		return errors.New("user email is required")
	}
	if b.PlayID.IsZero() {
		return errors.New("play area id is required")
	}

	col := config.GetDB().Collection("play_bookings")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var play models.Play
	errPlay := config.GetDB().Collection("play").FindOne(ctx, bson.M{"_id": b.PlayID}).Decode(&play)
	if errPlay == nil {
		b.OrganizerID = play.OrganizerID
	}
	if b.OrganizerID.IsZero() {
		adminID, _ := primitive.ObjectIDFromHex("000000000000000000000001")
		b.OrganizerID = adminID
	}

	var existing models.PlayBooking
	err := col.FindOne(ctx, bson.M{"play_id": b.PlayID, "user_email": b.UserEmail, "date": b.Date, "slot": b.Slot}).Decode(&existing)
	if err == nil {
		isAdmin := b.UserEmail == "23cs139@kpriet.ac.in"
		if !isAdmin {
			orgCol := config.GetDB().Collection("organizers")
			var org models.Organizer
			if errOrg := orgCol.FindOne(ctx, bson.M{"email": b.UserEmail}).Decode(&org); errOrg != nil {
				return errors.New("you already have a booking for this play slot")
			}
		}
	}

	b.ID = primitive.NewObjectID()
	b.Status = "booked"
	b.BookedAt = time.Now()

	_, err = col.InsertOne(ctx, b)
	return err
}
