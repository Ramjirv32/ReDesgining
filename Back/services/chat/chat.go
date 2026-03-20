package chat

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func SetupRoutes(app *fiber.App) {
	// Protected group - requires at least general authentication
	api := app.Group("/api/chat")

	api.Get("/questions", getQuestions)
	api.Get("/sessions", getSessions)
	api.Get("/sessions/:sessionId/messages", getMessages)
	api.Post("/sessions", createSession)
	api.Post("/sessions/:sessionId/messages", sendMessage) // Handles both text and files
	api.Post("/sessions/:sessionId/end", endSession)
	api.Put("/sessions/:sessionId/read", markAsRead)
}

func uploadFile(file *multipart.FileHeader) (string, string, error) {
	// Create uploads directory if it doesn't exist
	uploadsDir := "./uploads/chat"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		return "", "", fmt.Errorf("failed to create uploads directory: %w", err)
	}

	// Validate file type
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

	// Validate file size (10MB max)
	if file.Size > 10*1024*1024 {
		return "", "", fmt.Errorf("file size exceeds 10MB limit")
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.TrimSuffix(file.Filename, ext), ext)
	filePath := filepath.Join(uploadsDir, filename)

	// Save file
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

	// Return relative URL and file type
	fileType := "image"
	if file.Header.Get("Content-Type") == "application/pdf" {
		fileType = "pdf"
	}

	return fmt.Sprintf("/uploads/chat/%s", filename), fileType, nil
}

func getQuestions(c *fiber.Ctx) error {
	category := c.Query("category", "")

	filter := bson.M{}
	if category != "" {
		filter["category"] = category
	}

	opts := options.Find().SetSort(bson.M{"order": 1})

	cursor, err := config.ChatQuestionsCol.Find(context.Background(), filter, opts)
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch questions")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch questions"})
	}
	defer cursor.Close(context.Background())

	var questions []models.ChatQuestion
	if err := cursor.All(context.Background(), &questions); err != nil {
		log.Error().Err(err).Msg("Failed to decode questions")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch questions"})
	}

	// If no questions in DB, return dummy questions
	if len(questions) == 0 {
		questions = getDummyQuestions(category)
	}

	return c.JSON(questions)
}

func getDummyQuestions(category string) []models.ChatQuestion {
	allQuestions := map[string][]models.ChatQuestion{
		"dining": {
			{Question: "How do I list my restaurant on Ticpin?", Answer: "To list your restaurant, go to 'List Your Dining' and complete the registration form with your restaurant details."},
			{Question: "How do I update my menu?", Answer: "You can update your menu from the organizer dashboard by editing your dining listing."},
			{Question: "How do I manage bookings?", Answer: "All bookings can be managed from your organizer dashboard under the 'Bookings' section."},
			{Question: "How do I add photos of my restaurant?", Answer: "Go to your dining listing edit page and use the image upload section to add photos."},
			{Question: "How do I set my restaurant timings?", Answer: "Edit your dining listing and update the opening hours in the details section."},
		},
		"event": {
			{Question: "How do I create an event?", Answer: "Go to 'List Your Events' and fill in the event details form to create a new event."},
			{Question: "How do I sell tickets for my event?", Answer: "Create an event and add ticket categories with pricing in the ticketing section."},
			{Question: "How do I track event attendance?", Answer: "View attendee details in your organizer dashboard under the specific event."},
			{Question: "How do I cancel an event?", Answer: "Contact our support team to cancel or reschedule your event."},
			{Question: "How do I add performers to my event?", Answer: "Edit your event and add artist/performer details in the lineup section."},
		},
		"play": {
			{Question: "How do I list my sports facility?", Answer: "Go to 'List Your Play' and complete the registration for your sports venue."},
			{Question: "How do I set slot pricing?", Answer: "Edit your play listing and configure slot-based pricing in the pricing section."},
			{Question: "How do I manage court bookings?", Answer: "All court bookings can be managed from your organizer dashboard."},
			{Question: "How do I add new courts?", Answer: "Edit your play listing and add courts in the courts management section."},
			{Question: "How do I block unavailable slots?", Answer: "Use the availability settings in your organizer dashboard to block dates."},
		},
	}

	if category != "" {
		if q, ok := allQuestions[category]; ok {
			return q
		}
	}

	// Return all categories if no specific category
	var result []models.ChatQuestion
	for _, qs := range allQuestions {
		result = append(result, qs...)
	}
	return result
}

