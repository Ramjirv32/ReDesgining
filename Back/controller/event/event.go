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

	// Decode URL-encoded event name
	decodedId, err := url.QueryUnescape(id)
	if err != nil {
		decodedId = id
	}

	event, err := eventservice.GetByID(decodedId, false)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Event not found"})
	}

	return c.Status(fiber.StatusOK).JSON(event)
}

func GetEventAvailability(c *fiber.Ctx) error {
	eventId := c.Params("id")

	// Decode URL-encoded event name
	decodedId, err := url.QueryUnescape(eventId)
	if err != nil {
		decodedId = eventId
	}

	// For now, return empty availability - this can be enhanced later
	availability := map[string]interface{}{
		"booked":  map[string]int{},
		"total":   map[string]int{},
		"eventId": decodedId, // Use the decodedId to avoid unused variable error
	}

	return c.Status(fiber.StatusOK).JSON(availability)
}

func GetEventOffers(c *fiber.Ctx) error {
	eventId := c.Params("id")

	// Decode URL-encoded event name
	decodedId, err := url.QueryUnescape(eventId)
	if err != nil {
		decodedId = eventId
	}

	offers, _ := eventservice.GetEventOffers(decodedId)

	return c.Status(fiber.StatusOK).JSON(offers)
}
