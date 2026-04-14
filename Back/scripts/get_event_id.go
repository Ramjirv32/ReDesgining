// +build ignore

package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	uri := "mongodb+srv://ramji:Ramji23112005@cluster0.ln4g5.mongodb.net/ticpin?retryWrites=true&w=majority"
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.TODO())

	db := client.Database("ticpin")
	eventsCol := db.Collection("events")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var event bson.M
	err = eventsCol.FindOne(ctx, bson.M{"name": "Night Vibes Music Fest 2026"}).Decode(&event)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Event ID: %s\n", event["_id"])
	fmt.Printf("Event Name: %s\n", event["name"])
	fmt.Printf("Ticket Categories: %v\n", event["ticket_categories"])
}
