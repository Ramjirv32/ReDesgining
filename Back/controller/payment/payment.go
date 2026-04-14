package paymentctrl

import (
	"fmt"
	"ticpin-backend/config"
	passservice "ticpin-backend/services/pass"
	"ticpin-backend/services/payment"
	"ticpin-backend/models"
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

	if req.Type == "pass" && req.CustomerID != "" {
		// PREVENT DUPLICATE PASS: Check if user already has an active pass
		existingPass, err := passservice.GetActiveByUserID(req.CustomerID)
		if err == nil && existingPass != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "You already have an active Ticpin Pass. You can only have one active pass at a time.",
				"code":  "ACTIVE_PASS_EXISTS",
			})
		}
	}

	bookingType := req.Type
	if bookingType == "" {
		bookingType = "booking"
	}
	orderID := fmt.Sprintf("%s_%d", bookingType, time.Now().UnixMilli())
	if bookingType == "pass" && req.CustomerID != "" {
		// Razorpay receipt limit is 40 chars.
		// pass_ (5) + UserID (up to 30) + _ (1) + ShortTS (4) = 40
		orderID = fmt.Sprintf("pass_%s_%d", req.CustomerID, time.Now().Unix()%10000)
	}

	notes := req.Notes
	if notes == nil {
		notes = make(map[string]string)
	}
	if req.Type != "" {
		notes["booking_type"] = req.Type
	}

	// Use alternating gateway for play bookings: Razorpay -> Cashfree -> Razorpay -> Cashfree
	var gateway payment.GatewayType
	if req.Type == "play" {
		gateway = payment.GetPaymentGatewayForPlay()
	} else {
		gateway = payment.GetPaymentGateway()
	}

	result, err := payment.CreateOrderWithGateway(payment.OrderRequest{
		OrderID:       orderID,
		OrderAmount:   req.Amount,
		Currency:      "INR",
		CustomerID:    req.CustomerID,
		CustomerEmail: req.CustomerEmail,
		CustomerPhone: req.CustomerPhone,
		ReturnURL:     req.ReturnURL,
		Notes:         notes,
	}, gateway)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "payment order creation failed: " + err.Error()})
	}

	return c.JSON(result)
}
func VerifyPassHandler(c *fiber.Ctx) error {
	var req struct {
		RazorpayPaymentID string `json:"razorpay_payment_id"`
		RazorpayOrderID   string `json:"razorpay_order_id"`
		RazorpaySignature string `json:"razorpay_signature"`
		UserID            string `json:"user_id"`
		Email             string `json:"email"`
		Phone             string `json:"phone"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}

	// 1. Verify Razorpay Signature
	isValid := payment.VerifyRazorpaySignature(req.RazorpayOrderID, req.RazorpayPaymentID, req.RazorpaySignature)
	if !isValid {
		fmt.Printf("DEBUG: Invalid signature - order:%s payment:%s\n", req.RazorpayOrderID, req.RazorpayPaymentID)
		return c.Status(400).JSON(fiber.Map{"error": "invalid payment signature"})
	}

	// 2. Store pass in DB immediately (payment already collected by Razorpay)
	p, err := passservice.Apply(req.UserID, req.RazorpayPaymentID, req.Phone, req.RazorpayOrderID, models.TicpinPass{
		Price: 799, // Updated from test price 1 to 799
	})
	if err != nil {
		fmt.Printf("DEBUG: Failed to activate pass for user %s: %v\n", req.UserID, err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to activate pass: " + err.Error()})
	}

	// 3. Send confirmation email in background (non-blocking — payment already done)
	emailTo := req.Email
	go func() {
		if err := config.SendPassConfirmationEmail(emailTo); err != nil {
			fmt.Printf("DEBUG: Pass confirmation email failed for %s: %v (pass already activated)\n", emailTo, err)
		} else {
			fmt.Printf("DEBUG: Pass confirmation email sent to %s\n", emailTo)
		}
	}()

	return c.JSON(fiber.Map{
		"success": true,
		"pass":    p,
	})
}
