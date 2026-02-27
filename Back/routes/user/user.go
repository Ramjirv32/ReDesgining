package user

import (
	ctrl "ticpin-backend/controller/user"

	"github.com/gofiber/fiber/v2"
)

func UserRoutes(app *fiber.App) {
	api := app.Group("/api")
	users := api.Group("/users")

	users.Post("", ctrl.CreateUser)
	users.Post("/login", ctrl.LoginUser)
	users.Get("/:id", ctrl.GetUser)
}
