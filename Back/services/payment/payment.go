package payment

import (
	"bytes"
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

var httpClient = &http.Client{
	Timeout: 30 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     90 * time.Second,
	},
}

func GetPaymentGateway() GatewayType {
	weightStr := os.Getenv("PAYMENT_TRAFFIC_WEIGHT_CASHFREE")
	weight := 0.5
	if weightStr != "" {
		if w, err := strconv.ParseFloat(weightStr, 64); err == nil {
			weight = w
		}
	}

	rand.Seed(time.Now().UnixNano())
	r := rand.Float64()
	if r < weight {
		return GatewayCashfree
	}
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
	httpReq.Header.Add("x-api-version", "2022-01-01")
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
	if gateway == GatewayCashfree {
		return CreateOrderCashfree(req)
	}
	return CreateOrderRazorpay(req)
}

// CreateRefundRazorpay initiates a refund for a Razorpay payment
func CreateRefundRazorpay(paymentID string, amount float64, notes map[string]string) (string, error) {
	keyID := os.Getenv("NEXT_PUBLIC_RAZORPAY_KEY_ID")
	keySecret := os.Getenv("RAZORPAY_KEY_SECRET")

	payload := map[string]interface{}{
		"receipt": paymentID,
	}
	if amount > 0 {
		amountPaise := int64(amount * 100)
		payload["amount"] = amountPaise
	}
	if len(notes) > 0 {
		payload["notes"] = notes
	}

	jsonPayload, _ := json.Marshal(payload)
	httpReq, err := http.NewRequest("POST", "https://api.razorpay.com/v1/refunds", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return "", fmt.Errorf("failed to create refund request: %v", err)
	}

	auth := base64.StdEncoding.EncodeToString([]byte(keyID + ":" + keySecret))
	httpReq.Header.Add("Authorization", "Basic "+auth)
	httpReq.Header.Add("Content-Type", "application/json")

	fmt.Printf("DEBUG: Creating Razorpay refund for Payment ID: %s\n", paymentID)

	resp, err := httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to call razorpay refund API: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("razorpay refund response parse error: %s", string(body))
	}

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("razorpay refund API error (status %d): %s", resp.StatusCode, string(body))
	}

	refundID, _ := result["id"].(string)
	if refundID == "" {
		return "", fmt.Errorf("razorpay did not return refund ID: %s", string(body))
	}

	fmt.Printf("DEBUG: Successfully created Razorpay refund - Refund ID: %s, Payment ID: %s\n", refundID, paymentID)
	return refundID, nil
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
