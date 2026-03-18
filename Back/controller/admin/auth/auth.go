package auth

import (
	"ticpin-backend/models"
	adminsvc "ticpin-backend/services/admin"

	"github.com/gofiber/fiber/v2"
)

func AdminLogin(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Phone    string `json:"phone"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}

	var adminUser *models.Admin
	var err error

	if req.Email != "" {
		adminUser, err = adminsvc.Login(req.Email, req.Password)
	} else if req.Phone != "" {
		adminUser, err = adminsvc.GetByPhone(req.Phone)
	} else {
		return c.Status(400).JSON(fiber.Map{"error": "email or phone required"})
	}

	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "invalid admin credentials"})
	}

	return c.JSON(fiber.Map{
		"id":       adminUser.ID.Hex(),
		"email":    adminUser.Email,
		"phone":    adminUser.Phone,
		"name":     adminUser.Name,
		"isSuper":  adminUser.IsSuper,
		"userType": "admin",
	})
}
