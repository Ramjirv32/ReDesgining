package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	godotenv.Load()
	if err := config.ConnectDB(); err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	
    // Find venue
    var play models.Play
    err := config.PlaysCol.FindOne(ctx, bson.M{"name": "TURF ARENA CHENNAI"}).Decode(&play)
    if err != nil {
        // Try partial match
        err = config.PlaysCol.FindOne(ctx, bson.M{"name": bson.M{"$regex": "TURF ARENA", "$options": "i"}}).Decode(&play)
        if err != nil {
            log.Fatalf("Venue not found: %v", err)
        }
    }

    fmt.Printf("Venue: %s (ID: %s)\n", play.Name, play.ID.Hex())
    fmt.Printf("Hours: %s - %s\n", play.OpeningTime, play.ClosingTime)
    fmt.Printf("Courts: %v\n", play.Courts)

    // Check bookings for today
    today := "2026-03-30" // Today as per system prompt/screenshot
    cursor, err := config.PlayBookingsCol.Find(ctx, bson.M{
        "play_id": play.ID,
        "date":    today,
    })
    if err != nil {
        log.Fatal(err)
    }
    defer cursor.Close(ctx)

    var bookings []models.PlayBooking
    if err := cursor.All(ctx, &bookings); err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Found %d bookings for today (%s)\n", len(bookings), today)
    for _, b := range bookings {
        fmt.Printf("- Booking %s: Status: %s, Slot: %s, Duration: %d, Tickets: %v\n", 
            b.BookingID, b.Status, b.Slot, b.Duration, b.Tickets)
    }

    // Check SlotLocksCol
    cursor2, err := config.SlotLocksCol.Find(ctx, bson.M{
        "play_id": play.ID,
        "date":    today,
    })
    if err != nil {
        log.Fatal(err)
    }
    defer cursor2.Close(ctx)

    var locks []bson.M
    if err := cursor2.All(ctx, &locks); err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Found %d slot locks for today (%s)\n", len(locks), today)
    for _, l := range locks {
        fmt.Printf("- Lock: Slot: %v, Court: %v, BookingID: %v\n", l["slot"], l["court_name"], l["booking_id"])
    }
}
