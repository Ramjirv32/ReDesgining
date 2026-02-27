package booking

import (
	admincoupon "ticpin-backend/controller/admin/coupon"
	adminoffer "ticpin-backend/controller/admin/offer"
	bookingctrl "ticpin-backend/controller/booking"

	"github.com/gofiber/fiber/v2"
)

func BookingRoutes(app *fiber.App) {
	app.Post("/api/bookings/events", bookingctrl.CreateEventBooking)
	app.Post("/api/bookings/dining", bookingctrl.CreateDiningBooking)
	app.Post("/api/bookings/play", bookingctrl.CreatePlayBooking)

	app.Get("/api/events/:id/availability", bookingctrl.GetEventAvailability)

	app.Get("/api/events/:id/offers", adminoffer.GetEventOffers)
	app.Get("/api/dining/:id/offers", adminoffer.GetDiningOffers)
	app.Get("/api/play/:id/offers", adminoffer.GetPlayOffers)

	app.Post("/api/coupons/validate", admincoupon.ValidateCoupon)
}
