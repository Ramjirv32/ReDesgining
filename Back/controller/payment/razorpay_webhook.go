package paymentctrl

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2"
)

func RazorpayWebhook(c *fiber.Ctx) error {
	signature := c.Get("X-Razorpay-Signature")
	secret := os.Getenv("RAZORPAY_WEBHOOK_SECRET")

	if secret == "" {
		fmt.Println("CRITICAL: RAZORPAY_WEBHOOK_SECRET is not set")
		return c.Status(500).JSON(fiber.Map{"error": "webhook secret not configured"})
	}

	body := c.Body()

	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	if signature != expectedSignature {
		fmt.Printf("DEBUG: Razorpay Webhook Signature Mismatch - Got: %s, Expected: %s\n", signature, expectedSignature)
		return c.Status(400).JSON(fiber.Map{"error": "invalid signature"})
	}

	var event struct {
		Event   string                 `json:"event"`
		Payload map[string]interface{} `json:"payload"`
	}

	if err := c.BodyParser(&event); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "cannot parse body"})
	}

	fmt.Printf("DEBUG: Received Razorpay Webhook Event: %s\n", event.Event)

	return c.Status(200).JSON(fiber.Map{
		"status":  "received",
		"message": "webhook received successfully",
	})
}
