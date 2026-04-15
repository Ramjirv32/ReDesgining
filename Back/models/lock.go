package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SlotLock struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	LockKey     string             `bson:"lock_key" json:"lock_key"` // user browser session ID
	Type        string             `bson:"type" json:"type"`         // "play", "event", "dining"
	ReferenceID primitive.ObjectID `bson:"reference_id" json:"reference_id"`

	// Legacy support for play specifically
	PlayID primitive.ObjectID `bson:"play_id,omitempty" json:"play_id,omitempty"`
	
	Date      string `bson:"date" json:"date"`
	Slot      string `bson:"slot" json:"slot"`
	CourtName string `bson:"court_name,omitempty" json:"court_name,omitempty"`

	BookingID primitive.ObjectID `bson:"booking_id,omitempty" json:"booking_id,omitempty"`

	ExpiresAt time.Time `bson:"expires_at" json:"expires_at"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
}

type LockRequest struct {
	LockKey     string `json:"lock_key" validate:"required"`
	Type        string `json:"type" validate:"required"`
	ReferenceID string `json:"reference_id" validate:"required"`
	Date        string `json:"date" validate:"required"`
	Slot        string `json:"slot" validate:"required"`
	CourtName   string `json:"court_name" validate:"omitempty"`
}

type UnlockRequest struct {
	LockKey     string `json:"lock_key" validate:"required"`
	Type        string `json:"type" validate:"required"`
	ReferenceID string `json:"reference_id" validate:"required"`
	Date        string `json:"date" validate:"required"`
	Slot        string `json:"slot" validate:"required"`
	CourtName   string `json:"court_name" validate:"omitempty"`
}
