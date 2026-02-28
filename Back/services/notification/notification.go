package notificationsvc

import (
	"context"
	"strings"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func Send(n *models.Notification) error {
	col := config.GetDB().Collection("notifications")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	n.ID = primitive.NewObjectID()
	n.CreatedAt = time.Now()

	_, err := col.InsertOne(ctx, n)
	if err != nil {
		return err
	}

	// Async sending via email for all selected targets
	go func(notif models.Notification) {
		emails := make(map[string]bool)
		ctxB := context.Background()

		if notif.TargetType == "all_users" || notif.TargetType == "both" {
			cursor, _ := config.GetDB().Collection("users").Find(ctxB, bson.M{})
			var users []models.User
			cursor.All(ctxB, &users)
			for _, u := range users {
				if u.Phone != "" {
					emails[u.Phone] = true
				}
			}
		}

		if notif.TargetType == "all_organizers" || notif.TargetType == "both" {
			cursor, _ := config.GetDB().Collection("organizers").Find(ctxB, bson.M{})
			var orgs []models.Organizer
			cursor.All(ctxB, &orgs)
			for _, o := range orgs {
				if o.Email != "" {
					emails[o.Email] = true
				}
			}
		}

		if notif.TargetType == "selected_users" {
			for _, idStr := range notif.RecipientIDs {
				oid, _ := primitive.ObjectIDFromHex(idStr)
				var u models.User
				if err := config.GetDB().Collection("users").FindOne(ctxB, bson.M{"_id": oid}).Decode(&u); err == nil {
					if u.Phone != "" {
						emails[u.Phone] = true
					}
				}
			}
		}

		if notif.TargetType == "selected_organizers" {
			for _, idStr := range notif.RecipientIDs {
				oid, _ := primitive.ObjectIDFromHex(idStr)
				var o models.Organizer
				if err := config.GetDB().Collection("organizers").FindOne(ctxB, bson.M{"_id": oid}).Decode(&o); err == nil {
					if o.Email != "" {
						emails[o.Email] = true
					}
				}
			}
		}

		println("Found", len(emails), "unique valid target emails. Starting broadcast...")

		// Send emails
		for email := range emails {
			// Basic email validation
			if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
				continue
			}
			err := config.SendNotificationEmail(email, notif.Title, notif.Description, notif.ImageURL)
			if err != nil {
				// Log the error
				println("Failed to send notification email to", email, ":", err.Error())
			} else {
				println("Notification email sent to", email)
			}
		}
	}(*n)

	return nil
}

func GetAll() ([]models.Notification, error) {
	col := config.GetDB().Collection("notifications")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.M{"created_at": -1})
	cursor, err := col.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var list []models.Notification
	if err := cursor.All(ctx, &list); err != nil {
		return nil, err
	}
	return list, nil
}
