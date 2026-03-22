package notificationsvc

import (
	"context"
	"strings"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"ticpin-backend/worker"

	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func Send(n *models.Notification) error {
	col := config.NotificationsCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	n.ID = primitive.NewObjectID()
	n.CreatedAt = time.Now()

	_, err := col.InsertOne(ctx, n)
	if err != nil {
		return err
	}

	worker.Submit(func() {
		emails := make(map[string]bool)
		ctxB := context.Background()

		if n.TargetType == "all_users" || n.TargetType == "both" {
			cursor, _ := config.UsersCol.Find(ctxB, bson.M{}, options.Find().SetProjection(bson.M{"phone": 1}))
			var users []models.User
			cursor.All(ctxB, &users)
			for _, u := range users {
				if u.Phone != "" {
					emails[u.Phone] = true
				}
			}
		}

		if n.TargetType == "all_organizers" || n.TargetType == "both" {
			cursor, _ := config.OrgsCol.Find(ctxB, bson.M{}, options.Find().SetProjection(bson.M{"email": 1}))
			var orgs []models.Organizer
			cursor.All(ctxB, &orgs)
			for _, o := range orgs {
				if o.Email != "" {
					emails[o.Email] = true
				}
			}
		}

		if n.TargetType == "selected_users" {
			var oids []primitive.ObjectID
			for _, idStr := range n.RecipientIDs {
				if oid, err := primitive.ObjectIDFromHex(idStr); err == nil {
					oids = append(oids, oid)
				}
			}
			if len(oids) > 0 {
				cursor, err := config.UsersCol.Find(ctxB, bson.M{"_id": bson.M{"$in": oids}}, options.Find().SetProjection(bson.M{"phone": 1}))
				if err == nil {
					var users []models.User
					cursor.All(ctxB, &users)
					for _, u := range users {
						if u.Phone != "" {
							emails[u.Phone] = true
						}
					}
				}
			}
		}

		if n.TargetType == "selected_organizers" {
			var oids []primitive.ObjectID
			for _, idStr := range n.RecipientIDs {
				if oid, err := primitive.ObjectIDFromHex(idStr); err == nil {
					oids = append(oids, oid)
				}
			}
			if len(oids) > 0 {
				cursor, err := config.OrgsCol.Find(ctxB, bson.M{"_id": bson.M{"$in": oids}}, options.Find().SetProjection(bson.M{"email": 1}))
				if err == nil {
					var orgs []models.Organizer
					cursor.All(ctxB, &orgs)
					for _, o := range orgs {
						if o.Email != "" {
							emails[o.Email] = true
						}
					}
				}
			}
		}

		log.Info().Int("count", len(emails)).Msg("Starting broadcast to unique valid target emails")

		for email := range emails {

			if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
				continue
			}
			err := config.SendNotificationEmail(email, n.Title, n.Description, n.ImageURL)
			if err != nil {
				log.Error().Err(err).Str("email", email).Msg("Failed to send notification email")
			} else {
				log.Info().Str("email", email).Msg("Notification email sent")
			}
		}
	})

	return nil
}

func GetAll() ([]models.Notification, error) {
	col := config.NotificationsCol
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

	for i := range list {
		recipientDetails := []map[string]interface{}{}

		if list[i].TargetType == "all_users" || list[i].TargetType == "both" {
			cursor, _ := config.UsersCol.Find(ctx, bson.M{}, options.Find().SetProjection(bson.M{"phone": 1, "name": 1}))
			var users []models.User
			cursor.All(ctx, &users)
			for _, u := range users {
				if u.Phone != "" {
					recipientDetails = append(recipientDetails, map[string]interface{}{
						"id":    u.ID.Hex(),
						"phone": u.Phone,
						"name":  u.Name,
						"type":  "user",
					})
				}
			}
		}

		if list[i].TargetType == "all_organizers" || list[i].TargetType == "both" {
			cursor, _ := config.OrgsCol.Find(ctx, bson.M{}, options.Find().SetProjection(bson.M{"email": 1, "name": 1}))
			var orgs []models.Organizer
			cursor.All(ctx, &orgs)
			for _, o := range orgs {
				if o.Email != "" {
					recipientDetails = append(recipientDetails, map[string]interface{}{
						"id":    o.ID.Hex(),
						"email": o.Email,
						"name":  o.Name,
						"type":  "organizer",
					})
				}
			}
		}

		if list[i].TargetType == "selected_users" {
			var oids []primitive.ObjectID
			for _, idStr := range list[i].RecipientIDs {
				if oid, err := primitive.ObjectIDFromHex(idStr); err == nil {
					oids = append(oids, oid)
				}
			}
			if len(oids) > 0 {
				cursor, err := config.UsersCol.Find(ctx, bson.M{"_id": bson.M{"$in": oids}}, options.Find().SetProjection(bson.M{"phone": 1, "name": 1}))
				if err == nil {
					var users []models.User
					cursor.All(ctx, &users)
					for _, u := range users {
						if u.Phone != "" {
							recipientDetails = append(recipientDetails, map[string]interface{}{
								"id":    u.ID.Hex(),
								"phone": u.Phone,
								"name":  u.Name,
								"type":  "user",
							})
						}
					}
				}
			}
		}

		if list[i].TargetType == "selected_organizers" {
			var oids []primitive.ObjectID
			for _, idStr := range list[i].RecipientIDs {
				if oid, err := primitive.ObjectIDFromHex(idStr); err == nil {
					oids = append(oids, oid)
				}
			}
			if len(oids) > 0 {
				cursor, err := config.OrgsCol.Find(ctx, bson.M{"_id": bson.M{"$in": oids}}, options.Find().SetProjection(bson.M{"email": 1, "name": 1}))
				if err == nil {
					var orgs []models.Organizer
					cursor.All(ctx, &orgs)
					for _, o := range orgs {
						if o.Email != "" {
							recipientDetails = append(recipientDetails, map[string]interface{}{
								"id":    o.ID.Hex(),
								"email": o.Email,
								"name":  o.Name,
								"type":  "organizer",
							})
						}
					}
				}
			}
		}

		if len(recipientDetails) > 0 {
			list[i].RecipientDetails = recipientDetails
		}
	}

	return list, nil
}
