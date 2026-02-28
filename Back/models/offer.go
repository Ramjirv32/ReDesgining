package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EventOffer struct {
	ID            primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Title         string               `bson:"title" json:"title"`
	Description   string               `bson:"description" json:"description"`
	Image         string               `bson:"image" json:"image"`
	DiscountType  string               `bson:"discount_type" json:"discount_type"`
	DiscountValue float64              `bson:"discount_value" json:"discount_value"`
	AppliesTo     string               `bson:"applies_to" json:"applies_to"`
	EntityIDs     []primitive.ObjectID `bson:"entity_ids" json:"entity_ids"`
	ValidUntil    time.Time            `bson:"valid_until" json:"valid_until"`
	IsActive      bool                 `bson:"is_active" json:"is_active"`
	CreatedAt     time.Time            `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time            `bson:"updated_at" json:"updated_at"`
}
