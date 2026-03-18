package organizer

import (
	"context"
	"errors"
	"os"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"
	verifysvc "ticpin-backend/services/verification"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

func LoginOrCreate(email, password string) (*models.Organizer, bool, error) {
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&org)
	if err != nil {
		// Check if email exists in users collection - prevent user email from being used for organizer
		var existingUser bson.M
		err := config.UsersCol.FindOne(ctx, bson.M{"email": email}).Decode(&existingUser)
		if err == nil {
			return nil, false, errors.New("email already registered as a user. please login or use a different email")
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return nil, false, err
		}
		org = models.Organizer{
			ID:                primitive.NewObjectID(),
			Email:             email,
			Password:          string(hashed),
			OrganizerCategory: []string{},
			IsVerified:        false,
			CreatedAt:         time.Now(),
		}
		if _, err := collection.InsertOne(ctx, org); err != nil {
			return nil, false, err
		}
		_ = verifysvc.CreateOrganizerVerification(org.ID)
		return &org, true, nil
	}
	if err := bcrypt.CompareHashAndPassword([]byte(org.Password), []byte(password)); err != nil {
		return nil, false, errors.New("invalid password")
	}
	return &org, false, nil
}

func SendOTP(email, category string) error {
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	otp := config.GenerateOTP()
	expiry := time.Now().Add(10 * time.Minute)
	_, err := collection.UpdateOne(ctx, bson.M{"email": email}, bson.M{
		"$set": bson.M{"otp": otp, "otpExpiry": expiry},
	})
	if err != nil {
		return err
	}
	switch category {
	case "events":
		return config.SendEventsOTP(email, otp)
	case "dining":
		return config.SendDiningOTP(email, otp)
	default:
		return config.SendPlayOTP(email, otp)
	}
}

func VerifyOTP(email, otp string) (*models.Organizer, error) {
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&org); err != nil {
		return nil, errors.New("organizer not found")
	}
	if org.OTP != otp {
		return nil, errors.New("invalid otp")
	}
	if time.Now().After(org.OTPExpiry) {
		return nil, errors.New("otp expired")
	}
	_, err := collection.UpdateOne(ctx, bson.M{"email": email}, bson.M{
		"$set": bson.M{"isVerified": true, "otp": "", "otpExpiry": time.Time{}},
	})
	if err != nil {
		return nil, err
	}
	org.IsVerified = true
	return &org, nil
}

func GetByID(id string) (*models.Organizer, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&org); err != nil {
		return nil, err
	}
	return &org, nil
}

func CreateProfile(p *models.OrganizerProfile) error {
	p.ID = primitive.NewObjectID()
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	collection := config.GetDB().Collection("organizer_profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := collection.InsertOne(ctx, p)
	return err
}

func GetProfileByID(organizerID string) (*models.OrganizerProfile, error) {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return nil, err
	}
	collection := config.GetDB().Collection("organizer_profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var p models.OrganizerProfile
	if err := collection.FindOne(ctx, bson.M{"organizerId": objID}).Decode(&p); err != nil {
		return nil, err
	}
	return &p, nil
}

func UpdateProfile(organizerID string, p *models.OrganizerProfile) error {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}
	p.UpdatedAt = time.Now()
	collection := config.GetDB().Collection("organizer_profiles")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = collection.UpdateOne(ctx, bson.M{"organizerId": objID}, bson.M{"$set": p})
	return err
}

func IsAdmin(organizer models.Organizer) bool {
	return organizer.Role == "admin"
}

func IsAdminByEmail(email string) bool {
	adminEmail := config.GetAdminEmail()
	return email == adminEmail
}

