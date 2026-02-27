package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// EventOffer is a discount applied to a specific event/play/dining by admin
type EventOffer struct {
	ID            primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Title         string               `bson:"title" json:"title"`
	Description   string               `bson:"description" json:"description"`
	DiscountType  string               `bson:"discount_type" json:"discount_type"` // "percent" or "flat"
	DiscountValue float64              `bson:"discount_value" json:"discount_value"`
	AppliesTo     string               `bson:"applies_to" json:"applies_to"` // "event", "play", "dining"
	EntityIDs     []primitive.ObjectID `bson:"entity_ids" json:"entity_ids"` // one or more event/play/dining IDs
	ValidUntil    time.Time            `bson:"valid_until" json:"valid_until"`
	IsActive      bool                 `bson:"is_active" json:"is_active"`
	CreatedAt     time.Time            `bson:"created_at" json:"created_at"`
}
