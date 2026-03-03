package config

import (
	"context"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	MongoClient *mongo.Client

	UsersCol          *mongo.Collection
	ProfilesCol       *mongo.Collection
	OrgsCol           *mongo.Collection
	EventsCol         *mongo.Collection
	PlaysCol          *mongo.Collection
	DiningsCol        *mongo.Collection
	BookingsCol       *mongo.Collection
	EventBookingsCol  *mongo.Collection
	PlayBookingsCol   *mongo.Collection
	DiningBookingsCol *mongo.Collection
	CouponsCol        *mongo.Collection
	OffersCol         *mongo.Collection
	NotificationsCol  *mongo.Collection
	PassesCol         *mongo.Collection
	VerificationsCol  *mongo.Collection
)

func ConnectDB() error {
	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		uri = "mongodb://localhost:27017"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Client().
		ApplyURI(uri).
		SetMaxPoolSize(100).
		SetMinPoolSize(10).
		SetMaxConnIdleTime(30 * time.Second)

	client, err := mongo.Connect(ctx, opts)
	if err != nil {
		return err
	}

	if err = client.Ping(ctx, nil); err != nil {
		return err
	}

	MongoClient = client
	db := GetDB()

	UsersCol = db.Collection("users")
	ProfilesCol = db.Collection("profiles")
	OrgsCol = db.Collection("organizers")
	EventsCol = db.Collection("events")
	PlaysCol = db.Collection("plays")
	DiningsCol = db.Collection("dinings")
	BookingsCol = db.Collection("bookings")
	EventBookingsCol = db.Collection("event_bookings")
	PlayBookingsCol = db.Collection("play_bookings")
	DiningBookingsCol = db.Collection("dining_bookings")
	CouponsCol = db.Collection("coupons")
	OffersCol = db.Collection("offers")
	NotificationsCol = db.Collection("notifications")
	PassesCol = db.Collection("ticpin_passes")

	CreateIndexes()
	return nil
}

func GetDB() *mongo.Database {
	return MongoClient.Database("ticpin")
}

func CreateIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	UsersCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "phone", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "createdAt", Value: -1}}},
	})

	ProfilesCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "userId", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "phone", Value: 1}}},
	})

	OrgsCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	for _, col := range []*mongo.Collection{EventsCol, PlaysCol, DiningsCol} {
		col.Indexes().CreateMany(ctx, []mongo.IndexModel{
			{Keys: bson.D{{Key: "organizer_id", Value: 1}}},
			{Keys: bson.D{{Key: "createdAt", Value: -1}}},
		})
	}

	PassesCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "user_id", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
	})

	PlayBookingsCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{
			{Key: "play_id", Value: 1},
			{Key: "user_email", Value: 1},
			{Key: "date", Value: 1},
			{Key: "slot", Value: 1},
		}},
		{Keys: bson.D{{Key: "user_email", Value: 1}}},
		{Keys: bson.D{{Key: "booked_at", Value: -1}}},
	})

	EventBookingsCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{
			{Key: "event_id", Value: 1},
			{Key: "user_email", Value: 1},
		}},
		{Keys: bson.D{{Key: "user_email", Value: 1}}},
		{Keys: bson.D{{Key: "booked_at", Value: -1}}},
	})

	DiningBookingsCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{
			{Key: "dining_id", Value: 1},
			{Key: "user_email", Value: 1},
			{Key: "date", Value: 1},
			{Key: "time_slot", Value: 1},
		}},
		{Keys: bson.D{{Key: "user_email", Value: 1}}},
	})

	NotificationsCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "recipient_ids", Value: 1}}},
		{Keys: bson.D{{Key: "target_type", Value: 1}}},
		{Keys: bson.D{{Key: "createdAt", Value: -1}}},
	})

	PassesCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "qr_token", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	CouponsCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "code", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	OffersCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "entity_ids", Value: 1}, {Key: "applies_to", Value: 1}},
	})
}
