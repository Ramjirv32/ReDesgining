package pass

import (
	"fmt"
	ctrl "ticpin-backend/controller/pass"
	"ticpin-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func PassRoutes(app *fiber.App) {
	pass := app.Group("/api/pass", func(c *fiber.Ctx) error {
		fmt.Printf("PASS REQUEST: %s %s\n", c.Method(), c.Path())
		return c.Next()
	})
	pass.Post("/create", middleware.RequireUserAuth, ctrl.CreatePass)
	pass.Post("/apply", middleware.RequireUserAuth, ctrl.ApplyPass)
	pass.Get("/user/:userId", middleware.RequireUserAuth, middleware.RequireSelfUser, ctrl.GetPassByUser)
	pass.Get("/user/:userId/latest", middleware.RequireUserAuth, middleware.RequireSelfUser, ctrl.GetLatestPassByUser)
	pass.Post("/:id/renew", middleware.RequireUserAuth, ctrl.RenewPass)
	pass.Post("/:id/use-turf", middleware.RequireUserAuth, ctrl.UseTurfBooking)
	pass.Post("/:id/use-dining", middleware.RequireUserAuth, ctrl.UseDiningVoucher)

	// Catch-all for /api/pass/*
	pass.Use(func(c *fiber.Ctx) error {
		fmt.Printf("PASS 404: %s %s\n", c.Method(), c.Path())
		return c.Status(404).JSON(fiber.Map{"error": "route not found in pass group"})
	})
}
