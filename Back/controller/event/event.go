package event

import (
	eventservice "ticpin-backend/services/event"

	"github.com/gofiber/fiber/v2"
)

func GetAllEvents(c *fiber.Ctx) error {
	category := c.Query("category")
	artist := c.Query("artist")
	events, err := eventservice.GetAll(category, artist)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(events)
}

func GetEventByID(c *fiber.Ctx) error {
	e, err := eventservice.GetByID(c.Params("id"))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "event not found"})
	}
	return c.JSON(e)
}
