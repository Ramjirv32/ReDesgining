package pass

import (
	"context"
	"errors"
	"ticpin-backend/config"
	"ticpin-backend/models"
	profilesvc "ticpin-backend/services/profile"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	col := config.GetDB().Collection("ticpin_passes")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var p models.TicpinPass
	if err := col.FindOne(ctx, bson.M{"user_id": objID, "status": "active"}).Decode(&p); err != nil {
		return nil, err
	}
	return &p, nil
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
	if existsErr := col.FindOne(ctx, bson.M{"user_id": objID, "status": "active"}).Decode(&existing); existsErr == nil {
		return nil, errors.New("active pass already exists")
	}

	userProfile, _ := profilesvc.GetByUserID(userID)
	if userProfile != nil {
		if details.Name == "" {
			details.Name = userProfile.Name
		}
		if details.Phone == "" {
			details.Phone = userProfile.Phone
		}
		if details.Address == "" {
			details.Address = userProfile.Address
		}
		if details.Country == "" {
			details.Country = userProfile.Country
		}
		if details.State == "" {
			details.State = userProfile.State
		}
		if details.District == "" {
			details.District = userProfile.District
		}
	}

	now := time.Now()
	p := &models.TicpinPass{
		ID:        primitive.NewObjectID(),
		UserID:    objID,
		Name:      details.Name,
		Phone:     details.Phone,
		Address:   details.Address,
		Country:   details.Country,
		State:     details.State,
		District:  details.District,
		PaymentID: paymentID,
		Price:     PassPrice,
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
