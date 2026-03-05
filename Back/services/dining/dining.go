package dining

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

func Create(d *models.Dining) error {
	orgCol := config.OrgsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := orgCol.FindOne(ctx, bson.M{"_id": d.OrganizerID}, options.FindOne().SetProjection(bson.M{"isVerified": 1, "categoryStatus": 1})).Decode(&org); err != nil {
		return errors.New("organizer not found")
	}
	if !org.IsVerified {
		return errors.New("organizer is not verified")
	}
	if org.CategoryStatus["dining"] != "approved" {
		return errors.New("organizer is not approved for the dining category")
	}
	d.ID = primitive.NewObjectID()
	if d.Status == "" {
		d.Status = "draft"
	}
	d.CreatedAt = time.Now()
	d.UpdatedAt = time.Now()
	col := config.DiningsCol
	ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel2()
	_, err := col.InsertOne(ctx2, d)
	return err
}

func GetAll(limit int, after string) ([]models.Dining, string, error) {
	col := config.DiningsCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}
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

	var dinings []models.Dining
	if err := cursor.All(ctx, &dinings); err != nil {
		return nil, "", err
	}

	nextCursor := ""
	if len(dinings) > 0 {
		nextCursor = dinings[len(dinings)-1].ID.Hex()
	}

	return dinings, nextCursor, nil
}

func GetByID(id string, bypassCache bool) (*models.Dining, error) {
	
	cacheKey := "dining:" + id
	if !bypassCache {
		if val, ok := cache.GlobalCache.Get(cacheKey); ok {
			if d, ok := val.(*models.Dining); ok {
				return d, nil
			}
		}
	}

	
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	col := config.DiningsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var d models.Dining
	if err := col.FindOne(ctx, bson.M{"_id": objID}).Decode(&d); err != nil {
		return nil, err
	}

	
	cache.GlobalCache.Set(cacheKey, &d, 5*time.Minute)

	return &d, nil
}

func GetByOrganizer(organizerID string) ([]models.Dining, error) {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return nil, err
	}
	col := config.DiningsCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := col.Find(ctx, bson.M{"organizer_id": objID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var dinings []models.Dining
	if err := cursor.All(ctx, &dinings); err != nil {
		return nil, err
	}
	return dinings, nil
}

func Update(id string, organizerID string, update *models.Dining) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	orgID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}
	col := config.DiningsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var original models.Dining
	if err := col.FindOne(ctx, bson.M{"_id": objID, "organizer_id": orgID}).Decode(&original); err != nil {
		return errors.New("dining not found or not owned by this organizer")
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
		cache.GlobalCache.Delete("dining:" + id)
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
	col := config.DiningsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := col.DeleteOne(ctx, bson.M{"_id": objID, "organizer_id": orgID})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return errors.New("dining not found or not owned by this organizer")
	}
	cache.GlobalCache.Delete("dining:" + id)
	return nil
}
