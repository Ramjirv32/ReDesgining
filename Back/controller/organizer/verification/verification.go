package verification

import (
	"context"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"
	organizersvc "ticpin-backend/services/organizer"
	"ticpin-backend/services/verification"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
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

	if err != nil && category != "" {
		err = config.GetDB().Collection("organizer_setups").FindOne(context.Background(), bson.M{
			"organizerId": objID,
		}).Decode(&setup)
	}

	if err != nil {
		return c.JSON(nil)
	}

	return c.JSON(setup)
}

func GetMyExistingSetup(c *fiber.Ctx) error {
	organizerID, ok := c.Locals("organizerId").(string)
	if !ok || organizerID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}
	category := c.Query("category")

	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid organizerId"})
	}

	var setup models.OrganizerSetup
	err = config.GetDB().Collection("organizer_setups").FindOne(context.Background(), bson.M{
		"organizerId": objID,
		"category":    category,
	}).Decode(&setup)

	if err != nil && category != "" {
		err = config.GetDB().Collection("organizer_setups").FindOne(context.Background(), bson.M{
			"organizerId": objID,
		}).Decode(&setup)
	}

	if err != nil {
		return c.JSON(nil)
	}
	return c.JSON(setup)
}

func GetMyStatus(c *fiber.Ctx) error {
	organizerID, ok := c.Locals("organizerId").(string)
	if !ok || organizerID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	id, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid organizerId"})
	}

	var org models.Organizer
	_ = config.GetDB().Collection("organizers").FindOne(context.Background(), bson.M{"_id": id}).Decode(&org)
	catStatus := org.CategoryStatus
	if catStatus == nil {
		catStatus = map[string]string{}
	}
	return c.JSON(fiber.Map{"categoryStatus": catStatus})
}

func SendBackupOTPHandler(c *fiber.Ctx) error {
	organizerID, ok := c.Locals("organizerId").(string)
	if !ok || organizerID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	var req struct {
		Email    string `json:"email"`
		Category string `json:"category"`
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

func VerifyPANHandler(c *fiber.Ctx) error {
	organizerID, _ := c.Locals("organizerId").(string)
	var req struct {
		PAN  string `json:"pan"`
		Name string `json:"name"`
		DOB  string `json:"dob"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if err := organizersvc.CheckPANDuplicate(req.PAN, organizerID); err != nil {
		if err.Error() == "pan_already_used" {
			return c.Status(400).JSON(fiber.Map{"error": "This PAN card is already registered by another account."})
		}
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Check if already verified with same PAN in the local DB
	if existing, err := organizersvc.GetExistingSetup(organizerID); err == nil && existing != nil {
		if existing.PAN == req.PAN && existing.PANVerified {
			return c.JSON(fiber.Map{
				"status":  "SUCCESS",
				"message": "PAN already verified",
				"data": fiber.Map{
					"status":          "VALID",
					"registered_name": existing.VerifiedName,
				},
			})
		}
	}

	result, err := verification.VerifyPAN(req.PAN, req.Name, req.DOB, organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error(), "details": result})
	}

	// Persist the verification status in the database immediately
	objID, _ := primitive.ObjectIDFromHex(organizerID)
	collection := config.GetDB().Collection("organizer_setups")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"organizerId": objID}
	update := bson.M{
		"$set": bson.M{
			"pan":          req.PAN,
			"panName":      req.Name,
			"panDOB":       req.DOB,
			"panVerified":  true,
			"verifiedName": result.Name,
			"updatedAt":    time.Now(),
		},
		"$setOnInsert": bson.M{
			"createdAt": time.Now(),
		},
	}
	opts := options.Update().SetUpsert(true)
	_, _ = collection.UpdateOne(ctx, filter, update, opts)

	return c.JSON(fiber.Map{"status": "SUCCESS", "message": "PAN verified successfully", "data": result})
}

func FetchGSTHandler(c *fiber.Ctx) error {
	organizerID, _ := c.Locals("organizerId").(string)
	pan := c.Query("pan")
	if pan == "" {
		return c.Status(400).JSON(fiber.Map{"error": "pan is required"})
	}

	result, err := verification.FetchGST(pan, organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"status": "SUCCESS", "data": result})
}
