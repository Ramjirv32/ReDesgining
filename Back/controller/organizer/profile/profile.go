package profile

import (
	"context"
	"ticpin-backend/config"
	"ticpin-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateProfile(c *fiber.Ctx) error {
	organizerID, ok := c.Locals("organizerId").(string)
	if !ok || organizerID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	var profile models.OrganizerProfile
	if err := c.BodyParser(&profile); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid organizerId"})
	}

	profile.ID = primitive.NewObjectID()
	profile.OrganizerID = objID
	profile.CreatedAt = time.Now()
	profile.UpdatedAt = time.Now()

	_, err = config.GetDB().Collection("organizer_profiles").InsertOne(context.Background(), profile)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(profile)
}

func GetProfile(c *fiber.Ctx) error {
	organizerID, ok := c.Locals("organizerId").(string)
	if !ok || organizerID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid organizerId"})
	}

	var profile models.OrganizerProfile
	err = config.GetDB().Collection("organizer_profiles").FindOne(context.Background(), bson.M{"organizerId": objID}).Decode(&profile)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "profile not found"})
	}
	return c.JSON(profile)
}

func UpdateProfile(c *fiber.Ctx) error {
	organizerID, ok := c.Locals("organizerId").(string)
	if !ok || organizerID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid organizerId"})
	}

	var profile models.OrganizerProfile
	if err := c.BodyParser(&profile); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	profile.UpdatedAt = time.Now()

	_, err = config.GetDB().Collection("organizer_profiles").UpdateOne(
		context.Background(),
		bson.M{"organizerId": objID},
		bson.M{"$set": profile},
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "profile updated"})
}