func getSessions(c *fiber.Ctx) error {
	userType := c.Query("userType", "")
	userID := c.Query("userId", "")
	category := c.Query("category", "")
	limitStr := c.Query("limit", "10")
	pageStr := c.Query("page", "1")
	limit, _ := strconv.Atoi(limitStr)
	page, _ := strconv.Atoi(pageStr)
	if limit <= 0 {
		limit = 10
	}
	if page <= 0 {
		page = 1
	}
	skip := (page - 1) * limit

	isAdmin := c.Query("admin", "false") == "true"
	filter := bson.M{}

	if isAdmin {
		// Admin can see all active sessions, only where message exists
		filter["last_message"] = bson.M{"$ne": ""}
		if category != "" {
			filter["category"] = category
		}
	} else {
		// Regular users only see their own sessions
		if userType != "" {
			filter["user_type"] = userType
		}
		if userID != "" {
			filter["user_id"] = userID
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, _ := config.ChatSessionsCol.CountDocuments(ctx, filter)
	totalPages := (count + int64(limit) - 1) / int64(limit)

	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.M{"updated_at": -1})
	cursor, err := config.ChatSessionsCol.Find(ctx, filter, opts)
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch sessions")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch sessions"})
	}
	defer cursor.Close(context.Background())

	sessions := []models.ChatSession{}
	if err := cursor.All(context.Background(), &sessions); err != nil {
		log.Error().Err(err).Msg("Failed to decode sessions")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch sessions"})
	}

	// For admin, count unread messages for each session
	if isAdmin {
		type SessionWithUnread struct {
			models.ChatSession
			UnreadCount int64 `json:"unreadCount" bson:"unreadCount"`
		}
		sessionsWithUnread := []SessionWithUnread{}

		for _, session := range sessions {
			unreadCount, _ := config.ChatMessagesCol.CountDocuments(context.Background(), bson.M{
				"session_id": session.SessionID,
				"sender":     "user",
				"is_read":    false,
			})
			sessionsWithUnread = append(sessionsWithUnread, SessionWithUnread{
				ChatSession: session,
				UnreadCount: unreadCount,
			})
		}
		return c.JSON(fiber.Map{
			"sessions":    sessionsWithUnread,
			"totalPages":  totalPages,
			"currentPage": page,
		})
	}

	return c.JSON(fiber.Map{
		"sessions":    sessions,
		"totalPages":  totalPages,
		"currentPage": page,
	})
}

func getMessages(c *fiber.Ctx) error {
	sessionID := c.Params("sessionId")
	if sessionID == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session ID required"})
	}

	isAdmin := c.Query("admin", "false") == "true"
	userID := c.Query("userId", "")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get the session to verify ownership
	var session models.ChatSession
	err := config.ChatSessionsCol.FindOne(ctx, bson.M{"session_id": sessionID}).Decode(&session)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
	}

	// If not admin, verify the user owns this session
	if !isAdmin && userID != "" && session.UserID != userID {
		return c.Status(http.StatusForbidden).JSON(fiber.Map{"error": "Not authorized to access this session"})
	}

	filter := bson.M{"session_id": sessionID}
	opts := options.Find().SetSort(bson.M{"created_at": 1})

	cursor, err := config.ChatMessagesCol.Find(context.Background(), filter, opts)
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch messages")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch messages"})
	}
	defer cursor.Close(context.Background())

	var messages []models.ChatMessage
	if err := cursor.All(context.Background(), &messages); err != nil {
		log.Error().Err(err).Msg("Failed to decode messages")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch messages"})
	}

	return c.JSON(messages)
}

