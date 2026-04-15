package config

import (
	"bytes"
	"fmt"
	"html/template"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
	"time"

	gomail "gopkg.in/gomail.v2"
)

type BookingEmailData struct {
	Day               string
	Date              string
	Month             string
	Time              string
	EventName         string
	PlayName          string
	Venue             string
	VenueAddress      string
	Location          string
	BookingID         string
	TicketCount       int
	GateOpeningTime   string
	Duration          int
	Offer             string
	UserPhone         string
	EventImageURL     string
	PlayImageURL      string
	RestaurantName    string
	RestaurantAddress string
	VoucherID         string
	VoucherValue      string
	PartySize         int
	PassName          string
	PurchaseID        string
}

func sendOTP(from, pass, to, subject, body string) error {
	cleanPass := strings.ReplaceAll(pass, " ", "")

	fmt.Printf("[SMTP DEBUG] Gmail: %s -> %s\n", from, to)

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	// Use port 587 with STARTTLS (like Node.js nodemailer)
	d := gomail.NewDialer("smtp.gmail.com", 587, from, cleanPass)

	// Disable SSL (use STARTTLS like Node.js secure: false)
	d.SSL = false

	// Set timeouts like Node.js
	d.LocalName = "ticpin.in"

	// Add retry logic
	var lastErr error
	maxRetries := 3

	for i := 0; i < maxRetries; i++ {
		fmt.Printf("SMTP attempt %d/%d for: %s\n", i+1, maxRetries, to)

		// Create a channel for timeout handling
		done := make(chan error, 1)

		go func() {
			done <- d.DialAndSend(m)
		}()

		// Wait with 15 second timeout per attempt (like Node.js socketTimeout)
		select {
		case err := <-done:
			if err == nil {
				fmt.Printf("✅ OTP sent successfully to: %s\n", to)
				return nil
			}
			lastErr = err
			fmt.Printf("❌ SMTP attempt %d failed: %v\n", i+1, err)

			if strings.Contains(err.Error(), "535") || strings.Contains(err.Error(), "authentication") {
				return fmt.Errorf("authentication failed: %w", err)
			}

			if i < maxRetries-1 {
				time.Sleep(time.Duration(i+1) * time.Second)
			}

		case <-time.After(15 * time.Second):
			lastErr = fmt.Errorf("connection timeout after 15 seconds")
			fmt.Printf("⏱️ SMTP attempt %d timed out\n", i+1)

			if i < maxRetries-1 {
				time.Sleep(time.Duration(i+1) * time.Second)
			}
		}
	}

	return fmt.Errorf("failed after %d attempts: %w", maxRetries, lastErr)
}

func renderOTPTemplate(category, otp string) (string, error) {
	tmplPath := filepath.Join("templates", "otp.html")
	// Try absolute path if relative fails or to be sure
	if _, err := os.Stat(tmplPath); os.IsNotExist(err) {
		// Fallback for different run contexts
		tmplPath = filepath.Join("Back", "templates", "otp.html")
	}

	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		return "", err
	}

	var body bytes.Buffer
	data := struct {
		Category string
		OTP      string
	}{
		Category: category,
		OTP:      otp,
	}

	if err := tmpl.Execute(&body, data); err != nil {
		return "", err
	}

	return body.String(), nil
}

func renderBookingTemplate(templateName string, data BookingEmailData) (string, error) {
	tmplPath := filepath.Join("templates", templateName)
	if _, err := os.Stat(tmplPath); os.IsNotExist(err) {
		tmplPath = filepath.Join("Back", "templates", templateName)
	}

	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		return "", err
	}

	var body bytes.Buffer
	if err := tmpl.Execute(&body, data); err != nil {
		return "", err
	}

	return body.String(), nil
}

func SendBookingConfirmation(toEmail string, category string, data BookingEmailData) error {
	var from, pass, subject, templateName string

	switch category {
	case "play":
		from = os.Getenv("PLAY_EMAIL")
		pass = os.Getenv("PLAY_APP_PASSWORD")
		subject = "Ticpin Play Booking Confirmed: #" + data.BookingID
		templateName = "play_confirmation.html"
	case "events":
		from = os.Getenv("EVENTS_EMAIL")
		pass = os.Getenv("EVENTS_APP_PASSWORD")
		subject = "Ticpin Event Booking Confirmed: #" + data.BookingID
		templateName = "event_confirmation.html"
	case "dining":
		from = os.Getenv("DINING_EMAIL")
		pass = os.Getenv("DINING_APP_PASSWORD")
		subject = "Ticpin Dining Voucher Confirmed: #" + data.BookingID
		templateName = "dining_confirmation.html"
	case "pass":
		from = os.Getenv("ADMIN_EMAIL")
		pass = os.Getenv("ADMIN_APP_PASSWORD")
		subject = "Ticpin Pass Purchase Confirmed: #" + data.PurchaseID
		templateName = "pass_confirmation.html"
	default:
		return fmt.Errorf("invalid category for confirmation email")
	}

	if from == "" || pass == "" {
		// Fallback to admin if vertical specific not set
		from = os.Getenv("ADMIN_EMAIL")
		pass = os.Getenv("ADMIN_APP_PASSWORD")
	}

	body, err := renderBookingTemplate(templateName, data)
	if err != nil {
		return fmt.Errorf("failed to render template: %v", err)
	}

	return sendOTP(from, pass, toEmail, subject, body)
}

