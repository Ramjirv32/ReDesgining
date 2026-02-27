package config

import (
	"encoding/base64"
	"encoding/json"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type OrganizerClaims struct {
	OrganizerID string `json:"organizerId"`
	Email       string `json:"email"`
	jwt.RegisteredClaims
}

type SessionInfo struct {
	ID             string            `json:"id"`
	Email          string            `json:"email"`
	Vertical       string            `json:"vertical"`
	IsAdmin        bool              `json:"isAdmin"`
	CategoryStatus map[string]string `json:"categoryStatus"`
}

func jwtSecret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "ticpin-secret-change-in-production"
	}
	return []byte(s)
}

func GenerateOrganizerToken(organizerID, email string) (string, error) {
	claims := OrganizerClaims{
		OrganizerID: organizerID,
		Email:       email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret())
}

func SetAuthCookies(c *fiber.Ctx, organizerID, email, vertical string, isAdmin bool, categoryStatus map[string]string) error {
	token, err := GenerateOrganizerToken(organizerID, email)
	if err != nil {
		return err
	}
	if categoryStatus == nil {
		categoryStatus = map[string]string{}
	}

	c.Cookie(&fiber.Cookie{
		Name:     "ticpin_token",
		Value:    token,
		HTTPOnly: true,
		SameSite: "Lax",
		Path:     "/",
		MaxAge:   7 * 24 * 60 * 60,
	})

	info := SessionInfo{
		ID:             organizerID,
		Email:          email,
		Vertical:       vertical,
		IsAdmin:        isAdmin,
		CategoryStatus: categoryStatus,
	}
	raw, _ := json.Marshal(info)
	encoded := base64.StdEncoding.EncodeToString(raw)
	c.Cookie(&fiber.Cookie{
		Name:     "ticpin_session",
		Value:    encoded,
		HTTPOnly: false,
		SameSite: "Lax",
		Path:     "/",
		MaxAge:   7 * 24 * 60 * 60,
	})
	return nil
}

func ClearAuthCookies(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{Name: "ticpin_token", Value: "", MaxAge: -1, HTTPOnly: true, SameSite: "Lax", Path: "/"})
	c.Cookie(&fiber.Cookie{Name: "ticpin_session", Value: "", MaxAge: -1, SameSite: "Lax", Path: "/"})
}

func GetAdminEmail() string {
	email := os.Getenv("ADMIN_EMAIL")
	if email == "" {
		email = "23cs139@kpriet.ac.in"
	}
	return email
}
