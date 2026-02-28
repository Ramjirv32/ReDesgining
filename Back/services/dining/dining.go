package dining

import (
	"context"
	"errors"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func Create(d *models.Dining) error {
	orgCol := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := orgCol.FindOne(ctx, bson.M{"_id": d.OrganizerID}).Decode(&org); err != nil {
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
	col := config.GetDB().Collection("dinings")
	ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel2()
	_, err := col.InsertOne(ctx2, d)
	return err
}

func GetAll() ([]models.Dining, error) {
	col := config.GetDB().Collection("dinings")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := col.Find(ctx, bson.M{})
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

func GetByID(id string) (*models.Dining, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	col := config.GetDB().Collection("dinings")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var d models.Dining
	if err := col.FindOne(ctx, bson.M{"_id": objID}).Decode(&d); err != nil {
		return nil, err
	}
	return &d, nil
}

func GetByOrganizer(organizerID string) ([]models.Dining, error) {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return nil, err
	}
	col := config.GetDB().Collection("dinings")
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
	col := config.GetDB().Collection("dinings")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var original models.Dining
	if err := col.FindOne(ctx, bson.M{"_id": objID, "organizer_id": orgID}).Decode(&original); err != nil {
		return errors.New("dining not found or not owned by this organizer")
	}
	update.UpdatedAt = time.Now()
	update.OrganizerID = orgID
	update.CreatedAt = original.CreatedAt
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
	col := config.GetDB().Collection("dinings")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := col.DeleteOne(ctx, bson.M{"_id": objID, "organizer_id": orgID})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return errors.New("dining not found or not owned by this organizer")
	}
	return nil
}
