package main

import (
	"context"
	"fmt"
	"log"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

func main() {
	godotenv.Load()
	if err := config.ConnectDB(); err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	col := config.PlaysCol

	// Sample Court
	courts := []models.Court{
		{
			ID:    primitive.NewObjectID(),
			Name:  "Primary Court",
			Type:  "Indoor Synthetic",
			Price: 600,
            ImageURL: "https://res.cloudinary.com/dk4oxsddy/image/upload/v1774884935/ticpin/media/ch20ncpc27zomfibaz2c.jpg",
		},
	}

	res, err := col.UpdateOne(ctx, bson.M{"name": "TurfX Arena Chennai"}, bson.M{
		"$set": bson.M{"courts": courts},
	})
	if err != nil {
		log.Fatal(err)
	}

	if res.ModifiedCount == 0 {
		fmt.Println("No venue found or courts already set.")
	} else {
		fmt.Println("Successfully added sample court to TurfX Arena Chennai.")
	}
}
