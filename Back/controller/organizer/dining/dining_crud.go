package dining

import (
	"ticpin-backend/models"
	diningservice "ticpin-backend/services/dining"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateOrganizerDining(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	orgObjID, err := primitive.ObjectIDFromHex(authOrgID)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid organizer token"})
	}

	var dining models.Dining
	if err := c.BodyParser(&dining); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body: " + err.Error(),
		})
	}
	// Always set from JWT — never trust client-supplied organizer_id
	dining.OrganizerID = orgObjID

	if dining.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "dining name is required",
		})
	}
	if dining.Category == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "category is required",
		})
	}
	// sub_category is optional
	if dining.City == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "city is required",
		})
	}

	if err := diningservice.Create(&dining); err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "dining created successfully",
		"dining":  dining,
	})
}

func GetOrganizerDinings(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	organizerID := c.Params("organizer_id")
	if organizerID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "organizer_id is required",
		})
	}
	if authOrgID != organizerID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden: you can only view your own dinings"})
	}

	dinings, err := diningservice.GetByOrganizer(organizerID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(dinings)
}

func UpdateOrganizerDining(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	diningID := c.Params("id")

	var body models.Dining
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body: " + err.Error(),
		})
	}
	// Always use JWT value — strip any client-supplied organizer_id
	body.OrganizerID = primitive.NilObjectID

	if err := diningservice.Update(diningID, authOrgID, &body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"message": "dining updated successfully"})
}

func DeleteOrganizerDining(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	diningID := c.Params("id")

	if _, err := primitive.ObjectIDFromHex(diningID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid dining id",
		})
	}

	if err := diningservice.Delete(diningID, authOrgID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"message": "dining deleted successfully"})
}
