package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Organizer struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name              string             `bson:"name" json:"name"`
	Email             string             `bson:"email" json:"email"`
	Password          string             `bson:"password" json:"-"`
	OrganizerCategory []string           `bson:"organizerCategory" json:"organizerCategory"`
	CategoryStatus    map[string]string  `bson:"categoryStatus,omitempty" json:"categoryStatus"`
	OTP               string             `bson:"otp" json:"-"`
	OTPExpiry         time.Time          `bson:"otpExpiry" json:"-"`
	BackupOTP         string             `bson:"backupOTP" json:"-"`
	BackupOTPExpiry   time.Time          `bson:"backupOTPExpiry" json:"-"`
	IsVerified        bool               `bson:"isVerified" json:"isVerified"`
	CreatedAt         time.Time          `bson:"createdAt" json:"createdAt"`
}

type OrganizerSetup struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizerID   primitive.ObjectID `bson:"organizerId" json:"organizerId"`
	Category      string             `bson:"category" json:"category"`
	OrgType       string             `bson:"orgType" json:"orgType"`
	Phone         string             `bson:"phone" json:"phone"`
	BankAccountNo string             `bson:"bankAccountNo" json:"bankAccountNo"`
	BankIfsc      string             `bson:"bankIfsc" json:"bankIfsc"`
	BankName      string             `bson:"bankName" json:"bankName"`
	AccountHolder string             `bson:"accountHolder" json:"accountHolder"`
	GSTNumber     string             `bson:"gstNumber" json:"gstNumber"`
	PAN           string             `bson:"pan" json:"pan"`
	PANName       string             `bson:"panName" json:"panName"`
	PANDOB        string             `bson:"panDOB" json:"panDOB"`
	PANCardURL    string             `bson:"panCardUrl" json:"panCardUrl"`
	BackupEmail   string             `bson:"backupEmail" json:"backupEmail"`
	BackupPhone   string             `bson:"backupPhone" json:"backupPhone"`
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type OrganizerProfile struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizerID       primitive.ObjectID `bson:"organizerId" json:"organizerId"`
	Name              string             `bson:"name" json:"name"`
	Email             string             `bson:"email" json:"email"`
	Phone             string             `bson:"phone" json:"phone"`
	OrganizerCategory []string           `bson:"organizerCategory" json:"organizerCategory"`
	Address           string             `bson:"address" json:"address"`
	Country           string             `bson:"country" json:"country"`
	State             string             `bson:"state" json:"state"`
	District          string             `bson:"district" json:"district"`
	ProfilePhoto      string             `bson:"profilePhoto" json:"profilePhoto"`
	CreatedAt         time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt         time.Time          `bson:"updatedAt" json:"updatedAt"`
}
