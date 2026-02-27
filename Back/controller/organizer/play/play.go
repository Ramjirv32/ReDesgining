package play

import (
	"ticpin-backend/config"
	"ticpin-backend/models"
	organizersvc "ticpin-backend/services/organizer"
	verifysvc "ticpin-backend/services/verification"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func PlayLogin(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if req.Email == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "email and password required"})
	}

	org, err := organizersvc.Login(req.Email, req.Password)
	if err != nil {
		if err.Error() == "user_not_found" {
			return c.Status(404).JSON(fiber.Map{"error": "user_not_found"})
		}
		return c.Status(401).JSON(fiber.Map{"error": err.Error()})
	}

	if err := organizersvc.SendOTP(req.Email, "play"); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to send otp"})
	}
	return c.JSON(fiber.Map{"message": "otp sent", "organizerId": org.ID})
}

func PlaySignin(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if req.Email == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "email and password required"})
	}

	org, err := organizersvc.Create(req.Email, req.Password)
	if err != nil {
		if err.Error() == "email_exists" {
			return c.Status(400).JSON(fiber.Map{"error": "email_exists"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := organizersvc.SendOTP(req.Email, "play"); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to send otp"})
	}
	return c.Status(201).JSON(fiber.Map{"message": "account created, otp sent", "organizerId": org.ID})
}

func VerifyOTP(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	org, err := organizersvc.VerifyOTP(req.Email, req.OTP)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	isAdmin := req.Email == config.GetAdminEmail()
	if err := config.SetAuthCookies(c, org.ID.Hex(), org.Email, "play", isAdmin, org.CategoryStatus); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "session error"})
	}
	return c.JSON(fiber.Map{
		"id":             org.ID,
		"email":          org.Email,
		"categoryStatus": org.CategoryStatus,
		"isAdmin":        isAdmin,
	})
}

func GetOrganizer(c *fiber.Ctx) error {
	org, err := organizersvc.GetByID(c.Params("id"))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "organizer not found"})
	}
	return c.JSON(org)
}

func PlaySetup(c *fiber.Ctx) error {
	var payload struct {
		OrganizerID   string `json:"organizerId"`
		OrgType       string `json:"orgType"`
		Phone         string `json:"phone"`
		BankAccountNo string `json:"bankAccountNo"`
		BankIfsc      string `json:"bankIfsc"`
		BankName      string `json:"bankName"`
		AccountHolder string `json:"accountHolder"`
		GSTNumber     string `json:"gstNumber"`
		PAN           string `json:"pan"`
		PANName       string `json:"panName"`
		PANDOB        string `json:"panDOB"`
		PANCardURL    string `json:"panCardUrl"`
		BackupEmail   string `json:"backupEmail"`
		BackupPhone   string `json:"backupPhone"`
	}
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if payload.OrganizerID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "organizerId required"})
	}
	orgID, err := primitive.ObjectIDFromHex(payload.OrganizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid organizerId"})
	}

	setup := &models.OrganizerSetup{
		OrganizerID:   orgID,
		Category:      "play",
		OrgType:       payload.OrgType,
		Phone:         payload.Phone,
		BankAccountNo: payload.BankAccountNo,
		BankIfsc:      payload.BankIfsc,
		BankName:      payload.BankName,
		AccountHolder: payload.AccountHolder,
		GSTNumber:     payload.GSTNumber,
		PAN:           payload.PAN,
		PANName:       payload.PANName,
		PANDOB:        payload.PANDOB,
		PANCardURL:    payload.PANCardURL,
		BackupEmail:   payload.BackupEmail,
		BackupPhone:   payload.BackupPhone,
	}
	if err := organizersvc.CheckPANDuplicate(payload.PAN, payload.OrganizerID); err != nil {
		if err.Error() == "pan_already_used" {
			return c.Status(400).JSON(fiber.Map{"error": "pan_already_used"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	if err := organizersvc.SaveSetup(setup); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "setup saved", "status": "pending"})
}


func ResendOTP(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&req); err != nil || req.Email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "email required"})
	}
	if err := organizersvc.SendOTP(req.Email, "play"); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to send otp"})
	}
	return c.JSON(fiber.Map{"message": "otp sent"})
}

func SubmitVerification(c *fiber.Ctx) error {
	var v models.PlayVerification
	if err := c.BodyParser(&v); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if v.OrganizerID.IsZero() {
		return c.Status(400).JSON(fiber.Map{"error": "organizer_id required"})
	}

	if err := verifysvc.SubmitPlayVerification(&v); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(fiber.Map{"message": "verification submitted"})
}
