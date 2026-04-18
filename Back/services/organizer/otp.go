package organizer

import (
	"context"
	"errors"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func SendOTP(email, category string) error {
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var org models.Organizer
	if err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&org); err == nil {
		if org.Role == "admin" {
			category = "admin"
		}
	}

	otp := config.GenerateOTP()
	expiry := time.Now().Add(5 * time.Minute)
	_, err := collection.UpdateOne(ctx, bson.M{"email": email}, bson.M{
		"$set": bson.M{"otp": otp, "otpExpiry": expiry},
	})
	if err != nil {
		return err
	}
	switch category {
	case "events":
		return config.SendEventsOTP(email, otp)
	case "dining":
		return config.SendDiningOTP(email, otp)
	case "admin":
		return config.SendAdminOTP(email, otp)
	default:
		return config.SendPlayOTP(email, otp)
	}
}

func VerifyOTP(email, otp string) (*models.Organizer, error) {
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&org); err != nil {
		return nil, errors.New("organizer not found")
	}
	if org.OTP != otp {
		return nil, errors.New("invalid otp")
	}
	if time.Now().After(org.OTPExpiry) {
		return nil, errors.New("otp expired")
	}
	_, err := collection.UpdateOne(ctx, bson.M{"email": email}, bson.M{
		"$set": bson.M{"isVerified": true, "otp": "", "otpExpiry": time.Time{}},
	})
	if err != nil {
		return nil, err
	}
	org.IsVerified = true
	return &org, nil
}

func SendBackupOTP(organizerID, backupEmail, category string) error {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	otp := config.GenerateOTP()
	expiry := time.Now().Add(5 * time.Minute)
	_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{"backupOTP": otp, "backupOTPExpiry": expiry},
	})
	if err != nil {
		return err
	}
	switch category {
	case "events":
		return config.SendEventsOTP(backupEmail, otp)
	case "dining":
		return config.SendDiningOTP(backupEmail, otp)
	case "admin":
		return config.SendAdminOTP(backupEmail, otp)
	default:
		return config.SendPlayOTP(backupEmail, otp)
	}
}

func VerifyBackupOTP(organizerID, otp string) error {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&org); err != nil {
		return errors.New("organizer not found")
	}
	if org.BackupOTP != otp {
		return errors.New("invalid otp")
	}
	if time.Now().After(org.BackupOTPExpiry) {
		return errors.New("otp expired")
	}
	_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{"backupOTP": "", "backupOTPExpiry": time.Time{}},
	})
	return err
}
