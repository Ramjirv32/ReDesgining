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

// GetVerificationStatus returns the general status.
func GetVerificationStatus(c *fiber.Ctx) error {
	id, _ := primitive.ObjectIDFromHex(c.Params("id"))
	var org models.Organizer
	_ = config.GetDB().Collection("organizers").FindOne(context.Background(), bson.M{"_id": id}).Decode(&org)
	return c.JSON(fiber.Map{"status": org.IsVerified})
}

// GetCategoryStatus returns status for a specific vertical.
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

// GetExistingSetupHandler fetches existing setup data for an organizer.
func GetExistingSetupHandler(c *fiber.Ctx) error {
	organizerID := c.Query("organizerId")
	category := c.Query("category")
	if organizerID == "" || category == "" {
		return c.Status(400).JSON(fiber.Map{"error": "organizerId and category required"})
	}

	objID, _ := primitive.ObjectIDFromHex(organizerID)
	var setup models.OrganizerSetup
	err := config.GetDB().Collection("organizer_setups").FindOne(context.Background(), bson.M{
		"organizerId": objID,
		"category":    category,
	}).Decode(&setup)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "setup not found"})
	}
	return c.JSON(setup)
}

// SendBackupOTPHandler sends OTP to backup email/phone for verification changes.
func SendBackupOTPHandler(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
		Type  string `json:"type"` // "dining" | "events" | "play"
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if err := organizersvc.SendOTP(req.Email, req.Type); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to send otp"})
	}
	return c.JSON(fiber.Map{"message": "otp sent to " + req.Email})
}

// VerifyBackupOTPHandler verifies the backup OTP.
func VerifyBackupOTPHandler(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	_, err := organizersvc.VerifyOTP(req.Email, req.OTP)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid otp"})
	}
	return c.JSON(fiber.Map{"message": "otp verified"})
}