func createSession(c *fiber.Ctx) error {
	var input struct {
		UserID    string `json:"userId"`
		UserEmail string `json:"userEmail"`
		UserName  string `json:"userName"`
		UserType  string `json:"userType"`
		Category  string `json:"category"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Enhanced security validation
	if strings.TrimSpace(input.UserID) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User ID is required"})
	}
	if strings.TrimSpace(input.UserEmail) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User email is required"})
	}
	if strings.TrimSpace(input.UserName) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User name is required"})
	}
	if strings.TrimSpace(input.UserType) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User type is required"})
	}
	if strings.TrimSpace(input.Category) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Category is required"})
	}

	// Validate user type
	validUserTypes := map[string]bool{
		"user":      true,
		"organizer": true,
	}
	if !validUserTypes[input.UserType] {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user type. Must be 'user' or 'organizer'"})
	}

	// Validate category
	validCategories := map[string]bool{
		"dining": true,
		"event":  true,
		"play":   true,
	}
	if !validCategories[input.Category] {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid category. Must be 'dining', 'event', or 'play'"})
	}

	// Sanitize inputs
	input.UserID = strings.TrimSpace(input.UserID)
	input.UserEmail = strings.TrimSpace(input.UserEmail)
	input.UserName = strings.TrimSpace(input.UserName)
	input.UserType = strings.TrimSpace(input.UserType)
	input.Category = strings.TrimSpace(input.Category)

	// Generate secure session ID
	sessionID := generateSessionID()
	now := time.Now()

	session := models.ChatSession{
		SessionID: sessionID,
		UserID:    input.UserID,
		UserEmail: input.UserEmail,
		UserName:  input.UserName,
		UserType:  input.UserType,
		Category:  input.Category,
		Status:    "active",
		CreatedAt: now,
		UpdatedAt: now,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := config.ChatSessionsCol.InsertOne(ctx, session)
	if err != nil {
		log.Error().Err(err).Str("user_id", input.UserID).Str("user_type", input.UserType).Str("category", input.Category).Msg("Failed to create session")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create session"})
	}

	// Add welcome message
	welcomeMsg := models.ChatMessage{
		SessionID: sessionID,
		UserID:    input.UserID,
		UserEmail: input.UserEmail,
		UserType:  input.UserType,
		Category:  input.Category,
		Message:   "Hello! Welcome to Ticpin support. How can I help you today?",
		Sender:    "admin",
		IsRead:    true,
		CreatedAt: now,
	}
	config.ChatMessagesCol.InsertOne(context.Background(), welcomeMsg)

	log.Info().Str("session_id", sessionID).Str("user_id", input.UserID).Str("user_type", input.UserType).Str("category", input.Category).Msg("Chat session created")

	return c.Status(http.StatusCreated).JSON(session)
}

func sendMessage(c *fiber.Ctx) error {
	sessionID := c.Params("sessionId")
	if sessionID == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session ID required"})
	}

	// Check if this is a multipart form (file upload)
	contentType := c.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		return sendMessageWithFiles(c, sessionID)
	}

	// Handle regular JSON message
	var input struct {
		UserID    string `json:"userId"`
		UserEmail string `json:"userEmail"`
		UserType  string `json:"userType"`
		Message   string `json:"message"`
		Sender    string `json:"sender"` // "user" or "admin"
		FileUrl   string `json:"fileUrl,omitempty"`
		FileType  string `json:"fileType,omitempty"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Enhanced validation
	if strings.TrimSpace(input.UserID) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User ID is required"})
	}
	if strings.TrimSpace(input.UserEmail) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User email is required"})
	}
	if strings.TrimSpace(input.Message) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Message is required"})
	}
	if strings.TrimSpace(input.UserType) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User type is required"})
	}

	// Validate sender
	validSenders := map[string]bool{
		"user":  true,
		"admin": true,
	}
	if !validSenders[input.Sender] {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid sender. Must be 'user' or 'admin'"})
	}

	// Sanitize inputs
	input.UserID = strings.TrimSpace(input.UserID)
	input.UserEmail = strings.TrimSpace(input.UserEmail)
	input.Message = strings.TrimSpace(input.Message)
	input.UserType = strings.TrimSpace(input.UserType)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Create message
	message := models.ChatMessage{
		SessionID: sessionID,
		UserID:    input.UserID,
		UserEmail: input.UserEmail,
		UserType:  input.UserType,
		Message:   input.Message,
		Sender:    input.Sender,
		FileUrl:   input.FileUrl,
		FileType:  input.FileType,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	_, err := config.ChatMessagesCol.InsertOne(ctx, message)
	if err != nil {
		log.Error().Err(err).Str("session_id", sessionID).Str("user_id", input.UserID).Msg("Failed to send message")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to send message"})
	}

	log.Info().Str("session_id", sessionID).Str("user_id", input.UserID).Str("sender", input.Sender).Msg("Message sent")

	return c.Status(http.StatusCreated).JSON(message)
}

