package mobile

import (
	"fmt"
	diningservice "ticpin-backend/services/dining"
	eventservice "ticpin-backend/services/event"
	offerservice "ticpin-backend/services/offer"
	playservice "ticpin-backend/services/play"

	"github.com/gofiber/fiber/v2"
)

func GetMobileHomeData(c *fiber.Ctx) error {

	events, _, err := eventservice.GetAll("", "", 10, "")
	if err != nil {
		events = nil
	}

	dinings, _, err := diningservice.GetAll("", 10, "")
	if err != nil {
		dinings = nil
	}

	plays, _, err := playservice.GetAll("", "approved", 10, "")
	if err != nil {
		plays = nil
	}

	return c.JSON(fiber.Map{
		"events":  events,
		"dinings": dinings,
		"plays":   plays,
	})
}

func GetEventDetails(c *fiber.Ctx) error {
	id := c.Params("id")
	event, err := eventservice.GetByID(id, false)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "event not found"})
	}

	offers, _ := offerservice.GetForEntity("event", event.ID.Hex())

	return c.JSON(fiber.Map{
		"event":  event,
		"offers": offers,
	})
}

func GetDiningDetails(c *fiber.Ctx) error {
	id := c.Params("id")
	fmt.Printf("Fetching mobile dining details for: %s\n", id)
	dining, err := diningservice.GetByID(id, false)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "dining not found"})
	}

	offers, _ := offerservice.GetForEntity("dining", dining.ID.Hex())

	return c.JSON(fiber.Map{
		"venue":  dining,
		"offers": offers,
	})
}
