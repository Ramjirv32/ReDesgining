package organizer

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

func GetExistingSetup(organizerID string) (*models.OrganizerSetup, error) {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return nil, err
	}
	collection := config.GetDB().Collection("organizer_setups")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var setup models.OrganizerSetup
	if err := collection.FindOne(ctx, bson.M{"organizerId": objID}).Decode(&setup); err != nil {
		return nil, err
	}
	return &setup, nil
}

func CheckPANDuplicate(pan, organizerID string) error {
	if pan == "" {
		return nil
	}
	objID, _ := primitive.ObjectIDFromHex(organizerID)
	collection := config.GetDB().Collection("organizer_setups")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var existing models.OrganizerSetup
	err := collection.FindOne(ctx, bson.M{
		"pan":         pan,
		"organizerId": bson.M{"$ne": objID},
	}).Decode(&existing)
	if err == nil {
		return errors.New("pan_already_used")
	}
	return nil
}

func SaveSetup(setup *models.OrganizerSetup) error {
	collection := config.GetDB().Collection("organizer_setups")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingAny models.OrganizerSetup
	err := collection.FindOne(ctx, bson.M{"organizerId": setup.OrganizerID}).Decode(&existingAny)
	if err == nil {
		if existingAny.PAN != "" && setup.PAN != "" && existingAny.PAN != setup.PAN {
			return errors.New("pan_mismatch")
		}
	}

	if err := CheckPANDuplicate(setup.PAN, setup.OrganizerID.Hex()); err != nil {
		return err
	}

	setup.UpdatedAt = time.Now()

	filter := bson.M{"organizerId": setup.OrganizerID, "category": setup.Category}
	setFields := bson.M{
		"organizerId":   setup.OrganizerID,
		"category":      setup.Category,
		"orgType":       setup.OrgType,
		"phone":         setup.Phone,
		"bankAccountNo": setup.BankAccountNo,
		"bankIfsc":      setup.BankIfsc,
		"bankName":      setup.BankName,
		"accountHolder": setup.AccountHolder,
		"gstNumber":     setup.GSTNumber,
		"pan":           setup.PAN,
		"panName":       setup.PANName,
		"panDOB":        setup.PANDOB,
		"panCardUrl":    setup.PANCardURL,
		"backupEmail":   setup.BackupEmail,
		"backupPhone":   setup.BackupPhone,
		"panVerified":   setup.PANVerified,
		"verifiedName":  setup.VerifiedName,
		"gstList":       setup.GSTList,
		"updatedAt":     setup.UpdatedAt,
	}
	update := bson.M{
		"$set":         setFields,
		"$setOnInsert": bson.M{"_id": primitive.NewObjectID(), "createdAt": time.Now()},
	}
	opts := &options.UpdateOptions{}
	upsert := true
	opts.Upsert = &upsert
	if _, err := collection.UpdateOne(ctx, filter, update, opts); err != nil {
		return err
	}
	return UpdateCategoryStatus(setup.OrganizerID.Hex(), setup.Category, "pending")
}
