package utils

import (
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var validate = validator.New()

func ValidateStruct(s interface{}) []string {
	var errors []string
	err := validate.Struct(s)
	if err != nil {
		for _, err := range err.(validator.ValidationErrors) {
			errors = append(errors, err.Field()+" is invalid ("+err.Tag()+")")
		}
	}
	return errors
}

func ParseAndValidate(c *fiber.Ctx, out interface{}) error {
	if err := c.BodyParser(out); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body: " + err.Error()})
	}

	if errs := ValidateStruct(out); len(errs) > 0 {
		return c.Status(400).JSON(fiber.Map{"errors": errs})
	}

	return nil
}
