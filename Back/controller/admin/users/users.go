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
	cols := []string{"bookings", "dining_bookings", "play_bookings"}
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
	eventCount, _ := config.GetDB().Collection("bookings").CountDocuments(ctx, bson.M{"user_email": u.Phone})
	diningCount, _ := config.GetDB().Collection("dining_bookings").CountDocuments(ctx, bson.M{"user_email": u.Phone})
	playCount, _ := config.GetDB().Collection("play_bookings").CountDocuments(ctx, bson.M{"user_email": u.Phone})
	return c.JSON(fiber.Map{
		"events": eventCount,
		"dining": diningCount,
		"play":   playCount,
	})
}
