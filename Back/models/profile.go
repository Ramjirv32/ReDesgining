package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Profile struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID       primitive.ObjectID `bson:"userId" json:"userId"`
	Phone        string             `bson:"phone" json:"phone"`
	Name         string             `bson:"name" json:"name"`
	Address      string             `bson:"address" json:"address"`
	Country      string             `bson:"country" json:"country"`
	State        string             `bson:"state" json:"state"`
	District     string             `bson:"district" json:"district"`
	ProfilePhoto string             `bson:"profilePhoto" json:"profilePhoto"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt" json:"updatedAt"`
}
