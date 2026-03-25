package adminpass

import (
	"context"
	"fmt"
	"ticpin-backend/config"
	"ticpin-backend/models"
	_ "ticpin-backend/services/pass"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ListUsersForPass lists users who don't have an unexpired active pass
func ListUsersForPass(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Get all users
	cursor, err := config.GetDB().Collection("users").Find(ctx, bson.M{})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err := cursor.All(ctx, &users); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// 2. Identify users with active unexpired passes
	now := time.Now()
	passCursor, err := config.GetDB().Collection("ticpin_passes").Find(ctx, bson.M{
		"status":   "active",
		"end_date": bson.M{"$gt": now},
	})
	
	activeUserMap := make(map[string]bool)
	if err == nil {
		var activePasses []models.TicpinPass
		if err := passCursor.All(ctx, &activePasses); err == nil {
			for _, p := range activePasses {
				activeUserMap[p.UserID.Hex()] = true
			}
		}
	}

	// 3. Filter users
	result := []map[string]interface{}{}
	for _, u := range users {
		if !activeUserMap[u.ID.Hex()] {
			result = append(result, map[string]interface{}{
				"id":    u.ID.Hex(),
				"name":  u.Name,
				"phone": u.Phone,
			})
		}
	}

	return c.JSON(result)
}

// CreateAdminPass allows admin to manually create a pass for a user
func CreateAdminPass(c *fiber.Ctx) error {
	var req struct {
		UserID         string `json:"user_id"`
		DurationMonths int    `json:"duration_months"` // 3 or 6
		Price          float64 `json:"price"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}

	if req.UserID == "" || (req.DurationMonths != 3 && req.DurationMonths != 6) {
		return c.Status(400).JSON(fiber.Map{"error": "user_id and valid duration (3 or 6 months) required"})
	}

	// Prepare pass details
	now := time.Now()
	expiryDate := now.AddDate(0, req.DurationMonths, 0)
	userObjID, _ := primitive.ObjectIDFromHex(req.UserID)

	pass := models.TicpinPass{
		UserID:    userObjID,
		PaymentID: "ADMIN_CREATED_" + fmt.Sprintf("%d", now.Unix()),
		Price:     req.Price,
		Status:    "active",
		StartDate: now,
		EndDate:   expiryDate,
		Benefits: models.PassBenefits{
			TurfBookings: models.BenefitCounter{
				Total:     2,
				Used:      0,
				Remaining: 2,
			},
			DiningVouchers: models.DiningVoucherBenefit{
				Total:     2,
				Used:      0,
				Remaining: 2,
				ValueEach: 250.0,
			},
			EventsDiscountActive: true,
		},
		Renewals:  []models.RenewalRecord{},
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Create record
	_, err := config.GetDB().Collection("ticpin_passes").InsertOne(context.Background(), pass)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(pass)
}

// ListAllPasses lists all passes with filters
func ListAllPasses(c *fiber.Ctx) error {
	status := c.Query("status") // active, expired, all
	
	filter := bson.M{}
	if status == "active" {
		filter["status"] = "active"
		filter["end_date"] = bson.M{"$gt": time.Now()}
	} else if status == "expired" {
		filter["$or"] = []bson.M{
			{"status": "expired"},
			{"end_date": bson.M{"$lte": time.Now()}},
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.M{"createdAt": -1})
	cursor, err := config.GetDB().Collection("ticpin_passes").Find(ctx, filter, opts)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer cursor.Close(ctx)

	var passes []models.TicpinPass
	if err := cursor.All(ctx, &passes); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Enrich with user info
	type EnrichedPass struct {
		models.TicpinPass
		UserName  string `json:"user_name"`
		UserPhone string `json:"user_phone"`
	}
	
	enriched := []EnrichedPass{}
	for _, p := range passes {
		var u models.User
		config.GetDB().Collection("users").FindOne(ctx, bson.M{"_id": p.UserID}).Decode(&u)
		enriched = append(enriched, EnrichedPass{
			TicpinPass: p,
			UserName:   u.Name,
			UserPhone:  u.Phone,
		})
	}

	return c.JSON(enriched)
}

// UpdateAdminPass allows admin to manually update a pass
func UpdateAdminPass(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid pass id"})
	}

	var req struct {
		Status    string    `json:"status"`
		EndDate   time.Time `json:"end_date"`
		TurfLeft  int       `json:"turf_left"`
		DiningLeft int      `json:"dining_left"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"updatedAt": time.Now(),
	}
	if req.Status != "" {
		update["status"] = req.Status
	}
	if !req.EndDate.IsZero() {
		update["end_date"] = req.EndDate
	}
	
	// Update benefits if provided
	if req.TurfLeft >= 0 {
		update["benefits.turf_bookings.remaining"] = req.TurfLeft
	}
	if req.DiningLeft >= 0 {
		update["benefits.dining_vouchers.remaining"] = req.DiningLeft
	}

	result, err := config.GetDB().Collection("ticpin_passes").UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	if result.MatchedCount == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "pass not found"})
	}

	return c.JSON(fiber.Map{"message": "pass updated successfully"})
}

// RenewAdminPass manually renews a pass for another duration
func RenewAdminPass(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid pass id"})
	}

	var req struct {
		DurationMonths int `json:"duration_months"` // 3 or 6
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}

	if req.DurationMonths != 3 && req.DurationMonths != 6 {
		return c.Status(400).JSON(fiber.Map{"error": "valid duration (3 or 6 months) required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var p models.TicpinPass
	if err := config.GetDB().Collection("ticpin_passes").FindOne(ctx, bson.M{"_id": id}).Decode(&p); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "pass not found"})
	}

	newStart := time.Now()
	// If pass is still active, start from its end date
	if p.EndDate.After(newStart) && p.Status == "active" {
		newStart = p.EndDate
	}
	newEnd := newStart.AddDate(0, req.DurationMonths, 0)

	renewal := models.RenewalRecord{
		RenewedAt: time.Now(),
		StartDate: newStart,
		EndDate:   newEnd,
		PaymentID: "ADMIN_RENEW_" + fmt.Sprintf("%d", time.Now().Unix()),
		Price:     0, // Admin manual renewal
	}

	update := bson.M{
		"$set": bson.M{
			"status":                       "active",
			"end_date":                     newEnd,
			"updatedAt":                    time.Now(),
			"benefits.turf_bookings.used":   0,
			"benefits.turf_bookings.remaining": 2,
			"benefits.dining_vouchers.used": 0,
			"benefits.dining_vouchers.remaining": 2,
		},
		"$push": bson.M{
			"renewals": renewal,
		},
	}

	_, err = config.GetDB().Collection("ticpin_passes").UpdateOne(ctx, bson.M{"_id": id}, update)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "pass renewed successfully", "new_expiry": newEnd})
}

// DeleteAdminPass deletes a pass record
func DeleteAdminPass(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid pass id"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := config.GetDB().Collection("ticpin_passes").DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	if result.DeletedCount == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "pass not found"})
	}

	return c.JSON(fiber.Map{"message": "pass deleted successfully"})
}

// GetUserBySearch allows admin to search for a user by name or phone
func GetUserBySearch(c *fiber.Ctx) error {
	query := c.Query("q")
	if query == "" {
		return c.JSON([]models.User{})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"$or": []bson.M{
			{"name": bson.M{"$regex": query, "$options": "i"}},
			{"phone": bson.M{"$regex": query, "$options": "i"}},
		},
	}

	cursor, err := config.GetDB().Collection("users").Find(ctx, filter)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer cursor.Close(ctx)

	var users []models.User
	cursor.All(ctx, &users)

	return c.JSON(users)
}
