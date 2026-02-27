package play

import (
	"ticpin-backend/models"
	playservice "ticpin-backend/services/play"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateOrganizerPlay(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	orgObjID, err := primitive.ObjectIDFromHex(authOrgID)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid organizer token"})
	}

	var play models.Play
	if err := c.BodyParser(&play); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body: " + err.Error(),
		})
	}
	// Always set from JWT — never trust client-supplied organizer_id
	play.OrganizerID = orgObjID

	if play.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "play name is required",
		})
	}
	if play.Category == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "category is required",
		})
	}
	// sub_category is optional — not all sports have specific court types
	if play.City == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "city is required",
		})
	}

	if err := playservice.Create(&play); err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "play created successfully",
		"play":    play,
	})
}

func GetOrganizerPlays(c *fiber.Ctx) error {
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
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden: you can only view your own plays"})
	}

	plays, err := playservice.GetByOrganizer(organizerID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(plays)
}

func UpdateOrganizerPlay(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	playID := c.Params("id")

	var body models.Play
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body: " + err.Error(),
		})
	}
	// Always use JWT value — strip any client-supplied organizer_id
	body.OrganizerID = primitive.NilObjectID

	if err := playservice.Update(playID, authOrgID, &body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"message": "play updated successfully"})
}

func DeleteOrganizerPlay(c *fiber.Ctx) error {
	authOrgID, ok := c.Locals("organizerId").(string)
	if !ok || authOrgID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	playID := c.Params("id")

	if _, err := primitive.ObjectIDFromHex(playID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid play id",
		})
	}

	if err := playservice.Delete(playID, authOrgID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"message": "play deleted successfully"})
}
