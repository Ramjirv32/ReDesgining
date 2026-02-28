package verification

import (
	"context"
	"ticpin-backend/config"
	"ticpin-backend/models"
	organizersvc "ticpin-backend/services/organizer"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetVerificationStatus(c *fiber.Ctx) error {
	id, _ := primitive.ObjectIDFromHex(c.Params("id"))
	var org models.Organizer
	_ = config.GetDB().Collection("organizers").FindOne(context.Background(), bson.M{"_id": id}).Decode(&org)
	return c.JSON(fiber.Map{"status": org.IsVerified})
}

func GetCategoryStatus(c *fiber.Ctx) error {
	id, _ := primitive.ObjectIDFromHex(c.Params("id"))
	cat := c.Params("category")
	var org models.Organizer
	_ = config.GetDB().Collection("organizers").FindOne(context.Background(), bson.M{"_id": id}).Decode(&org)
	status := "none"
	if org.CategoryStatus != nil {
		if s, ok := org.CategoryStatus[cat]; ok {
			status = s
		}
	}
	return c.JSON(fiber.Map{"category": cat, "status": status})
}

func GetExistingSetupHandler(c *fiber.Ctx) error {
	organizerID := c.Params("id")
	category := c.Query("category")
	if category == "" {
		category = "dining"
	}
	if organizerID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "organizerId required"})
	}

	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid organizerId format"})
	}
	var setup models.OrganizerSetup
	err = config.GetDB().Collection("organizer_setups").FindOne(context.Background(), bson.M{
		"organizerId": objID,
		"category":    category,
	}).Decode(&setup)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "setup not found"})
	}
	return c.JSON(setup)
}

func SendBackupOTPHandler(c *fiber.Ctx) error {
	organizerID, ok := c.Locals("organizerId").(string)
	if !ok || organizerID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	var req struct {
		Email    string `json:"email"`
		Category string `json:"category"` // "dining" | "events" | "play"
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if err := organizersvc.SendBackupOTP(organizerID, req.Email, req.Category); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to send otp"})
	}
	return c.JSON(fiber.Map{"message": "otp sent to " + req.Email})
}

func VerifyBackupOTPHandler(c *fiber.Ctx) error {
	organizerID, ok := c.Locals("organizerId").(string)
	if !ok || organizerID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	var req struct {
		OTP string `json:"otp"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if req.OTP == "" {
		return c.Status(400).JSON(fiber.Map{"error": "otp is required"})
	}

	err := organizersvc.VerifyBackupOTP(organizerID, req.OTP)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "backup otp verified"})
}
