package chat

import (
	"context"
	"fmt"
	"net/http"
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

func getSessions(c *fiber.Ctx) error {
	userType := c.Query("userType", "")
	userID := c.Query("userId", "")
	category := c.Query("category", "")
	dateFilter := c.Query("dateFilter", "")
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
		if category != "" {
			filter["category"] = category
		}
		if userType != "" {
			filter["user_type"] = userType
		}

		if dateFilter != "" && dateFilter != "all" {
			now := time.Now()
			var startDate time.Time

			switch dateFilter {
			case "yesterday":
				startDate = now.AddDate(0, 0, -1)
				startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, startDate.Location())
				endDate := time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 23, 59, 59, 0, startDate.Location())
				filter["created_at"] = bson.M{"$gte": startDate, "$lte": endDate}
			case "3days":
				startDate = now.AddDate(0, 0, -3)
				filter["created_at"] = bson.M{"$gte": startDate}
			case "week":
				startDate = now.AddDate(0, 0, -7)
				filter["created_at"] = bson.M{"$gte": startDate}
			case "2weeks":
				startDate = now.AddDate(0, 0, -14)
				filter["created_at"] = bson.M{"$gte": startDate}
			}
		}

		filter["status"] = bson.M{"$in": []string{"pending", "active"}}
	} else {
		if userType != "" {
			filter["user_type"] = userType
		}
		if userID != "" {
			filter["user_id"] = userID
		}
		if category != "" {
			filter["category"] = category
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

	validUserTypes := map[string]bool{
		"user":      true,
		"organizer": true,
	}
	if !validUserTypes[input.UserType] {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user type. Must be 'user' or 'organizer'"})
	}

	validCategories := map[string]bool{
		"dining": true,
		"event":  true,
		"play":   true,
	}
	if !validCategories[input.Category] {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid category. Must be 'dining', 'event', or 'play'"})
	}

	input.UserID = strings.TrimSpace(input.UserID)
	input.UserEmail = strings.TrimSpace(input.UserEmail)
	input.UserName = strings.TrimSpace(input.UserName)
	input.UserType = strings.TrimSpace(input.UserType)
	input.Category = strings.TrimSpace(input.Category)

	var existingSession models.ChatSession
	existingFilter := bson.M{
		"user_id":  input.UserID,
		"category": input.Category,
		"status":   bson.M{"$in": []string{"pending", "active"}},
	}
	findErr := config.ChatSessionsCol.FindOne(context.Background(), existingFilter).Decode(&existingSession)
	if findErr == nil {
		log.Info().Str("session_id", existingSession.SessionID).Str("user_id", input.UserID).Str("category", input.Category).Msg("Returning existing session")
		return c.Status(http.StatusOK).JSON(existingSession)
	}

	sessionID := generateSessionID()
	now := time.Now()

	session := models.ChatSession{
		SessionID: sessionID,
		UserID:    input.UserID,
		UserEmail: input.UserEmail,
		UserName:  input.UserName,
		UserType:  input.UserType,
		Category:  input.Category,
		Status:    "pending",
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

	ticketMsg := models.ChatMessage{
		SessionID: sessionID,
		UserID:    input.UserID,
		UserEmail: input.UserEmail,
		UserType:  input.UserType,
		Category:  input.Category,
		Message:   fmt.Sprintf("New ticket raised by %s (%s) for %s support", input.UserName, input.UserEmail, input.Category),
		Sender:    "system",
		IsRead:    true,
		CreatedAt: now,
	}
	config.ChatMessagesCol.InsertOne(context.Background(), ticketMsg)

	log.Info().Str("session_id", sessionID).Str("user_id", input.UserID).Str("user_type", input.UserType).Str("category", input.Category).Msg("Chat ticket raised")

	return c.Status(http.StatusCreated).JSON(session)
}

func endSession(c *fiber.Ctx) error {
	sessionID := c.Params("sessionId")
	if sessionID == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session ID required"})
	}

	var session models.ChatSession
	err := config.ChatSessionsCol.FindOne(context.Background(), bson.M{"session_id": sessionID}).Decode(&session)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
	}

	if session.Status == "closed" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session is already closed"})
	}

	now := time.Now()

	updateData := bson.M{
		"$set": bson.M{
			"status":     "closed",
			"closed_at":  now,
			"updated_at": now,
		},
	}

	_, err = config.ChatSessionsCol.UpdateOne(context.Background(), bson.M{"session_id": sessionID}, updateData)
	if err != nil {
		log.Error().Err(err).Str("session_id", sessionID).Msg("Failed to end session")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to end session"})
	}

	systemMsg := models.ChatMessage{
		SessionID: sessionID,
		UserID:    session.UserID,
		UserEmail: session.UserEmail,
		UserType:  session.UserType,
		Category:  session.Category,
		Message:   "This chat has been ended by the administrator. You can view this conversation in history. Please raise a new ticket if you need further assistance.",
		Sender:    "system",
		IsRead:    true,
		CreatedAt: now,
	}
	config.ChatMessagesCol.InsertOne(context.Background(), systemMsg)

	log.Info().Str("session_id", sessionID).Msg("Session closed by admin")

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Session closed successfully",
	})
}

func acceptSession(c *fiber.Ctx) error {
	sessionID := c.Params("sessionId")
	if sessionID == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session ID required"})
	}

	var session models.ChatSession
	err := config.ChatSessionsCol.FindOne(context.Background(), bson.M{"session_id": sessionID}).Decode(&session)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
	}

	if session.Status != "pending" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session is not pending approval"})
	}

	now := time.Now()

	updateData := bson.M{
		"$set": bson.M{
			"status":     "active",
			"updated_at": now,
		},
	}

	_, err = config.ChatSessionsCol.UpdateOne(context.Background(), bson.M{"session_id": sessionID}, updateData)
	if err != nil {
		log.Error().Err(err).Str("session_id", sessionID).Msg("Failed to accept session")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to accept session"})
	}

	welcomeMsg := models.ChatMessage{
		SessionID: sessionID,
		UserID:    session.UserID,
		UserEmail: session.UserEmail,
		UserType:  session.UserType,
		Category:  session.Category,
		Message:   "Hello! Welcome to Ticpin support. Your ticket has been accepted. How can I help you today?",
		Sender:    "admin",
		IsRead:    false,
		CreatedAt: now,
	}
	config.ChatMessagesCol.InsertOne(context.Background(), welcomeMsg)

	log.Info().Str("session_id", sessionID).Msg("Session accepted by admin")

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Session accepted successfully",
	})
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
