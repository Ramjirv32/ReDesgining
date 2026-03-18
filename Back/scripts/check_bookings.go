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

func main() {
	uri := "mongodb+srv://ramji:Ramji23112005@cluster0.ln4g5.mongodb.net/ticpin?retryWrites=true&w=majority"
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.TODO())

	db := client.Database("ticpin")
	col := db.Collection("play_bookings")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := col.CountDocuments(ctx, bson.M{"play_id": bson.M{"$exists": true}})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Total play bookings: %d\n", count)

	cursor, err := col.Find(ctx, bson.M{}, options.Find().SetLimit(10))
	if err != nil {
		log.Fatal(err)
	}
	defer cursor.Close(ctx)

	fmt.Println("Recent play bookings:")
	for cursor.Next(ctx) {
		var b map[string]interface{}
		cursor.Decode(&b)
		fmt.Printf("- %+v\n", b)
	}
}
