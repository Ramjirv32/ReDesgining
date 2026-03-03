package play

import (
	playservice "ticpin-backend/services/play"

	"github.com/gofiber/fiber/v2"
)

func GetAllPlays(c *fiber.Ctx) error {
	category := c.Query("category")
	limit := c.QueryInt("limit", 20)
	after := c.Query("after")

	plays, nextCursor, err := playservice.GetAll(category, limit, after)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"data":        plays,
		"next_cursor": nextCursor,
	})
}

func GetPlayByID(c *fiber.Ctx) error {
	p, err := playservice.GetByID(c.Params("id"))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "play not found"})
	}
	return c.JSON(p)
}
