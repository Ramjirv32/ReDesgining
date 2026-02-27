package stats

import (
	"context"
	"ticpin-backend/config"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
)

// GetStats returns counts for admin dashboard.
func GetStats(c *fiber.Ctx) error {
	orgCount, _ := config.GetDB().Collection("organizers").CountDocuments(context.Background(), bson.M{})
	setupCount, _ := config.GetDB().Collection("organizer_setups").CountDocuments(context.Background(), bson.M{})

	return c.JSON(fiber.Map{
		"total_organizers": orgCount,
		"total_setups":     setupCount,
	})
}
