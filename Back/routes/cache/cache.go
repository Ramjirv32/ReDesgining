package cache

import (
	cacheController "ticpin-backend/controller/cache"

	"github.com/gofiber/fiber/v2"
)

func SetupCacheRoutes(app *fiber.App) {
	// Cache management routes (admin protected)
	cacheGroup := app.Group("/api/cache")

	// Get cache statistics
	cacheGroup.Get("/stats", cacheController.GetCacheStats)

	// Clear entire cache (use with caution)
	cacheGroup.Delete("/clear", cacheController.ClearCache)

	// Invalidate specific entity type cache
	cacheGroup.Delete("/invalidate/:entityType", cacheController.InvalidateEntityType)
}
