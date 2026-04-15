package payment

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"time"
)

type GatewayType string

const (
	GatewayCashfree GatewayType = "cashfree"
	GatewayRazorpay GatewayType = "razorpay"
)

var (
	httpClient = &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 10,
			IdleConnTimeout:     90 * time.Second,
		},
	}
	// Track last gateway for alternating pattern
	lastGateway GatewayType = GatewayRazorpay
)

// GetPaymentGatewayAlternating returns alternating gateway: Razorpay -> Cashfree -> Razorpay -> Cashfree
func GetPaymentGatewayAlternating() GatewayType {
	if lastGateway == GatewayRazorpay {
		lastGateway = GatewayCashfree
		fmt.Println("DEBUG: [PAYMENT_GATEWAY] Alternating: CASHFREE")
		return GatewayCashfree
	}
	lastGateway = GatewayRazorpay
	fmt.Println("DEBUG: [PAYMENT_GATEWAY] Alternating: RAZORPAY")
	return GatewayRazorpay
}

// GetPaymentGatewayWeighted uses random weighting (original behavior)
func GetPaymentGatewayWeighted() GatewayType {
	weightStr := os.Getenv("PAYMENT_TRAFFIC_WEIGHT_CASHFREE")
	weight := 0.5
	if weightStr != "" {
		if w, err := strconv.ParseFloat(weightStr, 64); err == nil {
			weight = w
		} else {
			fmt.Printf("DEBUG: Error parsing PAYMENT_TRAFFIC_WEIGHT_CASHFREE: %v\n", err)
		}
	}

	rand.Seed(time.Now().UnixNano())
	r := rand.Float64()
	fmt.Printf("DEBUG: [PAYMENT_GATEWAY] Raw Weight Env: '%s', Parsed Weight: %.2f, Random: %.4f\n", weightStr, weight, r)

	if r < weight {
		fmt.Println("DEBUG: [PAYMENT_GATEWAY] Decision: CASHFREE")
		return GatewayCashfree
	}
	fmt.Println("DEBUG: [PAYMENT_GATEWAY] Decision: RAZORPAY")
	return GatewayRazorpay
}

// GetPaymentGateway is the default selector - uses alternating for play, weighted for others
func GetPaymentGateway() GatewayType {
	return GatewayRazorpay
}

// GetPaymentGatewayForPlay uses alternating pattern: Razorpay -> Cashfree -> Razorpay -> Cashfree
func GetPaymentGatewayForPlay() GatewayType {
	return GatewayRazorpay
}

type OrderRequest struct {
	OrderID       string
	OrderAmount   float64
	Currency      string
	CustomerID    string
	CustomerEmail string
	CustomerPhone string
	ReturnURL     string
	Notes         map[string]string
}

type OrderResponse struct {
	Gateway     GatewayType `json:"gateway"`
	OrderID     string      `json:"order_id"`
	SessionID   string      `json:"payment_session_id,omitempty"`
	RazorpayKey string      `json:"razorpay_key,omitempty"`
}

