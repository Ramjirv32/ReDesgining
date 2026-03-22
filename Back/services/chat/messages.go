package chat

import (
	"context"
	"net/http"
	"strings"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func getMessages(c *fiber.Ctx) error {
	sessionID := c.Params("sessionId")
	if sessionID == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session ID required"})
	}

	isAdmin := c.Query("admin", "false") == "true"
	userID := c.Query("userId", "")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var session models.ChatSession
	err := config.ChatSessionsCol.FindOne(ctx, bson.M{"session_id": sessionID}).Decode(&session)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
	}

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

func sendMessage(c *fiber.Ctx) error {
	sessionID := c.Params("sessionId")
	if sessionID == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session ID required"})
	}

	contentType := c.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		return sendMessageWithFiles(c, sessionID)
	}

	var input struct {
		UserID    string `json:"userId"`
		UserEmail string `json:"userEmail"`
		UserType  string `json:"userType"`
		Message   string `json:"message"`
		Sender    string `json:"sender"`
		FileUrl   string `json:"fileUrl,omitempty"`
		FileType  string `json:"fileType,omitempty"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

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

	validSenders := map[string]bool{
		"user":  true,
		"admin": true,
	}
	if !validSenders[input.Sender] {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid sender. Must be 'user' or 'admin'"})
	}

	input.UserID = strings.TrimSpace(input.UserID)
	input.UserEmail = strings.TrimSpace(input.UserEmail)
	input.Message = strings.TrimSpace(input.Message)
	input.UserType = strings.TrimSpace(input.UserType)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

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
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Failed to parse form data"})
	}
	defer form.RemoveAll()

	userID := form.Value["userId"][0]
	userEmail := form.Value["userEmail"][0]
	userType := form.Value["userType"][0]
	message := form.Value["message"][0]
	sender := form.Value["sender"][0]

	if strings.TrimSpace(userID) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User ID is required"})
	}
	if strings.TrimSpace(userEmail) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User email is required"})
	}
	if strings.TrimSpace(userType) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "User type is required"})
	}

	validSenders := map[string]bool{
		"user":  true,
		"admin": true,
	}
	if !validSenders[sender] {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid sender. Must be 'user' or 'admin'"})
	}

	userID = strings.TrimSpace(userID)
	userEmail = strings.TrimSpace(userEmail)
	message = strings.TrimSpace(message)
	userType = strings.TrimSpace(userType)

	var fileUrl, fileType string
	files := form.File["file0"]
	if len(files) > 0 {
		fileUrl, fileType, err = uploadFile(files[0])
		if err != nil {
			log.Error().Err(err).Msg("Failed to upload file")
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

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