func Login(email, password string) (*models.Organizer, error) {
	adminEmail := config.GetAdminEmail()
	adminPass := os.Getenv("ADMIN_PASSWORD")
	if adminEmail != "" && adminPass != "" && email == adminEmail && password == adminPass {
		collection := config.GetDB().Collection("organizers")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		var org models.Organizer
		err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&org)
		if err == nil {
			return &org, nil
		}
		hashed, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		org = models.Organizer{
			ID:             primitive.NewObjectID(),
			Email:          email,
			Password:       string(hashed),
			Role:           "admin", // Admin users get admin role
			IsVerified:     true,
			CategoryStatus: map[string]string{},
			CreatedAt:      time.Now(),
		}
		collection.InsertOne(ctx, org)
		return &org, nil
	}

	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&org); err != nil {
		return nil, errors.New("user_not_found")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(org.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid_password")
	}
	return &org, nil
}

func Create(email, password string) (*models.Organizer, error) {
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if email already exists in organizers
	var existing models.Organizer
	if err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&existing); err == nil {
		return nil, errors.New("email_exists")
	}

	// Check if email exists in users collection - prevent user email from being used for organizer
	var existingUser bson.M
	err := config.UsersCol.FindOne(ctx, bson.M{"email": email}).Decode(&existingUser)
	if err == nil {
		return nil, errors.New("email already registered as a user. please login or use a different email")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	org := models.Organizer{
		ID:                primitive.NewObjectID(),
		Email:             email,
		Password:          string(hashed),
		OrganizerCategory: []string{},
		CategoryStatus:    map[string]string{},
		IsVerified:        false,
		CreatedAt:         time.Now(),
	}
	if _, err := collection.InsertOne(ctx, org); err != nil {
		return nil, err
	}
	_ = verifysvc.CreateOrganizerVerification(org.ID)
	return &org, nil
}

func UpdateCategoryStatus(organizerID, category, status string) error {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}

	// Update organizers collection
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	key := "categoryStatus." + category
	_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{key: status},
	})
	if err != nil {
		return err
	}

	// Also update organizer_setups collection with roles
	setupCollection := config.GetDB().Collection("organizer_setups")
	setupCtx, setupCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer setupCancel()

	// Update the roles field based on status
	roleStatus := "not_applied"
	profileCompleted := false

	if status == "pending" {
		roleStatus = "pending"
		profileCompleted = true
	} else if status == "approved" {
		roleStatus = "approved"
		profileCompleted = true
	}

	rolesKey := "roles." + category
	_, err = setupCollection.UpdateOne(setupCtx, bson.M{"organizer_id": objID}, bson.M{
		"$set": bson.M{
			rolesKey: bson.M{
				"status":            roleStatus,
				"profile_completed": profileCompleted,
			},
			"updatedAt": time.Now(),
		},
	})

	return err
}

func GetCategoryStatus(organizerID string) (map[string]string, error) {
	org, err := GetByID(organizerID)
	if err != nil {
		return nil, err
	}
	if org.CategoryStatus == nil {
		return map[string]string{}, nil
	}
	return org.CategoryStatus, nil
}

func GetExistingSetup(organizerID string) (*models.OrganizerSetup, error) {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return nil, err
	}
	collection := config.GetDB().Collection("organizer_setups")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var setup models.OrganizerSetup
	if err := collection.FindOne(ctx, bson.M{"organizerId": objID}).Decode(&setup); err != nil {
		return nil, err
	}
	return &setup, nil
}

func CheckPANDuplicate(pan, organizerID string) error {
	if pan == "" {
		return nil
	}
	objID, _ := primitive.ObjectIDFromHex(organizerID)
	collection := config.GetDB().Collection("organizer_setups")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var existing models.OrganizerSetup
	err := collection.FindOne(ctx, bson.M{
		"pan":         pan,
		"organizerId": bson.M{"$ne": objID},
	}).Decode(&existing)
	if err == nil {
		return errors.New("pan_already_used")
	}
	return nil
}

