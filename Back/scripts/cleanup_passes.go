package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"ticpin-backend/config"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
)

func main() {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	config.ConnectDB()
	db := config.GetDB()
	col := db.Collection("ticpin_passes")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	res, err := col.DeleteMany(ctx, bson.M{})
	if err != nil {
		log.Fatalf("Failed to delete passes: %v", err)
	}

	fmt.Printf("Successfully deleted %d passes\n", res.DeletedCount)
	os.Exit(0)
}
