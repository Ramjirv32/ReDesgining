package profile

import (
	ctrl "ticpin-backend/controller/profile"
	"ticpin-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func ProfileRoutes(app *fiber.App) {
	api := app.Group("/api")
	profiles := api.Group("/profiles", middleware.RequireUserAuth)

	profiles.Post("", ctrl.CreateProfile)
	profiles.Get("/:userId", middleware.RequireSelfUser, ctrl.GetProfile)
	profiles.Put("/:userId", middleware.RequireSelfUser, ctrl.UpdateProfile)
	profiles.Post("/:userId/photo", middleware.RequireSelfUser, ctrl.UploadProfilePhoto)
}
