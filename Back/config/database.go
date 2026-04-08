package config

import (
	"context"
	"fmt"
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
	SlotLocksCol      *mongo.Collection
	DiningBookingsCol *mongo.Collection
	CouponsCol        *mongo.Collection
	OffersCol         *mongo.Collection
	NotificationsCol  *mongo.Collection
	PassesCol         *mongo.Collection
	VerificationsCol  *mongo.Collection
	ChatSessionsCol   *mongo.Collection
	ChatMessagesCol   *mongo.Collection
	ChatQuestionsCol  *mongo.Collection
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
		SetMaxConnIdleTime(30 * time.Second).
		SetRetryWrites(false).
		SetRetryReads(false)

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
	SlotLocksCol = db.Collection("play_slot_locks")
	DiningBookingsCol = db.Collection("dining_bookings")
	CouponsCol = db.Collection("coupons")
	OffersCol = db.Collection("offers")
	NotificationsCol = db.Collection("notifications")
	PassesCol = db.Collection("ticpin_passes")
	ChatSessionsCol = db.Collection("chat_sessions")
	ChatMessagesCol = db.Collection("chat_messages")
	ChatQuestionsCol = db.Collection("chat_questions")

	fmt.Println("Database collections initialized")
	CreateIndexes()
	return nil
}

func GetDB() *mongo.Database {
	return MongoClient.Database("mental")
}

func CreateIndexes() {
	fmt.Println("Creating indexes...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	UsersCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "phone", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "createdAt", Value: -1}}},
	})

	ProfilesCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "userId", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "email", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "phone", Value: 1}}},
	})

	OrgsCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	for _, col := range []*mongo.Collection{EventsCol, PlaysCol, DiningsCol} {
		_, err := col.Indexes().CreateMany(ctx, []mongo.IndexModel{
			{Keys: bson.D{{Key: "organizer_id", Value: 1}}},
			{Keys: bson.D{{Key: "status", Value: 1}}},
			{Keys: bson.D{{Key: "category", Value: 1}}},
			{Keys: bson.D{{Key: "city", Value: 1}}},
			{Keys: bson.D{{Key: "createdAt", Value: -1}}},
		})
		if err != nil {
			fmt.Printf("Error creating indexes for %s: %v\n", col.Name(), err)
		} else {
			fmt.Printf("Indexes created for %s\n", col.Name())
		}
	}

	_, err := PlaysCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "opening_time", Value: 1}}},
		{Keys: bson.D{{Key: "closing_time", Value: 1}}},
	})
	if err != nil {
		fmt.Printf("Error creating extra indexes for plays: %v\n", err)
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

	SlotLocksCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "play_id", Value: 1},
			{Key: "date", Value: 1},
			{Key: "slot", Value: 1},
			{Key: "court_name", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	})

	// Add dining slot lock indexes
	SlotLocksCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "dining_id", Value: 1},
			{Key: "date", Value: 1},
			{Key: "time_slot", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	})

	SlotLocksCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "created_at", Value: 1}},
		Options: options.Index().SetExpireAfterSeconds(900),
	})

	SlotLocksCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "booking_id", Value: 1}},
		// Removed SetUnique(true) - multiple locks can share same booking_id for multi-slot/multi-court bookings
	})

	EventBookingsCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{
			{Key: "event_id", Value: 1},
			{Key: "user_email", Value: 1},
		}},
		{Keys: bson.D{{Key: "user_email", Value: 1}}},
		{Keys: bson.D{{Key: "booked_at", Value: -1}}},
		// Add capacity checking indexes
		{Keys: bson.D{
			{Key: "event_id", Value: 1},
			{Key: "status", Value: 1},
		}},
		{Keys: bson.D{
			{Key: "event_id", Value: 1},
			{Key: "status", Value: 1},
			{Key: "tickets.category", Value: 1},
		}},
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
		Options: options.Index().SetUnique(true).SetSparse(true),
	})

	CouponsCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "code", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	OffersCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "entity_ids", Value: 1}, {Key: "applies_to", Value: 1}},
	})

	ChatSessionsCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "session_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	ChatSessionsCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "updated_at", Value: -1}},
	})

	ChatMessagesCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "session_id", Value: 1}, {Key: "created_at", Value: 1}},
	})
}

func IsDuplicateKeyError(err error) bool {
	if err == nil {
		return false
	}
	return mongo.IsDuplicateKeyError(err)
}
