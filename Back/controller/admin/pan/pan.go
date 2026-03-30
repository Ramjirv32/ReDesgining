package panctrl

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GetPANCard generates a signed URL for viewing PAN card (admin only)
func GetPANCard(c *fiber.Ctx) error {
	// Get organizer ID from params
	organizerID := c.Params("id")
	if organizerID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Organizer ID is required",
		})
	}

	// Check if user is admin
	role := c.Locals("role").(string)
	if role != "admin" {
		return c.Status(403).JSON(fiber.Map{
			"error": "Access denied. Admin only.",
		})
	}

	// Get organizer from database
	organizersCol := config.GetDB().Collection("organizers")
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid organizer ID",
		})
	}

	var organizer models.Organizer
	err = organizersCol.FindOne(c.Context(), bson.M{"_id": objID}).Decode(&organizer)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Organizer not found",
		})
	}

	// Check if PAN card exists
	if organizer.PANCardPublicID == "" && organizer.PANCardURL == "" {
		return c.Status(404).JSON(fiber.Map{
			"error": "PAN card not uploaded",
		})
	}

	// Generate signed URL (valid for 5 minutes) or use legacy URL
	var signedURL string
	if organizer.PANCardPublicID != "" {
		signedURL, err = config.GenerateSignedPANURL(organizer.PANCardPublicID, 5)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to generate signed URL",
			})
		}
	} else {
		// Legacy fallback
		signedURL = organizer.PANCardURL
	}

	// Infer status if empty
	status := organizer.PANCardStatus
	if status == "" && (organizer.PANCardPublicID != "" || organizer.PANCardURL != "") {
		status = "uploaded"
	}

	return c.JSON(fiber.Map{
		"url":            signedURL,
		"expires_in":     5 * 60, // 5 minutes in seconds
		"organizer_name": organizer.Name,
		"uploaded_at":    organizer.PANCardUploadedAt,
		"status":         status,
		"is_legacy":      organizer.PANCardPublicID == "",
	})
}

// UploadPANCard handles PAN card upload for organizers
func UploadPANCard(c *fiber.Ctx) error {
	// Get organizer ID from params
	organizerID := c.Params("id")
	if organizerID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Organizer ID is required",
		})
	}

	// Check if user is admin
	role := c.Locals("role").(string)
	if role != "admin" {
		return c.Status(403).JSON(fiber.Map{
			"error": "Access denied. Admin only.",
		})
	}

	// Get file from form
	file, err := c.FormFile("pan_card")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "No file uploaded",
		})
	}

	// Validate file type
	if !isValidImageType(file.Filename) {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid file type. Only JPG, PNG, and PDF files are allowed",
		})
	}

	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		return c.Status(400).JSON(fiber.Map{
			"error": "File too large. Maximum size is 5MB",
		})
	}

	// Save file temporarily
	tempFilePath := filepath.Join("/tmp", fmt.Sprintf("pan_%s_%d", organizerID, time.Now().Unix()))
	err = c.SaveFile(file, tempFilePath)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to save file",
		})
	}
	defer os.Remove(tempFilePath) // Clean up

	// Upload to Cloudinary as authenticated
	result, err := config.UploadPANCard(tempFilePath, organizerID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to upload PAN card",
		})
	}

	// Update organizer in database
	organizersCol := config.GetDB().Collection("organizers")
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid organizer ID",
		})
	}

	update := bson.M{
		"$set": bson.M{
			"pan_card_public_id":   result.PublicID,
			"pan_card_uploaded_at": time.Now(),
			"pan_card_status":      "uploaded",
			"updated_at":           time.Now(),
		},
	}

	_, err = organizersCol.UpdateOne(c.Context(), bson.M{"_id": objID}, update)
	if err != nil {
		// Delete from Cloudinary if database update fails
		config.DeletePANCard(result.PublicID)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update organizer record",
		})
	}

	// Also update all organizer_setups to show the PAN card button
	setupsCol := config.GetDB().Collection("organizer_setups")
	_, _ = setupsCol.UpdateMany(c.Context(), bson.M{"organizerId": objID}, bson.M{
		"$set": bson.M{
			"panCardUrl": result.PublicID,
		},
	})

	return c.JSON(fiber.Map{
		"message":     "PAN card uploaded successfully",
		"public_id":   result.PublicID,
		"uploaded_at": time.Now(),
	})
}

