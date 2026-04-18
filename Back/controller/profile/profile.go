package profile

import (
	"context"
	"ticpin-backend/config"
	"ticpin-backend/models"
	profilesvc "ticpin-backend/services/profile"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
)

func CreateProfile(c *fiber.Ctx) error {
	var p models.Profile
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if err := profilesvc.Create(&p); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(p)
}

func GetProfile(c *fiber.Ctx) error {
	p, err := profilesvc.GetByUserID(c.Params("userId"))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "profile not found"})
	}
	return c.JSON(p)
}

func UpdateProfile(c *fiber.Ctx) error {
	var p models.Profile
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if err := profilesvc.Update(c.Params("userId"), &p); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "profile updated"})
}

func UploadProfilePhoto(c *fiber.Ctx) error {
	userID := c.Params("userId")

	file, err := c.FormFile("photo")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "photo required"})
	}

	src, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer src.Close()

	photoURL, err := profilesvc.UploadPhoto(src, userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "upload failed"})
	}

	if err := profilesvc.UpdatePhoto(userID, photoURL); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"url": photoURL})
}
func LookupProfile(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "email query parameter required"})
	}

	p, err := profilesvc.GetByEmail(email)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "profile not found"})
	}
	return c.JSON(p)
}

func CheckEmailExists(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "email query parameter required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var result struct {
		Exists      bool   `json:"exists"`
		IsUser      bool   `json:"isUser"`
		IsOrganizer bool   `json:"isOrganizer"`
		UserID      string `json:"userId,omitempty"`
	}

	// Check profiles (User account)
	colProfiles := config.GetDB().Collection("profiles")
	var profile models.Profile
	errProfile := colProfiles.FindOne(ctx, bson.M{"email": email}).Decode(&profile)
	if errProfile == nil {
		result.Exists = true
		result.IsUser = true
		result.UserID = profile.UserID.Hex()
		return c.JSON(result)
	}

	// Check organizers (Organizer account)
	colOrganizers := config.GetDB().Collection("organizers")
	errOrganizer := colOrganizers.FindOne(ctx, bson.M{"email": email}).Err()
	if errOrganizer == nil {
		result.Exists = true
		result.IsOrganizer = true
		return c.JSON(result)
	}

	// Email not found in either collection
	result.Exists = false
	result.IsUser = false
	result.IsOrganizer = false
	return c.JSON(result)
}

func LookupProfilePublic(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "email query parameter required"})
	}

	p, err := profilesvc.GetByEmail(email)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "profile not found"})
	}
	return c.JSON(p)
}
