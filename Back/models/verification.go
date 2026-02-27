package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RoleStatus struct {
	Status           string `bson:"status" json:"status"`
	ProfileCompleted bool   `bson:"profile_completed" json:"profile_completed"`
}

type RoleVerifications struct {
	Event  RoleStatus `bson:"event" json:"event"`
	Play   RoleStatus `bson:"play" json:"play"`
	Dining RoleStatus `bson:"dining" json:"dining"`
}

type OrganizerVerification struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizerID primitive.ObjectID `bson:"organizer_id" json:"organizer_id"`
	PanVerified bool               `bson:"pan_verified" json:"pan_verified"`
	Roles       RoleVerifications  `bson:"roles" json:"roles"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type GSTAccount struct {
	BrandName    string `bson:"brand_name" json:"brand_name"`
	Address      string `bson:"address" json:"address"`
	GSTIN        string `bson:"gstin" json:"gstin"`
	TaxpayerType string `bson:"taxpayer_type" json:"taxpayer_type"`
	GSTStatus    string `bson:"gst_status" json:"gst_status"`
}

type BankDetails struct {
	AccountName     string `bson:"account_name" json:"account_name"`
	AccountNumber   string `bson:"account_number" json:"account_number"`
	IFSC            string `bson:"ifsc" json:"ifsc"`
	FinancePOCName  string `bson:"finance_poc_name" json:"finance_poc_name"`
	FinancePOCPhone string `bson:"finance_poc_phone" json:"finance_poc_phone"`
	City            string `bson:"city" json:"city"`
}

type PlayVerification struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizerID     primitive.ObjectID `bson:"organizer_id" json:"organizer_id"`
	OrgType         string             `bson:"org_type" json:"org_type"`
	PanNumber       string             `bson:"pan_number" json:"pan_number"`
	PanName         string             `bson:"pan_name" json:"pan_name"`
	PanCardURL      string             `bson:"pan_card_url" json:"pan_card_url"`
	GSTAccounts     []GSTAccount       `bson:"gst_accounts" json:"gst_accounts"`
	Bank            BankDetails        `bson:"bank_details" json:"bank_details"`
	BackupEmail     string             `bson:"backup_email" json:"backup_email"`
	AgreementSigned bool               `bson:"agreement_signed" json:"agreement_signed"`
	Status          string             `bson:"status" json:"status"`
	CreatedAt       time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type EventVerification struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizerID     primitive.ObjectID `bson:"organizer_id" json:"organizer_id"`
	OrgType         string             `bson:"org_type" json:"org_type"`
	PanNumber       string             `bson:"pan_number" json:"pan_number"`
	PanName         string             `bson:"pan_name" json:"pan_name"`
	PanCardURL      string             `bson:"pan_card_url" json:"pan_card_url"`
	GSTAccounts     []GSTAccount       `bson:"gst_accounts" json:"gst_accounts"`
	Bank            BankDetails        `bson:"bank_details" json:"bank_details"`
	BackupEmail     string             `bson:"backup_email" json:"backup_email"`
	AgreementSigned bool               `bson:"agreement_signed" json:"agreement_signed"`
	Status          string             `bson:"status" json:"status"`
	CreatedAt       time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type DiningVerification struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizerID     primitive.ObjectID `bson:"organizer_id" json:"organizer_id"`
	OrgType         string             `bson:"org_type" json:"org_type"`
	PanNumber       string             `bson:"pan_number" json:"pan_number"`
	PanName         string             `bson:"pan_name" json:"pan_name"`
	PanCardURL      string             `bson:"pan_card_url" json:"pan_card_url"`
	GSTAccounts     []GSTAccount       `bson:"gst_accounts" json:"gst_accounts"`
	Bank            BankDetails        `bson:"bank_details" json:"bank_details"`
	BackupEmail     string             `bson:"backup_email" json:"backup_email"`
	AgreementSigned bool               `bson:"agreement_signed" json:"agreement_signed"`
	Status          string             `bson:"status" json:"status"`
	CreatedAt       time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updatedAt" json:"updatedAt"`
}
