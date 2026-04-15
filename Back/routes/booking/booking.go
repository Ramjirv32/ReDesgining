package booking

import (
	admincoupon "ticpin-backend/controller/admin/coupon"
	adminoffer "ticpin-backend/controller/admin/offer"
	bookingctrl "ticpin-backend/controller/booking"
	bookinguser "ticpin-backend/controller/booking/user"
	"ticpin-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func BookingRoutes(app *fiber.App) {

	app.Post("/api/bookings/events", middleware.RequireUserAuth, bookingctrl.CreateEventBooking)
	app.Post("/api/bookings/dining", middleware.RequireUserAuth, bookingctrl.CreateDiningBooking)
	app.Post("/api/bookings/play", middleware.RequireUserAuth, bookingctrl.CreatePlayBooking)
	app.Get("/api/bookings/user/history", middleware.RequireUserAuth, bookinguser.GetBookingHistory)
	app.Get("/api/bookings/user/:email", middleware.RequireUserAuth, bookinguser.GetBookingsByEmail)
	app.Get("/api/bookings/:id", middleware.RequireUserAuth, bookingctrl.GetBookingDetails)
	app.Get("/api/bookings/public/:id", bookingctrl.GetPublicBookingDetails)
	app.Put("/api/bookings/:id/cancel", middleware.RequireUserAuth, bookinguser.CancelBooking)
	app.Get("/api/events/:id/availability", bookingctrl.GetEventAvailability)
	app.Get("/api/play/:id/booked-slots", bookingctrl.GetPlaySlotAvailability)

	app.Get("/api/events/:id/offers", adminoffer.GetEventOffers)
	app.Get("/api/dining/:id/offers", adminoffer.GetDiningOffers)
	app.Get("/api/play/:id/offers", adminoffer.GetPlayOffers)

	// Unified Slot Locking APIs
	app.Post("/api/booking/lock", bookingctrl.CreateSlotLock)
	app.Post("/api/booking/unlock", bookingctrl.UnlockSlot)
	app.Get("/api/booking/lock/status", bookingctrl.GetUserActiveLocks)

	app.Post("/api/coupons/validate", middleware.RequireUserAuth, admincoupon.ValidateCoupon)
}
