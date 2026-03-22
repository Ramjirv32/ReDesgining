package cache

import (
	"net/http"
	"ticpin-backend/cache"

	"github.com/gofiber/fiber/v2"
)

func GetCacheStats(c *fiber.Ctx) error {
	stats := cache.GlobalCache.Stats()
	return c.Status(http.StatusOK).JSON(fiber.Map{
		"cache":  stats,
		"status": "active",
	})
}

func ClearCache(c *fiber.Ctx) error {

	cache.GlobalCache.Clear()
	return c.Status(http.StatusOK).JSON(fiber.Map{
		"message": "Cache cleared successfully",
		"status":  "cleared",
	})
}

func InvalidateEntityType(c *fiber.Ctx) error {
	entityType := c.Params("entityType")
	if entityType == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Entity type is required",
		})
	}

	cacheManager := cache.NewCacheManager()
	cacheManager.InvalidateEntityType(entityType)

	return c.Status(http.StatusOK).JSON(fiber.Map{
		"message":     "Cache invalidated for entity type: " + entityType,
		"entity_type": entityType,
	})
}
