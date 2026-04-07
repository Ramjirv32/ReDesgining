package verification

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"ticpin-backend/config"
	"ticpin-backend/models"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PANVerificationResponse struct {
	Status         string `json:"status"`
	Message        string `json:"message"`
	ReferenceID    int    `json:"reference_id"`
	VerificationID string `json:"verification_id"`
	RegisteredName string `json:"registered_name"`
	NamePanCard    string `json:"name_pan_card"`
}

type GSTListItem struct {
	GSTIN  string `json:"gstin"`
	Status string `json:"status"`
	State  string `json:"state"`
}

type LegacyGSTListResponse struct {
	ReferenceID    int           `json:"reference_id"`
	VerificationID string        `json:"verification_id"`
	Status         string        `json:"status"`
	PAN            string        `json:"pan"`
	GSTINList      []GSTListItem `json:"gstin_list"`
}

func getCashfreeHeaders(req *http.Request) {
	req.Header.Add("x-client-id", os.Getenv("CASHFREE_CLIENT_ID"))
	req.Header.Add("x-client-secret", os.Getenv("CASHFREE_CLIENT_SECRET"))
	req.Header.Add("Content-Type", "application/json")
}

func VerifyPANLegacy(pan, name string) (*PANVerificationResponse, error) {
	url := "https://api.cashfree.com/verification/pan/advance"
	if os.Getenv("CASHFREE_ENV") == "sandbox" {
		url = "https://sandbox.cashfree.com/verification/pan/advance"
	}

	payload := map[string]string{
		"pan":             pan,
		"name":            name,
		"verification_id": fmt.Sprintf("pan_%s", pan),
	}
	jsonPayload, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	getCashfreeHeaders(req)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("verification failed with status: %d, body: %s", res.StatusCode, string(body))
	}

	var result PANVerificationResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

func GetGSTByPAN(pan string) (*LegacyGSTListResponse, error) {
	url := "https://api.cashfree.com/verification/pan-gstin"
	if os.Getenv("CASHFREE_ENV") == "sandbox" {
		url = "https://sandbox.cashfree.com/verification/pan-gstin"
	}

	payload := map[string]string{
		"pan":             pan,
		"verification_id": fmt.Sprintf("gst_list_%s", pan),
	}
	jsonPayload, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	getCashfreeHeaders(req)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("fetching GST list failed with status: %d, body: %s", res.StatusCode, string(body))
	}

	var result LegacyGSTListResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// CreateOrganizerVerification creates a new organizer verification record
func CreateOrganizerVerification(organizerID primitive.ObjectID) error {
	v := models.OrganizerVerification{
		ID:          primitive.NewObjectID(),
		OrganizerID: organizerID,
		PanVerified: false,
		Roles: models.RoleVerifications{
			Event:  models.RoleStatus{Status: "not_applied", ProfileCompleted: false},
			Play:   models.RoleStatus{Status: "not_applied", ProfileCompleted: false},
			Dining: models.RoleStatus{Status: "not_applied", ProfileCompleted: false},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	col := config.GetDB().Collection("organizer_verifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := col.InsertOne(ctx, v)
	return err
}

// SubmitDiningVerification submits a dining verification request
func SubmitDiningVerification(v *models.DiningVerification) error {
	v.ID = primitive.NewObjectID()
	v.Status = "pending"
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	col := config.GetDB().Collection("dining_verifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := col.InsertOne(ctx, v); err != nil {
		return err
	}
	return setRolePending(v.OrganizerID, "dining")
}

// SubmitPlayVerification submits a play verification request
func SubmitPlayVerification(v *models.PlayVerification) error {
	v.ID = primitive.NewObjectID()
	v.Status = "pending"
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	col := config.GetDB().Collection("play_verifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := col.InsertOne(ctx, v); err != nil {
		return err
	}
	return setRolePending(v.OrganizerID, "play")
}

// SubmitEventVerification submits an event verification request
func SubmitEventVerification(v *models.EventVerification) error {
	v.ID = primitive.NewObjectID()
	v.Status = "pending"
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	col := config.GetDB().Collection("event_verifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := col.InsertOne(ctx, v); err != nil {
		return err
	}
	return setRolePending(v.OrganizerID, "event")
}

// setRolePending sets a role status to pending
func setRolePending(organizerID primitive.ObjectID, role string) error {
	col := config.GetDB().Collection("organizer_verifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	field := "roles." + role + ".status"
	_, err := col.UpdateOne(ctx, bson.M{"organizer_id": organizerID}, bson.M{
		"$set": bson.M{field: "pending", "updatedAt": time.Now()},
	})
	return err
}
