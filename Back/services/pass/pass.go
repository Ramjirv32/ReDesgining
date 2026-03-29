package pass

import (
	"context"
	"errors"
	"fmt"
	"ticpin-backend/config"
	"ticpin-backend/models"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	PassPrice          = 999.0
	PassDurationMonths = 3
)

var defaultBenefits = models.PassBenefits{
	TurfBookings:         models.BenefitCounter{Total: 2, Used: 0, Remaining: 2},
	DiningVouchers:       models.DiningVoucherBenefit{Total: 2, Used: 0, Remaining: 2, ValueEach: 250},
	EventsDiscountActive: true,
}

func GetActiveByUserID(userID string) (*models.TicpinPass, error) {
	col := config.GetDB().Collection("ticpin_passes")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var p models.TicpinPass
	now := time.Now()
	objID, err := primitive.ObjectIDFromHex(userID)
	if err == nil {
		if err := col.FindOne(ctx, bson.M{
			"user_id":  objID,
			"status":   "active",
			"end_date": bson.M{"$gt": now},
		}).Decode(&p); err == nil {
			return &p, nil
		}
	}

	phonesToTry := []string{userID}
	if len(userID) == 10 {
		phonesToTry = append(phonesToTry, "+91"+userID)
	} else if len(userID) == 13 && userID[:3] == "+91" {
		phonesToTry = append(phonesToTry, userID[3:])
	}

	for _, ph := range phonesToTry {
		fmt.Printf("DEBUG: GetActiveByUserID fallback - trying phone: %s\n", ph)
		if err := col.FindOne(ctx, bson.M{
			"phone":    ph,
			"status":   "active",
			"end_date": bson.M{"$gt": now},
		}).Decode(&p); err == nil {
			return &p, nil
		}
	}

	return nil, errors.New("active pass not found")
}

func GetLatestByUserID(userID string) (*models.TicpinPass, error) {
	col := config.GetDB().Collection("ticpin_passes")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var p models.TicpinPass
	objID, err := primitive.ObjectIDFromHex(userID)
	if err == nil {
		opts := options.FindOne().SetSort(bson.M{"end_date": -1})
		if err := col.FindOne(ctx, bson.M{"user_id": objID}, opts).Decode(&p); err == nil {
			return &p, nil
		}
	}

	phonesToTry := []string{userID}
	if len(userID) == 10 {
		phonesToTry = append(phonesToTry, "+91"+userID)
	} else if len(userID) == 13 && userID[:3] == "+91" {
		phonesToTry = append(phonesToTry, userID[3:])
	}

	for _, ph := range phonesToTry {
		opts := options.FindOne().SetSort(bson.M{"end_date": -1})
		if err := col.FindOne(ctx, bson.M{"phone": ph}, opts).Decode(&p); err == nil {
			return &p, nil
		}
	}

	return nil, errors.New("no pass found for user")
}

func Apply(userID, paymentID string, details models.TicpinPass) (*models.TicpinPass, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	col := config.GetDB().Collection("ticpin_passes")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var existing models.TicpinPass
	now := time.Now()
	if existsErr := col.FindOne(ctx, bson.M{
		"user_id":  objID,
		"status":   "active",
		"end_date": bson.M{"$gt": now},
	}).Decode(&existing); existsErr == nil {
		return nil, errors.New("unexpired active pass already exists")
	}

	price := details.Price
	if price <= 0 {
		price = PassPrice
	}

	p := &models.TicpinPass{
		ID:        primitive.NewObjectID(),
		UserID:    objID,
		PaymentID: paymentID,
		QRToken:   primitive.NewObjectID().Hex(),
		Price:     price,
		Status:    "active",
		StartDate: now,
		EndDate:   now.AddDate(0, PassDurationMonths, 0),
		Benefits:  defaultBenefits,
		Renewals:  []models.RenewalRecord{},
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err = col.InsertOne(ctx, p)
	return p, err
}

func Renew(passID, paymentID string) (*models.TicpinPass, error) {
	objID, err := primitive.ObjectIDFromHex(passID)
	if err != nil {
		return nil, err
	}

	col := config.GetDB().Collection("ticpin_passes")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var p models.TicpinPass
	if err := col.FindOne(ctx, bson.M{"_id": objID}).Decode(&p); err != nil {
		return nil, errors.New("pass not found")
	}

	now := time.Now()
	newStart := p.EndDate
	if now.After(p.EndDate) {
		newStart = now
	}
	newEnd := newStart.AddDate(0, PassDurationMonths, 0)

	renewalRecord := models.RenewalRecord{
		RenewedAt: now,
		StartDate: newStart,
		EndDate:   newEnd,
		PaymentID: paymentID,
		Price:     PassPrice,
	}

	update := bson.M{
		"$set": bson.M{
			"status":     "active",
			"start_date": newStart,
			"end_date":   newEnd,
			"benefits":   defaultBenefits,
			"payment_id": paymentID,
			"updatedAt":  now,
		},
		"$push": bson.M{"renewals": renewalRecord},
	}

	if _, err := col.UpdateOne(ctx, bson.M{"_id": objID}, update); err != nil {
		return nil, err
	}

	p.Status = "active"
	p.StartDate = newStart
	p.EndDate = newEnd
	p.Benefits = defaultBenefits
	p.PaymentID = paymentID
	p.Renewals = append(p.Renewals, renewalRecord)
	return &p, nil
}

func UseTurfBooking(passID string) (*models.TicpinPass, error) {
	return useBenefit(passID, "turf")
}

func UseDiningVoucher(passID string) (*models.TicpinPass, error) {
	return useBenefit(passID, "dining")
}

func useBenefit(passID, benefitType string) (*models.TicpinPass, error) {
	objID, err := primitive.ObjectIDFromHex(passID)
	if err != nil {
		return nil, err
	}

	col := config.GetDB().Collection("ticpin_passes")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var p models.TicpinPass
	if err := col.FindOne(ctx, bson.M{"_id": objID, "status": "active"}).Decode(&p); err != nil {
		return nil, errors.New("active pass not found")
	}

	var updateFields bson.M
	if benefitType == "turf" {
		if p.Benefits.TurfBookings.Remaining <= 0 {
			return nil, errors.New("no turf bookings remaining")
		}
		p.Benefits.TurfBookings.Used++
		p.Benefits.TurfBookings.Remaining--
		updateFields = bson.M{
			"benefits.turf_bookings.used":      p.Benefits.TurfBookings.Used,
			"benefits.turf_bookings.remaining": p.Benefits.TurfBookings.Remaining,
			"updatedAt":                        time.Now(),
		}
	} else {
		if p.Benefits.DiningVouchers.Remaining <= 0 {
			return nil, errors.New("no dining vouchers remaining")
		}
		p.Benefits.DiningVouchers.Used++
		p.Benefits.DiningVouchers.Remaining--
		updateFields = bson.M{
			"benefits.dining_vouchers.used":      p.Benefits.DiningVouchers.Used,
			"benefits.dining_vouchers.remaining": p.Benefits.DiningVouchers.Remaining,
			"updatedAt":                          time.Now(),
		}
	}

	if _, err = col.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": updateFields}); err != nil {
		return nil, err
	}
	return &p, nil
}

func ExpireOld() error {
	col := config.GetDB().Collection("ticpin_passes")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := col.UpdateMany(ctx,
		bson.M{"status": "active", "end_date": bson.M{"$lt": time.Now()}},
		bson.M{"$set": bson.M{"status": "expired", "updatedAt": time.Now()}},
	)
	return err
}
