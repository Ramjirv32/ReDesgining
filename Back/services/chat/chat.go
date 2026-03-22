package chat

import (
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api/chat")

	api.Get("/questions", getQuestions)
	api.Get("/sessions", getSessions)
	api.Get("/sessions/:sessionId/messages", getMessages)
	api.Post("/sessions", createSession)
	api.Post("/sessions/:sessionId/messages", sendMessage)
	api.Post("/sessions/:sessionId/accept", acceptSession)
	api.Post("/sessions/:sessionId/end", endSession)
	api.Put("/sessions/:sessionId/read", markAsRead)
}