func SendUnifiedOTP(toEmail, otp string, category string) error {
	var from, pass string

	switch strings.ToLower(category) {
	case "play":
		from = os.Getenv("PLAY_EMAIL")
		pass = os.Getenv("PLAY_APP_PASSWORD")
	case "events", "event":
		from = os.Getenv("EVENTS_EMAIL")
		pass = os.Getenv("EVENTS_APP_PASSWORD")
	case "dining":
		from = os.Getenv("DINING_EMAIL")
		pass = os.Getenv("DINING_APP_PASSWORD")
	case "admin":
		from = os.Getenv("ADMIN_EMAIL")
		pass = os.Getenv("ADMIN_APP_PASSWORD")
	default:
		// Default to Play for general user OTP
		from = os.Getenv("PLAY_EMAIL")
		pass = os.Getenv("PLAY_APP_PASSWORD")
	}

	// Final fallback to Admin if module specific is empty
	if from == "" || pass == "" {
		from = os.Getenv("ADMIN_EMAIL")
		pass = os.Getenv("ADMIN_APP_PASSWORD")
	}

	body, err := renderOTPTemplate("Ticpin", otp)
	if err != nil {
		body = fmt.Sprintf("<h2>Your Ticpin OTP: <b>%s</b></h2><p>Valid for 5 minutes.</p>", otp)
	}
	return sendOTP(from, pass, toEmail, "Ticpin OTP Verification", body)
}

func SendPlayOTP(toEmail, otp string) error {
	return SendUnifiedOTP(toEmail, otp, "play")
}

func SendEventsOTP(toEmail, otp string) error {
	return SendUnifiedOTP(toEmail, otp, "events")
}

func SendDiningOTP(toEmail, otp string) error {
	return SendUnifiedOTP(toEmail, otp, "dining")
}

func GenerateOTP() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

func SendStatusEmail(toEmail, vertical, status, reason string) error {
	var from, pass string

	switch strings.ToLower(vertical) {
	case "play":
		from = os.Getenv("PLAY_EMAIL")
		pass = os.Getenv("PLAY_APP_PASSWORD")
	case "events", "event":
		from = os.Getenv("EVENTS_EMAIL")
		pass = os.Getenv("EVENTS_APP_PASSWORD")
	case "dining":
		from = os.Getenv("DINING_EMAIL")
		pass = os.Getenv("DINING_APP_PASSWORD")
	default:
		from = os.Getenv("ADMIN_EMAIL")
		pass = os.Getenv("ADMIN_APP_PASSWORD")
	}

	if from == "" || pass == "" {
		from = os.Getenv("ADMIN_EMAIL")
		pass = os.Getenv("ADMIN_APP_PASSWORD")
	}

	subject := fmt.Sprintf("Ticpin Organizer Application: %s", status)
	var body string
	if status == "approved" {
		body = fmt.Sprintf("<h2>Congratulations!</h2><p>Your application for <b>%s</b> has been <b>approved</b>.</p><p>You can now log in and start creating listings.</p>", vertical)
	} else {
		body = fmt.Sprintf("<h2>Application Update</h2><p>Your application for <b>%s</b> has been <b>rejected</b>.</p><p><b>Reason:</b> %s</p><p>Please update your details and resubmit.</p>", vertical, reason)
	}

	return sendOTP(from, pass, toEmail, subject, body)
}

func SendSaleNotification(toEmail, eventName, customerEmail string, grandTotal float64, bookingID string) error {
	from := os.Getenv("EVENTS_EMAIL")
	if from == "" {
		from = os.Getenv("ADMIN_EMAIL")
	}
	pass := os.Getenv("EVENTS_APP_PASSWORD")
	if pass == "" {
		pass = os.Getenv("ADMIN_APP_PASSWORD")
	}
	if from == "" || pass == "" {
		return nil
	}
	subject := fmt.Sprintf("[Ticpin] New Sale: %s", eventName)
	body := fmt.Sprintf(`
<html><body style="font-family:sans-serif;color:#222;">
  <h2 style="color:#5331EA;">🎟 New Booking Received</h2>
  <table style="border-collapse:collapse;width:100%%;max-width:480px;">
    <tr><td style="padding:8px 0;color:#686868;">Event</td><td style="padding:8px 0;font-weight:600;">%s</td></tr>
    <tr><td style="padding:8px 0;color:#686868;">Customer Email</td><td style="padding:8px 0;">%s</td></tr>
    <tr><td style="padding:8px 0;color:#686868;">Amount Paid</td><td style="padding:8px 0;font-weight:600;">₹%.2f</td></tr>
    <tr><td style="padding:8px 0;color:#686868;">Booking ID</td><td style="padding:8px 0;font-family:monospace;">#%s</td></tr>
  </table>
  <p style="color:#AEAEAE;font-size:12px;margin-top:24px;">This is an automated sale notification from Ticpin.</p>
</body></html>`, eventName, customerEmail, grandTotal, bookingID)
	return sendOTP(from, pass, toEmail, subject, body)
}

