// +build ignore

package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"

	"ticpin-backend/config"
	"ticpin-backend/models"
)

func MigrateRoles() error {
	fmt.Println("Starting role migration for existing organizers...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	collection := config.GetDB().Collection("organizers")
	cursor, err := collection.Find(ctx, bson.M{
		"$or": []bson.M{
			{"role": bson.M{"$exists": false}},
			{"role": bson.M{"$eq": ""}},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to query organizers: %v", err)
	}
	defer cursor.Close(ctx)

	var updatedCount int64 = 0
	var adminCount int64 = 0

	for cursor.Next(ctx) {
		var organizer models.Organizer
		if err := cursor.Decode(&organizer); err != nil {
			continue
		}

		role := "organizer"
		if organizer.Email == config.GetAdminEmail() {
			role = "admin"
			adminCount++
		} else {
			updatedCount++
		}

		update := bson.M{"$set": bson.M{"role": role, "updatedAt": time.Now()}}
		_, err = collection.UpdateOne(ctx, bson.M{"_id": organizer.ID}, update)
		if err != nil {
			log.Printf("Failed to update organizer %s: %v\n", organizer.ID.Hex(), err)
			continue
		}

		log.Printf("Updated organizer %s with role: %s\n", organizer.ID.Hex(), role)
	}

	fmt.Printf("Migration completed:\n")
	fmt.Printf("- Total organizers updated: %d\n", updatedCount)
	fmt.Printf("- Admin users identified: %d\n", adminCount)
	fmt.Printf("- Regular users: %d\n", updatedCount-adminCount)

	return nil
}
