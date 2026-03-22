package paymentctrl

import (
	"fmt"
	"ticpin-backend/services/payment"
	"time"

	"github.com/gofiber/fiber/v2"
)

func CreateOrderHandler(c *fiber.Ctx) error {
	var req struct {
		Amount        float64           `json:"amount"`
		CustomerID    string            `json:"customer_id"`
		CustomerEmail string            `json:"customer_email"`
		CustomerPhone string            `json:"customer_phone"`
		ReturnURL     string            `json:"return_url"`
		Type          string            `json:"type"` // "event", "play", "dining"
		Notes         map[string]string `json:"notes"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request: " + err.Error()})
	}

	if req.Amount <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "amount must be positive"})
	}

	if req.CustomerPhone == "" {
		return c.Status(400).JSON(fiber.Map{"error": "customer_phone is required"})
	}

	orderID := fmt.Sprintf("TICPIN_%d", time.Now().UnixMilli())

	notes := req.Notes
	if notes == nil {
		notes = make(map[string]string)
	}
	if req.Type != "" {
		notes["booking_type"] = req.Type
	}

	result, err := payment.CreateOrder(payment.OrderRequest{
		OrderID:       orderID,
		OrderAmount:   req.Amount,
		Currency:      "INR",
		CustomerID:    req.CustomerID,
		CustomerEmail: req.CustomerEmail,
		CustomerPhone: req.CustomerPhone,
		ReturnURL:     req.ReturnURL,
		Notes:         notes,
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "payment order creation failed: " + err.Error()})
	}

	return c.JSON(result)
}
