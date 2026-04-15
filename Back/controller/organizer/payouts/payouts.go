package payouts

import (
	"context"
	"fmt"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/services/payment"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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

	orgObjID, err := primitive.ObjectIDFromHex(authOrgID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid organizer ID"})
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

	// 1. Fetch Organizer Setup
	var setup bson.M
	err = config.OrgsCol.Database().Collection("organizer_setups").FindOne(ctx, bson.M{"organizerId": orgObjID}).Decode(&setup)
	if err != nil {
		// Use manual parsing for setup if it fails, maybe the setup is in a different collection
		err = config.OrgsCol.Database().Collection("setups").FindOne(ctx, bson.M{"organizerId": orgObjID}).Decode(&setup)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "organizer setup / bank details not found"})
		}
	}

	bankAccount, _ := setup["bankAccountNo"].(string)
	ifsc, _ := setup["bankIfsc"].(string)
	accountHolder, _ := setup["accountHolder"].(string)
	
	if bankAccount == "" || ifsc == "" || accountHolder == "" {
		return c.Status(400).JSON(fiber.Map{"error": "organizer bank details are incomplete"})
	}

	// 2. Convert string IDs to primitive.ObjectIDs
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

	// 3. Calculate total amount across selected bookings
	filter := bson.M{"_id": bson.M{"$in": objIDs}}
	totalAmount := 0.0

	calculateTotal := func(coll *mongo.Collection) {
		cursor, _ := coll.Find(ctx, filter)
		var bs []bson.M
		cursor.All(ctx, &bs)
		for _, b := range bs {
			if v, ok := b["grand_total"].(float64); ok {
				totalAmount += v
			} else if v, ok := b["grand_total"].(int32); ok {
				totalAmount += float64(v)
			}
		}
	}
	calculateTotal(config.EventBookingsCol)
	calculateTotal(config.PlayBookingsCol)
	calculateTotal(config.DiningBookingsCol)

	if totalAmount <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "total payout amount must be greater than zero"})
	}

	// Calculate net payout (e.g., deducting 5% commission)
	commissionRate := 0.05
	netPayout := totalAmount * (1 - commissionRate)

	// 4. Trigger RazorpayX Process
	contactRef := fmt.Sprintf("org_%s", authOrgID)
	
	// Try creating contact. (Since we don't store contact ID yet, we assume it might exist or create a new one). 
	// For production, handle "contact already exists" via fetch, but RazorpayX can allow duplicates or we catch the error.
	contactID, err := payment.CreateRazorpayContact(accountHolder, "organizer@example.com", "9999999999", contactRef)
	if err != nil {
		fmt.Printf("ERROR: Failed to create Razorpay Contact: %v\n", err)
		return c.Status(500).JSON(fiber.Map{"error": "failed to initiate payout with payment gateway"})
	}

	fundAccountID, err := payment.CreateRazorpayFundAccount(contactID, accountHolder, ifsc, bankAccount)
	if err != nil {
		fmt.Printf("ERROR: Failed to create Razorpay Fund Account: %v\n", err)
		return c.Status(500).JSON(fiber.Map{"error": "failed to verify bank details with gateway"})
	}

	payoutRef := fmt.Sprintf("payout_%s_%d", authOrgID, time.Now().Unix())
	payoutNarration := fmt.Sprintf("Tickpin Settlement %s", payoutRef)
	
	payoutID, err := payment.TriggerRazorpayPayout(fundAccountID, netPayout, payoutRef, payoutNarration)
	if err != nil {
		fmt.Printf("ERROR: Razorpay Payout Execution Failed: %v\n", err)
		return c.Status(500).JSON(fiber.Map{"error": "payment gateway rejected transfer"})
	}

	// 5. Update payout_processed to true
	updateDoc := bson.M{
		"$set": bson.M{
			"payout_processed": true,
			"payout_date":      time.Now(),
			"payout_id":        payoutID,
			"net_payout":       netPayout,
		},
	}

	eres, _ := config.EventBookingsCol.UpdateMany(ctx, filter, updateDoc)
	pres, _ := config.PlayBookingsCol.UpdateMany(ctx, filter, updateDoc)
	dres, _ := config.DiningBookingsCol.UpdateMany(ctx, filter, updateDoc)

	totalUpdated := eres.ModifiedCount + pres.ModifiedCount + dres.ModifiedCount

	fmt.Printf("DEBUG: Triggered Payout %s for Organizer %s. Amount: %.2f (Net: %.2f). Bookings updated: %d\n", payoutID, authOrgID, totalAmount, netPayout, totalUpdated)

	return c.JSON(fiber.Map{
		"message":        "payout processed successfully via RazorpayX",
		"updated_count":  totalUpdated,
		"payout_id":      payoutID,
	})
}
