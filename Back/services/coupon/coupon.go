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
	c.UsedCount = 0

	col := config.GetDB().Collection("coupons")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

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

func GetByCategory(category string, userID string) ([]models.Coupon, error) {
	col := config.GetDB().Collection("coupons")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now()
	base := bson.M{
		"category":    category,
		"is_active":   true,
		"valid_from":  bson.M{"$lte": now},
		"valid_until": bson.M{"$gte": now},
	}

	usageFilter := bson.M{
		"$or": bson.A{
			bson.M{"max_uses": 0},
			bson.M{"$expr": bson.M{"$lt": bson.A{"$used_count", "$max_uses"}}},
		},
	}

	var filter bson.M
	if userID != "" {
		userObjID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			filter = bson.M{
				"$and": bson.A{
					base,
					usageFilter,
					bson.M{"$or": bson.A{
						bson.M{"user_ids": bson.M{"$exists": false}},
						bson.M{"user_ids": bson.M{"$size": 0}},
						bson.M{"user_ids": userObjID},
					}},
				},
			}
		} else {
			filter = bson.M{
				"$and": bson.A{
					base,
					usageFilter,
					bson.M{"$or": bson.A{
						bson.M{"user_ids": bson.M{"$exists": false}},
						bson.M{"user_ids": bson.M{"$size": 0}},
					}},
				},
			}
		}
	} else {
		filter = bson.M{
			"$and": bson.A{
				base,
				usageFilter,
				bson.M{"$or": bson.A{
					bson.M{"user_ids": bson.M{"$exists": false}},
					bson.M{"user_ids": bson.M{"$size": 0}},
				}},
			},
		}
	}

	cursor, err := col.Find(ctx, filter)
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

type ValidateResult struct {
	Coupon         *models.Coupon
	DiscountAmount float64
}

func Validate(code string, eventID string, orderAmount float64, userID string) (*ValidateResult, error) {
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

	if len(c.UserIDs) > 0 {
		if userID == "" {
			return nil, errors.New("this coupon is restricted and requires a logged-in user")
		}
		userObjID, err := primitive.ObjectIDFromHex(userID)
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

func IncrementUsage(couponID primitive.ObjectID, maxUses int) error {
	col := config.GetDB().Collection("coupons")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": couponID}
	if maxUses > 0 {
		filter["$or"] = bson.A{
			bson.M{"used_count": bson.M{"$exists": false}},
			bson.M{"$expr": bson.M{"$lt": bson.A{"$used_count", maxUses}}},
		}
	}

	res, err := col.UpdateOne(ctx, filter, bson.M{"$inc": bson.M{"used_count": 1}})
	if err != nil {
		return err
	}
	if res.ModifiedCount == 0 {
		return errors.New("coupon limit reached or invalid coupon")
	}
	return nil
}

func Update(id string, c *models.Coupon) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	col := config.GetDB().Collection("coupons")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"code":           strings.ToUpper(strings.TrimSpace(c.Code)),
			"description":    c.Description,
			"category":       c.Category,
			"discount_type":  c.DiscountType,
			"discount_value": c.DiscountValue,
			"user_ids":       c.UserIDs,
			"valid_from":     c.ValidFrom,
			"valid_until":    c.ValidUntil,
			"max_uses":       c.MaxUses,
			"is_active":      c.IsActive,
		},
	}

	_, err = col.UpdateOne(ctx, bson.M{"_id": objID}, update)
	return err
}

func Delete(id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	col := config.GetDB().Collection("coupons")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = col.DeleteOne(ctx, bson.M{"_id": objID})
	return err
}
