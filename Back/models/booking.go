package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BookingTicket struct {
	Category string  `bson:"category" json:"category"`
	Price    float64 `bson:"price" json:"price"`
	Quantity int     `bson:"quantity" json:"quantity"`
}

type Booking struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserEmail      string             `bson:"user_email" json:"user_email"`
	UserPhone      string             `bson:"user_phone" json:"user_phone"`
	UserID         string             `bson:"user_id" json:"user_id"`
	EventID        primitive.ObjectID `bson:"event_id" json:"event_id"`
	OrganizerID    primitive.ObjectID `bson:"organizer_id" json:"organizer_id"`
	EventName      string             `bson:"event_name" json:"event_name"`
	Tickets        []BookingTicket    `bson:"tickets" json:"tickets"`
	OrderAmount    float64            `bson:"order_amount" json:"order_amount"`
	BookingFee     float64            `bson:"booking_fee" json:"booking_fee"`
	DiscountAmount float64            `bson:"discount_amount" json:"discount_amount"`
	CouponCode     string             `bson:"coupon_code" json:"coupon_code"`
	OfferID        primitive.ObjectID `bson:"offer_id,omitempty" json:"offer_id,omitempty"`
	GrandTotal     float64            `bson:"grand_total" json:"grand_total"`
	PaymentID      string             `bson:"payment_id,omitempty" json:"payment_id,omitempty"`
	PaymentGateway string             `bson:"payment_gateway,omitempty" json:"payment_gateway,omitempty"`
	Status         string             `bson:"status" json:"status"`
	BookedAt       time.Time          `bson:"booked_at" json:"booked_at"`
}

type PlayBooking struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserEmail      string             `bson:"user_email" json:"user_email"`
	UserID         string             `bson:"user_id" json:"user_id"`
	PlayID         primitive.ObjectID `bson:"play_id" json:"play_id"`
	OrganizerID    primitive.ObjectID `bson:"organizer_id" json:"organizer_id"`
	VenueName      string             `bson:"venue_name" json:"venue_name"`
	Date           string             `bson:"date" json:"date"`
	Slot           string             `bson:"slot" json:"slot"`
	Duration       int                `bson:"duration" json:"duration"`
	Tickets        []BookingTicket    `bson:"tickets" json:"tickets"`
	OrderAmount    float64            `bson:"order_amount" json:"order_amount"`
	BookingFee     float64            `bson:"booking_fee" json:"booking_fee"`
	DiscountAmount float64            `bson:"discount_amount" json:"discount_amount"`
	CouponCode     string             `bson:"coupon_code" json:"coupon_code"`
	OfferID        primitive.ObjectID `bson:"offer_id,omitempty" json:"offer_id,omitempty"`
	GrandTotal     float64            `bson:"grand_total" json:"grand_total"`
	PaymentID      string             `bson:"payment_id,omitempty" json:"payment_id,omitempty"`
	PaymentGateway string             `bson:"payment_gateway,omitempty" json:"payment_gateway,omitempty"`
	Status         string             `bson:"status" json:"status"`
	BookedAt       time.Time          `bson:"booked_at" json:"booked_at"`
}

type DiningBooking struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserEmail      string             `bson:"user_email" json:"user_email"`
	UserID         string             `bson:"user_id" json:"user_id"`
	DiningID       primitive.ObjectID `bson:"dining_id" json:"dining_id"`
	OrganizerID    primitive.ObjectID `bson:"organizer_id" json:"organizer_id"`
	VenueName      string             `bson:"venue_name" json:"venue_name"`
	Date           string             `bson:"date" json:"date"`
	TimeSlot       string             `bson:"time_slot" json:"time_slot"`
	Guests         int                `bson:"guests" json:"guests"`
	OrderAmount    float64            `bson:"order_amount" json:"order_amount"`
	BookingFee     float64            `bson:"booking_fee" json:"booking_fee"`
	DiscountAmount float64            `bson:"discount_amount" json:"discount_amount"`
	CouponCode     string             `bson:"coupon_code" json:"coupon_code"`
	OfferID        primitive.ObjectID `bson:"offer_id,omitempty" json:"offer_id,omitempty"`
	GrandTotal     float64            `bson:"grand_total" json:"grand_total"`
	PaymentID      string             `bson:"payment_id,omitempty" json:"payment_id,omitempty"`
	PaymentGateway string             `bson:"payment_gateway,omitempty" json:"payment_gateway,omitempty"`
	Status         string             `bson:"status" json:"status"`
	BookedAt       time.Time          `bson:"booked_at" json:"booked_at"`
}
