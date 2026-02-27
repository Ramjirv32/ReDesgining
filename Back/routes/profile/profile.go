package profile

import (
	ctrl "ticpin-backend/controller/profile"

	"github.com/gofiber/fiber/v2"
)

func ProfileRoutes(app *fiber.App) {
	api := app.Group("/api")
	profiles := api.Group("/profiles")

	profiles.Post("", ctrl.CreateProfile)
	profiles.Get("/:userId", ctrl.GetProfile)
	profiles.Put("/:userId", ctrl.UpdateProfile)
	profiles.Post("/:userId/photo", ctrl.UploadProfilePhoto)
}
