package verification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
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
	url := os.Getenv("CASHFREE_VERIFICATION_URL") + "/pan"
	clientID := os.Getenv("CASHFREE_CLIENT_ID")
	clientSecret := os.Getenv("CASHFREE_CLIENT_SECRET")

	reqBody, _ := json.Marshal(PANVerifyRequest{
		PAN:  pan,
		Name: name,
		DOB:  dob,
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
			Name      string `json:"name"`
			NameMatch string `json:"name_match"`
			DOBMatch  string `json:"dob_match"`
			PANStatus string `json:"pan_status"`
		} `json:"details"`
	}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, err
	}

	return &PANVerifyResponse{
		Status:         raw.Status,
		Message:        raw.Message,
		VerificationID: raw.VerificationID,
		ReferenceID:    raw.ReferenceID,
		PAN:            raw.Details.PAN,
		Name:           raw.Details.Name,
		NameMatch:      raw.Details.NameMatch,
		DOBMatch:       raw.Details.DOBMatch,
		PANStatus:      raw.Details.PANStatus,
	}, nil
}

func FetchGST(pan, verificationID string) (*GSTListResponse, error) {
	url := os.Getenv("CASHFREE_VERIFICATION_URL") + "/gstin"
	clientID := os.Getenv("CASHFREE_CLIENT_ID")
	clientSecret := os.Getenv("CASHFREE_CLIENT_SECRET")

	reqBody, _ := json.Marshal(map[string]string{
		"pan": pan,
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

