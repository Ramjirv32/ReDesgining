package organizer

import (
	"context"
	"errors"
	"os"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"
	verifysvc "ticpin-backend/services/verification"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

func LoginOrCreate(email, password string) (*models.Organizer, bool, error) {
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&org)
	if err != nil {
		var existingUser bson.M
		err := config.UsersCol.FindOne(ctx, bson.M{"email": email}).Decode(&existingUser)
		if err == nil {
			return nil, false, errors.New("email already registered as a user. please login or use a different email")
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return nil, false, err
		}
		org = models.Organizer{
			ID:                primitive.NewObjectID(),
			Email:             email,
			Password:          string(hashed),
			OrganizerCategory: []string{},
			IsVerified:        false,
			CreatedAt:         time.Now(),
		}
		if _, err := collection.InsertOne(ctx, org); err != nil {
			return nil, false, err
		}
		_ = verifysvc.CreateOrganizerVerification(org.ID)
		return &org, true, nil
	}
	if err := bcrypt.CompareHashAndPassword([]byte(org.Password), []byte(password)); err != nil {
		return nil, false, errors.New("invalid password")
	}
	return &org, false, nil
}

func Login(email, password string) (*models.Organizer, error) {
	adminEmail := config.GetAdminEmail()
	adminPass := os.Getenv("ADMIN_PASSWORD")
	if adminEmail != "" && adminPass != "" && email == adminEmail && password == adminPass {
		collection := config.GetDB().Collection("organizers")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		var org models.Organizer
		err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&org)
		if err == nil {
			return &org, nil
		}
		hashed, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		org = models.Organizer{
			ID:             primitive.NewObjectID(),
			Email:          email,
			Password:       string(hashed),
			Role:           "admin",
			IsVerified:     true,
			CategoryStatus: map[string]string{},
			CreatedAt:      time.Now(),
		}
		collection.InsertOne(ctx, org)
		return &org, nil
	}

	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&org); err != nil {
		return nil, errors.New("user_not_found")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(org.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid_password")
	}
	return &org, nil
}

func Create(email, password string) (*models.Organizer, error) {
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existing models.Organizer
	if err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&existing); err == nil {
		return nil, errors.New("email_exists")
	}

	var existingUser bson.M
	err := config.UsersCol.FindOne(ctx, bson.M{"email": email}).Decode(&existingUser)
	if err == nil {
		return nil, errors.New("email already registered as a user. please login or use a different email")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	org := models.Organizer{
		ID:                primitive.NewObjectID(),
		Email:             email,
		Password:          string(hashed),
		OrganizerCategory: []string{},
		CategoryStatus:    map[string]string{},
		IsVerified:        false,
		CreatedAt:         time.Now(),
	}
	if _, err := collection.InsertOne(ctx, org); err != nil {
		return nil, err
	}
	_ = verifysvc.CreateOrganizerVerification(org.ID)
	return &org, nil
}

func GoogleAuth(email string) (*models.Organizer, error) {
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingUser bson.M
	err := config.UsersCol.FindOne(ctx, bson.M{"email": email}).Decode(&existingUser)
	if err == nil {
		return nil, errors.New("email already registered as a user. please login or use a different email")
	}

	var org models.Organizer
	err = collection.FindOne(ctx, bson.M{"email": email}).Decode(&org)
	if err != nil {
		org = models.Organizer{
			ID:                primitive.NewObjectID(),
			Email:             email,
			OrganizerCategory: []string{},
			CategoryStatus:    map[string]string{},
			IsVerified:        true,
			CreatedAt:         time.Now(),
		}
		if _, err := collection.InsertOne(ctx, org); err != nil {
			return nil, err
		}
		_ = verifysvc.CreateOrganizerVerification(org.ID)
		return &org, nil
	}

	if !org.IsVerified {
		_, _ = collection.UpdateOne(ctx, bson.M{"_id": org.ID}, bson.M{"$set": bson.M{"isVerified": true}})
		org.IsVerified = true
	}

	return &org, nil
}

func IsAdmin(organizer models.Organizer) bool {
	return organizer.Role == "admin"
}

func IsAdminByEmail(email string) bool {
	adminEmail := config.GetAdminEmail()
	return email == adminEmail
}
