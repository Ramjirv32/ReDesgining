package adminoffer

import (
	"ticpin-backend/models"
	offersvc "ticpin-backend/services/offer"

	"github.com/gofiber/fiber/v2"
)

func CreateOffer(c *fiber.Ctx) error {
	var offer models.EventOffer
	if err := c.BodyParser(&offer); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body: " + err.Error()})
	}
	if offer.Title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "title is required"})
	}
	if offer.DiscountType != "percent" && offer.DiscountType != "flat" {
		return c.Status(400).JSON(fiber.Map{"error": "discount_type must be 'percent' or 'flat'"})
	}
	if offer.DiscountValue <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "discount_value must be > 0"})
	}
	if offer.AppliesTo == "" {
		return c.Status(400).JSON(fiber.Map{"error": "applies_to is required (event, play, dining)"})
	}
	if len(offer.EntityIDs) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "entity_ids is required: select at least one listing"})
	}
	offer.IsActive = true
	if err := offersvc.Create(&offer); err != nil {
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
