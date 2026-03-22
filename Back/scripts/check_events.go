package scripts

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CheckEvents() {
	uri := "mongodb+srv://ramji:Ramji23112005@cluster0.ln4g5.mongodb.net/ticpin?retryWrites=true&w=majority"
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.TODO())

	db := client.Database("ticpin")
	eventsCol := db.Collection("events")
	bookingsCol := db.Collection("event_bookings")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	eventCount, err := eventsCol.CountDocuments(ctx, bson.M{})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Total events: %d\n", eventCount)

	bookingCount, err := bookingsCol.CountDocuments(ctx, bson.M{})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Total event bookings: %d\n", bookingCount)

	cursor, err := eventsCol.Find(ctx, bson.M{}, options.Find().SetLimit(3))
	if err != nil {
		log.Fatal(err)
	}
	defer cursor.Close(ctx)

	fmt.Println("\nSample events:")
	for cursor.Next(ctx) {
		var event bson.M
		cursor.Decode(&event)
		fmt.Printf("- Event: %s | Status: %v | Category: %v\n",
			event["name"], event["status"], event["category"])
		if ticketCats, ok := event["ticket_categories"]; ok {
			fmt.Printf("  Ticket Categories: %v\n", ticketCats)
		}
	}

	cursor2, err := bookingsCol.Find(ctx, bson.M{}, options.Find().SetLimit(3))
	if err != nil {
		log.Fatal(err)
	}
	defer cursor2.Close(ctx)

	fmt.Println("\nSample event bookings:")
	for cursor2.Next(ctx) {
		var booking bson.M
		cursor2.Decode(&booking)
		fmt.Printf("- Booking ID: %s | Event: %s | Status: %v | Amount: %.2f\n",
			booking["booking_id"], booking["event_name"], booking["status"], booking["grand_total"])
		if tickets, ok := booking["tickets"]; ok {
			fmt.Printf("  Tickets: %v\n", tickets)
		}
	}

	fmt.Println("\n=== Capacity Management Check ===")
	pipeline := []bson.M{
		{"$match": bson.M{"status": "booked"}},
		{"$unwind": "$tickets"},
		{"$group": bson.M{
			"_id":          bson.M{"event_id": "$event_id", "category": "$tickets.category"},
			"total_booked": bson.M{"$sum": "$tickets.quantity"},
		}},
		{"$sort": bson.M{"total_booked": -1}},
	}

	cursor3, err := bookingsCol.Aggregate(ctx, pipeline)
	if err != nil {
		log.Fatal(err)
	}
	defer cursor3.Close(ctx)

	fmt.Println("Ticket category booking summary:")
	for cursor3.Next(ctx) {
		var result struct {
			ID          bson.M `bson:"_id"`
			TotalBooked int    `bson:"total_booked"`
		}
		cursor3.Decode(&result)
		fmt.Printf("- Event: %s | Category: %s | Booked: %d\n",
			result.ID["event_id"], result.ID["category"], result.TotalBooked)
	}

	fmt.Println("\n=== Overbooking Check ===")
	pipeline2 := []bson.M{
		{"$match": bson.M{"status": "booked"}},
		{"$lookup": bson.M{
			"from":         "events",
			"localField":   "event_id",
			"foreignField": "_id",
			"as":           "event",
		}},
		{"$unwind": "$event"},
		{"$unwind": "$tickets"},
		{"$unwind": "$event.ticket_categories"},
		{"$match": bson.M{"tickets.category": "$event.ticket_categories.name"}},
		{"$group": bson.M{
			"_id": bson.M{
				"event_id": "$event_id",
				"category": "$tickets.category",
				"capacity": "$event.ticket_categories.capacity",
			},
			"total_booked": bson.M{"$sum": "$tickets.quantity"},
		}},
		{"$match": bson.M{"total_booked": bson.M{"$gt": "$_id.capacity"}}},
	}

	cursor4, err := bookingsCol.Aggregate(ctx, pipeline2)
	if err != nil {
		log.Fatal(err)
	}
	defer cursor4.Close(ctx)

	overbooked := 0
	for cursor4.Next(ctx) {
		var result struct {
			ID          bson.M `bson:"_id"`
			TotalBooked int    `bson:"total_booked"`
		}
		cursor4.Decode(&result)
		fmt.Printf("⚠️  OVERBOOKED - Event: %s | Category: %s | Booked: %d | Capacity: %d\n",
			result.ID["event_id"], result.ID["category"], result.TotalBooked, result.ID["capacity"])
		overbooked++
	}

	if overbooked == 0 {
		fmt.Println("✅ No overbooking detected")
	} else {
		fmt.Printf("❌ Found %d overbooked categories\n", overbooked)
	}

	fmt.Println("\n=== Event System Audit Complete ===")
}
