package coupon

import (
	"context"
	"errors"
	"strings"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func Create(c *models.Coupon) error {
	c.ID = primitive.NewObjectID()
	c.Code = strings.ToUpper(strings.TrimSpace(c.Code))
	if c.Code == "" {
		return errors.New("coupon code is required")
	}
	c.CreatedAt = time.Now()
	if c.UsedCount == 0 {
		c.UsedCount = 0
	}

	col := config.GetDB().Collection("coupons")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Ensure unique code
	var existing models.Coupon
	err := col.FindOne(ctx, bson.M{"code": c.Code}).Decode(&existing)
	if err == nil {
		return errors.New("coupon code already exists")
	}

	_, err = col.InsertOne(ctx, c)
	return err
}

func GetAll() ([]models.Coupon, error) {
	col := config.GetDB().Collection("coupons")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := col.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	coupons := []models.Coupon{}
	if err := cursor.All(ctx, &coupons); err != nil {
		return nil, err
	}
	return coupons, nil
}

// ValidateResult is returned on successful coupon validation
type ValidateResult struct {
	Coupon         *models.Coupon
	DiscountAmount float64
}

// Validate checks if a coupon code is valid for a given event and order amount
func Validate(code string, eventID string, orderAmount float64) (*ValidateResult, error) {
	code = strings.ToUpper(strings.TrimSpace(code))
	if code == "" {
		return nil, errors.New("coupon code is required")
	}

	col := config.GetDB().Collection("coupons")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var c models.Coupon
	if err := col.FindOne(ctx, bson.M{"code": code}).Decode(&c); err != nil {
		return nil, errors.New("invalid coupon code")
	}
	if !c.IsActive {
		return nil, errors.New("coupon is not active")
	}
	now := time.Now()
	if now.Before(c.ValidFrom) {
		return nil, errors.New("coupon is not yet valid")
	}
	if now.After(c.ValidUntil) {
		return nil, errors.New("coupon has expired")
	}
	if c.MaxUses > 0 && c.UsedCount >= c.MaxUses {
		return nil, errors.New("coupon usage limit reached")
	}

	// If coupon is user-specific, verify the user is in the allowed list
	if len(c.UserIDs) > 0 {
		userObjID, err := primitive.ObjectIDFromHex(eventID) // eventID param reused as userID
		if err != nil {
			return nil, errors.New("invalid user id")
		}
		found := false
		for _, uid := range c.UserIDs {
			if uid == userObjID {
				found = true
				break
			}
		}
		if !found {
			return nil, errors.New("coupon is not valid for this user")
		}
	}

	var discount float64
	if c.DiscountType == "percent" {
		discount = orderAmount * c.DiscountValue / 100
	} else {
		discount = c.DiscountValue
		if discount > orderAmount {
			discount = orderAmount
		}
	}

	return &ValidateResult{Coupon: &c, DiscountAmount: discount}, nil
}

// IncrementUsage increments the used_count of a coupon
func IncrementUsage(couponID primitive.ObjectID) {
	col := config.GetDB().Collection("coupons")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _ = col.UpdateOne(ctx, bson.M{"_id": couponID}, bson.M{"$inc": bson.M{"used_count": 1}})
}
