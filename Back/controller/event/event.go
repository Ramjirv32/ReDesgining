package event

import (
	"net/url"
	eventservice "ticpin-backend/services/event"

	"github.com/gofiber/fiber/v2"
)

func GetAllEvents(c *fiber.Ctx) error {
	category := c.Query("category")
	artist := c.Query("artist")
	limit, _ := c.ParamsInt("limit", 20)
	if l := c.QueryInt("limit"); l > 0 {
		limit = l
	}
	after := c.Query("after")

	events, nextCursor, err := eventservice.GetAll(category, artist, limit, after)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data":        events,
		"next_cursor": nextCursor,
	})
}

func GetEventByID(c *fiber.Ctx) error {
	id := c.Params("id")
	// Robustly decode the ID to handle single or double encoding (e.g. %20 or %2520)
	for {
		decoded, err := url.PathUnescape(id)
		if err != nil || decoded == id {
			break
		}
		id = decoded
	}
	bypass := c.Query("bypassCache") == "true"
	e, err := eventservice.GetByID(id, bypass)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "event not found"})
	}
	return c.JSON(e)
}
