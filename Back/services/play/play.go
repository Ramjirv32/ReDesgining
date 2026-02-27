package play

import (
	"context"
	"errors"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func Create(p *models.Play) error {
	orgCol := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := orgCol.FindOne(ctx, bson.M{"_id": p.OrganizerID}).Decode(&org); err != nil {
		return errors.New("organizer not found")
	}
	if !org.IsVerified {
		return errors.New("organizer is not verified")
	}
	// Check admin approval via CategoryStatus
	if org.CategoryStatus["play"] != "approved" {
		return errors.New("organizer is not approved for the play category")
	}
	p.ID = primitive.NewObjectID()
	if p.Status == "" {
		p.Status = "draft"
	}
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	col := config.GetDB().Collection("plays")
	ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel2()
	_, err := col.InsertOne(ctx2, p)
	return err
}

func GetAll(category string) ([]models.Play, error) {
	col := config.GetDB().Collection("plays")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}
	if category != "" {
		filter["category"] = category
	}

	cursor, err := col.Find(ctx, filter)
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

func GetByID(id string) (*models.Play, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	col := config.GetDB().Collection("plays")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var p models.Play
	if err := col.FindOne(ctx, bson.M{"_id": objID}).Decode(&p); err != nil {
		return nil, err
	}
	return &p, nil
}

func GetByOrganizer(organizerID string) ([]models.Play, error) {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return nil, err
	}
	col := config.GetDB().Collection("plays")
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
	col := config.GetDB().Collection("plays")
	// Fetch original to preserve immutable fields (ownership + createdAt)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var original models.Play
	if err := col.FindOne(ctx, bson.M{"_id": objID, "organizer_id": orgID}).Decode(&original); err != nil {
		return errors.New("play not found or not owned by this organizer")
	}
	update.UpdatedAt = time.Now()
	update.OrganizerID = orgID            // never allow organizer_id to change
	update.CreatedAt = original.CreatedAt // never overwrite creation timestamp
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
	col := config.GetDB().Collection("plays")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := col.DeleteOne(ctx, bson.M{"_id": objID, "organizer_id": orgID})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return errors.New("play not found or not owned by this organizer")
	}
	return nil
}
