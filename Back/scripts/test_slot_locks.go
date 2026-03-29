package main

import (
	"context"
	"fmt"
	"log"
	"time"

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
	
	// Test 1: Check for any existing orphaned locks
	fmt.Println("=== Checking for orphaned slot locks ===")
	cursor, err := config.SlotLocksCol.Find(ctx, bson.M{"play_id": bson.M{"$exists": true}})
	if err != nil {
		log.Fatal(err)
	}
	defer cursor.Close(ctx)

	var locks []bson.M
	if err := cursor.All(ctx, &locks); err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Found %d total slot locks\n", len(locks))

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
			fmt.Printf("STALE LOCK: Booking %v has status %s (Play: %s, Date: %s, Slot: %s)\n", 
				bookingID, booking.Status, booking.PlayID.Hex(), booking.Date, booking.Slot)
			isOrphaned = true
		}

		if isOrphaned {
			orphanedCount++
			fmt.Printf("Cleaning up lock %v...\n", lock["_id"])
			_, _ = config.SlotLocksCol.DeleteOne(ctx, bson.M{"_id": lock["_id"]})
		}
	}

	fmt.Printf("Total orphaned/stale locks cleaned up: %d\n", orphanedCount)

	// Test 2: Check for recent Ticpass bookings
	fmt.Println("\n=== Checking recent Ticpass bookings ===")
	bookingCursor, err := config.PlayBookingsCol.Find(ctx, bson.M{
		"ticpass_applied": true,
		"booked_at": bson.M{"$gte": time.Now().Add(-24 * time.Hour)},
	})
	if err != nil {
		log.Fatal(err)
	}
	defer bookingCursor.Close(ctx)

	var ticpassBookings []models.PlayBooking
	if err := bookingCursor.All(ctx, &ticpassBookings); err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Found %d recent Ticpass bookings:\n", len(ticpassBookings))
	for _, booking := range ticpassBookings {
		fmt.Printf("- Booking ID: %s, Amount: %.2f, Status: %s, Date: %s, Slot: %s\n",
			booking.BookingID, booking.GrandTotal, booking.Status, booking.Date, booking.Slot)
	}

	fmt.Println("\n=== Slot lock cleanup test completed successfully! ===")
}
