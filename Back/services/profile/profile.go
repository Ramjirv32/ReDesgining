package profile

import (
	"context"
	"errors"
	"io"
	"ticpin-backend/config"
	"ticpin-backend/models"
	"time"

	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func Create(p *models.Profile) error {
	if p.UserID.IsZero() {
		return errors.New("invalid user identifier")
	}


	if p.Email != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// Check Users
		if err := config.UsersCol.FindOne(ctx, bson.M{"email": p.Email}).Err(); err == nil {
			return errors.New("email already registered as a user")
		}

		// Check Organizers
		if err := config.OrgsCol.FindOne(ctx, bson.M{"email": p.Email}).Err(); err == nil {
			return errors.New("email already registered as an organizer")
		}

		// Check existing Profiles (other than this one)
		var existingProf bson.M
		if err := config.ProfilesCol.FindOne(ctx, bson.M{"email": p.Email}).Decode(&existingProf); err == nil {
			return errors.New("email already registered in another profile")
		}
	}

	p.ID = primitive.NewObjectID()
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()

	collection := config.GetDB().Collection("profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, p)
	if err != nil {
		if config.IsDuplicateKeyError(err) {
			return errors.New("a profile for this user already exists")
		}
		return err
	}
	return nil
}

func GetByUserID(userID string) (*models.Profile, error) {
	collection := config.GetDB().Collection("profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var p models.Profile
	objID, err := primitive.ObjectIDFromHex(userID)
	if err == nil {
		if err := collection.FindOne(ctx, bson.M{"userId": objID}).Decode(&p); err == nil {
			return &p, nil
		}
	}

	phonesToTry := []string{userID}
	if len(userID) == 10 {
		phonesToTry = append(phonesToTry, "+91"+userID)
	} else if len(userID) == 13 && userID[:3] == "+91" {
		phonesToTry = append(phonesToTry, userID[3:])
	}

	for _, ph := range phonesToTry {
		if err := collection.FindOne(ctx, bson.M{"phone": ph}).Decode(&p); err == nil {
			return &p, nil
		}
	}

	return nil, errors.New("profile not found")
}

func Update(userID string, p *models.Profile) error {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	collection := config.GetDB().Collection("profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check email uniqueness if email is provided
	if p.Email != "" {
		// Fetch current profile to see if email changed
		var current models.Profile
		if err := collection.FindOne(ctx, bson.M{"userId": objID}).Decode(&current); err == nil {
			if current.Email != p.Email {
				// Email changed, check uniqueness
				if err := config.UsersCol.FindOne(ctx, bson.M{"email": p.Email}).Err(); err == nil {
					return errors.New("email already registered as a user")
				}
				if err := config.OrgsCol.FindOne(ctx, bson.M{"email": p.Email}).Err(); err == nil {
					return errors.New("email already registered as an organizer")
				}
				if err := collection.FindOne(ctx, bson.M{"email": p.Email, "userId": bson.M{"$ne": objID}}).Err(); err == nil {
					return errors.New("email already registered in another profile")
				}
			}
		}
	}

	updateData := bson.M{
		"name":      p.Name,
		"email":     p.Email,
		"phone":     p.Phone,
		"state":     p.State,
		"updatedAt": time.Now(),
	}

	// Only add other fields if they are non-zero
	if p.Address != "" {
		updateData["address"] = p.Address
	}
	if p.City != "" {
		updateData["city"] = p.City
	}
	if p.Gender != "" {
		updateData["gender"] = p.Gender
	}
	if p.Pincode != "" {
		updateData["pincode"] = p.Pincode
	}

	_, err = collection.UpdateOne(ctx, bson.M{"userId": objID}, bson.M{"$set": updateData})
	return err
}

func UploadPhoto(file io.Reader, userID string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	result, err := config.GetCloudinary().Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:   "ticpin/profiles",
		PublicID: userID,
	})
	if err != nil {
		return "", err
	}
	return result.SecureURL, nil
}

func UpdatePhoto(userID, photoURL string) error {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	collection := config.GetDB().Collection("profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.UpdateOne(ctx, bson.M{"userId": objID}, bson.M{"$set": bson.M{"profilePhoto": photoURL, "updatedAt": time.Now()}})
	return err
}
