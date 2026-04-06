package verification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
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

type GSTListResponse struct {
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

func VerifyPAN(pan, name string) (*PANVerificationResponse, error) {
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

func GetGSTByPAN(pan string) (*GSTListResponse, error) {
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

	var result GSTListResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return &result, nil
}
