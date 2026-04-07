package verification

import (
	"ticpin-backend/services/verification"

	"github.com/gofiber/fiber/v2"
)

func VerifyPAN(c *fiber.Ctx) error {
	var input struct {
		PAN  string `json:"pan" xml:"pan" form:"pan"`
		Name string `json:"name" xml:"name" form:"name"`
	}
	
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if input.PAN == "" || input.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "PAN and Name are required"})
	}

	res, err := verification.VerifyPANLegacy(input.PAN, input.Name)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Wrong name or PAN"})
	}

	if res.Status != "VALID" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Wrong name or PAN"})
	}

	return c.JSON(res)
}

func GetGSTByPAN(c *fiber.Ctx) error {
	pan := c.Query("pan")
	if pan == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "PAN is required"})
	}

	res, err := verification.GetGSTByPAN(pan)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(res)
}
