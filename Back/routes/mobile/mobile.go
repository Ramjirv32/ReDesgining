package mobile

import (
	mobilecontroller "ticpin-backend/controller/mobile"

	"github.com/gofiber/fiber/v2"
)

func RegisterMobileRoutes(api fiber.Router) {
	mobile := api.Group("/api/mobile")
	mobile.Get("/home", mobilecontroller.GetMobileHomeData)
	mobile.Get("/event/:id", mobilecontroller.GetEventDetails)
	mobile.Get("/dining/:id", mobilecontroller.GetDiningDetails)
}
