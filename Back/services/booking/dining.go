package booking

import (
	"context"
	"errors"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"
	organizersvc "ticpin-backend/services/organizer"
	"ticpin-backend/utils"

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

	col := config.DiningBookingsCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var dining models.Dining
	errDining := config.GetDB().Collection("dining").FindOne(ctx, bson.M{"_id": b.DiningID}).Decode(&dining)
	if errDining == nil {
		b.OrganizerID = dining.OrganizerID
	}

	var existing models.DiningBooking
	err := col.FindOne(ctx, bson.M{"dining_id": b.DiningID, "user_email": b.UserEmail, "date": b.Date, "time_slot": b.TimeSlot}).Decode(&existing)
	if err == nil {

		orgCol := config.GetDB().Collection("organizers")
		var org models.Organizer
		errOrg := orgCol.FindOne(ctx, bson.M{"email": b.UserEmail}).Decode(&org)
		isAdmin := errOrg == nil && organizersvc.IsAdmin(org)

		if !isAdmin {
			if errOrg != nil {
				return errors.New("you already have a booking for this slot")
			}
		}
	}

	b.ID = primitive.NewObjectID()
	b.BookingID = utils.HashObjectID(b.ID)
	b.Status = "booked"
	b.BookedAt = time.Now()

	_, err = col.InsertOne(ctx, b)
	return err
}
