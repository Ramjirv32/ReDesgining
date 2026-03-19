package scripts

import (
	"context"
	"log"
	"time"

	"ticpin-backend/config"

	"go.mongodb.org/mongo-driver/bson"
)

func CleanupChatSessions() {
	// Connect to database
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Clean up old chat sessions (older than 7 days)
	cutoffTime := time.Now().Add(-7 * 24 * time.Hour)

	// Delete old messages
	msgResult, err := config.ChatMessagesCol.DeleteMany(ctx, bson.M{
		"created_at": bson.M{"$lt": cutoffTime},
	})
	if err != nil {
		log.Printf("Error deleting old messages: %v", err)
	} else {
		log.Printf("Deleted %d old messages", msgResult.DeletedCount)
	}

	// Delete old sessions
	sessionResult, err := config.ChatSessionsCol.DeleteMany(ctx, bson.M{
		"created_at": bson.M{"$lt": cutoffTime},
	})
	if err != nil {
		log.Printf("Error deleting old sessions: %v", err)
	} else {
		log.Printf("Deleted %d old sessions", sessionResult.DeletedCount)
	}

	// Update any sessions with invalid status to "ended"
	updateResult, err := config.ChatSessionsCol.UpdateMany(ctx, bson.M{
		"status": bson.M{"$nin": []string{"active", "ended"}},
	}, bson.M{
		"$set": bson.M{
			"status":   "ended",
			"ended_at": time.Now(),
			"ended_by": "system_cleanup",
		},
	})
	if err != nil {
		log.Printf("Error updating invalid sessions: %v", err)
	} else {
		log.Printf("Updated %d sessions with invalid status", updateResult.ModifiedCount)
	}

	log.Println("Chat cleanup completed successfully!")
}
