package adminusers

import (
	"context"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetUser(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid user id"})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var u models.User
	if err := config.GetDB().Collection("users").FindOne(ctx, bson.M{"_id": id}).Decode(&u); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "user not found"})
	}
	return c.JSON(u)
}

func UpdateUser(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid user id"})
	}
	var req struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	update := bson.M{}
	if req.Name != "" {
		update["name"] = req.Name
	}
	if req.Phone != "" {
		update["phone"] = req.Phone
	}
	_, err = config.GetDB().Collection("users").UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "user updated"})
}

func DeleteUser(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid user id"})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := config.GetDB().Collection("users").DeleteOne(ctx, bson.M{"_id": id}); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "user deleted"})
}

func GetUserBookings(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid user id"})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var u models.User
	if err := config.GetDB().Collection("users").FindOne(ctx, bson.M{"_id": id}).Decode(&u); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "user not found"})
	}

	var profile models.Profile
	profileErr := config.GetDB().Collection("profiles").FindOne(ctx, bson.M{"userId": id}).Decode(&profile)

	filter := bson.M{"$or": []bson.M{
		{"user_id": id.Hex()},
		{"user_phone": u.Phone},
	}}
	if profileErr == nil && profile.Email != "" {
		filter["$or"] = append(filter["$or"].([]bson.M), bson.M{"user_email": profile.Email})
	}

	type Booking = map[string]interface{}
	allBookings := []Booking{}
	cols := []string{"bookings", "event_bookings", "dining_bookings", "play_bookings"}
	for _, col := range cols {
		cursor, err := config.GetDB().Collection(col).Find(ctx, filter)
		if err != nil {
			continue
		}
		var rows []Booking
		cursor.All(ctx, &rows)
		cursor.Close(ctx)
		allBookings = append(allBookings, rows...)
	}
	return c.JSON(allBookings)
}

