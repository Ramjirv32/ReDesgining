package events

import (
	"ticpin-backend/models"
	eventservice "ticpin-backend/services/event"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateOrganizerEvent(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	orgObjID, err := primitive.ObjectIDFromHex(authOrgID)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid organizer token"})
	}

	var event models.Event
	if err := c.BodyParser(&event); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body: " + err.Error(),
		})
	}
	// Always set from JWT — never trust client-supplied organizer_id
	event.OrganizerID = orgObjID

	if event.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "event name is required",
		})
	}
	if event.Category == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "category is required",
		})
	}
	// sub_category is optional — not all categories have sub-categories
	if event.City == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "city is required",
		})
	}

	if err := eventservice.Create(&event); err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "event created successfully",
		"event":   event,
	})
}

func GetOrganizerEvents(c *fiber.Ctx) error {
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
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden: you can only view your own events"})
	}

	events, err := eventservice.GetByOrganizer(organizerID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(events)
}

func UpdateOrganizerEvent(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	eventID := c.Params("id")

	var body models.Event
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body: " + err.Error(),
		})
	}
	// Always use JWT value — strip any client-supplied organizer_id
	body.OrganizerID = primitive.NilObjectID

	if err := eventservice.Update(eventID, authOrgID, &body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"message": "event updated successfully"})
}

func DeleteOrganizerEvent(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	eventID := c.Params("id")

	if _, err := primitive.ObjectIDFromHex(eventID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid event id",
		})
	}

	if err := eventservice.Delete(eventID, authOrgID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"message": "event deleted successfully"})
}
