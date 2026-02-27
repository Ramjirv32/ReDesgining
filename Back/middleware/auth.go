package middleware

import (
	"os"
	"ticpin-backend/config"
	"ticpin-backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OrganizerClaims struct {
	OrganizerID string `json:"organizerId"`
	Email       string `json:"email"`
	jwt.RegisteredClaims
}

func jwtSecret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "ticpin-secret-change-in-production"
	}
	return []byte(s)
}

func RequireAuth(c *fiber.Ctx) error {
	tokenStr := c.Cookies("ticpin_token")
	if tokenStr == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized: missing token"})
	}

	claims := &OrganizerClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.ErrUnauthorized
		}
		return jwtSecret(), nil
	})
	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized: invalid or expired token"})
	}

	c.Locals("organizerId", claims.OrganizerID)
	c.Locals("email", claims.Email)
	return c.Next()
}

func RequireAdmin(c *fiber.Ctx) error {
	adminEmail := os.Getenv("ADMIN_EMAIL")
	if adminEmail == "" {
		adminEmail = "23cs139@kpriet.ac.in"
	}
	emailVal := c.Locals("email")
	if emailVal == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	email := emailVal.(string)
	if email != adminEmail {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden: admin access required"})
	}
	return c.Next()
}

func RequireCategoryApproval(category string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		organizerID, ok := c.Locals("organizerId").(string)
		if !ok || organizerID == "" {
			return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
		}

		objID, err := primitive.ObjectIDFromHex(organizerID)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid organizer id"})
		}

		var org models.Organizer
		err = config.GetDB().Collection("organizers").FindOne(c.Context(), bson.M{"_id": objID}).Decode(&org)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "organizer not found"})
		}

		if org.CategoryStatus == nil || org.CategoryStatus[category] != "approved" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "forbidden: your application for " + category + " is not approved yet",
			})
		}

		return c.Next()
	}
}
