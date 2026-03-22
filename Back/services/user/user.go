package user

import (
	"context"
	"errors"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func Create(user *models.User) error {
	user.ID = primitive.NewObjectID()
	user.CreatedAt = time.Now()

	collection := config.GetDB().Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, user)
	return err
}

func Login(phone string) (*models.User, error) {
	collection := config.GetDB().Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u models.User
	err := collection.FindOne(ctx, bson.M{"phone": phone}).Decode(&u)
	if err == nil {
		return &u, nil
	}

	u = models.User{
		ID:        primitive.NewObjectID(),
		Phone:     phone,
		CreatedAt: time.Now(),
	}
	_, err = collection.InsertOne(ctx, u)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func GetByID(id string) (*models.User, error) {
	collection := config.GetDB().Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u models.User
	objID, err := primitive.ObjectIDFromHex(id)
	if err == nil {
		if err := collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&u); err == nil {
			return &u, nil
		}
	}

	if err := collection.FindOne(ctx, bson.M{"phone": id}).Decode(&u); err == nil {
		return &u, nil
	}

	return nil, errors.New("user not found")
}
