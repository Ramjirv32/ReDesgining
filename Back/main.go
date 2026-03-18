package main

import (
	"context"
	stdlog "log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/middleware"
	adminroutes "ticpin-backend/routes/admin"
	bookingroutes "ticpin-backend/routes/booking"
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

func main() {
	godotenv.Load()

	worker.Init(5, 100)

	if err := config.ConnectDB(); err != nil {
		stdlog.Fatal("MongoDB:", err)
	}

	if err := config.InitCloudinary(); err != nil {
		stdlog.Fatal("Cloudinary:", err)
	}

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	if os.Getenv("ENV") != "production" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}

	app := fiber.New(fiber.Config{
		JSONEncoder: json.Marshal,
		JSONDecoder: json.Unmarshal,
	})

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

	// Domain restriction middleware
	app.Use(func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		referer := c.Get("Referer")

		// Allow localhost for development
		if c.IP() == "127.0.0.1" || c.IP() == "::1" {
			return c.Next()
		}

		// Check allowed domains
		allowedOrigins := []string{
			"https://re-desgining.vercel.app",
			"https://ticpin.in",
			"http://localhost:3000",
		}

		// Check Origin header
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

		// Check Referer header as fallback
		if referer != "" {
			allowed := false
			for _, allowedOrigin := range allowedOrigins {
				if len(referer) >= len(allowedOrigin) && referer[:len(allowedOrigin)] == allowedOrigin {
					allowed = true
					break
				}
			}
			if !allowed {
				return c.Status(403).JSON(fiber.Map{"error": "referer not allowed"})
			}
		}

		return c.Next()
	})

	app.Use(fiberRecover.New())
	app.Use(compress.New(compress.Config{Level: compress.LevelDefault}))

	// Start rate limiting cleanup
	middleware.StartRateLimitCleanup()

	// Apply rate limiting to all routes
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

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{"status": "ok"})
	})

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

	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	if os.Getenv("ENV") == "development" {
		app.Get("/api/debug/routes", func(c *fiber.Ctx) error {
			return c.JSON(app.Stack())
		})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "9000"
	}

	go func() {
		if err := app.Listen(":" + port); err != nil {
			log.Printf("Listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")
	worker.Shutdown()
	if err := app.ShutdownWithTimeout(10 * time.Second); err != nil {
		stdlog.Printf("Shutdown: %v", err)
	}

	if config.MongoClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := config.MongoClient.Disconnect(ctx); err != nil {
			stdlog.Printf("MongoDB Disconnect: %v", err)
		}
	}
	log.Info().Msg("Server exited")
}
