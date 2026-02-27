package auth

import (
	"ticpin-backend/config"

	"github.com/gofiber/fiber/v2"
)

// Logout clears the authentication cookies.
func Logout(c *fiber.Ctx) error {
	// Clears both ticpin_token and ticpin_session cookies
	config.ClearAuthCookies(c)
	return c.JSON(fiber.Map{"message": "logged out successfully"})
}
