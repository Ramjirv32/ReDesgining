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
	type Booking = map[string]interface{}
	allBookings := []Booking{}
	cols := []string{"bookings", "event_bookings", "dining_bookings", "play_bookings"}
	for _, col := range cols {
		cursor, err := config.GetDB().Collection(col).Find(ctx, bson.M{"user_email": u.Phone})
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

	type Booking = struct {
		ID          string `json:"id"`
		Type        string `json:"type"`
		EntityName  string `json:"entityName"`
		Status      string `json:"status"`
		BookingDate string `json:"bookingDate"`
		Amount      *int   `json:"amount,omitempty"`
		CreatedAt   string `json:"createdAt"`
	}

	allBookings := []Booking{}

	cursor, _ := config.GetDB().Collection("dining_bookings").Find(ctx, bson.M{"user_email": u.Phone})
	var diningBookings []struct {
		ID     primitive.ObjectID `bson:"_id"`
		Name   string             `bson:"name"`
		Status string             `bson:"status"`
		Date   string             `bson:"date"`
		Amount *int               `bson:"amount"`
		Time   string             `bson:"time"`
	}
	if cursor.All(ctx, &diningBookings) == nil {
		for _, b := range diningBookings {
			allBookings = append(allBookings, Booking{
				ID:          b.ID.Hex(),
				Type:        "dining",
				EntityName:  b.Name,
				Status:      b.Status,
				BookingDate: b.Date + " " + b.Time,
				Amount:      b.Amount,
				CreatedAt:   b.ID.Timestamp().Format("2006-01-02T15:04:05Z"),
			})
		}
	}

	cursor, _ = config.GetDB().Collection("event_bookings").Find(ctx, bson.M{"user_email": u.Phone})
	var eventBookings []struct {
		ID     primitive.ObjectID `bson:"_id"`
		Name   string             `bson:"event_name"`
		Status string             `bson:"status"`
		Date   string             `bson:"date"`
		Amount *int               `bson:"amount"`
	}
	if cursor.All(ctx, &eventBookings) == nil {
		for _, b := range eventBookings {
			allBookings = append(allBookings, Booking{
				ID:          b.ID.Hex(),
				Type:        "event",
				EntityName:  b.Name,
				Status:      b.Status,
				BookingDate: b.Date,
				Amount:      b.Amount,
				CreatedAt:   b.ID.Timestamp().Format("2006-01-02T15:04:05Z"),
			})
		}
	}

	cursor, _ = config.GetDB().Collection("play_bookings").Find(ctx, bson.M{"user_email": u.Phone})
	var playBookings []struct {
		ID     primitive.ObjectID `bson:"_id"`
		Name   string             `bson:"name"`
		Status string             `bson:"status"`
		Date   string             `bson:"date"`
		Amount *int               `bson:"amount"`
	}
	if cursor.All(ctx, &playBookings) == nil {
		for _, b := range playBookings {
			allBookings = append(allBookings, Booking{
				ID:          b.ID.Hex(),
				Type:        "play",
				EntityName:  b.Name,
				Status:      b.Status,
				BookingDate: b.Date,
				Amount:      b.Amount,
				CreatedAt:   b.ID.Timestamp().Format("2006-01-02T15:04:05Z"),
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
	eventBookingsCount, _ := config.GetDB().Collection("event_bookings").CountDocuments(ctx, bson.M{"user_email": u.Phone})
	eventCount, _ := config.GetDB().Collection("bookings").CountDocuments(ctx, bson.M{"user_email": u.Phone})
	diningCount, _ := config.GetDB().Collection("dining_bookings").CountDocuments(ctx, bson.M{"user_email": u.Phone})
	playCount, _ := config.GetDB().Collection("play_bookings").CountDocuments(ctx, bson.M{"user_email": u.Phone})
	return c.JSON(fiber.Map{
		"events": eventCount + eventBookingsCount,
		"dining": diningCount,
		"play":   playCount,
	})
}
