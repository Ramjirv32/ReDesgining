package offer

import (
	"context"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func Create(o *models.EventOffer) error {
	o.ID = primitive.NewObjectID()
	o.CreatedAt = time.Now()
	col := config.GetDB().Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := col.InsertOne(ctx, o)
	return err
}

func GetAll() ([]models.EventOffer, error) {
	col := config.GetDB().Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := col.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	offers := []models.EventOffer{}
	if err := cursor.All(ctx, &offers); err != nil {
		return nil, err
	}
	return offers, nil
}

func GetForEntity(entityType string, entityID string) ([]models.EventOffer, error) {
	objID, err := primitive.ObjectIDFromHex(entityID)
	if err != nil {
		return nil, err
	}
	col := config.GetDB().Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"applies_to":  entityType,
		"is_active":   true,
		"valid_until": bson.M{"$gt": time.Now()},
		"entity_ids":  bson.M{"$elemMatch": bson.M{"$eq": objID}},
	}
	cursor, err := col.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	offers := []models.EventOffer{}
	if err := cursor.All(ctx, &offers); err != nil {
		return nil, err
	}
	return offers, nil
}
func GetByCategory(category string) ([]models.EventOffer, error) {
	col := config.GetDB().Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"applies_to":  category,
		"is_active":   true,
		"valid_until": bson.M{"$gt": time.Now()},
	}
	cursor, err := col.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	offers := []models.EventOffer{}
	if err := cursor.All(ctx, &offers); err != nil {
		return nil, err
	}
	return offers, nil
}
