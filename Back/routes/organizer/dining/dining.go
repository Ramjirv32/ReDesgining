package dining

import (
	ctrl "ticpin-backend/controller/organizer/dining"
	"ticpin-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func DiningRoutes(app *fiber.App) {
	dining := app.Group("/api/organizer/dining")

	dining.Post("/login", ctrl.DiningLogin)
	dining.Post("/signin", ctrl.DiningSignin)
	dining.Post("/verify", ctrl.VerifyOTP)
	dining.Post("/resend-otp", ctrl.ResendOTP)

	dining.Post("/setup", middleware.RequireAuth, ctrl.DiningSetup)
	dining.Post("/submit-verification", middleware.RequireAuth, ctrl.SubmitVerification)
	dining.Post("/create", middleware.RequireAuth, middleware.RequireCategoryApproval("dining"), ctrl.CreateOrganizerDining)
	dining.Get("/:organizer_id/list", middleware.RequireAuth, ctrl.GetOrganizerDinings)
	dining.Put("/:id", middleware.RequireAuth, ctrl.UpdateOrganizerDining)
	dining.Delete("/:id", middleware.RequireAuth, ctrl.DeleteOrganizerDining)
}
