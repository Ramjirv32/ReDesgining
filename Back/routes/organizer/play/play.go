package play

import (
	ctrl "ticpin-backend/controller/organizer/play"
	"ticpin-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func PlayRoutes(app *fiber.App) {
	play := app.Group("/api/organizer/play")

	play.Post("/login", ctrl.PlayLogin)
	play.Post("/signin", ctrl.PlaySignin)
	play.Post("/verify", ctrl.VerifyOTP)
	play.Post("/resend-otp", ctrl.ResendOTP)

	play.Post("/setup", middleware.RequireAuth, ctrl.PlaySetup)
	play.Post("/submit-verification", middleware.RequireAuth, ctrl.SubmitVerification)
	play.Post("/create", middleware.RequireAuth, middleware.RequireCategoryApproval("play"), ctrl.CreateOrganizerPlay)
	play.Get("/:organizer_id/list", middleware.RequireAuth, ctrl.GetOrganizerPlays)
	play.Put("/:id", middleware.RequireAuth, ctrl.UpdateOrganizerPlay)
	play.Delete("/:id", middleware.RequireAuth, ctrl.DeleteOrganizerPlay)
	play.Get("/organizer/:id", middleware.RequireAuth, ctrl.GetOrganizer)
}
