package user

import (
	admincoupon "ticpin-backend/controller/admin/coupon"
	adminoffer "ticpin-backend/controller/admin/offer"
	ctrl "ticpin-backend/controller/user"

	"github.com/gofiber/fiber/v2"
)

func UserRoutes(app *fiber.App) {
	api := app.Group("/api")
	users := api.Group("/users")

	users.Post("", ctrl.CreateUser)
	users.Post("/login", ctrl.LoginUser)
	users.Get("/:id", ctrl.GetUser)

	api.Get("/coupons/:category", admincoupon.GetCouponsByCategory)
	api.Get("/offers/:category", adminoffer.GetOffersByCategory)
}
