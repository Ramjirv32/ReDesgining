package event

import (
	"context"
	"errors"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
	orgCol := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := orgCol.FindOne(ctx, bson.M{"_id": e.OrganizerID}).Decode(&org); err != nil {
		return errors.New("organizer not found")
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
	col := config.GetDB().Collection("events")
	ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel2()
	_, err := col.InsertOne(ctx2, e)
	return err
}

func GetAll(category string, artist string) ([]models.Event, error) {
	col := config.GetDB().Collection("events")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}
	if category != "" {
		filter["category"] = category
	}
	if artist != "" {
		filter["artists.name"] = bson.M{"$regex": primitive.Regex{Pattern: artist, Options: "i"}}
	}

	cursor, err := col.Find(ctx, filter)
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

func GetByID(id string) (*models.Event, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	col := config.GetDB().Collection("events")
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
	col := config.GetDB().Collection("events")
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
	col := config.GetDB().Collection("events")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var original models.Event
	if err := col.FindOne(ctx, bson.M{"_id": objID, "organizer_id": orgID}).Decode(&original); err != nil {
		return errors.New("event not found or not owned by this organizer")
	}
	update.UpdatedAt = time.Now()
	update.OrganizerID = orgID
	update.CreatedAt = original.CreatedAt

	// Always reset to pending so admin must re-approve after any organizer edit
	update.Status = "pending"

	if len(update.TicketCategories) > 0 {
		update.PriceStartsFrom = calculateMinPrice(update.TicketCategories)
	} else {
		update.PriceStartsFrom = original.PriceStartsFrom
	}
	ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel2()
	_, err = col.UpdateOne(
		ctx2,
		bson.M{"_id": objID, "organizer_id": orgID},
		bson.M{"$set": update},
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
	col := config.GetDB().Collection("events")
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
