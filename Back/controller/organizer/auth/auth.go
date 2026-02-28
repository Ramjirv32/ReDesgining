package auth

import (
	"ticpin-backend/config"

	"github.com/gofiber/fiber/v2"
)

func Logout(c *fiber.Ctx) error {
	config.ClearAuthCookies(c)
	return c.JSON(fiber.Map{"message": "logged out successfully"})
}