func SendNotificationEmail(toEmail, subject, content, imageURL string) error {
	from := os.Getenv("EVENTS_EMAIL")
	if from == "" {
		from = "events@ticpin.in"
	}
	pass := os.Getenv("EVENTS_APP_PASSWORD")

	var body string
	if imageURL != "" {
		body = fmt.Sprintf(`
<html><body style="font-family:sans-serif;color:#222;max-width:600px;margin:auto;">
  <h2 style="color:#5331EA;">%s</h2>
  <div style="margin:20px 0; line-height:1.6;">%s</div>
  <img src="%s" style="width:100%%; border-radius:15px; margin-top:20px;" />
  <p style="color:#AEAEAE;font-size:12px;margin-top:24px;">Sent from Ticpin Admin Panel.</p>
</body></html>`, subject, content, imageURL)
	} else {
		body = fmt.Sprintf(`
<html><body style="font-family:sans-serif;color:#222;max-width:600px;margin:auto;">
  <h2 style="color:#5331EA;">%s</h2>
  <div style="margin:20px 0; line-height:1.6;">%s</div>
  <p style="color:#AEAEAE;font-size:12px;margin-top:24px;">Sent from Ticpin Admin Panel.</p>
</body></html>`, subject, content)
	}

	return sendOTP(from, pass, toEmail, subject, body)
}

func SendCancellationEmail(toEmail, bookingID, category, venueName, date, grandTotal string) error {
	from := os.Getenv("EVENTS_EMAIL")
	if from == "" {
		from = os.Getenv("ADMIN_EMAIL")
	}
	pass := os.Getenv("EVENTS_APP_PASSWORD")
	if pass == "" {
		pass = os.Getenv("ADMIN_APP_PASSWORD")
	}
	if from == "" || pass == "" {
		return nil
	}

	subject := fmt.Sprintf("[Ticpin] Booking Cancelled: #%s", bookingID)

	var categoryLabel string
	switch category {
	case "events":
		categoryLabel = "Event"
	case "play":
		categoryLabel = "Play"
	case "dining":
		categoryLabel = "Dining"
	default:
		categoryLabel = "Booking"
	}

	body := fmt.Sprintf(`
<html><body style="font-family:sans-serif;color:#222;max-width:600px;margin:auto;">
  <div style="background:#FF4444;color:white;padding:20px;text-align:center;border-radius:12px 12px 0 0;">
    <h2 style="margin:0;">Booking Cancelled</h2>
  </div>
  <div style="background:#f9f9f9;padding:24px;border-radius:0 0 12px 12px;">
    <p style="font-size:16px;line-height:1.6;">Hello,</p>
    <p style="font-size:16px;line-height:1.6;">Your %s booking has been successfully cancelled.</p>
    
    <table style="width:100%%;background:white;border-radius:8px;margin:20px 0;border-collapse:collapse;">
      <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666;">Booking ID</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:600;">#%s</td></tr>
      <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666;">Category</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:600;">%s</td></tr>
      <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666;">Venue/Event</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:600;">%s</td></tr>
      <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666;">Date</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:600;">%s</td></tr>
      <tr><td style="padding:12px;color:#666;">Refund Amount</td><td style="padding:12px;font-weight:600;color:#2E7D32;">₹%s</td></tr>
    </table>
    
    <p style="font-size:14px;line-height:1.6;color:#666;margin-top:24px;">
      If you have any questions about your cancellation or refund, please contact our support team.
    </p>
    
    <p style="font-size:14px;line-height:1.6;color:#999;margin-top:30px;">
      This is an automated message from Ticpin. Please do not reply to this email.
    </p>
  </div>
</body></html>`, categoryLabel, bookingID, categoryLabel, venueName, date, grandTotal)

	return sendOTP(from, pass, toEmail, subject, body)
}
func SendPassConfirmationEmail(toEmail string) error {
	from := os.Getenv("ADMIN_EMAIL")
	pass := os.Getenv("ADMIN_APP_PASSWORD")
	subject := "Welcome to Ticpin Pass!"

	tmplPath := filepath.Join("templates", "pass_confirmation.html")
	if _, err := os.Stat(tmplPath); os.IsNotExist(err) {
		tmplPath = filepath.Join("Back", "templates", "pass_confirmation.html")
	}

	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		return fmt.Errorf("failed to parse pass template: %v", err)
	}

	var body bytes.Buffer
	if err := tmpl.Execute(&body, nil); err != nil {
		return fmt.Errorf("failed to render pass template: %v", err)
	}

	return sendOTP(from, pass, toEmail, subject, body.String())
}