func GetUserDetails(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid user id"})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var u models.User
	if err := config.GetDB().Collection("users").FindOne(ctx, bson.M{"_id": id}).Decode(&u); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "user not found"})
	}

	var profile models.Profile
	profileErr := config.GetDB().Collection("profiles").FindOne(ctx, bson.M{"userId": id}).Decode(&profile)

	type Booking struct {
		ID          string                 `json:"id"`
		Type        string                 `json:"type"`
		EntityName  string                 `json:"entityName"`
		Status      string                 `json:"status"`
		BookingDate string                 `json:"bookingDate"`
		Amount      *int                   `json:"amount,omitempty"`
		CreatedAt   string                 `json:"createdAt"`
		Metadata    map[string]interface{} `json:"metadata"`
	}

	allBookings := []Booking{}

	filter := bson.M{"$or": []bson.M{
		{"user_id": id.Hex()},
		{"user_phone": u.Phone},
	}}
	if profileErr == nil && profile.Email != "" {
		filter["$or"] = append(filter["$or"].([]bson.M), bson.M{"user_email": profile.Email})
	}

	// 1. Generic Bookings
	cursor, _ := config.GetDB().Collection("bookings").Find(ctx, filter)
	var genericBookings []map[string]interface{}
	if cursor.All(ctx, &genericBookings) == nil {
		for _, b := range genericBookings {
			id, _ := b["_id"].(primitive.ObjectID)
			name, _ := b["event_name"].(string)
			status, _ := b["status"].(string)
			bookedAt, _ := b["booked_at"].(time.Time)
			total, _ := b["grand_total"].(float64)
			amt := int(total)
			allBookings = append(allBookings, Booking{
				ID:          id.Hex(),
				Type:        "event",
				EntityName:  name,
				Status:      status,
				BookingDate: bookedAt.Format("02 Jan 2006"),
				Amount:      &amt,
				CreatedAt:   bookedAt.Format("2006-01-02T15:04:05Z"),
				Metadata:    b,
			})
		}
	}

	// 2. Dining Bookings
	cursor, _ = config.GetDB().Collection("dining_bookings").Find(ctx, filter)
	var diningBookings []map[string]interface{}
	if cursor.All(ctx, &diningBookings) == nil {
		for _, b := range diningBookings {
			id, _ := b["_id"].(primitive.ObjectID)
			name, _ := b["venue_name"].(string)
			status, _ := b["status"].(string)
			date, _ := b["date"].(string)
			timeSlot, _ := b["time_slot"].(string)
			var amt *int
			if a, ok := b["amount"].(int32); ok {
				val := int(a)
				amt = &val
			} else if a, ok := b["amount"].(int64); ok {
				val := int(a)
				amt = &val
			} else if a, ok := b["amount"].(int); ok {
				amt = &a
			}

			allBookings = append(allBookings, Booking{
				ID:          id.Hex(),
				Type:        "dining",
				EntityName:  name,
				Status:      status,
				BookingDate: date + " " + timeSlot,
				Amount:      amt,
				CreatedAt:   id.Timestamp().Format("2006-01-02T15:04:05Z"),
				Metadata:    b,
			})
		}
	}

	// 3. Event Bookings
	cursor, _ = config.GetDB().Collection("event_bookings").Find(ctx, filter)
	var eventBookings []map[string]interface{}
	if cursor.All(ctx, &eventBookings) == nil {
		for _, b := range eventBookings {
			id, _ := b["_id"].(primitive.ObjectID)
			name, _ := b["event_name"].(string)
			status, _ := b["status"].(string)
			date, _ := b["date"].(string)
			var amt *int
			if a, ok := b["amount"].(int32); ok {
				val := int(a)
				amt = &val
			} else if a, ok := b["amount"].(int64); ok {
				val := int(a)
				amt = &val
			} else if a, ok := b["amount"].(int); ok {
				amt = &a
			}

			allBookings = append(allBookings, Booking{
				ID:          id.Hex(),
				Type:        "event",
				EntityName:  name,
				Status:      status,
				BookingDate: date,
				Amount:      amt,
				CreatedAt:   id.Timestamp().Format("2006-01-02T15:04:05Z"),
				Metadata:    b,
			})
		}
	}

	// 4. Play Bookings
	cursor, _ = config.GetDB().Collection("play_bookings").Find(ctx, filter)
	var playBookings []map[string]interface{}
	if cursor.All(ctx, &playBookings) == nil {
		for _, b := range playBookings {
			id, _ := b["_id"].(primitive.ObjectID)
			name, _ := b["venue_name"].(string)
			status, _ := b["status"].(string)
			date, _ := b["date"].(string)
			var amt *int
			if a, ok := b["amount"].(int32); ok {
				val := int(a)
				amt = &val
			} else if a, ok := b["amount"].(int64); ok {
				val := int(a)
				amt = &val
			} else if a, ok := b["amount"].(int); ok {
				amt = &a
			}

			allBookings = append(allBookings, Booking{
				ID:          id.Hex(),
				Type:        "play",
				EntityName:  name,
				Status:      status,
				BookingDate: date,
				Amount:      amt,
				CreatedAt:   id.Timestamp().Format("2006-01-02T15:04:05Z"),
				Metadata:    b,
			})
		}
	}

	for i := 0; i < len(allBookings); i++ {
		for j := i + 1; j < len(allBookings); j++ {
			if allBookings[i].CreatedAt < allBookings[j].CreatedAt {
				allBookings[i], allBookings[j] = allBookings[j], allBookings[i]
			}
		}
	}

	response := fiber.Map{
		"id":        u.ID.Hex(),
		"name":      u.Name,
		"phone":     u.Phone,
		"createdAt": u.CreatedAt,
		"bookings":  allBookings,
	}

	if profileErr == nil {
		response["email"] = profile.Email
		response["profilePhoto"] = profile.ProfilePhoto
	}

	return c.JSON(response)
}

func GetUserStats(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid user id"})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var u models.User
	if err := config.GetDB().Collection("users").FindOne(ctx, bson.M{"_id": id}).Decode(&u); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "user not found"})
	}

	var profile models.Profile
	profileErr := config.GetDB().Collection("profiles").FindOne(ctx, bson.M{"userId": id}).Decode(&profile)

	filter := bson.M{"$or": []bson.M{
		{"user_id": id.Hex()},
		{"user_phone": u.Phone},
	}}
	if profileErr == nil && profile.Email != "" {
		filter["$or"] = append(filter["$or"].([]bson.M), bson.M{"user_email": profile.Email})
	}

	eventBookingsCount, _ := config.GetDB().Collection("event_bookings").CountDocuments(ctx, filter)
	eventCount, _ := config.GetDB().Collection("bookings").CountDocuments(ctx, filter)
	diningCount, _ := config.GetDB().Collection("dining_bookings").CountDocuments(ctx, filter)
	playCount, _ := config.GetDB().Collection("play_bookings").CountDocuments(ctx, filter)
	return c.JSON(fiber.Map{
		"events": eventCount + eventBookingsCount,
		"dining": diningCount,
		"play":   playCount,
	})
}
