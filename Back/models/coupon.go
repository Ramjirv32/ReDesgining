package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Coupon struct {
	ID            primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Code          string               `bson:"code" json:"code"`
	Category      string               `bson:"category" json:"category"`
	DiscountType  string               `bson:"discount_type" json:"discount_type"`
	DiscountValue float64              `bson:"discount_value" json:"discount_value"`
	UserIDs       []primitive.ObjectID `bson:"user_ids,omitempty" json:"user_ids,omitempty"`
	ValidFrom     time.Time            `bson:"valid_from" json:"valid_from"`
	ValidUntil    time.Time            `bson:"valid_until" json:"valid_until"`
	MaxUses       int                  `bson:"max_uses" json:"max_uses"`
	UsedCount     int                  `bson:"used_count" json:"used_count"`
	IsActive      bool                 `bson:"is_active" json:"is_active"`
	CreatedAt     time.Time            `bson:"created_at" json:"created_at"`
}
