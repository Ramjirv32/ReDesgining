package booking

import (
	"context"
	"errors"
	"strconv"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"
	organizersvc "ticpin-backend/services/organizer"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

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

	session, err := config.MongoClient.StartSession()
	if err != nil {
		return err
	}
	defer session.EndSession(context.Background())

	_, err = session.WithTransaction(context.Background(), func(sessCtx mongo.SessionContext) (interface{}, error) {
		col := config.BookingsCol

		var existing models.Booking
		err := col.FindOne(sessCtx, bson.M{"event_id": b.EventID, "user_email": b.UserEmail, "status": "booked"}).Decode(&existing)
		if err == nil {
			// Check if user is admin by looking up organizer
			orgCol := config.OrgsCol
			var org models.Organizer
			errOrg := orgCol.FindOne(sessCtx, bson.M{"email": b.UserEmail}).Decode(&org)
			isAdmin := errOrg == nil && organizersvc.IsAdmin(org)

			if !isAdmin {
				if errOrg != nil {
					return nil, errors.New("this email has already booked for this event")
				}
			}
		}

		var event models.Event
		err = config.EventsCol.FindOne(sessCtx, bson.M{"_id": b.EventID}).Decode(&event)
		if err != nil {
			return nil, errors.New("event not found")
		}

		b.OrganizerID = event.OrganizerID
		if b.OrganizerID.IsZero() {
			adminID, _ := primitive.ObjectIDFromHex("000000000000000000000001")
			b.OrganizerID = adminID
		}

		capacityMap := map[string]int{}
		for _, cat := range event.TicketCategories {
			if cat.Capacity > 0 {
				capacityMap[cat.Name] = cat.Capacity
			}
		}

		if len(capacityMap) > 0 {
			for _, t := range b.Tickets {
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
				cursor, err := col.Aggregate(sessCtx, pipeline)
				if err == nil {
					var results []struct {
						Total int `bson:"total"`
					}
					if cursor.All(sessCtx, &results) == nil && len(results) > 0 {
						alreadyBooked := results[0].Total
						if alreadyBooked+t.Quantity > cap {
							available := cap - alreadyBooked
							if available <= 0 {
								return nil, errors.New("seats full for category: " + t.Category)
							}
							return nil, errors.New("only " + strconv.Itoa(available) + " seats available for: " + t.Category)
						}
					}
				}
			}
		}

		b.ID = primitive.NewObjectID()
		if b.Status == "" {
			b.Status = "booked"
		}
		b.BookedAt = time.Now()

		_, err = col.InsertOne(sessCtx, b)
		return nil, err
	})

	return err
}

func GetAvailability(eventID string) (map[string]int, error) {
	objID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, err
	}
	col := config.BookingsCol
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
