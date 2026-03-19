package dining

import (
	ctrl "ticpin-backend/controller/dining"
	offerctrl "ticpin-backend/controller/admin/offer"

	"github.com/gofiber/fiber/v2"
)

func DiningRoutes(app *fiber.App) {
	dining := app.Group("/api/dining")
	dining.Get("", ctrl.GetAllDinings)
	dining.Get("/:id", ctrl.GetDiningByID)
	dining.Get("/:id/offers", offerctrl.GetDiningOffers)
}
