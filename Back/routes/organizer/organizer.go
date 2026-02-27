package organizer

import (
	orgauth "ticpin-backend/controller/organizer/auth"
	orgmedia "ticpin-backend/controller/organizer/media"
	orgprofile "ticpin-backend/controller/organizer/profile"
	orgver "ticpin-backend/controller/organizer/verification"
	"ticpin-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func OrganizerRoutes(app *fiber.App) {
	profileGrp := app.Group("/api/organizer/profile", middleware.RequireAuth)
	profileGrp.Post("", orgprofile.CreateProfile)
	profileGrp.Get("/:id", orgprofile.GetProfile)
	profileGrp.Put("/:id", orgprofile.UpdateProfile)

	verGrp := app.Group("/api/organizer/verification", middleware.RequireAuth)
	verGrp.Get("/:id", orgver.GetVerificationStatus)

	app.Get("/api/organizer/me", middleware.RequireAuth, orgmedia.GetOrganizerMe)

	app.Get("/api/organizer/:id/status", middleware.RequireAuth, orgver.GetCategoryStatus)

	app.Get("/api/organizer/:id/existing-setup", middleware.RequireAuth, orgver.GetExistingSetupHandler)

	app.Post("/api/organizer/upload-pan", middleware.RequireAuth, orgmedia.UploadPANCard)

	// Generic media upload for create pages (images, gallery, menu)
	app.Post("/api/organizer/upload-media", middleware.RequireAuth, orgmedia.UploadMedia)

	app.Post("/api/organizer/send-backup-otp", middleware.RequireAuth, orgver.SendBackupOTPHandler)
	app.Post("/api/organizer/verify-backup-otp", middleware.RequireAuth, orgver.VerifyBackupOTPHandler)

	app.Post("/api/organizer/logout", orgauth.Logout)
}