func CreateOrderCashfree(req OrderRequest) (*OrderResponse, error) {
	clientID := os.Getenv("CASHFREE_CLIENT_ID")
	clientSecret := os.Getenv("CASHFREE_CLIENT_SECRET")
	baseURL := os.Getenv("CASHFREE_PAYMENT_URL")
	if baseURL == "" {
		baseURL = "https://api.cashfree.com/pg" // Use production for testing
	}

	fmt.Printf("DEBUG: Cashfree API - ClientID: %s, BaseURL: %s\n", clientID, baseURL)
	if clientID == "" {
		fmt.Println("DEBUG: WARNING - CASHFREE_CLIENT_ID is empty!")
	}

	expiry := time.Now().Add(30 * time.Minute).In(time.FixedZone("IST", 5*3600+30*60)).
		Format("2006-01-02T15:04:05-07:00")

	payload := map[string]interface{}{
		"order_id":          req.OrderID,
		"order_amount":      req.OrderAmount,
		"order_currency":    req.Currency,
		"order_expiry_time": expiry,
		"customer_details": map[string]string{
			"customer_id":    req.CustomerID,
			"customer_email": req.CustomerEmail,
			"customer_phone": req.CustomerPhone,
		},
	}
	if req.ReturnURL != "" {
		payload["order_meta"] = map[string]string{
			"return_url": req.ReturnURL + "?order_id={order_id}&order_token={order_token}",
		}
	}

	jsonPayload, _ := json.Marshal(payload)
	fmt.Printf("DEBUG: Cashfree Request Payload: %s\n", string(jsonPayload))

	httpReq, err := http.NewRequest("POST", baseURL+"/orders", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Add("x-client-id", clientID)
	httpReq.Header.Add("x-client-secret", clientSecret)
	httpReq.Header.Add("x-api-version", "2023-08-01")
	httpReq.Header.Add("Content-Type", "application/json")

	fmt.Printf("DEBUG: Cashfree Request URL: %s\n", httpReq.URL.String())
	fmt.Printf("DEBUG: Cashfree Request Headers: %+v\n", httpReq.Header)

	resp, err := httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("DEBUG: Cashfree Response Status: %d\n", resp.StatusCode)
	fmt.Printf("DEBUG: Cashfree Response Body: %s\n", string(body))

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("cashfree response parse error: %s", string(body))
	}

	// Check for error response
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("cashfree order creation failed: %s", string(body))
	}

	sessionID, _ := result["payment_session_id"].(string)
	if sessionID == "" {
		// Version 2022-01-01 uses order_token
		sessionID, _ = result["order_token"].(string)
	}

	if sessionID == "" {
		return nil, fmt.Errorf("cashfree order creation failed: %s", string(body))
	}

	return &OrderResponse{
		Gateway:   GatewayCashfree,
		OrderID:   req.OrderID,
		SessionID: sessionID,
	}, nil
}

func CreateOrderRazorpay(req OrderRequest) (*OrderResponse, error) {
	keyID := os.Getenv("NEXT_PUBLIC_RAZORPAY_KEY_ID")
	keySecret := os.Getenv("RAZORPAY_KEY_SECRET")

	amountPaise := int64(req.OrderAmount * 100)
	payload := map[string]interface{}{
		"amount":   amountPaise,
		"currency": req.Currency,
		"receipt":  req.OrderID,
	}
	if req.Notes != nil {
		payload["notes"] = req.Notes
	}

	jsonPayload, _ := json.Marshal(payload)
	httpReq, err := http.NewRequest("POST", "https://api.razorpay.com/v1/orders", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, err
	}

	auth := base64.StdEncoding.EncodeToString([]byte(keyID + ":" + keySecret))
	httpReq.Header.Add("Authorization", "Basic "+auth)
	httpReq.Header.Add("Content-Type", "application/json")

	resp, err := httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("razorpay response parse error: %s", string(body))
	}

	orderID, _ := result["id"].(string)
	if orderID == "" {
		return nil, fmt.Errorf("razorpay order creation failed: %s", string(body))
	}

	return &OrderResponse{
		Gateway:     GatewayRazorpay,
		OrderID:     orderID,
		RazorpayKey: keyID,
	}, nil
}

func CreateOrder(req OrderRequest) (*OrderResponse, error) {
	if req.Currency == "" {
		req.Currency = "INR"
	}
	if req.CustomerID == "" {
		req.CustomerID = "user_" + req.CustomerPhone
	}
	gateway := GetPaymentGateway()
	return CreateOrderWithGateway(req, gateway)
}

// CreateOrderWithGateway creates order with specified gateway
func CreateOrderWithGateway(req OrderRequest, gateway GatewayType) (*OrderResponse, error) {
	if req.Currency == "" {
		req.Currency = "INR"
	}
	if req.CustomerID == "" {
		req.CustomerID = "user_" + req.CustomerPhone
	}
	if gateway == GatewayCashfree {
		return CreateOrderCashfree(req)
	}
	return CreateOrderRazorpay(req)
}

// CreateRefundRazorpay initiates a refund for a Razorpay payment
func CreateRefundRazorpay(paymentID string, amount float64, notes map[string]string) (string, error) {
	url := fmt.Sprintf("https://api.razorpay.com/v1/payments/%s/refund", paymentID)

	payload := map[string]interface{}{
		"amount": int(amount * 100), // paise
	}
	
	if len(notes) > 0 {
		payload["notes"] = notes
	}

	body, _ := json.Marshal(payload)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}

	keyID := os.Getenv("NEXT_PUBLIC_RAZORPAY_KEY_ID")
	keySecret := os.Getenv("RAZORPAY_KEY_SECRET")

	req.SetBasicAuth(keyID, keySecret)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("razorpay refund failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var jsonResp map[string]interface{}
	json.Unmarshal(respBody, &jsonResp)

	if id, ok := jsonResp["id"].(string); ok {
		return id, nil
	}

	return "", fmt.Errorf("could not parse refund id from razorpay response")
}

