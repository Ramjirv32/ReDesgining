package profile

import (
	"ticpin-backend/models"
	profilesvc "ticpin-backend/services/profile"

	"github.com/gofiber/fiber/v2"
)

func CreateProfile(c *fiber.Ctx) error {
	var p models.Profile
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if err := profilesvc.Create(&p); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(p)
}

func GetProfile(c *fiber.Ctx) error {
	p, err := profilesvc.GetByUserID(c.Params("userId"))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "profile not found"})
	}
	return c.JSON(p)
}

func UpdateProfile(c *fiber.Ctx) error {
	var p models.Profile
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if err := profilesvc.Update(c.Params("userId"), &p); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "profile updated"})
}

func UploadProfilePhoto(c *fiber.Ctx) error {
	userID := c.Params("userId")

	file, err := c.FormFile("photo")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "photo required"})
	}

	src, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer src.Close()

	photoURL, err := profilesvc.UploadPhoto(src, userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "upload failed"})
	}

	if err := profilesvc.UpdatePhoto(userID, photoURL); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"photoURL": photoURL})
}
