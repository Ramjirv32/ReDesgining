package organizers

import (
	"strconv"
	"ticpin-backend/config"
	"ticpin-backend/models"
	organizersvc "ticpin-backend/services/organizer"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func ListOrganizers(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")

	filter := bson.M{}
	if search != "" {
		filter["email"] = bson.M{"$regex": search, "$options": "i"}
	}

	status := c.Query("status", "")
	if status != "" {
		filter["$or"] = []bson.M{
			{"categoryStatus.events": status},
			{"categoryStatus.dining": status},
			{"categoryStatus.play": status},
		}
	}

	skip := int64((page - 1) * limit)
	opts := options.Find().SetSkip(skip).SetLimit(int64(limit)).SetSort(bson.M{"_id": -1})

	col := config.GetDB().Collection("organizers")
	cursor, err := col.Find(c.Context(), filter, opts)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer cursor.Close(c.Context())

	list := []models.Organizer{}
	if err := cursor.All(c.Context(), &list); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	total, _ := col.CountDocuments(c.Context(), filter)

	return c.JSON(fiber.Map{
		"organizers": list,
		"total":      total,
		"page":       page,
		"pages":      (total + int64(limit) - 1) / int64(limit),
	})
}

func GetOrganizerDetail(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}

	var org models.Organizer
	err = config.GetDB().Collection("organizers").FindOne(c.Context(), bson.M{"_id": id}).Decode(&org)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "not found"})
	}

	cursor, err := config.GetDB().Collection("organizer_setups").Find(c.Context(), bson.M{"organizerId": id})
	var setups []models.OrganizerSetup
	if err == nil {
		cursor.All(c.Context(), &setups)
	}

	return c.JSON(fiber.Map{
		"organizer": org,
		"setups":    setups,
	})
}

func UpdateCategoryStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		Category string `json:"category"`
		Status   string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}

	if err := organizersvc.UpdateCategoryStatus(id, body.Category, body.Status); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "status updated for " + body.Category})
}

func DeleteOrganizer(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}

	_, err = config.GetDB().Collection("organizers").DeleteOne(c.Context(), bson.M{"_id": id})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete organizer"})
	}
	_, _ = config.GetDB().Collection("organizer_setups").DeleteMany(c.Context(), bson.M{"organizerId": id})
	_, _ = config.GetDB().Collection("profiles").DeleteOne(c.Context(), bson.M{"organizerId": id})

	return c.JSON(fiber.Map{"message": "organizer and related data deleted"})
}
