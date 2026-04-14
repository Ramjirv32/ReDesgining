package payouts

import (
	"context"
	"fmt"
	"time"

	"ticpin-backend/config"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TriggerPayoutRequest struct {
	BookingIDs []string `json:"booking_ids"`
}

func getOrgItems(ctx context.Context, orgObjID primitive.ObjectID) ([]primitive.ObjectID, []primitive.ObjectID, []primitive.ObjectID) {
	var eventIDs, playIDs, diningIDs []primitive.ObjectID

	var orgEvents []bson.M
	eventCur, _ := config.EventsCol.Find(ctx, bson.M{"organizer_id": orgObjID})
	eventCur.All(ctx, &orgEvents)
	for _, e := range orgEvents {
		eventIDs = append(eventIDs, e["_id"].(primitive.ObjectID))
	}

	var orgPlays []bson.M
	playCur, _ := config.PlaysCol.Find(ctx, bson.M{"organizer_id": orgObjID})
	playCur.All(ctx, &orgPlays)
	for _, p := range orgPlays {
		playIDs = append(playIDs, p["_id"].(primitive.ObjectID))
	}

	var orgDinings []bson.M
	diningCur, _ := config.DiningsCol.Find(ctx, bson.M{"organizer_id": orgObjID})
	diningCur.All(ctx, &orgDinings)
	for _, d := range orgDinings {
		diningIDs = append(diningIDs, d["_id"].(primitive.ObjectID))
	}

	return eventIDs, playIDs, diningIDs
}

func GetPayoutsList(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}
	orgObjID, err := primitive.ObjectIDFromHex(authOrgID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid organizer token"})
	}

	filterType := c.Query("filter", "all")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	eventIDs, playIDs, diningIDs := getOrgItems(ctx, orgObjID)

	var dateFilter bson.M = nil
	now := time.Now()
	if filterType == "week" {
		dateFilter = bson.M{"$gte": now.AddDate(0, 0, -7)}
	} else if filterType == "month" {
		dateFilter = bson.M{"$gte": now.AddDate(0, -1, 0)}
	} else if filterType == "day" {
		dateFilter = bson.M{"$gte": now.AddDate(0, 0, -1)}
	}

	buildMatch := func(idField string, ids []primitive.ObjectID) bson.M {
		m := bson.M{
			idField: bson.M{"$in": ids},
			// Only payout for successful/completed bookings. Can also include cancelled if they have partial refund
			"status": bson.M{"$in": []string{"booked", "confirmed", "cancelled"}},
		}
		if dateFilter != nil {
			m["booked_at"] = dateFilter
		}
		return m
	}

	var allBookings []bson.M

	if len(eventIDs) > 0 {
		cursor, _ := config.EventBookingsCol.Find(ctx, buildMatch("event_id", eventIDs))
		var eb []bson.M
		cursor.All(ctx, &eb)
		// tag them
		for i := range eb {
			eb[i]["booking_category"] = "event"
		}
		allBookings = append(allBookings, eb...)
	}

	if len(playIDs) > 0 {
		cursor, _ := config.PlayBookingsCol.Find(ctx, buildMatch("play_id", playIDs))
		var pb []bson.M
		cursor.All(ctx, &pb)
		for i := range pb {
			pb[i]["booking_category"] = "play"
		}
		allBookings = append(allBookings, pb...)
	}

	if len(diningIDs) > 0 {
		cursor, _ := config.DiningBookingsCol.Find(ctx, buildMatch("dining_id", diningIDs))
		var db []bson.M
		cursor.All(ctx, &db)
		for i := range db {
			db[i]["booking_category"] = "dining"
		}
		allBookings = append(allBookings, db...)
	}

	return c.JSON(fiber.Map{
		"bookings": allBookings,
	})
}

func TriggerPayout(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	var req TriggerPayoutRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}

	if len(req.BookingIDs) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "no bookings selected"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Convert string IDs to primitive.ObjectIDs
	var objIDs []primitive.ObjectID
	for _, idStr := range req.BookingIDs {
		oid, err := primitive.ObjectIDFromHex(idStr)
		if err == nil {
			objIDs = append(objIDs, oid)
		}
	}

	if len(objIDs) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "invalid booking ids"})
	}

	// Update payout_processed to true
	updateDoc := bson.M{
		"$set": bson.M{
			"payout_processed": true,
			"payout_date":      time.Now(),
		},
	}

	// Update across all three collections
	filter := bson.M{"_id": bson.M{"$in": objIDs}}

	eres, _ := config.EventBookingsCol.UpdateMany(ctx, filter, updateDoc)
	pres, _ := config.PlayBookingsCol.UpdateMany(ctx, filter, updateDoc)
	dres, _ := config.DiningBookingsCol.UpdateMany(ctx, filter, updateDoc)

	totalUpdated := eres.ModifiedCount + pres.ModifiedCount + dres.ModifiedCount

	fmt.Printf("DEBUG: Triggered Payout for Organizer %s. Bookings updated: %d\n", authOrgID, totalUpdated)

	return c.JSON(fiber.Map{
		"message":        "payout processed successfully",
		"updated_count":  totalUpdated,
	})
}
