package cache

import (
	cacheController "ticpin-backend/controller/cache"

	"github.com/gofiber/fiber/v2"
)

func SetupCacheRoutes(app *fiber.App) {

	cacheGroup := app.Group("/api/cache")

	cacheGroup.Get("/stats", cacheController.GetCacheStats)

	cacheGroup.Delete("/clear", cacheController.ClearCache)

	cacheGroup.Delete("/invalidate/:entityType", cacheController.InvalidateEntityType)
}
