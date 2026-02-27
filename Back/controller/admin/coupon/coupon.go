package admincoupon

import (
	"context"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"
	couponsvc "ticpin-backend/services/coupon"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
)

func CreateCoupon(c *fiber.Ctx) error {
	var coupon models.Coupon
	if err := c.BodyParser(&coupon); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body: " + err.Error()})
	}
	if coupon.Code == "" {
		return c.Status(400).JSON(fiber.Map{"error": "code is required"})
	}
	if coupon.DiscountType != "percent" && coupon.DiscountType != "flat" {
		return c.Status(400).JSON(fiber.Map{"error": "discount_type must be 'percent' or 'flat'"})
	}
	if coupon.DiscountValue <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "discount_value must be > 0"})
	}
	if err := couponsvc.Create(&coupon); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(fiber.Map{"message": "coupon created", "coupon": coupon})
}

func ListCoupons(c *fiber.Ctx) error {
	coupons, err := couponsvc.GetAll()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(coupons)
}

// ListUsers returns all users for the admin coupon user-selector dropdown.
func ListUsers(c *fiber.Ctx) error {
	col := config.GetDB().Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := col.Find(ctx, bson.M{})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer cursor.Close(ctx)
	users := []models.User{}
	if err := cursor.All(ctx, &users); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(users)
}

func ValidateCoupon(c *fiber.Ctx) error {
	var req struct {
		Code        string  `json:"code"`
		EventID     string  `json:"event_id"`
		OrderAmount float64 `json:"order_amount"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}
	result, err := couponsvc.Validate(req.Code, req.EventID, req.OrderAmount)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"valid":           true,
		"discount_amount": result.DiscountAmount,
		"coupon":          result.Coupon,
	})
}
