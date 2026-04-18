package otp

import (
	"ticpin-backend/services/otp"

	"github.com/gofiber/fiber/v2"
)

func SendOTP(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Category string `json:"category"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if req.Email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "email is required"})
	}

	category := req.Category
	if category == "" {
		category = "play"
	}

	if err := otp.SendOTP(req.Email, category); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to send otp"})
	}

	return c.JSON(fiber.Map{"message": "otp sent successfully"})
}

func VerifyOTP(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if req.Email == "" || req.OTP == "" {
		return c.Status(400).JSON(fiber.Map{"error": "email and otp are required"})
	}

	if err := otp.VerifyOTP(req.Email, req.OTP); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "email verified successfully"})
}
