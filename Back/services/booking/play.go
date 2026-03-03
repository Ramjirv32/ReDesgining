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

var TIME_SLOTS = []string{
	"06:00 - 07:00 AM", "07:00 - 08:00 AM", "08:00 - 09:00 AM",
	"09:00 - 10:00 AM", "10:00 - 11:00 AM", "11:00 AM - 12:00 PM",
	"04:00 - 05:00 PM", "05:00 - 06:00 PM", "06:00 - 07:00 PM",
	"07:00 - 08:00 PM", "08:00 - 09:00 PM", "09:00 - 10:00 PM",
}

func getSlotIndex(slot string) int {
	for i, s := range TIME_SLOTS {
		if s == slot {
			return i
		}
	}
	return -1
}

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

	var results []models.PlayBooking
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	bookedCombinations := []string{}
	for _, b := range results {
		startIdx := getSlotIndex(b.Slot)
		if startIdx == -1 {
			continue
		}

		duration := b.Duration
		if duration <= 0 {
			duration = 1
		}

		for _, ticket := range b.Tickets {
			for i := 0; i < duration; i++ {
				if startIdx+i < len(TIME_SLOTS) {
					bookedCombinations = append(bookedCombinations, TIME_SLOTS[startIdx+i]+"|"+ticket.Category)
				}
			}
		}
	}
	return bookedCombinations, nil
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

	startIdx := getSlotIndex(b.Slot)
	if startIdx == -1 {
		return errors.New("invalid time slot")
	}

	duration := b.Duration
	if duration <= 0 {
		duration = 1
	}

	// Check if any of the requested courts are already booked in ANY of the overlapping slots
	for _, ticket := range b.Tickets {
		cursor, err := col.Find(ctx, bson.M{
			"play_id":          b.PlayID,
			"date":             b.Date,
			"status":           "booked",
			"tickets.category": ticket.Category,
		})
		if err != nil {
			continue
		}

		var existingBookings []models.PlayBooking
		if err := cursor.All(ctx, &existingBookings); err != nil {
			cursor.Close(ctx)
			continue
		}
		cursor.Close(ctx)

		for _, eb := range existingBookings {
			ebStart := getSlotIndex(eb.Slot)
			ebDur := eb.Duration
			if ebDur <= 0 {
				ebDur = 1
			}

			// Overlap logic: [startIdx, startIdx + duration) overlaps [ebStart, ebStart + ebDur)
			if (startIdx < ebStart+ebDur) && (ebStart < startIdx+duration) {
				return errors.New("court " + ticket.Category + " is already booked during this time window")
			}
		}
	}

	b.ID = primitive.NewObjectID()
	b.Status = "booked"
	b.BookedAt = time.Now()

	_, err := col.InsertOne(ctx, b)
	return err
}
