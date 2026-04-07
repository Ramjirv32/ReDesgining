package main

import (
	"fmt"
	"net"
	"os"
	"time"
	"gopkg.in/gomail.v2"
)

func main() {
	// Test basic network connectivity to Google SMTP
	fmt.Println("1. Testing network connectivity to smtp.gmail.com:587...")
	conn, err := net.DialTimeout("tcp", "smtp.gmail.com:587", 5*time.Second)
	if err != nil {
		fmt.Printf("FAIL: Could not connect to port 587: %v\n", err)
	} else {
		fmt.Println("SUCCESS: Connected to port 587")
		conn.Close()
	}

	fmt.Println("\n2. Testing network connectivity to smtp.gmail.com:465...")
	conn465, err := net.DialTimeout("tcp", "smtp.gmail.com:465", 5*time.Second)
	if err != nil {
		fmt.Printf("FAIL: Could not connect to port 465: %v\n", err)
	} else {
		fmt.Println("SUCCESS: Connected to port 465")
		conn465.Close()
	}

	// Test actual email sending (replace with your env variables or hardcode for local test)
	from := os.Getenv("PLAY_EMAIL")
	pass := os.Getenv("PLAY_APP_PASSWORD")
	to := "ramjib2311@gmail.com"

	if from == "" || pass == "" {
		fmt.Println("\n3. Skipping email send test: PLAY_EMAIL or PLAY_APP_PASSWORD not set in environment.")
		return
	}

	fmt.Printf("\n3. Testing email send from %s to %s via port 587...\n", from, to)
	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Ticpin SMTP Local Test")
	m.SetBody("text/plain", "This is a test email to verify SMTP configuration.")

	d := gomail.NewDialer("smtp.gmail.com", 587, from, pass)
	if err := d.DialAndSend(m); err != nil {
		fmt.Printf("FAIL: Send via 587 failed: %v\n", err)
	} else {
		fmt.Println("SUCCESS: Email sent via 587!")
	}
}
