package chat

import (
	"context"
	"net/http"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api/chat")

	api.Get("/questions", getQuestions)
	api.Get("/sessions", getSessions)
	api.Get("/sessions/:sessionId/messages", getMessages)
	api.Post("/sessions", createSession)
	api.Post("/sessions/:sessionId/messages", sendMessage)
	api.Put("/sessions/:sessionId/read", markAsRead)
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
	isAdmin := c.Query("admin", "false") == "true"

	filter := bson.M{}

	if isAdmin {
		// Admin can see all sessions, optionally filtered by category
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

	opts := options.Find().SetSort(bson.M{"updated_at": -1})

	cursor, err := config.ChatSessionsCol.Find(context.Background(), filter, opts)
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch sessions")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch sessions"})
	}
	defer cursor.Close(context.Background())

	var sessions []models.ChatSession
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
		var sessionsWithUnread []SessionWithUnread

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
		return c.JSON(sessionsWithUnread)
	}

	return c.JSON(sessions)
}

func getMessages(c *fiber.Ctx) error {
	sessionID := c.Params("sessionId")
	if sessionID == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session ID required"})
	}

	// Check if user is authorized to access this session
	userID := c.Query("userId", "")
	isAdmin := c.Query("admin", "false") == "true"

	// Get the session to verify ownership
	var session models.ChatSession
	err := config.ChatSessionsCol.FindOne(context.Background(), bson.M{"session_id": sessionID}).Decode(&session)
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
		UserType  string `json:"userType"` // "user" or "organizer"
		Category  string `json:"category"` // "dining", "event", "play"
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
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
		Status:    "active",
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err := config.ChatSessionsCol.InsertOne(context.Background(), session)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create session")
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

	return c.Status(http.StatusCreated).JSON(session)
}

func sendMessage(c *fiber.Ctx) error {
	sessionID := c.Params("sessionId")
	if sessionID == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Session ID required"})
	}

	var input struct {
		UserID    string `json:"userId"`
		UserEmail string `json:"userEmail"`
		UserType  string `json:"userType"`
		Message   string `json:"message"`
		Sender    string `json:"sender"` // "user" or "admin"
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Get session to find category
	var session models.ChatSession
	err := config.ChatSessionsCol.FindOne(context.Background(), bson.M{"session_id": sessionID}).Decode(&session)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
	}

	now := time.Now()
	message := models.ChatMessage{
		SessionID: sessionID,
		UserID:    input.UserID,
		UserEmail: input.UserEmail,
		UserType:  input.UserType,
		Category:  session.Category,
		Message:   input.Message,
		Sender:    input.Sender,
		IsRead:    false,
		CreatedAt: now,
	}

	_, err = config.ChatMessagesCol.InsertOne(context.Background(), message)
	if err != nil {
		log.Error().Err(err).Msg("Failed to send message")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to send message"})
	}

	// Update session
	config.ChatSessionsCol.UpdateOne(context.Background(),
		bson.M{"session_id": sessionID},
		bson.M{"$set": bson.M{"last_message": input.Message, "updated_at": now}},
	)

	return c.Status(http.StatusCreated).JSON(message)
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
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
		time.Sleep(time.Nanosecond)
	}
	return string(b)
}
