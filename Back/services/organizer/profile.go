package organizer

import (
	"context"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateProfile(p *models.OrganizerProfile) error {
	p.ID = primitive.NewObjectID()
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	collection := config.GetDB().Collection("organizer_profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := collection.InsertOne(ctx, p)
	return err
}

func GetProfileByID(organizerID string) (*models.OrganizerProfile, error) {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return nil, err
	}
	collection := config.GetDB().Collection("organizer_profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var p models.OrganizerProfile
	if err := collection.FindOne(ctx, bson.M{"organizerId": objID}).Decode(&p); err != nil {
		return nil, err
	}
	return &p, nil
}

func UpdateProfile(organizerID string, p *models.OrganizerProfile) error {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}
	p.UpdatedAt = time.Now()
	collection := config.GetDB().Collection("organizer_profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = collection.UpdateOne(ctx, bson.M{"organizerId": objID}, bson.M{"$set": p})
	return err
}
