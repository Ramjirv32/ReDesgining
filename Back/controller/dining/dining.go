package dining

import (
	diningservice "ticpin-backend/services/dining"

	"github.com/gofiber/fiber/v2"
)

func GetAllDinings(c *fiber.Ctx) error {
	dinings, err := diningservice.GetAll()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(dinings)
}

func GetDiningByID(c *fiber.Ctx) error {
	d, err := diningservice.GetByID(c.Params("id"))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "dining not found"})
	}
	return c.JSON(d)
}
