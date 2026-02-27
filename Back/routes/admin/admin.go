package admin

import (
	adminauth "ticpin-backend/controller/admin/auth"
	admincoupon "ticpin-backend/controller/admin/coupon"
	adminlistings "ticpin-backend/controller/admin/listings"
	adminoffer "ticpin-backend/controller/admin/offer"
	adminorgs "ticpin-backend/controller/admin/organizers"
	adminstats "ticpin-backend/controller/admin/stats"
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
	admin.Post("/organizers/:id/status", adminorgs.UpdateCategoryStatus)
	admin.Delete("/organizers/:id", adminorgs.DeleteOrganizer)

	admin.Get("/events", adminlistings.ListAllEvents)
	admin.Put("/events/:id/status", adminlistings.UpdateEventStatus)
	admin.Delete("/events/:id", adminlistings.DeleteEvent)

	admin.Get("/dining", adminlistings.ListAllDining)
	admin.Put("/dining/:id/status", adminlistings.UpdateDiningStatus)
	admin.Delete("/dining/:id", adminlistings.DeleteDining)

	admin.Get("/play", adminlistings.ListAllPlay)
	admin.Put("/play/:id/status", adminlistings.UpdatePlayStatus)
	admin.Delete("/play/:id", adminlistings.DeletePlay)

	admin.Post("/coupons", admincoupon.CreateCoupon)
	admin.Get("/coupons", admincoupon.ListCoupons)
	admin.Get("/users", admincoupon.ListUsers)

	admin.Post("/offers", adminoffer.CreateOffer)
	admin.Get("/offers", adminoffer.ListOffers)

	admin.Post("/upload-media", orgmedia.UploadMedia)
}
