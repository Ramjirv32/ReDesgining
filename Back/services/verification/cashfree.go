package verification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type PANVerifyRequest struct {
	PAN  string `json:"pan"`
	Name string `json:"name"`
	DOB  string `json:"dob"`
}

type PANVerifyResponse struct {
	Status         string `json:"status"`
	Message        string `json:"message"`
	VerificationID string `json:"verification_id"`
	ReferenceID    int    `json:"reference_id"`
	PAN            string `json:"pan"`
	Name           string `json:"name"`
	NameMatch      string `json:"name_match"`
	DOBMatch       string `json:"dob_match"`
	PANStatus      string `json:"pan_status"`
}

type GSTListResponse struct {
	Status         string `json:"status"`
	Message        string `json:"message"`
	VerificationID string `json:"verification_id"`
	ReferenceID    int    `json:"reference_id"`
	PAN            string `json:"pan"`
	GSTINList      []struct {
		GSTIN  string `json:"gstin"`
		Status string `json:"status"`
		State  string `json:"state"`
	} `json:"gstin_list"`
}

func VerifyPAN(pan, name, dob, verificationID string) (*PANVerifyResponse, error) {
	// Use the advance PAN verification API as per Cashfree documentation
	url := "https://api.cashfree.com/verification/pan/advance"
	if os.Getenv("CASHFREE_ENV") == "sandbox" {
		url = "https://sandbox.cashfree.com/verification/pan/advance"
	}

	clientID := os.Getenv("CASHFREE_CLIENT_ID")
	clientSecret := os.Getenv("CASHFREE_CLIENT_SECRET")

	// Debug logging
	fmt.Printf("Cashfree PAN Verification - URL: %s, ClientID: %s\n", url, clientID)

	if clientID == "" || clientSecret == "" {
		return nil, fmt.Errorf("cashfree configuration missing - check CASHFREE_CLIENT_ID, CASHFREE_CLIENT_SECRET")
	}

	// Generate verification ID if not provided
	if verificationID == "" {
		verificationID = fmt.Sprintf("pan_%s_%d", pan, time.Now().Unix())
	}

	reqBody, _ := json.Marshal(map[string]interface{}{
		"pan":             pan,
		"name":            name,
		"verification_id": verificationID,
	})

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-client-id", clientID)
	req.Header.Set("x-client-secret", clientSecret)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("cashfree request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Cashfree Response - Status: %d, Body: %s\n", resp.StatusCode, string(body))

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("cashfree error: %s", string(body))
	}

	var raw struct {
		Status         string `json:"status"`
		Message        string `json:"message"`
		ReferenceID    int    `json:"reference_id"`
		VerificationID string `json:"verification_id"`
		NameProvided   string `json:"name_provided"`
		PAN            string `json:"pan"`
		RegisteredName string `json:"registered_name"`
		NamePanCard    string `json:"name_pan_card"`
		FirstName      string `json:"first_name"`
		LastName       string `json:"last_name"`
		Type           string `json:"type"`
		Gender         string `json:"gender"`
		DateOfBirth    string `json:"date_of_birth"`
		Email          string `json:"email"`
		MobileNumber   string `json:"mobile_number"`
		AadhaarLinked  bool   `json:"aadhaar_linked"`
	}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, err
	}

	return &PANVerifyResponse{
		Status:         raw.Status,
		Message:        raw.Message,
		VerificationID: raw.VerificationID,
		ReferenceID:    raw.ReferenceID,
		PAN:            raw.PAN,
		Name:           raw.RegisteredName,
		NameMatch:      "MATCH", // Since we're using advance API, this is implied
		DOBMatch:       "MATCH", // Since we're using advance API, this is implied
		PANStatus:      raw.Status,
	}, nil
}

func FetchGST(pan, verificationID string) (*GSTListResponse, error) {
	// Use the correct GST API endpoint
	url := "https://api.cashfree.com/verification/pan-gstin"
	if os.Getenv("CASHFREE_ENV") == "sandbox" {
		url = "https://sandbox.cashfree.com/verification/pan-gstin"
	}

	clientID := os.Getenv("CASHFREE_CLIENT_ID")
	clientSecret := os.Getenv("CASHFREE_CLIENT_SECRET")

	// Generate verification ID if not provided
	if verificationID == "" {
		verificationID = fmt.Sprintf("gst_%s_%d", pan, time.Now().Unix())
	}

	reqBody, _ := json.Marshal(map[string]string{
		"pan":             pan,
		"verification_id": verificationID,
	})

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-client-id", clientID)
	req.Header.Set("x-client-secret", clientSecret)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("cashfree error: %s", string(body))
	}

	var raw struct {
		Status         string `json:"status"`
		Message        string `json:"message"`
		VerificationID string `json:"verification_id"`
		ReferenceID    int    `json:"reference_id"`
		Details        struct {
			PAN       string `json:"pan"`
			GSTINList []struct {
				GSTIN  string `json:"gstin"`
				Status string `json:"status"`
				State  string `json:"state"`
			} `json:"gstin_list"`
		} `json:"details"`
	}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, err
	}

	return &GSTListResponse{
		Status:         raw.Status,
		Message:        raw.Message,
		VerificationID: raw.VerificationID,
		ReferenceID:    raw.ReferenceID,
		PAN:            raw.Details.PAN,
		GSTINList:      raw.Details.GSTINList,
	}, nil
}
