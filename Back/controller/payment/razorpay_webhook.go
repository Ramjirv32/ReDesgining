package paymentctrl

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"ticpin-backend/config"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
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

	if event.Event == "order.paid" || event.Event == "payment.captured" {
		orderPayload, exists := event.Payload["order"].(map[string]interface{})
		if !exists {
			// This might be for "payment.captured", in which case it might be inside "payment"
			paymentPayload, pExists := event.Payload["payment"].(map[string]interface{})
			if pExists {
				orderPayload = paymentPayload
			} else {
				fmt.Println("DEBUG: Required payload entities missing")
				return c.Status(200).JSON(fiber.Map{"status": "ignored", "message": "no order data"})
			}
		}

		entity, ok := orderPayload["entity"].(map[string]interface{})
		if !ok {
			fmt.Println("DEBUG: Could not parse order entity")
			return c.Status(200).JSON(fiber.Map{"status": "ignored", "message": "no entity"})
		}

		orderID, _ := entity["id"].(string)
		if orderID == "" {
			fmt.Println("DEBUG: No order ID found in webhook")
			return c.Status(200).JSON(fiber.Map{"status": "ignored"})
		}

		notes, _ := entity["notes"].(map[string]interface{})
		bookingType := ""
		if notes != nil {
			bookingType, _ = notes["booking_type"].(string)
		}

		fmt.Printf("DEBUG: Processing order.paid for Order ID: %s, Booking Type: %s\n", orderID, bookingType)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		var targetCollections []*mongo.Collection

		switch bookingType {
		case "event":
			targetCollections = append(targetCollections, config.EventBookingsCol)
		case "play":
			targetCollections = append(targetCollections, config.PlayBookingsCol)
		case "dining":
			targetCollections = append(targetCollections, config.DiningBookingsCol)
		default:
			// Search across all if type is missing
			targetCollections = []*mongo.Collection{
				config.EventBookingsCol,
				config.PlayBookingsCol,
				config.DiningBookingsCol,
			}
		}

		for _, col := range targetCollections {
			result, err := col.UpdateMany(ctx, bson.M{
				"payment_id": orderID,
			}, bson.M{
				"$set": bson.M{
					"status": "booked", // Consistent with rest of the app
				},
			})
			if err == nil && result.ModifiedCount > 0 {
				fmt.Printf("DEBUG: Successfully updated booking status for Order ID: %s in collection: %s\n", orderID, col.Name())
				break
			}
		}
	}

	return c.Status(200).JSON(fiber.Map{
		"status":  "received",
		"message": "webhook processed",
	})
}