// DeletePANCard deletes PAN card (admin only)
func DeletePANCard(c *fiber.Ctx) error {
	// Get organizer ID from params
	organizerID := c.Params("id")
	if organizerID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Organizer ID is required",
		})
	}

	// Check if user is admin
	role := c.Locals("role").(string)
	if role != "admin" {
		return c.Status(403).JSON(fiber.Map{
			"error": "Access denied. Admin only.",
		})
	}

	// Get organizer from database
	organizersCol := config.GetDB().Collection("organizers")
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid organizer ID",
		})
	}

	var organizer models.Organizer
	err = organizersCol.FindOne(c.Context(), bson.M{"_id": objID}).Decode(&organizer)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Organizer not found",
		})
	}

	// Determine what to delete
	publicID := organizer.PANCardPublicID
	isLegacy := false
	if publicID == "" {
		if organizer.PANCardURL == "" {
			return c.Status(404).JSON(fiber.Map{
				"error": "PAN card not found",
			})
		}
		// Attempt to extract Public ID from legacy URL
		// Example: https://res.cloudinary.com/.../upload/v12345/ticpin/pan/filename.jpg
		urlParts := strings.Split(organizer.PANCardURL, "/upload/")
		if len(urlParts) > 1 {
			// Get everything after /upload/ (e.g., v12345/ticpin/pan/filename.jpg)
			path := urlParts[1]
			// Remove version/ if exists
			if strings.HasPrefix(path, "v") {
				firstSlash := strings.Index(path, "/")
				if firstSlash != -1 {
					path = path[firstSlash+1:]
				}
			}
			// Remove extension
			lastDot := strings.LastIndex(path, ".")
			if lastDot != -1 {
				publicID = path[:lastDot]
			} else {
				publicID = path
			}
			isLegacy = true
		}
	}

	// Delete from Cloudinary if we have a public ID
	if publicID != "" {
		err = config.DeletePANCard(publicID)
		if err != nil {
			fmt.Printf("Warning: Could not delete from Cloudinary: %v\n", err)
		}
	}

	// Update database
	update := bson.M{
		"$set": bson.M{
			"pan_card_public_id":   "",
			"pan_card_uploaded_at": nil,
			"pan_card_status":      "deleted",
			"panCardUrl":           "", // Clear legacy URL too
			"updated_at":           time.Now(),
		},
	}

	_, err = organizersCol.UpdateOne(c.Context(), bson.M{"_id": objID}, update)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update organizer record",
		})
	}

	// Also clear from all organizer_setups
	setupsCol := config.GetDB().Collection("organizer_setups")
	_, _ = setupsCol.UpdateMany(c.Context(), bson.M{"organizerId": objID}, bson.M{
		"$set": bson.M{
			"panCardUrl": "",
		},
	})

	message := "PAN card deleted successfully"
	if isLegacy {
		message = "Legacy PAN card deleted successfully"
	}

	return c.JSON(fiber.Map{
		"message": message,
	})
}

// SecureLegacyPANCard migrates a legacy public PAN card to authenticated storage
func SecureLegacyPANCard(c *fiber.Ctx) error {
	organizerID := c.Params("id")
	if organizerID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "id required"})
	}

	// Check if user is admin
	role := c.Locals("role").(string)
	if role != "admin" {
		return c.Status(403).JSON(fiber.Map{"error": "admin only"})
	}

	objID, _ := primitive.ObjectIDFromHex(organizerID)
	organizersCol := config.GetDB().Collection("organizers")

	var organizer models.Organizer
	err := organizersCol.FindOne(c.Context(), bson.M{"_id": objID}).Decode(&organizer)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "not found"})
	}

	if organizer.PANCardURL == "" {
		return c.Status(400).JSON(fiber.Map{"error": "no legacy pan card found"})
	}

	// 1. Upload to Cloudinary using the URL as source (Type: authenticated)
	// We'll use the same folder and format as new uploads
	result, err := config.UploadPANCard(organizer.PANCardURL, organizerID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "migration failed during upload"})
	}

	// 2. Extract old public ID to delete if possible
	oldPublicID := ""
	urlParts := strings.Split(organizer.PANCardURL, "/upload/")
	if len(urlParts) > 1 {
		path := urlParts[1]
		if strings.HasPrefix(path, "v") {
			if firstSlash := strings.Index(path, "/"); firstSlash != -1 {
				path = path[firstSlash+1:]
			}
		}
		if lastDot := strings.LastIndex(path, "."); lastDot != -1 {
			oldPublicID = path[:lastDot]
		} else {
			oldPublicID = path
		}
	}

	// 3. Delete old public version
	if oldPublicID != "" {
		config.DeletePANCard(oldPublicID)
	}

	// 4. Update database
	update := bson.M{
		"$set": bson.M{
			"pan_card_public_id":   result.PublicID,
			"pan_card_uploaded_at": time.Now(),
			"pan_card_status":      "uploaded",
			"panCardUrl":           result.PublicID, // Set to ID for consistency
			"updated_at":           time.Now(),
		},
	}

	organizersCol.UpdateOne(c.Context(), bson.M{"_id": objID}, update)
	
	// Also update all organizer_setups
	setupsCol := config.GetDB().Collection("organizer_setups")
	setupsCol.UpdateMany(c.Context(), bson.M{"organizerId": objID}, bson.M{
		"$set": bson.M{"panCardUrl": result.PublicID},
	})

	return c.JSON(fiber.Map{
		"message":   "PAN card secured successfully",
		"public_id": result.PublicID,
	})
}

// isValidImageType checks if the file type is allowed
func isValidImageType(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	allowedExts := []string{".jpg", ".jpeg", ".png", ".pdf"}

	for _, allowedExt := range allowedExts {
		if ext == allowedExt {
			return true
		}
	}
	return false
}
