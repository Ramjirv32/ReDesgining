package event

import (
	ctrl "ticpin-backend/controller/event"

	"github.com/gofiber/fiber/v2"
)

func EventRoutes(app *fiber.App) {
	events := app.Group("/api/events")
	events.Get("", ctrl.GetAllEvents)
	events.Get("/:id", ctrl.GetEventByID)
}
