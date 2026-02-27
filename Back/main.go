package main

import (
	"log"

	"ticpin-backend/config"
	adminroutes "ticpin-backend/routes/admin"
	bookingroutes "ticpin-backend/routes/booking"
	diningroutes "ticpin-backend/routes/dining"
	eventroutes "ticpin-backend/routes/event"
	"ticpin-backend/routes/organizer"
	organizerdining "ticpin-backend/routes/organizer/dining"
	organizerEvents "ticpin-backend/routes/organizer/events"
	organizerplay "ticpin-backend/routes/organizer/play"
	passroutes "ticpin-backend/routes/pass"
	playroutes "ticpin-backend/routes/play"
	"ticpin-backend/routes/profile"
	"ticpin-backend/routes/user"

	json "github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	fiberRecover "github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	if err := config.ConnectDB(); err != nil {
		log.Fatal("MongoDB:", err)
	}

	if err := config.InitCloudinary(); err != nil {
		log.Fatal("Cloudinary:", err)
	}

	app := fiber.New(fiber.Config{
		JSONEncoder: json.Marshal,
		JSONDecoder: json.Unmarshal,
	})

	app.Use(logger.New())
	app.Use(fiberRecover.New())

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000,http://localhost:9000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowCredentials: true,
	}))

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

	adminroutes.AdminRoutes(app)
	bookingroutes.BookingRoutes(app)

	app.Get("/api/debug/routes", func(c *fiber.Ctx) error {
		return c.JSON(app.Stack())
	})

	log.Fatal(app.Listen(":9000"))
}
