package analytics

import (
	"context"
	"time"

	"ticpin-backend/config"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AnalyticsResponse struct {
	TotalCollectedAmount float64           `json:"total_collected_amount"`
	TotalRefundedAmount  float64           `json:"total_refunded_amount"`
	TotalNetRevenue      float64           `json:"total_net_revenue"`
	TotalBookings        int               `json:"total_bookings"`
	ChartData            []DailyChartData  `json:"chart_data"`
}

type DailyChartData struct {
	Date      string  `json:"date"`
	Collected float64 `json:"collected"`
	Refunded  float64 `json:"refunded"`
}

func GetOrganizerAnalytics(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}
	orgObjID, err := primitive.ObjectIDFromHex(authOrgID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid organizer token"})
	}

	filterType := c.Query("filter", "all") // "week", "month", "all"

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Get Event IDs
	var orgEvents []bson.M
	eventCur, _ := config.EventsCol.Find(ctx, bson.M{"organizer_id": orgObjID})
	eventCur.All(ctx, &orgEvents)
	var eventIDs []primitive.ObjectID
	for _, e := range orgEvents {
		eventIDs = append(eventIDs, e["_id"].(primitive.ObjectID))
	}

	// 2. Get Play IDs
	var orgPlays []bson.M
	playCur, _ := config.PlaysCol.Find(ctx, bson.M{"organizer_id": orgObjID})
	playCur.All(ctx, &orgPlays)
	var playIDs []primitive.ObjectID
	for _, p := range orgPlays {
		playIDs = append(playIDs, p["_id"].(primitive.ObjectID))
	}

	// 3. Get Dining IDs (if they exist)
	var orgDinings []bson.M
	diningCur, _ := config.DiningsCol.Find(ctx, bson.M{"organizer_id": orgObjID})
	diningCur.All(ctx, &orgDinings)
	var diningIDs []primitive.ObjectID
	for _, d := range orgDinings {
		diningIDs = append(diningIDs, d["_id"].(primitive.ObjectID))
	}

	// Set date constraint
	var dateFilter bson.M = nil
	now := time.Now()
	if filterType == "week" {
		dateFilter = bson.M{"$gte": now.AddDate(0, 0, -7)}
	} else if filterType == "month" {
		dateFilter = bson.M{"$gte": now.AddDate(0, -1, 0)}
	}

	// Helper to build match
	buildMatch := func(idField string, ids []primitive.ObjectID) bson.M {
		m := bson.M{
			idField: bson.M{"$in": ids},
			"status": bson.M{"$in": []string{"booked", "confirmed", "cancelled"}},
		}
		if dateFilter != nil {
			m["booked_at"] = dateFilter
		}
		return m
	}

	var allBookings []bson.M

	// Fetch Event Bookings
	if len(eventIDs) > 0 {
		cursor, _ := config.EventBookingsCol.Find(ctx, buildMatch("event_id", eventIDs))
		var eb []bson.M
		cursor.All(ctx, &eb)
		allBookings = append(allBookings, eb...)
	}

	// Fetch Play Bookings
	if len(playIDs) > 0 {
		cursor, _ := config.PlayBookingsCol.Find(ctx, buildMatch("play_id", playIDs))
		var pb []bson.M
		cursor.All(ctx, &pb)
		allBookings = append(allBookings, pb...)
	}

	// Fetch Dining Bookings
	if len(diningIDs) > 0 {
		cursor, _ := config.DiningBookingsCol.Find(ctx, buildMatch("dining_id", diningIDs))
		var db []bson.M
		cursor.All(ctx, &db)
		allBookings = append(allBookings, db...)
	}

	// Aggregate Metrics
	var resp AnalyticsResponse
	resp.TotalBookings = len(allBookings)
	
	dailyAgg := make(map[string]*DailyChartData)

	for _, b := range allBookings {
		gt := 0.0
		if val, err := getFloat(b["grand_total"]); err == nil {
			gt = val
		}

		refundAmount := 0.0
		if val, err := getFloat(b["refund_amount"]); err == nil {
			refundAmount = val
		}

		// Calculate Collected (if booked/confirmed, it's grand_total, if cancelled, it's (grand_total - refund) OR just count refunded separately)
		// For simplicity, Collected = total user paid initially. Refunded = amount given back.
		// Net Revenue = Collected - Refunded
		
		resp.TotalCollectedAmount += gt
		resp.TotalRefundedAmount += refundAmount

		// Chart distribution
		if bookedAt, ok := b["booked_at"].(primitive.DateTime); ok {
			dateStr := bookedAt.Time().Format("2006-01-02")
			if _, exists := dailyAgg[dateStr]; !exists {
				dailyAgg[dateStr] = &DailyChartData{Date: dateStr}
			}
			dailyAgg[dateStr].Collected += gt
			
			// For refund, if cancelled, maybe attribute refund to cancellation date? 
			// Let's attribute the refund to the day it was booked for simplicity, or the day it was cancelled
			dailyAgg[dateStr].Refunded += refundAmount
		}
	}

	resp.TotalNetRevenue = resp.TotalCollectedAmount - resp.TotalRefundedAmount

	for _, v := range dailyAgg {
		resp.ChartData = append(resp.ChartData, *v)
	}

	return c.JSON(resp)
}

func getFloat(v interface{}) (float64, error) {
	switch val := v.(type) {
	case float64:
		return val, nil
	case int32:
		return float64(val), nil
	case int64:
		return float64(val), nil
	}
	return 0, nil
}
