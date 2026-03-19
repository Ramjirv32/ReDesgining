package play

import (
	ctrl "ticpin-backend/controller/play"
	offerctrl "ticpin-backend/controller/admin/offer"

	"github.com/gofiber/fiber/v2"
)

func PlayRoutes(app *fiber.App) {
	play := app.Group("/api/play")
	play.Get("", ctrl.GetAllPlays)
	play.Get("/:id", ctrl.GetPlayByID)
	play.Get("/:id/offers", offerctrl.GetPlayOffers)
}
