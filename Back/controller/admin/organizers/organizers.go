package organizers

import (
	"context"
	"strconv"
	"ticpin-backend/config"
	"ticpin-backend/models"
	organizersvc "ticpin-backend/services/organizer"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ListOrganizers returns a paginated list of organizers with optional search.
// GET /api/admin/organizers?page=1&limit=10&search=...
func ListOrganizers(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")

	filter := bson.M{}
	if search != "" {
		filter["email"] = bson.M{"$regex": search, "$options": "i"}
	}

	skip := int64((page - 1) * limit)
	opts := options.Find().SetSkip(skip).SetLimit(int64(limit)).SetSort(bson.M{"_id": -1})

	col := config.GetDB().Collection("organizers")
	cursor, err := col.Find(context.Background(), filter, opts)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer cursor.Close(context.Background())

	var list []models.Organizer
	if err := cursor.All(context.Background(), &list); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	total, _ := col.CountDocuments(context.Background(), filter)

	return c.JSON(fiber.Map{
		"organizers": list,
		"total":      total,
		"page":       page,
		"pages":      (total + int64(limit) - 1) / int64(limit),
	})
}

// GetOrganizerDetail returns full organizer info + their verification setups.
// GET /api/admin/organizers/:id
func GetOrganizerDetail(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}

	var org models.Organizer
	err = config.GetDB().Collection("organizers").FindOne(context.Background(), bson.M{"_id": id}).Decode(&org)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "not found"})
	}

	// Fetch all setups for this organizer (dining, events, play)
	cursor, err := config.GetDB().Collection("organizer_setups").Find(context.Background(), bson.M{"organizerId": id})
	var setups []models.OrganizerSetup
	if err == nil {
		cursor.All(context.Background(), &setups)
	}

	return c.JSON(fiber.Map{
		"organizer": org,
		"setups":    setups,
	})
}

// UpdateCategoryStatus sets verification status for a specific vertical.
// POST /api/admin/organizers/:id/status
func UpdateCategoryStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		Category string `json:"category"` // "dining" | "events" | "play"
		Status   string `json:"status"`   // "pending" | "approved" | "rejected"
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}

	if err := organizersvc.UpdateCategoryStatus(id, body.Category, body.Status); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "status updated for " + body.Category})
}

// DeleteOrganizer removes an organizer and all their setups.
// DELETE /api/admin/organizers/:id
func DeleteOrganizer(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}

	// Delete from organizers collection
	_, err = config.GetDB().Collection("organizers").DeleteOne(context.Background(), bson.M{"_id": id})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete organizer"})
	}

	// Delete from setups collection
	_, _ = config.GetDB().Collection("organizer_setups").DeleteMany(context.Background(), bson.M{"organizerId": id})

	// Also delete from profiles if exists
	_, _ = config.GetDB().Collection("profiles").DeleteOne(context.Background(), bson.M{"organizerId": id})

	return c.JSON(fiber.Map{"message": "organizer and related data deleted"})
}
