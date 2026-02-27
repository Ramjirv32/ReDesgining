package pass

import (
	ctrl "ticpin-backend/controller/pass"

	"github.com/gofiber/fiber/v2"
)

func PassRoutes(app *fiber.App) {
	pass := app.Group("/api/pass")
	pass.Post("/apply", ctrl.ApplyPass)
	pass.Get("/user/:userId", ctrl.GetPassByUser)
	pass.Post("/:id/renew", ctrl.RenewPass)
	pass.Post("/:id/use-turf", ctrl.UseTurfBooking)
	pass.Post("/:id/use-dining", ctrl.UseDiningVoucher)
}
