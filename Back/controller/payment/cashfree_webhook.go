package paymentctrl

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2"
)

func CashfreeWebhook(c *fiber.Ctx) error {

	signature := c.Get("x-webhook-signature")
	secret := os.Getenv("CASHFREE_CLIENT_SECRET")

	if secret == "" {
		fmt.Println("CRITICAL: CASHFREE_CLIENT_SECRET is not set")
		return c.Status(500).JSON(fiber.Map{"error": "cashfree secret not configured"})
	}

	body := c.Body()
	timestamp := c.Get("x-webhook-timestamp")

	data := timestamp + string(body)
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(data))
	expectedSignature := base64.StdEncoding.EncodeToString(h.Sum(nil))

	if signature != "" && signature != expectedSignature {
		fmt.Printf("DEBUG: Cashfree Webhook Signature Mismatch - Got: %s, Expected: %s\n", signature, expectedSignature)

	}

	var event struct {
		EventName string                 `json:"event_name"`
		Data      map[string]interface{} `json:"data"`
	}

	if err := c.BodyParser(&event); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "cannot parse body"})
	}

	fmt.Printf("DEBUG: Received Cashfree Webhook Event: %s\n", event.EventName)

	return c.Status(200).JSON(fiber.Map{
		"status":  "received",
		"message": "webhook received successfully",
	})
}
