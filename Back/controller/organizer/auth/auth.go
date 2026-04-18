package auth

import (
	"context"
	"ticpin-backend/config"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
)

func Logout(c *fiber.Ctx) error {
	config.ClearAuthCookies(c)
	return c.JSON(fiber.Map{"message": "logged out successfully"})
}

func CheckEmailExists(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "email query parameter required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var organizer struct {
		Exists      bool `json:"exists"`
		IsOrganizer bool `json:"isOrganizer"`
	}

	col := config.GetDB().Collection("organizers")
	err := col.FindOne(ctx, bson.M{"email": email}).Err()
	if err == nil {
		organizer.Exists = true
		organizer.IsOrganizer = true
	} else {
		organizer.Exists = false
		organizer.IsOrganizer = false
	}

	return c.JSON(organizer)
}