// ======================= RAZORPAYX PAYOUTS =======================

func CreateRazorpayContact(name, email, phone, referenceID string) (string, error) {
	url := "https://api.razorpay.com/v1/contacts"
	
	payload := map[string]interface{}{
		"name": name,
		"email": email,
		"contact": phone,
		"type": "vendor",
		"reference_id": referenceID,
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}

	req.SetBasicAuth(os.Getenv("RAZORPAY_KEY"), os.Getenv("RAZORPAY_SECRET"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("create contact failed: %s", string(respBody))
	}

	var jsonResp map[string]interface{}
	json.Unmarshal(respBody, &jsonResp)
	if id, ok := jsonResp["id"].(string); ok {
		return id, nil
	}
	return "", fmt.Errorf("could not parse contact id")
}

func CreateRazorpayFundAccount(contactID, name, ifsc, accountNumber string) (string, error) {
	url := "https://api.razorpay.com/v1/fund_accounts"
	
	payload := map[string]interface{}{
		"contact_id": contactID,
		"account_type": "bank_account",
		"bank_account": map[string]interface{}{
			"name": name,
			"ifsc": ifsc,
			"account_number": accountNumber,
		},
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}

	req.SetBasicAuth(os.Getenv("RAZORPAY_KEY"), os.Getenv("RAZORPAY_SECRET"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("create fund account failed: %s", string(respBody))
	}

	var jsonResp map[string]interface{}
	json.Unmarshal(respBody, &jsonResp)
	if id, ok := jsonResp["id"].(string); ok {
		return id, nil
	}
	return "", fmt.Errorf("could not parse fund account id")
}

func TriggerRazorpayPayout(fundAccountID string, amount float64, referenceID, narration string) (string, error) {
	url := "https://api.razorpay.com/v1/payouts"
	
	// Create payout request. Mode: IMPS for immediate, NEFT for standard processing.
	// We'll queue it if low balance.
	payload := map[string]interface{}{
		"account_number": os.Getenv("RAZORPAY_PAYOUT_ACCOUNT"), // Business account number used to fund payouts (requires X config)
		"fund_account_id": fundAccountID,
		"amount": int(amount * 100), // convert to paise
		"currency": "INR",
		"mode": "IMPS",
		"purpose": "payout",
		"queue_if_low_balance": true,
		"reference_id": referenceID,
		"narration": narration,
	}

	// For safety, if Payout Account isn't set, default to standard "business" type.
	if os.Getenv("RAZORPAY_PAYOUT_ACCOUNT") == "" {
		delete(payload, "account_number")
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}

	req.SetBasicAuth(os.Getenv("RAZORPAY_KEY"), os.Getenv("RAZORPAY_SECRET"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("payout failed: %s", string(respBody))
	}

	var jsonResp map[string]interface{}
	json.Unmarshal(respBody, &jsonResp)
	if id, ok := jsonResp["id"].(string); ok {
		return id, nil // payout ID
	}
	return "", fmt.Errorf("could not parse payout id")
}

// CreateRefund initiates a refund based on payment gateway
func CreateRefund(paymentID string, amount float64, notes map[string]string) (string, error) {
	gateway := GetPaymentGateway()
	if gateway == GatewayCashfree {
		// Cashfree refund implementation (if needed in future)
		return "", fmt.Errorf("cashfree refunds not yet implemented")
	}
	return CreateRefundRazorpay(paymentID, amount, notes)
}
// VerifyRazorpaySignature verifies the authenticity of Razorpay payment
func VerifyRazorpaySignature(orderID, paymentID, signature string) bool {
	secret := os.Getenv("RAZORPAY_KEY_SECRET")
	if secret == "" {
		fmt.Println("DEBUG: RAZORPAY_KEY_SECRET is empty!")
		return false
	}

	payload := orderID + "|" + paymentID
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(payload))
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	return expectedSignature == signature
}
