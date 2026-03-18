package middleware

import (
	"ticpin-backend/config"
	stdlog "log"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
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

	claims := &config.OrganizerClaims{}
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
	c.Locals("isAdmin", claims.IsAdmin)
	c.Locals("approvals", claims.CategoryStatus)

	return c.Next()
}

func RequireAdmin(c *fiber.Ctx) error {
	isAdmin, ok := c.Locals("isAdmin").(bool)
	if !ok || !isAdmin {
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
		stdlog.Printf("RequireSelfOrAdmin Forbidden: authID=%s, paramID=%s", authID, organizerID)
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
	authPhone, _ := c.Locals("phone").(string)

	// Allow if matches either hex ID or phone number
	if authUserID == targetUserID || (authPhone != "" && authPhone == targetUserID) {
		return c.Next()
	}

	return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden: you can only access your own data"})
}

func RequireCategoryApproval(category string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		isAdmin, _ := c.Locals("isAdmin").(bool)
		if isAdmin {
			return c.Next()
		}

		approvals, ok := c.Locals("approvals").(map[string]string)
		if !ok || approvals == nil || approvals[category] != "approved" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "forbidden: your application for " + category + " is not approved yet",
			})
		}

		return c.Next()
	}
}