func sendMessageWithFiles(c *fiber.Ctx, sessionID string) error {
	// Parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Failed to parse form data"})
	}
	defer form.RemoveAll()

	// Extract form fields
	userID := form.Value["userId"][0]
	userEmail := form.Value["userEmail"][0]
	userType := form.Value["userType"][0]
	message := form.Value["message"][0]
	sender := form.Value["sender"][0]

	// Validation
	if strings.TrimSpace(userID) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User ID is required"})
	}
	if strings.TrimSpace(userEmail) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User email is required"})
	}
	if strings.TrimSpace(userType) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User type is required"})
	}

	// Validate sender
	validSenders := map[string]bool{
		"user":  true,
		"admin": true,
	}
	if !validSenders[sender] {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid sender. Must be 'user' or 'admin'"})
	}

	// Sanitize inputs
	userID = strings.TrimSpace(userID)
	userEmail = strings.TrimSpace(userEmail)
	message = strings.TrimSpace(message)
	userType = strings.TrimSpace(userType)

	// Handle file uploads
	var fileUrl, fileType string
	files := form.File["file0"] // Get first file
	if len(files) > 0 {
		fileUrl, fileType, err = uploadFile(files[0])
		if err != nil {
			log.Error().Err(err).Msg("Failed to upload file")
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Create message with file attachment
	chatMessage := models.ChatMessage{
		SessionID: sessionID,
		UserID:    userID,
		UserEmail: userEmail,
		UserType:  userType,
		Message:   message,
		Sender:    sender,
		FileUrl:   fileUrl,
		FileType:  fileType,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	_, err = config.ChatMessagesCol.InsertOne(ctx, chatMessage)
	if err != nil {
		log.Error().Err(err).Str("session_id", sessionID).Str("user_id", userID).Msg("Failed to send message with file")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to send message"})
	}

	log.Info().Str("session_id", sessionID).Str("user_id", userID).Str("sender", sender).Str("file_url", fileUrl).Msg("Message with file sent")

	return c.Status(http.StatusCreated).JSON(chatMessage)
}

func endSession(c *fiber.Ctx) error {
	sessionID := c.Params("sessionId")
	if sessionID == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session ID required"})
	}

	// Enhanced validation
	if strings.TrimSpace(sessionID) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session ID is required"})
	}

	// Get session to verify it exists and is active
	var session models.ChatSession
	err := config.ChatSessionsCol.FindOne(context.Background(), bson.M{"session_id": sessionID}).Decode(&session)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
	}

	// Check if session is already ended
	if session.Status == "ended" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session is already ended"})
	}

	// Update session status to "ended" with proper metadata
	updateData := bson.M{
		"$set": bson.M{
			"status":   "ended",
			"ended_at": time.Now(),
			"ended_by": "admin",
		},
	}

	_, err = config.ChatSessionsCol.UpdateOne(context.Background(), bson.M{"session_id": sessionID}, updateData)
	if err != nil {
		log.Error().Err(err).Str("session_id", sessionID).Msg("Failed to end session")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to end session"})
	}

	// Add system message about session termination
	systemMsg := models.ChatMessage{
		SessionID: sessionID,
		UserID:    session.UserID,
		UserEmail: session.UserEmail,
		UserType:  session.UserType,
		Category:  session.Category,
		Message:   "This chat session has been ended by the administrator. Please start a new session if you need further assistance.",
		Sender:    "system",
		IsRead:    true,
		CreatedAt: time.Now(),
	}
	config.ChatMessagesCol.InsertOne(context.Background(), systemMsg)

	log.Info().Str("session_id", sessionID).Msg("Session ended by admin")

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Session ended successfully",
	})
}

func getDummyAnswer(category, message string) string {
	// Provide fallback answers for common questions when not in DB
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

func markAsRead(c *fiber.Ctx) error {
	sessionID := c.Params("sessionId")
	if sessionID == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session ID required"})
	}

	_, err := config.ChatMessagesCol.UpdateMany(context.Background(),
		bson.M{"session_id": sessionID, "sender": "user", "is_read": false},
		bson.M{"$set": bson.M{"is_read": true}},
	)

	if err != nil {
		log.Error().Err(err).Msg("Failed to mark as read")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to mark as read"})
	}

	return c.JSON(fiber.Map{"success": true})
}

func generateSessionID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

func randomString(n int) string {
	const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Exclude confusing chars
	res := make([]byte, n)
	for i := 0; i < n; i++ {
		res[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(res)
}
