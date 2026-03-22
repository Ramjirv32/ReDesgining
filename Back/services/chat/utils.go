package chat

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func uploadFile(file *multipart.FileHeader) (string, string, error) {
	uploadsDir := "./uploads/chat"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		return "", "", fmt.Errorf("failed to create uploads directory: %w", err)
	}

	allowedTypes := map[string]bool{
		"image/jpeg":      true,
		"image/png":       true,
		"image/gif":       true,
		"image/webp":      true,
		"application/pdf": true,
	}

	if !allowedTypes[file.Header.Get("Content-Type")] {
		return "", "", fmt.Errorf("file type not allowed")
	}

	if file.Size > 10*1024*1024 {
		return "", "", fmt.Errorf("file size exceeds 10MB limit")
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.TrimSuffix(file.Filename, ext), ext)
	filePath := filepath.Join(uploadsDir, filename)

	src, err := file.Open()
	if err != nil {
		return "", "", fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	dst, err := os.Create(filePath)
	if err != nil {
		return "", "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return "", "", fmt.Errorf("failed to save file: %w", err)
	}

	fileType := "image"
	if file.Header.Get("Content-Type") == "application/pdf" {
		fileType = "pdf"
	}

	return fmt.Sprintf("/uploads/chat/%s", filename), fileType, nil
}

func getDummyAnswer(category, message string) string {
	switch strings.ToLower(message) {
	case "hello", "hi", "help":
		return "Hello! How can I help you today?"
	case "how do i list my restaurant":
		return "To list your restaurant, go to 'List Your Dining' and complete the registration form with your restaurant details."
	case "how do i update my menu":
		return "You can update your menu from the organizer dashboard by editing your dining listing."
	case "how do i manage bookings":
		return "All bookings can be managed from your organizer dashboard under the 'Bookings' section."
	case "how do i add photos":
		return "Go to your dining listing edit page and use the image upload section to add photos of your restaurant."
	case "how do i set timings":
		return "Edit your dining listing and update the opening hours in the details section."
	case "how do i create an event":
		return "Go to 'List Your Events' and fill in the event creation form to create a new event."
	case "how do i sell tickets":
		return "Create an event and add ticket categories with pricing in the ticketing section."
	case "how do i list my sports facility":
		return "Go to 'List Your Play' and complete the registration for your sports venue."
	case "how do i set pricing":
		return "Edit your play listing and configure slot-based pricing in the pricing section."
	case "how do i manage courts":
		return "All court bookings can be managed from your organizer dashboard under the 'Bookings' section."
	case "how do i add courts":
		return "Edit your play listing and add new courts in the courts management section."
	default:
		return "Thank you for your message. Our support team will assist you shortly."
	}
}

func generateSessionID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

func randomString(n int) string {
	const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	res := make([]byte, n)
	for i := 0; i < n; i++ {
		res[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(res)
}
