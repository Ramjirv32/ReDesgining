package admin

import (
	adminauth "ticpin-backend/controller/admin/auth"
	admincoupon "ticpin-backend/controller/admin/coupon"
	adminlistings "ticpin-backend/controller/admin/listings"
	adminnotification "ticpin-backend/controller/admin/notification"
	adminoffer "ticpin-backend/controller/admin/offer"
	adminorgs "ticpin-backend/controller/admin/organizers"
	adminstats "ticpin-backend/controller/admin/stats"
	adminusers "ticpin-backend/controller/admin/users"
	orgmedia "ticpin-backend/controller/organizer/media"
	"ticpin-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func AdminRoutes(app *fiber.App) {
	app.Post("/api/admin/login", adminauth.AdminLogin)

	admin := app.Group("/api/admin", middleware.RequireAuth, middleware.RequireAdmin)

	admin.Get("/stats", adminstats.GetStats)

	admin.Get("/organizers", adminorgs.ListOrganizers)
	admin.Get("/organizers/:id", adminorgs.GetOrganizerDetail)
	admin.Put("/organizers/:id/status", adminorgs.UpdateCategoryStatus)
	admin.Delete("/organizers/:id", adminorgs.DeleteOrganizer)

	admin.Get("/events", adminlistings.ListAllEvents)
	admin.Put("/events/:id/status", adminlistings.UpdateEventStatus)
	admin.Put("/events/:id", adminlistings.UpdateEvent)
	admin.Delete("/events/:id", adminlistings.DeleteEvent)

	admin.Get("/dining", adminlistings.ListAllDining)
	admin.Put("/dining/:id/status", adminlistings.UpdateDiningStatus)
	admin.Put("/dining/:id", adminlistings.UpdateDining)
	admin.Delete("/dining/:id", adminlistings.DeleteDining)

	admin.Get("/play", adminlistings.ListAllPlay)
	admin.Put("/play/:id/status", adminlistings.UpdatePlayStatus)
	admin.Put("/play/:id", adminlistings.UpdatePlay)
	admin.Delete("/play/:id", adminlistings.DeletePlay)

	admin.Post("/coupons", admincoupon.CreateCoupon)
	admin.Get("/coupons", admincoupon.ListCoupons)
	admin.Put("/coupons/:id", admincoupon.UpdateCoupon)
	admin.Delete("/coupons/:id", admincoupon.DeleteCoupon)
	admin.Get("/users", admincoupon.ListUsers)
	admin.Get("/users/:id", adminusers.GetUser)
	admin.Get("/users/:id/stats", adminusers.GetUserStats)
	admin.Get("/users/:id/bookings", adminusers.GetUserBookings)
	admin.Put("/users/:id", adminusers.UpdateUser)
	admin.Delete("/users/:id", adminusers.DeleteUser)

	admin.Post("/offers", adminoffer.CreateOffer)
	admin.Get("/offers", adminoffer.ListOffers)
	admin.Put("/offers/:id", adminoffer.UpdateOffer)
	admin.Delete("/offers/:id", adminoffer.DeleteOffer)

	admin.Post("/notifications", adminnotification.SendNotification)
	admin.Get("/notifications", adminnotification.ListNotifications)

	admin.Post("/upload-media", orgmedia.UploadMedia)
}
