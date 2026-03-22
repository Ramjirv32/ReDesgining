package play

import (
	offerctrl "ticpin-backend/controller/admin/offer"
	ctrl "ticpin-backend/controller/play"

	"github.com/gofiber/fiber/v2"
)

func PlayRoutes(app *fiber.App) {
	play := app.Group("/api/play")
	play.Get("", ctrl.GetAllPlays)
	play.Get("/:id", ctrl.GetPlayByID)
	play.Get("/:id/offers", offerctrl.GetPlayOffers)
}
