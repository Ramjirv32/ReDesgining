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
