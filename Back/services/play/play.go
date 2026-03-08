package play

import (
	"context"
	"errors"
	"time"

	"ticpin-backend/cache"
	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func Create(p *models.Play) error {
	orgCol := config.OrgsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := orgCol.FindOne(ctx, bson.M{"_id": p.OrganizerID}, options.FindOne().SetProjection(bson.M{"isVerified": 1, "categoryStatus": 1})).Decode(&org); err != nil {
		return errors.New("organizer not found")
	}
	if !org.IsVerified {
		return errors.New("organizer is not verified")
	}
	if org.CategoryStatus["play"] != "approved" {
		return errors.New("organizer is not approved for the play category")
	}
	p.ID = primitive.NewObjectID()
	if p.Status == "" {
		p.Status = "draft"
	}
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	col := config.PlaysCol
	ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel2()
	_, err := col.InsertOne(ctx2, p)
	return err
}

func GetAll(category string, status string, limit int, after string) ([]models.Play, string, error) {
	col := config.PlaysCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}
	if category != "" {
		filter["category"] = category
	}
	if status != "" {
		filter["status"] = status
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

	var plays []models.Play
	if err := cursor.All(ctx, &plays); err != nil {
		return nil, "", err
	}

	nextCursor := ""
	if len(plays) > 0 {
		nextCursor = plays[len(plays)-1].ID.Hex()
	}

	return plays, nextCursor, nil
}

func GetByID(id string, bypassCache bool) (*models.Play, error) {

	cacheKey := "play:" + id
	if !bypassCache {
		if val, ok := cache.GlobalCache.Get(cacheKey); ok {
			if p, ok := val.(*models.Play); ok {
				return p, nil
			}
		}
	}

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		// If input is not a valid ObjectID, try fetching by name.
		p, errNamed := GetByName(id)
		if errNamed == nil {
			cache.GlobalCache.Set(cacheKey, p, 5*time.Minute)
			return p, nil
		}
		return nil, err
	}
	col := config.PlaysCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var p models.Play
	if err := col.FindOne(ctx, bson.M{"_id": objID}).Decode(&p); err != nil {
		return nil, err
	}

	cache.GlobalCache.Set(cacheKey, &p, 5*time.Minute)

	return &p, nil
}

func GetByName(name string) (*models.Play, error) {
	col := config.PlaysCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var p models.Play
	if err := col.FindOne(ctx, bson.M{"name": name}).Decode(&p); err != nil {
		return nil, err
	}
	return &p, nil
}

func GetByOrganizer(organizerID string) ([]models.Play, error) {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return nil, err
	}
	col := config.PlaysCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := col.Find(ctx, bson.M{"organizer_id": objID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var plays []models.Play
	if err := cursor.All(ctx, &plays); err != nil {
		return nil, err
	}
	return plays, nil
}

func Update(id string, organizerID string, update *models.Play) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	orgID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}
	col := config.PlaysCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var original models.Play
	if err := col.FindOne(ctx, bson.M{"_id": objID, "organizer_id": orgID}).Decode(&original); err != nil {
		return errors.New("play not found or not owned by this organizer")
	}

	updateDoc := bson.M{}
	if update.Name != "" {
		updateDoc["name"] = update.Name
	}
	if update.Category != "" {
		updateDoc["category"] = update.Category
	}
	if update.VenueName != "" {
		updateDoc["venue_name"] = update.VenueName
	}
	if update.Time != "" {
		updateDoc["time"] = update.Time
	}
	if update.OpeningTime != "" {
		updateDoc["opening_time"] = update.OpeningTime
	}
	if update.ClosingTime != "" {
		updateDoc["closing_time"] = update.ClosingTime
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
	if update.PriceStartsFrom > 0 {
		updateDoc["price_starts_from"] = update.PriceStartsFrom
	}
	if update.Description != "" {
		updateDoc["description"] = update.Description
	}
	if len(update.Courts) > 0 {
		updateDoc["courts"] = update.Courts
	}
	if update.EventInstructions != "" {
		updateDoc["event_instructions"] = update.EventInstructions
	}

	updateDoc["updatedAt"] = time.Now()

	_, err = col.UpdateOne(
		ctx,
		bson.M{"_id": objID, "organizer_id": orgID},
		bson.M{"$set": updateDoc},
	)
	if err == nil {

		cache.GlobalCache.Delete("play:" + id)
	}
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
	col := config.PlaysCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := col.DeleteOne(ctx, bson.M{"_id": objID, "organizer_id": orgID})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return errors.New("play not found or not owned by this organizer")
	}

	cache.GlobalCache.Delete("play:" + id)
	return nil
}
