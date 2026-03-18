package otp

import (
	"context"
	"errors"
	"ticpin-backend/config"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type OTPRecord struct {
	Email     string    `bson:"email"`
	OTP       string    `bson:"otp"`
	ExpiresAt time.Time `bson:"expiresAt"`
}

func SendOTP(email string) error {
	otp := config.GenerateOTP()
	expiresAt := time.Now().Add(10 * time.Minute)

	collection := config.GetDB().Collection("otps")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	opts := options.Update().SetUpsert(true)
	_, err := collection.UpdateOne(ctx, bson.M{"email": email}, bson.M{
		"$set": OTPRecord{
			Email:     email,
			OTP:       otp,
			ExpiresAt: expiresAt,
		},
	}, opts)

	if err != nil {
		return err
	}

	// Send OTP synchronously to ensure delivery in serverless environments (like Vercel)
	if err := config.SendPlayOTP(email, otp); err != nil {
		return err
	}

	return nil
}

func VerifyOTP(email, otp string) error {
	collection := config.GetDB().Collection("otps")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var record OTPRecord
	err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&record)
	if err != nil {
		return errors.New("otp not found")
	}

	if record.OTP != otp {
		return errors.New("invalid otp")
	}

	if time.Now().After(record.ExpiresAt) {
		return errors.New("otp expired")
	}

	_, _ = collection.DeleteOne(ctx, bson.M{"email": email})

	return nil
}
