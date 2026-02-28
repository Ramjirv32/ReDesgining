package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Notification struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title        string             `bson:"title" json:"title"`
	Description  string             `bson:"description" json:"description"`
	ImageURL     string             `bson:"image_url" json:"image_url"`
	TargetType   string             `bson:"target_type" json:"target_type"` // "all_users", "all_organizers", "selected_users", "selected_organizers", "both"
	RecipientIDs []string           `bson:"recipient_ids,omitempty" json:"recipient_ids,omitempty"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
}
