package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"ticpin-backend/config"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
)

func main() {
	godotenv.Load()
	if err := config.ConnectDB(); err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	col := config.SlotLocksCol

	fifteenMinutesAgo := time.Now().Add(-15 * time.Minute)

	// Case 1: Locks with created_at older than 15 mins
	res1, err := col.DeleteMany(ctx, bson.M{
		"created_at": bson.M{"$lt": fifteenMinutesAgo},
	})
	if err != nil {
		log.Printf("Error deleting old timed locks: %v", err)
	} else {
		fmt.Printf("Cleaned up %d timed stale locks\n", res1.DeletedCount)
	}

	// Case 2: Locks MISSING created_at (they might stay forever)
	res2, err := col.DeleteMany(ctx, bson.M{
		"created_at": bson.M{"$exists": false},
	})
	if err != nil {
		log.Printf("Error deleting untimed stale locks: %v", err)
	} else {
		fmt.Printf("Cleaned up %d untimed stale locks\n", res2.DeletedCount)
	}

	fmt.Println("Cleanup complete.")
}
