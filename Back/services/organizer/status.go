package organizer

import (
	"context"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func UpdateCategoryStatus(organizerID, category, status string) error {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}

	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	key := "categoryStatus." + category
	_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{key: status},
	})
	if err != nil {
		return err
	}

	setupCollection := config.GetDB().Collection("organizer_setups")
	setupCtx, setupCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer setupCancel()

	roleStatus := "not_applied"
	profileCompleted := false

	if status == "pending" {
		roleStatus = "pending"
		profileCompleted = true
	} else if status == "approved" {
		roleStatus = "approved"
		profileCompleted = true
	}

	rolesKey := "roles." + category
	_, err = setupCollection.UpdateOne(setupCtx, bson.M{"organizer_id": objID}, bson.M{
		"$set": bson.M{
			rolesKey: bson.M{
				"status":            roleStatus,
				"profile_completed": profileCompleted,
			},
			"updatedAt": time.Now(),
		},
	})

	return err
}

func GetCategoryStatus(organizerID string) (map[string]string, error) {
	org, err := GetByID(organizerID)
	if err != nil {
		return nil, err
	}
	if org.CategoryStatus == nil {
		return map[string]string{}, nil
	}
	return org.CategoryStatus, nil
}

func GetByID(id string) (*models.Organizer, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&org); err != nil {
		return nil, err
	}
	return &org, nil
}
