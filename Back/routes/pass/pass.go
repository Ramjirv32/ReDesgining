package pass

import (
	ctrl "ticpin-backend/controller/pass"
	"ticpin-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func PassRoutes(app *fiber.App) {
	pass := app.Group("/api/pass")
	pass.Post("/apply", middleware.RequireUserAuth, ctrl.ApplyPass)
	pass.Get("/user/:userId", middleware.RequireUserAuth, middleware.RequireSelfUser, ctrl.GetPassByUser)
	pass.Post("/:id/renew", middleware.RequireUserAuth, ctrl.RenewPass)
	pass.Post("/:id/use-turf", middleware.RequireUserAuth, ctrl.UseTurfBooking)
	pass.Post("/:id/use-dining", middleware.RequireUserAuth, ctrl.UseDiningVoucher)
}
