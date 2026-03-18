package admin

import (
	"context"
	"errors"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

func Create(email, password, name, phone string) (*models.Admin, error) {
	collection := config.GetDB().Collection("admins")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if admin already exists
	var existing models.Admin
	if err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&existing); err == nil {
		return nil, errors.New("admin already exists")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	admin := models.Admin{
		ID:        primitive.NewObjectID(),
		Email:     email,
		Password:  string(hashed),
		Name:      name,
		Phone:     phone,
		IsSuper:   true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = collection.InsertOne(ctx, admin)
	if err != nil {
		return nil, err
	}

	return &admin, nil
}

func Login(email, password string) (*models.Admin, error) {
	collection := config.GetDB().Collection("admins")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var admin models.Admin
	err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&admin)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return &admin, nil
}

func GetByEmail(email string) (*models.Admin, error) {
	collection := config.GetDB().Collection("admins")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var admin models.Admin
	err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&admin)
	if err != nil {
		return nil, err
	}

	return &admin, nil
}

func GetByPhone(phone string) (*models.Admin, error) {
	collection := config.GetDB().Collection("admins")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var admin models.Admin
	err := collection.FindOne(ctx, bson.M{"phone": phone}).Decode(&admin)
	if err != nil {
		return nil, err
	}

	return &admin, nil
}
