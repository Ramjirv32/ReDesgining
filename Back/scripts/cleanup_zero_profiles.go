// +build ignore

package main

import (
	"context"
	"fmt"
	"log"
	"ticpin-backend/config"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func main() {
	godotenv.Load("../.env")

	if err := config.ConnectDB(); err != nil {
		log.Fatal(err)
	}

	db := config.GetDB()
	col := db.Collection("profiles")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find zeroed userId
	zeroID := primitive.NilObjectID
	fmt.Printf("Searching for zeroed userId: %v\n", zeroID.Hex())

	filter := bson.M{"userId": zeroID}
	count, err := col.CountDocuments(ctx, filter)
	if err != nil {
		log.Fatal(err)
	}

	if count > 0 {
		fmt.Printf("Found %d profiles with zeroed userId. Deleting...\n", count)
		res, err := col.DeleteMany(ctx, filter)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Deleted %d profiles.\n", res.DeletedCount)
	} else {
		fmt.Println("No profiles with zeroed userId found.")
	}
}
