package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Notification struct {
	ID               primitive.ObjectID       `bson:"_id,omitempty" json:"id"`
	Title            string                   `bson:"title" json:"title"`
	Description      string                   `bson:"description" json:"description"`
	ImageURL         string                   `bson:"image_url" json:"image_url"`
	TargetType       string                   `bson:"target_type" json:"target_type"`
	RecipientIDs     []string                 `bson:"recipient_ids,omitempty" json:"recipient_ids,omitempty"`
	RecipientDetails []map[string]interface{} `bson:"recipient_details,omitempty" json:"recipient_details,omitempty"`
	CreatedAt        time.Time                `bson:"created_at" json:"created_at"`
}
