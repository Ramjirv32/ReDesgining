package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// MongoDB connection - update with your actual connection string
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	client, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(context.Background())

	// Get database name - update with your actual database name
	dbName := "ticpin" // Change this to your database name
	db := client.Database(dbName)

	// List all collections
	collections, err := db.ListCollectionNames(context.Background(), bson.M{})
	if err != nil {
		log.Fatal("Failed to list collections:", err)
	}

	fmt.Printf("Found %d collections in database '%s'\n", len(collections), dbName)
	fmt.Println("Collections to be deleted:")
	for i, name := range collections {
		fmt.Printf("%d. %s\n", i+1, name)
	}

	// Confirmation prompt
	fmt.Print("\n⚠️  WARNING: This will permanently delete ALL collections and data!")
	fmt.Print("\nType 'DELETE ALL' to confirm: ")

	var confirmation string
	reader := bufio.NewReader(os.Stdin)
	confirmation, _ = reader.ReadString('\n')
	confirmation = strings.TrimSpace(confirmation) // Remove whitespace and newlines

	fmt.Printf("Received: '%s'\n", confirmation) // Debug line

	if confirmation != "DELETE ALL" {
		fmt.Printf("Expected 'DELETE ALL' but got '%s'. Operation cancelled.\n", confirmation)
		return
	}

	// Delete all collections
	fmt.Println("\n🗑️  Deleting collections...")
	startTime := time.Now()

	for _, collectionName := range collections {
		fmt.Printf("Deleting collection: %s... ", collectionName)

		err := db.Collection(collectionName).Drop(context.Background())
		if err != nil {
			fmt.Printf("❌ FAILED: %v\n", err)
		} else {
			fmt.Println("✅ SUCCESS")
		}
	}

	duration := time.Since(startTime)
	fmt.Printf("\n✅ All collections deleted successfully in %v\n", duration)
	fmt.Printf("Database '%s' is now empty.\n", dbName)
}
