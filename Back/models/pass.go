package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BenefitCounter struct {
	Total     int `bson:"total" json:"total"`
	Used      int `bson:"used" json:"used"`
	Remaining int `bson:"remaining" json:"remaining"`
}

type DiningVoucherBenefit struct {
	Total     int     `bson:"total" json:"total"`
	Used      int     `bson:"used" json:"used"`
	Remaining int     `bson:"remaining" json:"remaining"`
	ValueEach float64 `bson:"value_each" json:"value_each"`
}

type PassBenefits struct {
	TurfBookings         BenefitCounter       `bson:"turf_bookings" json:"turf_bookings"`
	DiningVouchers       DiningVoucherBenefit `bson:"dining_vouchers" json:"dining_vouchers"`
	EventsDiscountActive bool                 `bson:"events_discount_active" json:"events_discount_active"`
}

type RenewalRecord struct {
	RenewedAt time.Time `bson:"renewed_at" json:"renewed_at"`
	StartDate time.Time `bson:"start_date" json:"start_date"`
	EndDate   time.Time `bson:"end_date" json:"end_date"`
	PaymentID string    `bson:"payment_id" json:"payment_id"`
	Price     float64   `bson:"price" json:"price"`
}

type TicpinPass struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
	Name      string             `bson:"name" json:"name"`
	Phone     string             `bson:"phone" json:"phone"`
	Address   string             `bson:"address" json:"address"`
	Country   string             `bson:"country" json:"country"`
	State     string             `bson:"state" json:"state"`
	District  string             `bson:"district" json:"district"`
	PaymentID string             `bson:"payment_id" json:"payment_id"`
	Price     float64            `bson:"price" json:"price"`
	Status    string             `bson:"status" json:"status"`
	StartDate time.Time          `bson:"start_date" json:"start_date"`
	EndDate   time.Time          `bson:"end_date" json:"end_date"`
	Benefits  PassBenefits       `bson:"benefits" json:"benefits"`
	Renewals  []RenewalRecord    `bson:"renewals" json:"renewals"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}
