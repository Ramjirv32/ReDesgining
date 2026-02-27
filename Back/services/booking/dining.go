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

func CreateDining(b *models.DiningBooking) error {
	if b.UserEmail == "" {
		return errors.New("user email is required")
	}
	if b.DiningID.IsZero() {
		return errors.New("dining id is required")
	}

	col := config.GetDB().Collection("dining_bookings")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Fetch Dining to get OrganizerID
	var dining models.Dining
	errDining := config.GetDB().Collection("dining").FindOne(ctx, bson.M{"_id": b.DiningID}).Decode(&dining)
	if errDining == nil {
		b.OrganizerID = dining.OrganizerID
	}
	if b.OrganizerID.IsZero() {
		adminID, _ := primitive.ObjectIDFromHex("000000000000000000000001")
		b.OrganizerID = adminID
	}

	// Duplicate check
	var existing models.DiningBooking
	err := col.FindOne(ctx, bson.M{"dining_id": b.DiningID, "user_email": b.UserEmail, "date": b.Date, "time_slot": b.TimeSlot}).Decode(&existing)
	if err == nil {
		// Exempt admin/organizers
		isAdmin := b.UserEmail == "23cs139@kpriet.ac.in"
		if !isAdmin {
			orgCol := config.GetDB().Collection("organizers")
			var org models.Organizer
			if errOrg := orgCol.FindOne(ctx, bson.M{"email": b.UserEmail}).Decode(&org); errOrg != nil {
				return errors.New("you already have a booking for this slot")
			}
		}
	}

	b.ID = primitive.NewObjectID()
	b.Status = "booked"
	b.BookedAt = time.Now()

	_, err = col.InsertOne(ctx, b)
	return err
}
