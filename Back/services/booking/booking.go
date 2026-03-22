package booking

import (
	"context"
	"crypto/rand"
	"errors"
	"math/big"
	"strconv"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"
	"ticpin-backend/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func generateBookingID() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const length = 8

	b := make([]byte, length)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		b[i] = charset[n.Int64()]
	}
	return string(b)
}

func Create(b *models.Booking) error {
	if b.UserEmail == "" {
		return errors.New("user email is required")
	}
	if b.EventID.IsZero() {
		return errors.New("event id is required")
	}
	if len(b.Tickets) == 0 {
		return errors.New("at least one ticket is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	col := config.EventBookingsCol

	var event models.Event
	err := config.EventsCol.FindOne(ctx, bson.M{"_id": b.EventID}).Decode(&event)
	if err != nil {
		return errors.New("event not found")
	}

	b.OrganizerID = event.OrganizerID

	b.ID = primitive.NewObjectID()

	b.BookingID = utils.HashObjectID(b.ID)

	if b.Status == "" {
		b.Status = "booked"
	}
	b.BookedAt = time.Now()

	capacityMap := map[string]int{}
	if event.TicketCategories != nil {
		for _, cat := range event.TicketCategories {
			if cat.Capacity > 0 {
				capacityMap[cat.Name] = cat.Capacity
			}
		}
	}

	if len(capacityMap) > 0 && b.Tickets != nil {
		for _, t := range b.Tickets {
			if t.Category == "" {
				continue
			}
			cap, hasCap := capacityMap[t.Category]
			if !hasCap {
				continue
			}
			pipeline := []bson.M{
				{"$match": bson.M{
					"event_id": b.EventID,
					"status":   "booked",
				}},
				{"$unwind": "$tickets"},
				{"$match": bson.M{"tickets.category": t.Category}},
				{"$group": bson.M{
					"_id":   nil,
					"total": bson.M{"$sum": "$tickets.quantity"},
				}},
			}
			cursor, err := col.Aggregate(ctx, pipeline)
			if err == nil {
				var results []struct {
					Total int `bson:"total"`
				}
				if cursor.All(ctx, &results) == nil && len(results) > 0 {
					alreadyBooked := results[0].Total
					if alreadyBooked+t.Quantity > cap {
						available := cap - alreadyBooked
						if available <= 0 {
							return errors.New("seats full for category: " + t.Category)
						}
						return errors.New("only " + strconv.Itoa(available) + " seats available for: " + t.Category)
					}
				}
			}
		}
	}

	_, err = col.InsertOne(ctx, b)
	return err
}

func GetAvailability(eventID string) (map[string]int, error) {
	objID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, err
	}
	col := config.EventBookingsCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pipeline := []bson.M{
		{"$match": bson.M{"event_id": objID, "status": "booked"}},
		{"$unwind": "$tickets"},
		{"$group": bson.M{
			"_id":   "$tickets.category",
			"total": bson.M{"$sum": "$tickets.quantity"},
		}},
	}

	cursor, err := col.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	result := map[string]int{}
	var rows []struct {
		Category string `bson:"_id"`
		Total    int    `bson:"total"`
	}
	if err := cursor.All(ctx, &rows); err != nil {
		return nil, err
	}
	for _, r := range rows {
		result[r.Category] = r.Total
	}
	return result, nil
}
