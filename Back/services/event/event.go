package event

import (
	"context"
	"errors"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func calculateMinPrice(categories []models.TicketCategory) float64 {
	if len(categories) == 0 {
		return 0
	}
	min := categories[0].Price
	for _, cat := range categories {
		if cat.Price < min {
			min = cat.Price
		}
	}
	return min
}

func Create(e *models.Event) error {
	orgCol := config.OrgsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := orgCol.FindOne(ctx, bson.M{"_id": e.OrganizerID}, options.FindOne().SetProjection(bson.M{"isVerified": 1, "categoryStatus": 1})).Decode(&org); err != nil {
		return errors.New("organizer not found")
	}
	if !org.IsVerified {
		return errors.New("organizer is not verified")
	}
	if org.CategoryStatus["events"] != "approved" {
		return errors.New("organizer is not approved for the events category")
	}

	if len(e.TicketCategories) > 0 {
		e.PriceStartsFrom = calculateMinPrice(e.TicketCategories)
	}

	e.ID = primitive.NewObjectID()
	if e.Status == "" {
		e.Status = "draft"
	}
	e.CreatedAt = time.Now()
	e.UpdatedAt = time.Now()
	col := config.EventsCol
	ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel2()
	_, err := col.InsertOne(ctx2, e)
	return err
}

func GetAll(category string, artist string, limit int, after string) ([]models.Event, string, error) {
	col := config.EventsCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}
	if category != "" {
		filter["category"] = category
	}
	if artist != "" {
		filter["artists.name"] = bson.M{"$regex": primitive.Regex{Pattern: artist, Options: "i"}}
	}

	if after != "" {
		if oid, err := primitive.ObjectIDFromHex(after); err == nil {
			filter["_id"] = bson.M{"$gt": oid}
		}
	}

	if limit <= 0 || limit > 100 {
		limit = 20
	}

	opts := options.Find().SetLimit(int64(limit)).SetSort(bson.M{"_id": 1})

	cursor, err := col.Find(ctx, filter, opts)
	if err != nil {
		return nil, "", err
	}
	defer cursor.Close(ctx)

	var events []models.Event
	if err := cursor.All(ctx, &events); err != nil {
		return nil, "", err
	}

	nextCursor := ""
	if len(events) > 0 {
		nextCursor = events[len(events)-1].ID.Hex()
	}

	return events, nextCursor, nil
}

func GetByID(id string) (*models.Event, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	col := config.EventsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var e models.Event
	if err := col.FindOne(ctx, bson.M{"_id": objID}).Decode(&e); err != nil {
		return nil, err
	}
	return &e, nil
}

func GetByOrganizer(organizerID string) ([]models.Event, error) {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return nil, err
	}
	col := config.EventsCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := col.Find(ctx, bson.M{"organizer_id": objID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var events []models.Event
	if err := cursor.All(ctx, &events); err != nil {
		return nil, err
	}
	return events, nil
}

func Update(id string, organizerID string, update *models.Event) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	orgID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}
	col := config.EventsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var original models.Event
	if err := col.FindOne(ctx, bson.M{"_id": objID, "organizer_id": orgID}).Decode(&original); err != nil {
		return errors.New("event not found or not owned by this organizer")
	}

	updateDoc := bson.M{}
	if update.Name != "" {
		updateDoc["name"] = update.Name
	}
	if update.Category != "" {
		updateDoc["category"] = update.Category
	}
	if !update.Date.IsZero() {
		updateDoc["date"] = update.Date
	}
	if update.VenueName != "" {
		updateDoc["venue_name"] = update.VenueName
	}
	if update.VenueAddress != "" {
		updateDoc["venue_address"] = update.VenueAddress
	}
	if update.PortraitImageURL != "" {
		updateDoc["portrait_image_url"] = update.PortraitImageURL
	}
	if update.LandscapeImageURL != "" {
		updateDoc["landscape_image_url"] = update.LandscapeImageURL
	}
	if len(update.TicketCategories) > 0 {
		updateDoc["ticket_categories"] = update.TicketCategories
		updateDoc["price_starts_from"] = calculateMinPrice(update.TicketCategories)
	}
	if update.Description != "" {
		updateDoc["description"] = update.Description
	}
	if len(update.Artists) > 0 {
		updateDoc["artists"] = update.Artists
	}

	updateDoc["updatedAt"] = time.Now()
	updateDoc["status"] = "pending"

	_, err = col.UpdateOne(
		ctx,
		bson.M{"_id": objID, "organizer_id": orgID},
		bson.M{"$set": updateDoc},
	)
	return err
}

func Delete(id string, organizerID string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	orgID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}
	col := config.EventsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := col.DeleteOne(ctx, bson.M{"_id": objID, "organizer_id": orgID})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return errors.New("event not found or not owned by this organizer")
	}
	return nil
}
