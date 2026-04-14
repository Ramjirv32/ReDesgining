// +build ignore

package main

import (
	"context"
	"fmt"
	"log"

	"ticpin-backend/config"
	"ticpin-backend/models"

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

	cursor, err := col.Find(ctx, bson.M{"play_id": bson.M{"$exists": true}})
	if err != nil {
		log.Fatal(err)
	}
	defer cursor.Close(ctx)

	var locks []bson.M
	if err := cursor.All(ctx, &locks); err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Found %d total play slot locks\n", len(locks))

	orphanedCount := 0
	for _, lock := range locks {
		bookingID := lock["booking_id"]
		var booking models.PlayBooking
		err := config.PlayBookingsCol.FindOne(ctx, bson.M{"_id": bookingID}).Decode(&booking)
		
		isOrphaned := false
		if err != nil {
			fmt.Printf("ORPHANED LOCK: No booking found for ID %v\n", bookingID)
			isOrphaned = true
		} else if booking.Status == "cancelled" || booking.Status == "failed" || booking.Status == "refunded" {
			fmt.Printf("STALE LOCK: Booking %v has status %s\n", bookingID, booking.Status)
			isOrphaned = true
		}

		if isOrphaned {
			orphanedCount++
			fmt.Printf("Cleaning up lock %v...\n", lock["_id"])
			_, _ = col.DeleteOne(ctx, bson.M{"_id": lock["_id"]})
		}
	}

	fmt.Printf("Total orphaned/stale locks cleaned up: %d\n", orphanedCount)
}
