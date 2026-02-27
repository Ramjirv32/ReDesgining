package profile

import (
	"context"
	"ticpin-backend/config"
	"ticpin-backend/models"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CreateProfile handles profile creation.
func CreateProfile(c *fiber.Ctx) error {
	var profile models.Profile
	if err := c.BodyParser(&profile); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	_, err := config.GetDB().Collection("profiles").InsertOne(context.Background(), profile)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(profile)
}

// GetProfile fetches an organizer's profile.
func GetProfile(c *fiber.Ctx) error {
	organizerID, _ := primitive.ObjectIDFromHex(c.Params("organizerId"))
	var profile models.Profile
	err := config.GetDB().Collection("profiles").FindOne(context.Background(), bson.M{"organizerId": organizerID}).Decode(&profile)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "profile not found"})
	}
	return c.JSON(profile)
}

// UpdateProfile updates profile info.
func UpdateProfile(c *fiber.Ctx) error {
	organizerID, _ := primitive.ObjectIDFromHex(c.Params("organizerId"))
	var updates bson.M
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	delete(updates, "_id")
	delete(updates, "organizerId")

	_, err := config.GetDB().Collection("profiles").UpdateOne(
		context.Background(),
		bson.M{"organizerId": organizerID},
		bson.M{"$set": updates},
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "profile updated"})
}
