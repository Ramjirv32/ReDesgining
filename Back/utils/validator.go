package utils

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var validate = validator.New()

func init() {
	// Register custom validators
	validate.RegisterValidation("phone", validatePhone)
	validate.RegisterValidation("pan", validatePAN)
	validate.RegisterValidation("gst", validateGST)
	validate.RegisterValidation("ifsc", validateIFSC)
}

func ValidateStruct(s interface{}) []string {
	var errors []string
	err := validate.Struct(s)
	if err != nil {
		for _, err := range err.(validator.ValidationErrors) {
			errors = append(errors, formatErrorMessage(err))
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

// Custom validators
func validatePhone(fl validator.FieldLevel) bool {
	phone := fl.Field().String()
	// Indian phone number format: 10 digits starting with 6-9
	matched, _ := regexp.MatchString(`^[6-9]\d{9}$`, phone)
	return matched
}

func validatePAN(fl validator.FieldLevel) bool {
	pan := strings.ToUpper(fl.Field().String())
	// PAN format: 5 letters, 4 digits, 1 letter
	matched, _ := regexp.MatchString(`^[A-Z]{5}[0-9]{4}[A-Z]{1}$`, pan)
	return matched
}

func validateGST(fl validator.FieldLevel) bool {
	gst := strings.ToUpper(fl.Field().String())
	// GST format: 2 digits (state code) + 10 characters (PAN) + 3 digits/letters
	matched, _ := regexp.MatchString(`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{3}$`, gst)
	return matched
}

func validateIFSC(fl validator.FieldLevel) bool {
	ifsc := strings.ToUpper(fl.Field().String())
	// IFSC format: 4 letters (bank code) + 0 + 6 letters/digits (branch code)
	matched, _ := regexp.MatchString(`^[A-Z]{4}0[A-Z0-9]{6}$`, ifsc)
	return matched
}

// formatErrorMessage formats a single validation error
func formatErrorMessage(e validator.FieldError) string {
	field := e.Field()
	tag := e.Tag()

	switch tag {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "email":
		return fmt.Sprintf("%s must be a valid email address", field)
	case "min":
		return fmt.Sprintf("%s must be at least %s characters long", field, e.Param())
	case "max":
		return fmt.Sprintf("%s must be at most %s characters long", field, e.Param())
	case "phone":
		return fmt.Sprintf("%s must be a valid 10-digit phone number", field)
	case "pan":
		return fmt.Sprintf("%s must be a valid PAN number", field)
	case "gst":
		return fmt.Sprintf("%s must be a valid GST number", field)
	case "ifsc":
		return fmt.Sprintf("%s must be a valid IFSC code", field)
	default:
		return fmt.Sprintf("%s is invalid", field)
	}
}

// Common validation structs
type LoginRequest struct {
	Email string `json:"email" validate:"required,email"`
	OTP   string `json:"otp" validate:"required,len=6"`
}

type OrganizerSetupRequest struct {
	OrgType       string `json:"orgType" validate:"required"`
	Phone         string `json:"phone" validate:"required,phone"`
	BankAccountNo string `json:"bankAccountNo" validate:"required,min=9,max=18"`
	BankIfsc      string `json:"bankIfsc" validate:"required,ifsc"`
	BankName      string `json:"bankName" validate:"required,min=2,max=50"`
	AccountHolder string `json:"accountHolder" validate:"required,min=2,max=50"`
	GSTNumber     string `json:"gstNumber" validate:"omitempty,gst"`
	PAN           string `json:"pan" validate:"required,pan"`
	PANName       string `json:"panName" validate:"required,min=2,max=50"`
	PANDOB        string `json:"panDOB" validate:"required"`
	PANCardURL    string `json:"panCardUrl" validate:"required,url"`
	BackupEmail   string `json:"backupEmail" validate:"omitempty,email"`
	BackupPhone   string `json:"backupPhone" validate:"omitempty,phone"`
}

type EventRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=100"`
	Description string `json:"description" validate:"required,min=10,max=1000"`
	Category    string `json:"category" validate:"required"`
	City        string `json:"city" validate:"required,min=2,max=50"`
	State       string `json:"state" validate:"required,min=2,max=50"`
	Address     string `json:"address" validate:"required,min=5,max=200"`
	Date        string `json:"date" validate:"required"`
	Time        string `json:"time" validate:"required"`
	Price       int    `json:"price" validate:"required,min=0"`
	ImageURL    string `json:"imageUrl" validate:"required,url"`
}

type PlayRequest struct {
	Name         string `json:"name" validate:"required,min=2,max=100"`
	Description  string `json:"description" validate:"required,min=10,max=1000"`
	Category     string `json:"category" validate:"required"`
	City         string `json:"city" validate:"required,min=2,max=50"`
	State        string `json:"state" validate:"required,min=2,max=50"`
	Address      string `json:"address" validate:"required,min=5,max=200"`
	ImageURL     string `json:"imageUrl" validate:"required,url"`
	Courts       int    `json:"courts" validate:"required,min=1,max=20"`
	PricePerHour int    `json:"pricePerHour" validate:"required,min=0"`
	OpeningTime  string `json:"openingTime" validate:"required"`
	ClosingTime  string `json:"closingTime" validate:"required"`
}

type DiningRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=100"`
	Description string `json:"description" validate:"required,min=10,max=1000"`
	Category    string `json:"category" validate:"required"`
	City        string `json:"city" validate:"required,min=2,max=50"`
	State       string `json:"state" validate:"required,min=2,max=50"`
	Address     string `json:"address" validate:"required,min=5,max=200"`
	ImageURL    string `json:"imageUrl" validate:"required,url"`
	Cuisine     string `json:"cuisine" validate:"required,min=2,max=50"`
	PriceRange  string `json:"priceRange" validate:"required,oneof=budget moderate premium luxury"`
}

// SanitizeInput removes potentially harmful characters
func SanitizeInput(input string) string {
	// Remove HTML tags and special characters
	input = regexp.MustCompile(`<[^>]*>`).ReplaceAllString(input, "")
	// Trim whitespace
	input = strings.TrimSpace(input)
	return input
}
