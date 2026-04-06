package paymentctrl

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"os"
	"strings"
	"ticpin-backend/config"
	"ticpin-backend/models"
	passservice "ticpin-backend/services/pass"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
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

	dataStr := timestamp + string(body)
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(dataStr))
	expectedSignature := base64.StdEncoding.EncodeToString(h.Sum(nil))

	if signature != "" && signature != expectedSignature {
		fmt.Printf("DEBUG: Cashfree Webhook Signature Mismatch - Got: %s, Expected: %s\n", signature, expectedSignature)
		return c.Status(400).JSON(fiber.Map{"error": "invalid signature"})
	}

	var payload struct {
		EventName string `json:"event_name"`
		Data      struct {
			Order struct {
				OrderID string `json:"order_id"`
			} `json:"order"`
			Payment struct {
				CFPaymentID   interface{} `json:"cf_payment_id"`
				PaymentStatus string      `json:"payment_status"`
			} `json:"payment"`
		} `json:"data"`
	}

	if err := c.BodyParser(&payload); err != nil {
		fmt.Printf("DEBUG: Cashfree Webhook Parse Error: %v\n", err)
		return c.Status(400).JSON(fiber.Map{"error": "cannot parse body"})
	}

	orderID := payload.Data.Order.OrderID
	paymentID := fmt.Sprintf("%v", payload.Data.Payment.CFPaymentID)
	status := payload.Data.Payment.PaymentStatus

	fmt.Printf("DEBUG: Received Cashfree Webhook: %s for Order: %s (Status: %s)\n", payload.EventName, orderID, status)

	if orderID == "" {
		return c.Status(200).JSON(fiber.Map{"status": "ignored", "message": "no order_id"})
	}

	// Handle pass creation if it's a pass payment
	if status == "SUCCESS" {
		// Detect if it's a pass payment by orderID prefix
		if strings.HasPrefix(orderID, "pass_") {
			// Format: pass_USERID_TIMESTAMP
			parts := strings.Split(orderID, "_")
			if len(parts) >= 2 {
				userID := parts[1]
				_, err := passservice.Apply(userID, orderID, models.TicpinPass{
					Status: "active",
				})
				if err != nil {
					fmt.Printf("DEBUG: Error creating pass from cashfree webhook: %v\n", err)
				} else {
					fmt.Printf("DEBUG: Successfully created pass for User: %s via Cashfree\n", userID)
					return c.Status(200).JSON(fiber.Map{"status": "received", "message": "pass created"})
				}
			}
		}
	}

	// 1. Determine local status
	var newStatus string
	if status == "SUCCESS" {
		newStatus = "booked"
	} else if status == "FAILED" || status == "CANCELLED" {
		newStatus = "failed"
	} else {
		return c.Status(200).JSON(fiber.Map{"status": "ignored", "message": "unhandled status"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 2. Perform Atomic Multi-Collection Update (Just like Razorpay)
	filter := bson.M{
		"$or": []bson.M{
			{"payment_id": orderID}, // Sometimes OrderID is used as temp payment_id
			{"order_id": orderID},
		},
	}
	update := bson.M{
		"$set": bson.M{
			"status":     newStatus,
			"payment_id": paymentID,
			"paid_at":    time.Now(),
		},
	}

	// Check if already booked to avoid double logic
	// (Though ideally the update filter would handle this)

	var collections = []*mongo.Collection{
		config.PlayBookingsCol,
		config.EventBookingsCol,
		config.DiningBookingsCol,
	}

	for _, col := range collections {
		result, err := col.UpdateMany(ctx, filter, update)
		if err == nil && result.ModifiedCount > 0 {
			fmt.Printf("DEBUG: Cashfree Webhook processed successfully for col: %s\n", col.Name())
		}
	}

	return c.Status(200).JSON(fiber.Map{
		"status":  "received",
		"message": "webhook processed successfully",
	})
}
