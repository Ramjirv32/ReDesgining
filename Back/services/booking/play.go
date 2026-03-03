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

func GetPlayBookedSlots(playIDHex string, date string) ([]string, error) {
	playID, err := primitive.ObjectIDFromHex(playIDHex)
	if err != nil {
		return nil, errors.New("invalid play_id")
	}
	col := config.PlayBookingsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := col.Find(ctx, bson.M{
		"play_id": playID,
		"date":    date,
		"status":  "booked",
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []struct {
		Slot string `bson:"slot"`
	}
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	seen := map[string]bool{}
	slots := []string{}
	for _, r := range results {
		if !seen[r.Slot] {
			seen[r.Slot] = true
			slots = append(slots, r.Slot)
		}
	}
	return slots, nil
}

func CreatePlay(b *models.PlayBooking) error {
	if b.UserEmail == "" {
		return errors.New("user email is required")
	}
	if b.PlayID.IsZero() {
		return errors.New("play area id is required")
	}

	col := config.PlayBookingsCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var play models.Play
	errPlay := config.PlaysCol.FindOne(ctx, bson.M{"_id": b.PlayID}).Decode(&play)
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

		adminEmail := config.GetAdminEmail()
		isAdmin := b.UserEmail == adminEmail
		if !isAdmin {
			orgCol := config.OrgsCol
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
