package pass

import (
	"fmt"
	"ticpin-backend/models"
	passservice "ticpin-backend/services/pass"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreatePass(c *fiber.Ctx) error {
	var req struct {
		UserID         string `json:"user_id"`
		OrderID        string `json:"order_id"`
		PaymentID      string `json:"payment_id"`
		Amount         int    `json:"amount"`
		DurationMonths int    `json:"duration_months"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if req.UserID == "" || req.PaymentID == "" || req.OrderID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "user_id, payment_id, and order_id required"})
	}

	// Convert string UserID to ObjectID
	userObjID, err := primitive.ObjectIDFromHex(req.UserID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid user_id"})
	}

	// Create pass with 3 months validity
	expiryDate := time.Now().AddDate(0, req.DurationMonths, 0)

	passDetails := models.TicpinPass{
		UserID:    userObjID,
		PaymentID: req.PaymentID,
		Price:     float64(req.Amount),
		Status:    "active",
		StartDate: time.Now(),
		EndDate:   expiryDate,
		Benefits: models.PassBenefits{
			TurfBookings: models.BenefitCounter{
				Total:     2,
				Used:      0,
				Remaining: 2,
			},
			DiningVouchers: models.DiningVoucherBenefit{
				Total:     2,
				Used:      0,
				Remaining: 2,
				ValueEach: 250.0,
			},
			EventsDiscountActive: true,
		},
		Renewals:  []models.RenewalRecord{},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	p, err := passservice.Apply(passDetails.UserID.Hex(), req.PaymentID, models.TicpinPass{})
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(p)
}

func ApplyPass(c *fiber.Ctx) error {
	var req struct {
		UserID    string `json:"user_id"`
		PaymentID string `json:"payment_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if req.UserID == "" || req.PaymentID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "user_id and payment_id required"})
	}

	details := models.TicpinPass{}

	p, err := passservice.Apply(req.UserID, req.PaymentID, details)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(p)
}

func GetPassByUser(c *fiber.Ctx) error {
	p, err := passservice.GetActiveByUserID(c.Params("userId"))
	if err != nil {
		return c.Status(200).JSON(nil)
	}
	return c.JSON(p)
}

func GetLatestPassByUser(c *fiber.Ctx) error {
	fmt.Printf("DEBUG: GetLatestPassByUser called for User: %s\n", c.Params("userId"))
	p, err := passservice.GetLatestByUserID(c.Params("userId"))
	if err != nil {
		fmt.Printf("DEBUG: GetLatestPassByUser error: %v\n", err)
		return c.Status(200).JSON(nil)
	}
	return c.JSON(p)
}

func RenewPass(c *fiber.Ctx) error {
	var req struct {
		PaymentID string `json:"payment_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if req.PaymentID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "payment_id required"})
	}

	p, err := passservice.Renew(c.Params("id"), req.PaymentID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(p)
}

func UseTurfBooking(c *fiber.Ctx) error {
	p, err := passservice.UseTurfBooking(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(p)
}

func UseDiningVoucher(c *fiber.Ctx) error {
	p, err := passservice.UseDiningVoucher(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(p)
}
