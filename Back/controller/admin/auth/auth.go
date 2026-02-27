package auth

import (
	"os"
	"ticpin-backend/config"

	"github.com/gofiber/fiber/v2"
)

// AdminLogin authenticates an admin by email+password stored in env vars.
// POST /api/admin/login  (public — no JWT required)
func AdminLogin(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}

	adminEmail := os.Getenv("ADMIN_EMAIL")
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminEmail == "" {
		adminEmail = "23cs139@kpriet.ac.in"
	}
	if adminPassword == "" {
		adminPassword = "12345678"
	}

	if req.Email != adminEmail || req.Password != adminPassword {
		return c.Status(401).JSON(fiber.Map{"error": "invalid admin credentials"})
	}

	// Issue JWT — use a fixed admin ID ("admin") so RequireAdmin can validate the email
	if err := config.SetAuthCookies(c, "admin", adminEmail, "admin", true, nil); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to create session"})
	}
	return c.JSON(fiber.Map{"message": "admin login successful", "email": adminEmail})
}
