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
	// Single organizer routes (need to come before the catch-all /:id routes)
	app.Get("/api/organizer/me", middleware.RequireAuth, orgmedia.GetOrganizerMe)

	// Profile routes - using implicit organizerId from auth
	profileGrp := app.Group("/api/organizer/profile", middleware.RequireAuth)
	profileGrp.Get("", orgprofile.GetProfile)        // GET current profile
	profileGrp.Post("", orgprofile.CreateProfile)    // POST new profile
	profileGrp.Put("", orgprofile.UpdateProfile)     // PUT update profile
	profileGrp.Get("/:id", orgprofile.GetProfile)    // Fallback for /:id (still uses auth)
	profileGrp.Put("/:id", orgprofile.UpdateProfile) // Fallback for /:id (still uses auth)

	// Verification routes
	verGrp := app.Group("/api/organizer/verification", middleware.RequireAuth)
	verGrp.Get("/:id", orgver.GetVerificationStatus)

	// Generic routes that need specific routes first
	app.Get("/api/organizer/:id/status", middleware.RequireAuth, orgver.GetCategoryStatus)
	app.Get("/api/organizer/:id/existing-setup", middleware.RequireAuth, orgver.GetExistingSetupHandler)

	// Media uploads
	app.Post("/api/organizer/upload-pan", middleware.RequireAuth, orgmedia.UploadPANCard)
	app.Post("/api/organizer/upload-media", middleware.RequireAuth, orgmedia.UploadMedia)

	// Auth routes
	app.Post("/api/organizer/send-backup-otp", middleware.RequireAuth, orgver.SendBackupOTPHandler)
	app.Post("/api/organizer/verify-backup-otp", middleware.RequireAuth, orgver.VerifyBackupOTPHandler)
	app.Post("/api/organizer/logout", orgauth.Logout)
}
