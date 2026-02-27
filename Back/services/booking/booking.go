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

// Create stores a new event booking.
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

	// 1. Check for duplicate booking (one booking per email per event)
	// EXEMPTIONS: Admin and Organizers can book multiple times.
	col := config.GetDB().Collection("bookings")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var existing models.Booking
	err := col.FindOne(ctx, bson.M{"event_id": b.EventID, "user_email": b.UserEmail, "status": "booked"}).Decode(&existing)
	if err == nil {
		// Found existing booking. Check if this email is exempt.
		isAdmin := b.UserEmail == "23cs139@kpriet.ac.in" // Default admin email from auth.go
		// In production, we should check os.Getenv("ADMIN_EMAIL") but for now we follow the pattern in auth.go
		if !isAdmin {
			// Check if it's an organizer
			orgCol := config.GetDB().Collection("organizers")
			var org models.Organizer
			errOrg := orgCol.FindOne(ctx, bson.M{"email": b.UserEmail}).Decode(&org)
			if errOrg != nil {
				// Not an admin and not an organizer -> Reject duplicate
				return errors.New("this email has already booked for this event")
			}
		}
	}

	// 2. Verify capacity: for each ticket category, count booked tickets

	// Fetch event to get capacity info
	var event models.Event
	evCtx, evCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer evCancel()
	err = config.GetDB().Collection("events").FindOne(evCtx, bson.M{"_id": b.EventID}).Decode(&event)
	if err != nil {
		return errors.New("event not found")
	}

	// Set OrganizerID from Event
	b.OrganizerID = event.OrganizerID
	if b.OrganizerID.IsZero() {
		
		adminID, _ := primitive.ObjectIDFromHex("000000000000000000000001")
		b.OrganizerID = adminID
	}

	// Build a map of category name -> capacity
	capacityMap := map[string]int{}
	for _, cat := range event.TicketCategories {
		if cat.Capacity > 0 {
			capacityMap[cat.Name] = cat.Capacity
		}
	}

	// For each ticket in this booking, check if adding them would exceed capacity
	if len(capacityMap) > 0 {
		for _, t := range b.Tickets {
			cap, hasCap := capacityMap[t.Category]
			if !hasCap {
				continue
			}
			// Count already booked tickets for this category
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
						return errors.New("only " + itoa(available) + " seats available for: " + t.Category)
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

	_, err = col.InsertOne(ctx, b)
	return err
}

// GetAvailability returns per-category booked count for an event
func GetAvailability(eventID string) (map[string]int, error) {
	objID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, err
	}
	col := config.GetDB().Collection("bookings")
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

// itoa is a tiny int-to-string helper to avoid importing strconv in a loop
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	result := ""
	for n > 0 {
		result = string(rune('0'+n%10)) + result
		n /= 10
	}
	return result
}
