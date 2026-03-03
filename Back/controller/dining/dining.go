package dining

import (
	diningservice "ticpin-backend/services/dining"

	"github.com/gofiber/fiber/v2"
)

func GetAllDinings(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	after := c.Query("after")

	dinings, nextCursor, err := diningservice.GetAll(limit, after)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"data":        dinings,
		"next_cursor": nextCursor,
	})
}

func GetDiningByID(c *fiber.Ctx) error {
	bypass := c.Query("bypassCache") == "true"
	d, err := diningservice.GetByID(c.Params("id"), bypass)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "dining not found"})
	}
	return c.JSON(d)
}
