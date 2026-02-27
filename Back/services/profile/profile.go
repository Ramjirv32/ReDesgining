package profile

import (
	"context"
	"io"
	"ticpin-backend/config"
	"ticpin-backend/models"
	"time"

	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func Create(p *models.Profile) error {
	p.ID = primitive.NewObjectID()
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()

	collection := config.GetDB().Collection("profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, p)
	return err
}

func GetByUserID(userID string) (*models.Profile, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	collection := config.GetDB().Collection("profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var p models.Profile
	if err := collection.FindOne(ctx, bson.M{"userId": objID}).Decode(&p); err != nil {
		return nil, err
	}
	return &p, nil
}

func Update(userID string, p *models.Profile) error {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	p.UpdatedAt = time.Now()

	collection := config.GetDB().Collection("profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.UpdateOne(ctx, bson.M{"userId": objID}, bson.M{"$set": p})
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
