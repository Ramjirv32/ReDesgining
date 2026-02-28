package adminnotification

import (
	"ticpin-backend/models"
	notificationsvc "ticpin-backend/services/notification"

	"github.com/gofiber/fiber/v2"
)

func SendNotification(c *fiber.Ctx) error {
	var n models.Notification
	if err := c.BodyParser(&n); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	if n.Title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "title is required"})
	}

	if err := notificationsvc.Send(&n); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "notification sent and saved", "notification": n})
}

func ListNotifications(c *fiber.Ctx) error {
	list, err := notificationsvc.GetAll()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(list)
}
