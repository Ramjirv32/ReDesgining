package scripts

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
	col := db.Collection("plays")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := col.Find(ctx, bson.M{"name": "Coimbatore Elite Turf Arena"})
	if err != nil {
		log.Fatal(err)
	}
	defer cursor.Close(ctx)

	fmt.Println("Venues matching name:")
	for cursor.Next(ctx) {
		var p bson.M
		cursor.Decode(&p)
		subCat := p["sub_category"]
		courtsInterface := p["courts"]
		courtsCount := 0
		if courts, ok := courtsInterface.(bson.A); ok {
			courtsCount = len(courts)
		} else if courts, ok := courtsInterface.(primitive.A); ok {
			courtsCount = len(courts)
		}
		fmt.Printf("- ID: %v, SubCat: %v, CourtsCount: %v\n", p["_id"], subCat, courtsCount)
	}
}
