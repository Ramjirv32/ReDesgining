package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type GPS struct {
	Lat float64 `bson:"lat" json:"lat"`
	Lng float64 `bson:"lng" json:"lng"`
}

type NotificationPreferences struct {
	Email bool `bson:"email" json:"email"`
	Push  bool `bson:"push" json:"push"`
	SMS   bool `bson:"sms" json:"sms"`
}

type Profile struct {
	ID                      primitive.ObjectID      `bson:"_id,omitempty" json:"id"`
	UserID                  primitive.ObjectID      `bson:"userId" json:"userId"`
	Phone                   string                  `bson:"phone" json:"phone"`
	Name                    string                  `bson:"name" json:"name"`
	Email                   string                  `bson:"email" json:"email"`
	Address                 string                  `bson:"address" json:"address"`
	Street                  string                  `bson:"street" json:"street"`
	City                    string                  `bson:"city" json:"city"`
	District                string                  `bson:"district" json:"district"`
	State                   string                  `bson:"state" json:"state"`
	Country                 string                  `bson:"country" json:"country"`
	GPS                     GPS                     `bson:"gps" json:"gps"`
	ProfilePhoto            string                  `bson:"profilePhoto" json:"profilePhoto"`
	DOB                     string                  `bson:"dob" json:"dob"`
	Gender                  string                  `bson:"gender" json:"gender"`
	NotificationPreferences NotificationPreferences `bson:"notificationPreferences" json:"notificationPreferences"`
	PreferredLanguage       string                  `bson:"preferredLanguage" json:"preferredLanguage"`
	CreatedAt               time.Time               `bson:"createdAt" json:"createdAt"`
	UpdatedAt               time.Time               `bson:"updatedAt" json:"updatedAt"`
}
