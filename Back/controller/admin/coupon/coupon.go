package admincoupon

import (
	"context"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"
	couponsvc "ticpin-backend/services/coupon"
	"ticpin-backend/utils"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateCoupon(c *fiber.Ctx) error {
	var input struct {
		Code          string   `json:"code" validate:"required"`
		Description   string   `json:"description"`
		Category      string   `json:"category" validate:"required,oneof=event play dining"`
		DiscountType  string   `json:"discount_type" validate:"required,oneof=percent flat"`
		DiscountValue float64  `json:"discount_value" validate:"required,gt=0"`
		UserIDs       []string `json:"user_ids"`
		IsPublic      bool     `json:"is_public"`
		ValidFrom     string   `json:"valid_from"`
		ValidUntil    string   `json:"valid_until"`
		MaxUses       int      `json:"max_uses"`
	}
	if err := utils.ParseAndValidate(c, &input); err != nil {
		return err
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
		Description:   input.Description,
		Category:      input.Category,
		DiscountType:  input.DiscountType,
		DiscountValue: input.DiscountValue,
		UserIDs:       userObjIDs,
		IsPublic:      input.IsPublic,
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
	limit := c.QueryInt("limit", 20)
	after := c.Query("after")

	coupons, nextCursor, err := couponsvc.GetAll(limit, after)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"data":        coupons,
		"next_cursor": nextCursor,
	})
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
		Category    string  `json:"category"`
		OrderAmount float64 `json:"order_amount"`
		UserID      string  `json:"user_id"`
		UserEmail   string  `json:"user_email"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}
	result, err := couponsvc.Validate(req.Code, req.Category, req.OrderAmount, req.UserID, req.UserEmail)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"valid":           true,
		"discount_amount": result.DiscountAmount,
		"coupon":          result.Coupon,
	})
}

func UpdateCoupon(c *fiber.Ctx) error {
	id := c.Params("id")
	var input struct {
		Code          string   `json:"code"`
		Description   string   `json:"description"`
		Category      string   `json:"category"`
		DiscountType  string   `json:"discount_type"`
		DiscountValue float64  `json:"discount_value"`
		UserIDs       []string `json:"user_ids"`
		IsPublic      bool     `json:"is_public"`
		ValidFrom     string   `json:"valid_from"`
		ValidUntil    string   `json:"valid_until"`
		MaxUses       int      `json:"max_uses"`
		IsActive      bool     `json:"is_active"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
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
	if input.ValidFrom != "" {
		validFrom, _ = time.Parse(time.RFC3339, input.ValidFrom)
	}
	if input.ValidUntil != "" {
		validUntil, _ = time.Parse(time.RFC3339, input.ValidUntil)
	}

	coupon := models.Coupon{
		Code:          input.Code,
		Description:   input.Description,
		Category:      input.Category,
		DiscountType:  input.DiscountType,
		DiscountValue: input.DiscountValue,
		UserIDs:       userObjIDs,
		IsPublic:      input.IsPublic,
		ValidFrom:     validFrom,
		ValidUntil:    validUntil,
		MaxUses:       input.MaxUses,
		IsActive:      input.IsActive,
	}

	if err := couponsvc.Update(id, &coupon); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "coupon updated"})
}

func DeleteCoupon(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := couponsvc.Delete(id); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "coupon deleted"})
}
