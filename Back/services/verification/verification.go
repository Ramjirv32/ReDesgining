package verification

import (
	"context"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateOrganizerVerification(organizerID primitive.ObjectID) error {
	v := models.OrganizerVerification{
		ID:          primitive.NewObjectID(),
		OrganizerID: organizerID,
		PanVerified: false,
		Roles: models.RoleVerifications{
			Event:  models.RoleStatus{Status: "not_applied", ProfileCompleted: false},
			Play:   models.RoleStatus{Status: "not_applied", ProfileCompleted: false},
			Dining: models.RoleStatus{Status: "not_applied", ProfileCompleted: false},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	col := config.GetDB().Collection("organizer_verifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := col.InsertOne(ctx, v)
	return err
}

func GetOrganizerVerification(organizerID string) (*models.OrganizerVerification, error) {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return nil, err
	}
	col := config.GetDB().Collection("organizer_verifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var v models.OrganizerVerification
	if err := col.FindOne(ctx, bson.M{"organizer_id": objID}).Decode(&v); err != nil {
		return nil, err
	}
	return &v, nil
}

func setRolePending(organizerID primitive.ObjectID, role string) error {
	col := config.GetDB().Collection("organizer_verifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	field := "roles." + role + ".status"
	_, err := col.UpdateOne(ctx, bson.M{"organizer_id": organizerID}, bson.M{
		"$set": bson.M{field: "pending", "updatedAt": time.Now()},
	})
	return err
}

func SubmitPlayVerification(v *models.PlayVerification) error {
	v.ID = primitive.NewObjectID()
	v.Status = "pending"
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	col := config.GetDB().Collection("play_verifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := col.InsertOne(ctx, v); err != nil {
		return err
	}
	return setRolePending(v.OrganizerID, "play")
}

func SubmitEventVerification(v *models.EventVerification) error {
	v.ID = primitive.NewObjectID()
	v.Status = "pending"
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	col := config.GetDB().Collection("event_verifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := col.InsertOne(ctx, v); err != nil {
		return err
	}
	return setRolePending(v.OrganizerID, "event")
}

func SubmitDiningVerification(v *models.DiningVerification) error {
	v.ID = primitive.NewObjectID()
	v.Status = "pending"
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	col := config.GetDB().Collection("dining_verifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := col.InsertOne(ctx, v); err != nil {
		return err
	}
	return setRolePending(v.OrganizerID, "dining")
}
