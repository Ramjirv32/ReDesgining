package app

import (
	"log"
	"os"
	"time"

	"ticpin-backend/config"
	// "ticpin-backend/middleware"
	// adminroutes "ticpin-backend/routes/admin"
	// bookingroutes "ticpin-backend/routes/booking"
	// "ticpin-backend/routes/cache"
	// diningroutes "ticpin-backend/routes/dining"
	// eventroutes "ticpin-backend/routes/event"
	// mobileroutes "ticpin-backend/routes/mobile"
	// "ticpin-backend/routes/organizer"
	// organizerdining "ticpin-backend/routes/organizer/dining"
	// organizerEvents "ticpin-backend/routes/organizer/events"
	// organizerplay "ticpin-backend/routes/organizer/play"
	// passroutes "ticpin-backend/routes/pass"
	// paymentroutes "ticpin-backend/routes/payment"
	// playroutes "ticpin-backend/routes/play"
	// "ticpin-backend/routes/profile"
	// "ticpin-backend/routes/user"
	// "ticpin-backend/services/chat"
	// "ticpin-backend/worker"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberRecover "github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func InitApp() *fiber.App {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Initialize Postgres
	if err := config.ConnectDB(); err != nil {
		log.Fatalf("PostgreSQL connection error: %v", err)
	}

	// Run migrations
	config.AutoMigrate()

	app := fiber.New()

	// Logging Middleware
	app.Use(func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		stop := time.Now()

		log.Printf("[%s] %s | %d | %v | %s",
			c.Method(), c.Path(), c.Response().StatusCode(), stop.Sub(start), c.IP())

		return err
	})

	app.Use(fiberRecover.New())
	app.Use(compress.New(compress.Config{Level: compress.LevelDefault}))

	corsOrigins := os.Getenv("CORS_ORIGINS")
	if corsOrigins == "" {
		corsOrigins = "*"
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowCredentials: true,
	}))

	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{"status": "ok", "db": "postgres"})
	})

	// Placeholder for routes (will be uncommented as we migrate them)
	/*
	organizer.OrganizerRoutes(app)
	user.UserRoutes(app)
	profile.ProfileRoutes(app)
	// ... other routes
	*/

	return app
}
