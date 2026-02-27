package play

import (
	ctrl "ticpin-backend/controller/play"

	"github.com/gofiber/fiber/v2"
)

func PlayRoutes(app *fiber.App) {
	play := app.Group("/api/play")
	play.Get("", ctrl.GetAllPlays)
	play.Get("/:id", ctrl.GetPlayByID)
}
