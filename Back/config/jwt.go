package config

import (
	"encoding/base64"
	"encoding/json"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

var (
	jwtSecretCached   []byte
	isProdCached      bool
	initializedConfig bool
)

func InitJWT(secret string, isProd bool) {
	jwtSecretCached = []byte(secret)
	isProdCached = isProd
	initializedConfig = true
}

func JWTSecret() []byte {
	if !initializedConfig {
		s := os.Getenv("JWT_SECRET")
		if s == "" {
			s = "ticpin-secret-change-in-production"
		}
		jwtSecretCached = []byte(s)
	}
	return jwtSecretCached
}

func IsProduction() bool {
	return isProdCached || os.Getenv("ENV") == "production"
}

type OrganizerClaims struct {
	OrganizerID    string            `json:"organizerId"`
	Email          string            `json:"email"`
	Role           string            `json:"role"`
	IsAdmin        bool              `json:"isAdmin"`
	CategoryStatus map[string]string `json:"categoryStatus"`
	jwt.RegisteredClaims
}

type SessionInfo struct {
	ID             string            `json:"id"`
	Email          string            `json:"email"`
	Vertical       string            `json:"vertical"`
	IsAdmin        bool              `json:"isAdmin"`
	CategoryStatus map[string]string `json:"categoryStatus"`
}

func GenerateOrganizerToken(organizerID, email, role string, isAdmin bool, categoryStatus map[string]string) (string, error) {

	if role == "" {
		if isAdmin {
			role = "admin"
		} else {
			role = "organizer"
		}
	}

	claims := OrganizerClaims{
		OrganizerID:    organizerID,
		Email:          email,
		Role:           role,
		IsAdmin:        isAdmin,
		CategoryStatus: categoryStatus,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JWTSecret())
}

func SetAuthCookies(c *fiber.Ctx, organizerID, email, role, vertical string, isAdmin bool, categoryStatus map[string]string) error {
	token, err := GenerateOrganizerToken(organizerID, email, role, isAdmin, categoryStatus)
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
		Secure:   IsProduction(),
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
		Secure:   IsProduction(),
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

type UserClaims struct {
	UserID string `json:"userId"`
	Phone  string `json:"phone"`
	jwt.RegisteredClaims
}

type UserSessionInfo struct {
	ID    string `json:"id"`
	Phone string `json:"phone"`
	Name  string `json:"name,omitempty"`
}

func GenerateUserToken(userID, phone string) (string, error) {
	claims := UserClaims{
		UserID: userID,
		Phone:  phone,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JWTSecret())
}

func SetUserAuthCookies(c *fiber.Ctx, userID, phone, name string) error {
	token, err := GenerateUserToken(userID, phone)
	if err != nil {
		return err
	}

	c.Cookie(&fiber.Cookie{
		Name:     "ticpin_user_token",
		Value:    token,
		HTTPOnly: true,
		Secure:   IsProduction(),
		SameSite: "Lax",
		Path:     "/",
		MaxAge:   30 * 24 * 60 * 60,
	})

	info := UserSessionInfo{
		ID:    userID,
		Phone: phone,
		Name:  name,
	}
	raw, _ := json.Marshal(info)
	encoded := base64.StdEncoding.EncodeToString(raw)
	c.Cookie(&fiber.Cookie{
		Name:     "ticpin_user_session",
		Value:    encoded,
		HTTPOnly: false,
		Secure:   IsProduction(),
		SameSite: "Lax",
		Path:     "/",
		MaxAge:   30 * 24 * 60 * 60,
	})
	return nil
}

func ClearUserAuthCookies(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{Name: "ticpin_user_token", Value: "", MaxAge: -1, HTTPOnly: true, SameSite: "Lax", Path: "/"})
	c.Cookie(&fiber.Cookie{Name: "ticpin_user_session", Value: "", MaxAge: -1, SameSite: "Lax", Path: "/"})
}

func GetAdminEmail() string {
	email := os.Getenv("ADMIN_EMAIL")
	if email == "" {
		email = "23cs139@kpriet.ac.in"
	}
	return email
}
