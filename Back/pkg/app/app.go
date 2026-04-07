package app

import (
	"fmt"
	stdlog "log"
	"os"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/middleware"
	adminroutes "ticpin-backend/routes/admin"
	bookingroutes "ticpin-backend/routes/booking"
	"ticpin-backend/routes/cache"
	diningroutes "ticpin-backend/routes/dining"
	eventroutes "ticpin-backend/routes/event"
	mobileroutes "ticpin-backend/routes/mobile"
	"ticpin-backend/routes/organizer"
	organizerdining "ticpin-backend/routes/organizer/dining"
	organizerEvents "ticpin-backend/routes/organizer/events"
	organizerplay "ticpin-backend/routes/organizer/play"
	passroutes "ticpin-backend/routes/pass"
	paymentroutes "ticpin-backend/routes/payment"
	playroutes "ticpin-backend/routes/play"
	"ticpin-backend/routes/profile"
	"ticpin-backend/routes/user"
	"ticpin-backend/services/chat"
	"ticpin-backend/worker"

	"github.com/go-playground/validator/v10"
	json "github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberRecover "github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

var validate = validator.New()

func InitApp() *fiber.App {
	// Load .env only if not on Vercel
	if os.Getenv("VERCEL") != "1" {
		godotenv.Load()
	}

	// Initialize dependencies
	if err := config.ConnectDB(); err != nil {
		stdlog.Println("MongoDB connection error:", err)
	}

	if err := config.InitCloudinary(); err != nil {
		stdlog.Println("Cloudinary initialization error:", err)
	}

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	if os.Getenv("ENV") != "production" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}

	app := fiber.New(fiber.Config{
		JSONEncoder: json.Marshal,
		JSONDecoder: json.Unmarshal,
	})

	// Logging Middleware
	app.Use(func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		stop := time.Now()

		log.Info().
			Str("method", c.Method()).
			Str("path", c.Path()).
			Int("status", c.Response().StatusCode()).
			Dur("latency", stop.Sub(start)).
			Str("ip", c.IP()).
			Msg("HTTP Request")

		return err
	})

	// Security Middleware
	app.Use(func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		if c.IP() == "127.0.0.1" || c.IP() == "::1" || os.Getenv("VERCEL") == "1" {
			return c.Next()
		}
		allowedOrigins := []string{
			"https://re-desgining.vercel.app",
			"https://ticpin.in",
			"http://localhost:3000",
		}
		if origin != "" {
			allowed := false
			for _, allowedOrigin := range allowedOrigins {
				if origin == allowedOrigin {
					allowed = true
					break
				}
			}
			if !allowed {
				return c.Status(403).JSON(fiber.Map{"error": "origin not allowed"})
			}
		}
		return c.Next()
	})

	app.Use(fiberRecover.New())
	app.Use(compress.New(compress.Config{Level: compress.LevelDefault}))

	// Background tasks only if NOT on Vercel
	if os.Getenv("VERCEL") != "1" {
		worker.Init(5, 100)
		middleware.StartRateLimitCleanup()
	}

	app.Use(middleware.RateLimitByPath)

	corsOrigins := os.Getenv("CORS_ORIGINS")
	if corsOrigins == "" {
		corsOrigins = "https://re-desgining.vercel.app,https://ticpin.in,http://localhost:3000"
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowCredentials: true,
	}))

	// Routes
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{"status": "ok", "vercel": os.Getenv("VERCEL") == "1"})
	})

	// Static files handled by Vercel for web app, but if needed from backend:
	app.Static("/uploads", "./uploads")

	organizer.OrganizerRoutes(app)
	organizerplay.PlayRoutes(app)
	organizerEvents.EventsRoutes(app)
	organizerdining.DiningRoutes(app)

	user.UserRoutes(app)
	profile.ProfileRoutes(app)
	eventroutes.EventRoutes(app)
	playroutes.PlayRoutes(app)
	diningroutes.DiningRoutes(app)
	passroutes.PassRoutes(app)
	mobileroutes.RegisterMobileRoutes(app)

	adminroutes.AdminRoutes(app)
	bookingroutes.BookingRoutes(app)
	paymentroutes.PaymentRoutes(app)
	chat.SetupRoutes(app)
	cache.SetupCacheRoutes(app)

	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	return app
}
