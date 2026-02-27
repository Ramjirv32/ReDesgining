package admincoupon

import (
	"context"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"
	couponsvc "ticpin-backend/services/coupon"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateCoupon(c *fiber.Ctx) error {
	var input struct {
		Code          string   `json:"code"`
		Description   string   `json:"description"`
		Category      string   `json:"category"`
		DiscountType  string   `json:"discount_type"`
		DiscountValue float64  `json:"discount_value"`
		UserIDs       []string `json:"user_ids"`
		ValidFrom     string   `json:"valid_from"`
		ValidUntil    string   `json:"valid_until"`
		MaxUses       int      `json:"max_uses"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body: " + err.Error()})
	}
	if input.Code == "" {
		return c.Status(400).JSON(fiber.Map{"error": "code is required"})
	}
	if input.Category != "event" && input.Category != "play" && input.Category != "dining" {
		return c.Status(400).JSON(fiber.Map{"error": "category must be 'event', 'play', or 'dining'"})
	}
	if input.DiscountType != "percent" && input.DiscountType != "flat" {
		return c.Status(400).JSON(fiber.Map{"error": "discount_type must be 'percent' or 'flat'"})
	}
	if input.DiscountValue <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "discount_value must be > 0"})
	}

	var userObjIDs []primitive.ObjectID
	for _, sid := range input.UserIDs {
		if sid == "" {
			continue
		}
		oid, err := primitive.ObjectIDFromHex(sid)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid user_id: " + sid})
		}
		userObjIDs = append(userObjIDs, oid)
	}

	var validFrom, validUntil time.Time
	var err error
	if input.ValidFrom != "" {
		validFrom, err = time.Parse(time.RFC3339, input.ValidFrom)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid valid_from date: " + err.Error()})
		}
	}
	if input.ValidUntil != "" {
		validUntil, err = time.Parse(time.RFC3339, input.ValidUntil)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid valid_until date: " + err.Error()})
		}
	}

	coupon := models.Coupon{
		Code:          input.Code,
		Category:      input.Category,
		DiscountType:  input.DiscountType,
		DiscountValue: input.DiscountValue,
		UserIDs:       userObjIDs,
		ValidFrom:     validFrom,
		ValidUntil:    validUntil,
		MaxUses:       input.MaxUses,
		IsActive:      true,
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

func GetCouponsByCategory(c *fiber.Ctx) error {
	category := c.Params("category")
	if category != "event" && category != "play" && category != "dining" {
		return c.Status(400).JSON(fiber.Map{"error": "invalid category"})
	}
	userID := c.Query("user_id")
	coupons, err := couponsvc.GetByCategory(category, userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(coupons)
}

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
		UserID      string  `json:"user_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}
	result, err := couponsvc.Validate(req.Code, req.EventID, req.OrderAmount, req.UserID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"valid":           true,
		"discount_amount": result.DiscountAmount,
		"coupon":          result.Coupon,
	})
}
