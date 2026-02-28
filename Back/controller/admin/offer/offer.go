package adminoffer

import (
	"context"
	"fmt"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"
	offersvc "ticpin-backend/services/offer"

	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateOffer(c *fiber.Ctx) error {
	title := c.FormValue("title")
	description := c.FormValue("description")
	discountTypeStr := c.FormValue("discount_type")
	discountValueStr := c.FormValue("discount_value")
	appliesTo := c.FormValue("applies_to")
	validUntil := c.FormValue("valid_until")

	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid form data: " + err.Error()})
	}
	entityIDs := form.Value["entity_ids"]

	if title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "title is required"})
	}
	if discountTypeStr != "percent" && discountTypeStr != "flat" {
		return c.Status(400).JSON(fiber.Map{"error": "discount_type must be 'percent' or 'flat'"})
	}

	var discountValue float64
	_, err = fmt.Sscanf(discountValueStr, "%f", &discountValue)
	if err != nil || discountValue <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "discount_value must be a number > 0"})
	}

	if appliesTo == "" {
		return c.Status(400).JSON(fiber.Map{"error": "applies_to is required (event, play, dining)"})
	}
	if len(entityIDs) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "entity_ids is required: select at least one listing"})
	}
	if validUntil == "" {
		return c.Status(400).JSON(fiber.Map{"error": "valid_until is required"})
	}

	validUntilTime, err := time.Parse(time.RFC3339, validUntil)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid valid_until date format"})
	}
	var imageURL string
	fileHeader, err := c.FormFile("image")
	if err == nil && fileHeader != nil {
		file, err := fileHeader.Open()
		if err == nil {
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
					Folder: "ticpin/offers",
				})
				attemptCancel()

				if uploadErr == nil {
					break
				}
			}

			if uploadErr == nil {
				imageURL = resp.SecureURL
			}
		}
	}

	var entityObjIDs []primitive.ObjectID
	for _, id := range entityIDs {
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid entity_id: " + id})
		}
		entityObjIDs = append(entityObjIDs, objID)
	}

	offer := &models.EventOffer{
		ID:            primitive.NewObjectID(),
		Title:         title,
		Description:   description,
		Image:         imageURL,
		DiscountType:  discountTypeStr,
		DiscountValue: discountValue,
		AppliesTo:     appliesTo,
		EntityIDs:     entityObjIDs,
		ValidUntil:    validUntilTime,
		IsActive:      true,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := offersvc.Create(offer); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(fiber.Map{"message": "offer created", "offer": offer})
}

func ListOffers(c *fiber.Ctx) error {
	offers, err := offersvc.GetAll()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(offers)
}

func GetEventOffers(c *fiber.Ctx) error {
	eventID := c.Params("id")
	offers, err := offersvc.GetForEntity("event", eventID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(offers)
}

func GetDiningOffers(c *fiber.Ctx) error {
	diningID := c.Params("id")
	offers, err := offersvc.GetForEntity("dining", diningID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(offers)
}

func GetPlayOffers(c *fiber.Ctx) error {
	playID := c.Params("id")
	offers, err := offersvc.GetForEntity("play", playID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(offers)
}
func GetOffersByCategory(c *fiber.Ctx) error {
	category := c.Params("category")
	offers, err := offersvc.GetByCategory(category)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(offers)
}

func UpdateOffer(c *fiber.Ctx) error {
	id := c.Params("id")
	title := c.FormValue("title")
	description := c.FormValue("description")
	discountTypeStr := c.FormValue("discount_type")
	discountValueStr := c.FormValue("discount_value")
	appliesTo := c.FormValue("applies_to")
	validUntil := c.FormValue("valid_until")
	isActiveStr := c.FormValue("is_active")

	form, _ := c.MultipartForm()
	entityIDs := []string{}
	if form != nil {
		entityIDs = form.Value["entity_ids"]
	}

	var discountValue float64
	fmt.Sscanf(discountValueStr, "%f", &discountValue)

	validUntilTime, _ := time.Parse(time.RFC3339, validUntil)

	var imageURL string
	fileHeader, err := c.FormFile("image")
	if err == nil && fileHeader != nil {
		file, err := fileHeader.Open()
		if err == nil {
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
					Folder: "ticpin/offers",
				})
				attemptCancel()
				if uploadErr == nil {
					break
				}
			}
			if uploadErr == nil {
				imageURL = resp.SecureURL
			}
		}
	}

	var entityObjIDs []primitive.ObjectID
	for _, eid := range entityIDs {
		objID, _ := primitive.ObjectIDFromHex(eid)
		entityObjIDs = append(entityObjIDs, objID)
	}

	offer := &models.EventOffer{
		Title:         title,
		Description:   description,
		DiscountType:  discountTypeStr,
		DiscountValue: discountValue,
		AppliesTo:     appliesTo,
		EntityIDs:     entityObjIDs,
		ValidUntil:    validUntilTime,
		IsActive:      isActiveStr == "true" || isActiveStr == "", // default to active if not specified
		UpdatedAt:     time.Now(),
	}
	if imageURL != "" {
		offer.Image = imageURL
	}

	if err := offersvc.Update(id, offer); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "offer updated"})
}

func DeleteOffer(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := offersvc.Delete(id); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "offer deleted"})
}
