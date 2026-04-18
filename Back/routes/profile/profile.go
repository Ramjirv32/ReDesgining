package profile

import (
	ctrl "ticpin-backend/controller/profile"
	"ticpin-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func ProfileRoutes(app *fiber.App) {
	api := app.Group("/api")
	profiles := api.Group("/profiles", middleware.RequireUserAuth)

	// Public endpoint for email checking (no auth required)
	app.Get("/api/profiles/check-email", ctrl.CheckEmailExists)
	// Public endpoint for profile lookup (no auth required)
	app.Get("/api/profiles/lookup-public", ctrl.LookupProfilePublic)

	profiles.Post("", ctrl.CreateProfile)
	profiles.Get("/lookup", ctrl.LookupProfile)
	profiles.Get("/:userId", middleware.RequireSelfUser, ctrl.GetProfile)
	profiles.Put("/:userId", middleware.RequireSelfUser, ctrl.UpdateProfile)
	profiles.Post("/:userId/photo", middleware.RequireSelfUser, ctrl.UploadProfilePhoto)
}