func SaveSetup(setup *models.OrganizerSetup) error {
	collection := config.GetDB().Collection("organizer_setups")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingAny models.OrganizerSetup
	err := collection.FindOne(ctx, bson.M{"organizerId": setup.OrganizerID}).Decode(&existingAny)
	if err == nil {

		if existingAny.PAN != "" && setup.PAN != "" && existingAny.PAN != setup.PAN {
			return errors.New("pan_mismatch")
		}
	}

	if err := CheckPANDuplicate(setup.PAN, setup.OrganizerID.Hex()); err != nil {
		return err
	}

	setup.UpdatedAt = time.Now()

	filter := bson.M{"organizerId": setup.OrganizerID, "category": setup.Category}
	setFields := bson.M{
		"organizerId":   setup.OrganizerID,
		"category":      setup.Category,
		"orgType":       setup.OrgType,
		"phone":         setup.Phone,
		"bankAccountNo": setup.BankAccountNo,
		"bankIfsc":      setup.BankIfsc,
		"bankName":      setup.BankName,
		"accountHolder": setup.AccountHolder,
		"gstNumber":     setup.GSTNumber,
		"pan":           setup.PAN,
		"panName":       setup.PANName,
		"panDOB":        setup.PANDOB,
		"panCardUrl":    setup.PANCardURL,
		"backupEmail":   setup.BackupEmail,
		"backupPhone":   setup.BackupPhone,
		"panVerified":   setup.PANVerified,
		"verifiedName":  setup.VerifiedName,
		"gstList":       setup.GSTList,
		"updatedAt":     setup.UpdatedAt,
	}
	update := bson.M{
		"$set":         setFields,
		"$setOnInsert": bson.M{"_id": primitive.NewObjectID(), "createdAt": time.Now()},
	}
	opts := &options.UpdateOptions{}
	upsert := true
	opts.Upsert = &upsert
	if _, err := collection.UpdateOne(ctx, filter, update, opts); err != nil {
		return err
	}
	return UpdateCategoryStatus(setup.OrganizerID.Hex(), setup.Category, "pending")
}

func SendBackupOTP(organizerID, backupEmail, category string) error {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	otp := config.GenerateOTP()
	expiry := time.Now().Add(10 * time.Minute)
	_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{"backupOTP": otp, "backupOTPExpiry": expiry},
	})
	if err != nil {
		return err
	}
	switch category {
	case "events":
		return config.SendEventsOTP(backupEmail, otp)
	case "dining":
		return config.SendDiningOTP(backupEmail, otp)
	default:
		return config.SendPlayOTP(backupEmail, otp)
	}
}

func VerifyBackupOTP(organizerID, otp string) error {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&org); err != nil {
		return errors.New("organizer not found")
	}
	if org.BackupOTP != otp {
		return errors.New("invalid otp")
	}
	if time.Now().After(org.BackupOTPExpiry) {
		return errors.New("otp expired")
	}
	_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{"backupOTP": "", "backupOTPExpiry": time.Time{}},
	})
	return err
}
func GoogleAuth(email string) (*models.Organizer, error) {
	collection := config.GetDB().Collection("organizers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if email exists in users collection - prevent user email from being used for organizer
	var existingUser bson.M
	err := config.UsersCol.FindOne(ctx, bson.M{"email": email}).Decode(&existingUser)
	if err == nil {
		return nil, errors.New("email already registered as a user. please login or use a different email")
	}

	var org models.Organizer
	err = collection.FindOne(ctx, bson.M{"email": email}).Decode(&org)
	if err != nil {

		org = models.Organizer{
			ID:                primitive.NewObjectID(),
			Email:             email,
			OrganizerCategory: []string{},
			CategoryStatus:    map[string]string{},
			IsVerified:        true,
			CreatedAt:         time.Now(),
		}
		if _, err := collection.InsertOne(ctx, org); err != nil {
			return nil, err
		}
		_ = verifysvc.CreateOrganizerVerification(org.ID)
		return &org, nil
	}

	if !org.IsVerified {
		_, _ = collection.UpdateOne(ctx, bson.M{"_id": org.ID}, bson.M{"$set": bson.M{"isVerified": true}})
		org.IsVerified = true
	}

	return &org, nil
}
