package user

import (
	admincoupon "ticpin-backend/controller/admin/coupon"
	adminoffer "ticpin-backend/controller/admin/offer"
	ctrl "ticpin-backend/controller/user"

	"ticpin-backend/controller/otp"

	"github.com/gofiber/fiber/v2"
)

func UserRoutes(app *fiber.App) {
	api := app.Group("/api")
	user := api.Group("/user")

	user.Post("", ctrl.CreateUser)
	user.Post("/login", ctrl.LoginUser)
	user.Get("/:id", ctrl.GetUser)

	user.Post("/send-otp", otp.SendOTP)
	user.Post("/verify-otp", otp.VerifyOTP)

	api.Get("/coupons/:category", admincoupon.GetCouponsByCategory)
	api.Get("/offers/:category", adminoffer.GetOffersByCategory)
}
