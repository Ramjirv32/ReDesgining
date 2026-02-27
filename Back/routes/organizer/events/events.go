package events

import (
	ctrl "ticpin-backend/controller/organizer/events"
	"ticpin-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func EventsRoutes(app *fiber.App) {
	events := app.Group("/api/organizer/events")

	events.Post("/login", ctrl.EventsLogin)
	events.Post("/signin", ctrl.EventsSignin)
	events.Post("/verify", ctrl.VerifyOTP)
	events.Post("/resend-otp", ctrl.ResendOTP)

	events.Post("/setup", middleware.RequireAuth, ctrl.EventsSetup)
	events.Post("/submit-verification", middleware.RequireAuth, ctrl.SubmitVerification)
	events.Post("/create", middleware.RequireAuth, middleware.RequireCategoryApproval("events"), ctrl.CreateOrganizerEvent)
	events.Get("/:organizer_id/list", middleware.RequireAuth, ctrl.GetOrganizerEvents)
	events.Put("/:id", middleware.RequireAuth, ctrl.UpdateOrganizerEvent)
	events.Delete("/:id", middleware.RequireAuth, ctrl.DeleteOrganizerEvent)
}
