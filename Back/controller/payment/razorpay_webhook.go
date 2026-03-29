package paymentctrl

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"ticpin-backend/config"
	"ticpin-backend/models"
	passservice "ticpin-backend/services/pass"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

	// Handle different Razorpay events
	switch event.Event {
	case "order.paid", "payment.captured":
		// Handle successful payments
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
		case "pass":
			userID, _ := notes["user_id"].(string)
			passID, _ := notes["pass_id"].(string)
			amountVal, _ := entity["amount"].(float64)
			amount := amountVal / 100.0

			if userID != "" {
				if passID != "" {
					_, err := passservice.Renew(passID, orderID)
					if err != nil {
						fmt.Printf("DEBUG: Error renewing pass from webhook: %v\n", err)
					} else {
						fmt.Printf("DEBUG: Successfully renewed pass %s for User: %s via Razorpay\n", passID, userID)
					}
				} else {
					_, err := passservice.Apply(userID, orderID, models.TicpinPass{
						Status: "active",
						Price:  amount,
					})
					if err != nil {
						fmt.Printf("DEBUG: Error creating pass from webhook: %v\n", err)
					} else {
						fmt.Printf("DEBUG: Successfully created pass for User: %s via Razorpay\n", userID)
					}
				}
			}
			// Respond and exit
			return c.Status(200).JSON(fiber.Map{"status": "received", "message": "pass processed"})
		default:
			// Search across all if type is missing
			targetCollections = []*mongo.Collection{
				config.EventBookingsCol,
				config.PlayBookingsCol,
				config.DiningBookingsCol,
			}
		}

		for _, col := range targetCollections {
			// Find by either payment_id or order_id
			filter := bson.M{
				"$or": []bson.M{
					{"payment_id": orderID},
					{"order_id": orderID},
				},
			}
			result, err := col.UpdateMany(ctx, filter, bson.M{
				"$set": bson.M{
					"status":  "booked",
					"paid_at": time.Now(),
				},
			})
			if err == nil && result.ModifiedCount > 0 {
				fmt.Printf("DEBUG: Successfully updated booking status for Order/Payment ID: %s in collection: %s\n", orderID, col.Name())
				break
			}
		}

	case "payment.failed":
		// Handle failed payments
		paymentPayload, exists := event.Payload["payment"].(map[string]interface{})
		if !exists {
			fmt.Println("DEBUG: Required payment payload missing for payment.failed")
			return c.Status(200).JSON(fiber.Map{"status": "ignored", "message": "no payment data"})
		}

		entity, ok := paymentPayload["entity"].(map[string]interface{})
		if !ok {
			fmt.Println("DEBUG: Could not parse payment entity for payment.failed")
			return c.Status(200).JSON(fiber.Map{"status": "ignored", "message": "no payment entity"})
		}

		orderID, _ := entity["order_id"].(string)
		if orderID == "" {
			fmt.Println("DEBUG: No order ID found in payment.failed webhook")
			return c.Status(200).JSON(fiber.Map{"status": "ignored"})
		}

		fmt.Printf("DEBUG: Processing payment.failed for Order ID: %s\n", orderID)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// Update booking status to failed for all booking types
		targetCollections := []*mongo.Collection{
			config.EventBookingsCol,
			config.PlayBookingsCol,
			config.DiningBookingsCol,
		}

		for _, col := range targetCollections {
			filter := bson.M{
				"$or": []bson.M{
					{"payment_id": orderID},
					{"order_id": orderID},
				},
			}
			result, err := col.UpdateMany(ctx, filter, bson.M{
				"$set": bson.M{
					"status":    "failed",
					"failed_at": time.Now(),
				},
			})
			if err == nil && result.ModifiedCount > 0 {
				fmt.Printf("DEBUG: Successfully updated booking status to 'failed' for Order/Payment ID: %s in collection: %s\n", orderID, col.Name())
				break
			}
		}

	case "payment.created":
		// Handle payment initiation (useful for tracking)
		fmt.Printf("DEBUG: Payment initiated - Order ID will be tracked\n")
		// No action needed, just logging for now

	case "order.created":
		// Handle order creation (useful for tracking)
		fmt.Printf("DEBUG: Order created - tracking order lifecycle\n")
		// No action needed, just logging for now

	case "refund.processed":
		// Handle refunds - IMPORTANT for booking platform
		paymentPayload, exists := event.Payload["payment"].(map[string]interface{})
		if !exists {
			fmt.Println("DEBUG: Required payment payload missing for refund.processed")
			return c.Status(200).JSON(fiber.Map{"status": "ignored", "message": "no payment data"})
		}

		entity, ok := paymentPayload["entity"].(map[string]interface{})
		if !ok {
			fmt.Println("DEBUG: Could not parse payment entity for refund.processed")
			return c.Status(200).JSON(fiber.Map{"status": "ignored", "message": "no payment entity"})
		}

		orderID, _ := entity["order_id"].(string)
		if orderID == "" {
			fmt.Println("DEBUG: No order ID found in refund.processed webhook")
			return c.Status(200).JSON(fiber.Map{"status": "ignored"})
		}

		fmt.Printf("DEBUG: Processing refund.processed for Order ID: %s\n", orderID)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// Update booking status to refunded for all booking types
		targetCollections := []*mongo.Collection{
			config.EventBookingsCol,
			config.PlayBookingsCol,
			config.DiningBookingsCol,
		}

		for _, col := range targetCollections {
			filter := bson.M{
				"$or": []bson.M{
					{"payment_id": orderID},
					{"order_id": orderID},
				},
			}

			// NEW: Before updating status, check if we need to refund Ticpass benefits
			var bookingDoc bson.M
			if err := col.FindOne(ctx, filter).Decode(&bookingDoc); err == nil {
				ticpassApplied, _ := bookingDoc["ticpass_applied"].(bool)
				userID, _ := bookingDoc["user_id"].(string)

				if ticpassApplied && userID != "" {
					fmt.Printf("DEBUG: Found Ticpass booking to refund. User: %s, Collection: %s\n", userID, col.Name())

					// Check if already refunded to prevent double refunds
					bookingID := bookingDoc["_id"]
					if bookingID != nil {
						if oid, ok := bookingID.(primitive.ObjectID); ok {
							var existingBooking map[string]interface{}
							err := col.FindOne(ctx, bson.M{"_id": oid}).Decode(&existingBooking)
							if err == nil {
								if status, ok := existingBooking["status"].(string); ok && (status == "refunded" || status == "cancelled") {
									fmt.Printf("INFO: Booking %s already refunded/cancelled, skipping Ticpass refund\n", oid.Hex())
									continue // Skip to next collection
								}
							}
						}
					}

					pass, err := passservice.GetActiveByUserID(userID)
					if err == nil && pass != nil {
						if col.Name() == "play_bookings" {
							_, err = passservice.RefundTurfBooking(pass.ID.Hex())
							if err != nil {
								fmt.Printf("ERROR: Failed to refund Ticpass turf benefit for User: %s, Error: %v\n", userID, err)
							} else {
								fmt.Printf("DEBUG: Refunded Ticpass turf benefit for User: %s\n", userID)
							}
						} else if col.Name() == "dining_bookings" {
							_, err = passservice.RefundDiningVoucher(pass.ID.Hex())
							if err != nil {
								fmt.Printf("ERROR: Failed to refund Ticpass dining benefit for User: %s, Error: %v\n", userID, err)
							} else {
								fmt.Printf("DEBUG: Refunded Ticpass dining benefit for User: %s\n", userID)
							}
						}
					}
				}
			}

			result, err := col.UpdateMany(ctx, filter, bson.M{
				"$set": bson.M{
					"status":      "refunded",
					"refunded_at": time.Now(),
				},
			})
			if err == nil && result.ModifiedCount > 0 {
				fmt.Printf("DEBUG: Successfully updated booking status to 'refunded' for Order/Payment ID: %s in collection: %s\n", orderID, col.Name())
				break
			}
		}

	case "settlement.completed":
		// Handle settlements (useful for accounting)
		fmt.Printf("DEBUG: Settlement completed - useful for accounting\n")
		// No action needed for booking status, but important for financial tracking

	default:
		fmt.Printf("DEBUG: Unhandled Razorpay Webhook Event: %s\n", event.Event)
		// Return 200 for unhandled events to prevent Razorpay from retrying
	}

	return c.Status(200).JSON(fiber.Map{
		"status":  "received",
		"message": "webhook processed",
	})
}
