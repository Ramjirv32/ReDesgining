package middleware

import (
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
	return config.JWTSecret()
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

	adminEmail := config.GetAdminEmail()
	c.Locals("isAdmin", claims.Email == adminEmail)

	return c.Next()
}

func RequireAdmin(c *fiber.Ctx) error {
	isAdmin, _ := c.Locals("isAdmin").(bool)
	if !isAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden: admin access required"})
	}
	return c.Next()
}

func RequireSelfOrAdmin(c *fiber.Ctx) error {
	organizerID := c.Params("id")
	if organizerID == "" {
		organizerID = c.Params("organizerId")
	}

	authID := c.Locals("organizerId").(string)
	isAdmin, _ := c.Locals("isAdmin").(bool)

	if !isAdmin && authID != organizerID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden: you can only access your own data"})
	}

	return c.Next()
}

type UserClaims struct {
	UserID string `json:"userId"`
	Phone  string `json:"phone"`
	jwt.RegisteredClaims
}

func RequireUserAuth(c *fiber.Ctx) error {
	tokenStr := c.Cookies("ticpin_user_token")
	if tokenStr == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized: missing user token"})
	}

	claims := &UserClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.ErrUnauthorized
		}
		return jwtSecret(), nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized: invalid or expired user token"})
	}

	c.Locals("userId", claims.UserID)
	c.Locals("phone", claims.Phone)
	return c.Next()
}

func RequireSelfUser(c *fiber.Ctx) error {
	targetUserID := c.Params("userId")
	if targetUserID == "" {
		targetUserID = c.Params("id")
	}

	authUserID := c.Locals("userId").(string)
	if authUserID != targetUserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden: you can only access your own profile"})
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
