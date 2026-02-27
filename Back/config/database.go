package config

import (
	"context"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoClient *mongo.Client

func ConnectDB() error {
	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		uri = "mongodb://localhost:27017"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return err
	}

	if err = client.Ping(ctx, nil); err != nil {
		return err
	}

	MongoClient = client
	CreateIndexes()
	return nil
}

func GetDB() *mongo.Database {
	return MongoClient.Database("ticpin")
}

func CreateIndexes() {
	db := GetDB()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	userCollection := db.Collection("users")
	phoneIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "phone", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	createdIndex := mongo.IndexModel{
		Keys: bson.D{{Key: "createdAt", Value: -1}},
	}
	userCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{phoneIndex, createdIndex})

	profileCollection := db.Collection("profiles")
	userIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "userId", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	profilePhoneIndex := mongo.IndexModel{
		Keys: bson.D{{Key: "phone", Value: 1}},
	}
	profileCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{userIDIndex, profilePhoneIndex})

	orgCollection := db.Collection("organizers")
	orgEmailIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	orgCollection.Indexes().CreateOne(ctx, orgEmailIndex)

	orgProfileCollection := db.Collection("organizer_profiles")
	orgProfileIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "organizerId", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	orgProfileCollection.Indexes().CreateOne(ctx, orgProfileIndex)

	orgVerificationCollection := db.Collection("organizer_verifications")
	orgVerificationIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "organizer_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	orgVerificationCollection.Indexes().CreateOne(ctx, orgVerificationIndex)

	for _, colName := range []string{"play_verifications", "event_verifications", "dining_verifications"} {
		col := db.Collection(colName)
		col.Indexes().CreateOne(ctx, mongo.IndexModel{
			Keys: bson.D{{Key: "organizer_id", Value: 1}},
		})
	}

	for _, colName := range []string{"events", "plays", "dinings"} {
		col := db.Collection(colName)
		col.Indexes().CreateMany(ctx, []mongo.IndexModel{
			{Keys: bson.D{{Key: "organizer_id", Value: 1}}},
			{Keys: bson.D{{Key: "createdAt", Value: -1}}},
		})
	}

	passCollection := db.Collection("ticpin_passes")
	passCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "user_id", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
	})
}
