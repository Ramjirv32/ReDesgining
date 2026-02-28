package media

import (
	"context"
	"ticpin-backend/config"
	"ticpin-backend/models"
	"time"

	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func UploadPANCard(c *fiber.Ctx) error {
	organizerID, ok := c.Locals("organizerId").(string)
	if !ok || organizerID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "organizerId not found in context"})
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "file required"})
	}

	file, err := fileHeader.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to open file"})
	}
	defer file.Close()

	var resp *uploader.UploadResult
	var uploadErr error
	for i := 0; i < 3; i++ {
		if i > 0 {
			file.Seek(0, 0)
			time.Sleep(2 * time.Second)
		}

		attemptCtx, attemptCancel := context.WithTimeout(context.Background(), 120*time.Second)
		resp, uploadErr = config.GetCloudinary().Upload.Upload(attemptCtx, file, uploader.UploadParams{
			Folder: "ticpin/pan",
		})
		attemptCancel()

		if uploadErr == nil {
			break
		}
	}

	if uploadErr != nil {
		return c.Status(500).JSON(fiber.Map{"error": "upload failed after retries: " + uploadErr.Error()})
	}

	url := resp.SecureURL

	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid organizerId"})
	}

	_, err = config.GetDB().Collection("organizers").UpdateOne(
		context.Background(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"panCardUrl": url}},
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "database update failed"})
	}

	return c.JSON(fiber.Map{"url": url})
}

func UploadMedia(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "file required"})
	}

	file, err := fileHeader.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to open file"})
	}
	defer file.Close()

	organizerID := c.FormValue("organizerId")
	if organizerID == "" {
		if val, ok := c.Locals("organizerId").(string); ok {
			organizerID = val
		}
	}

	var resp *uploader.UploadResult
	var uploadErr error
	for i := 0; i < 3; i++ {
		if i > 0 {
			file.Seek(0, 0)
			time.Sleep(2 * time.Second)
		}

		attemptCtx, attemptCancel := context.WithTimeout(context.Background(), 120*time.Second)
		resp, uploadErr = config.GetCloudinary().Upload.Upload(attemptCtx, file, uploader.UploadParams{
			Folder: "ticpin/media",
		})
		attemptCancel()

		if uploadErr == nil {
			break
		}
	}

	if uploadErr != nil {
		return c.Status(500).JSON(fiber.Map{"error": "upload failed after retries: " + uploadErr.Error()})
	}

	url := resp.SecureURL

	if organizerID != "" {
		objID, err := primitive.ObjectIDFromHex(organizerID)
		if err == nil {
			_, _ = config.GetDB().Collection("play").InsertOne(context.Background(), bson.M{
				"organizer_id": objID,
				"url":          url,
				"type":         "media_upload",
				"filename":     fileHeader.Filename,
				"mime_type":    fileHeader.Header.Get("Content-Type"),
				"createdAt":    time.Now(),
			})
		}
	}

	return c.JSON(fiber.Map{"url": url})
}

func GetOrganizerMe(c *fiber.Ctx) error {
	organizerID, ok := c.Locals("organizerId").(string)
	if !ok || organizerID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}

	var org models.Organizer
	err = config.GetDB().Collection("organizers").FindOne(context.Background(), bson.M{"_id": objID}).Decode(&org)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "organizer not found"})
	}

	return c.JSON(org)
}
