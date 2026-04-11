package paymentroutes

import (
	paymentctrl "ticpin-backend/controller/payment"
	"ticpin-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func PaymentRoutes(app *fiber.App) {

	app.Post("/api/payment/create-order", middleware.RequireUserAuth, paymentctrl.CreateOrderHandler)
	app.Post("/api/payment/verify-pass", middleware.RequireUserAuth, paymentctrl.VerifyPassHandler)
	app.Post("/api/payment/razorpay/webhook", paymentctrl.RazorpayWebhook)
	app.Post("/api/payment/cashfree/webhook", paymentctrl.CashfreeWebhook)
}
