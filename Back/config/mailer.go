package config

import (
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"strings"

	gomail "gopkg.in/gomail.v2"
)

func sendOTP(from, pass, to, subject, body string) error {
	port, _ := strconv.Atoi(os.Getenv("SMTP_PORT"))
	if port == 0 {
		port = 587
	}

	// Clean password (remove spaces often found in app passwords)
	cleanPass := strings.ReplaceAll(pass, " ", "")

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer("smtp.gmail.com", port, from, cleanPass)
	return d.DialAndSend(m)
}

func SendPlayOTP(toEmail, otp string) error {
	from := os.Getenv("PLAY_EMAIL")
	pass := os.Getenv("PLAY_APP_PASSWORD")
	body := fmt.Sprintf("<h2>Your Ticpin Play OTP: <b>%s</b></h2><p>Valid for 10 minutes.</p>", otp)
	return sendOTP(from, pass, toEmail, "Ticpin Play OTP Verification", body)
}

func SendEventsOTP(toEmail, otp string) error {
	from := os.Getenv("EVENTS_EMAIL")
	pass := os.Getenv("EVENTS_APP_PASSWORD")
	body := fmt.Sprintf("<h2>Your Ticpin Events OTP: <b>%s</b></h2><p>Valid for 10 minutes.</p>", otp)
	return sendOTP(from, pass, toEmail, "Ticpin Events OTP Verification", body)
}

func SendDiningOTP(toEmail, otp string) error {
	from := os.Getenv("DINING_EMAIL")
	pass := os.Getenv("DINING_APP_PASSWORD")
	body := fmt.Sprintf("<h2>Your Ticpin Dining OTP: <b>%s</b></h2><p>Valid for 10 minutes.</p>", otp)
	return sendOTP(from, pass, toEmail, "Ticpin Dining OTP Verification", body)
}

func GenerateOTP() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

func SendStatusEmail(toEmail, vertical, status, reason string) error {
	from := os.Getenv("ADMIN_EMAIL")
	if from == "" {
		from = "23cs139@kpriet.ac.in"
	}
	pass := os.Getenv("ADMIN_APP_PASSWORD")

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
	from := os.Getenv("ADMIN_EMAIL")
	if from == "" {
		from = "23cs139@kpriet.ac.in"
	}
	pass := os.Getenv("ADMIN_APP_PASSWORD")

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
