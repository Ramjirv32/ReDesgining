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
		"limit":      limit,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

func GetOrganizerByID(c *fiber.Ctx) error {
	organizerID := c.Params("id")
	if organizerID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Organizer ID is required"})
	}

	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid organizer ID"})
	}

	col := config.GetDB().Collection("organizers")
	var organizer models.Organizer

	err = col.FindOne(c.Context(), bson.M{"_id": objID}).Decode(&organizer)
	if err != nil {
		if err.Error() == "mongo: no documents in result" {
			return c.Status(404).JSON(fiber.Map{"error": "Organizer not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Infer PAN card status if missing
	if organizer.PANCardStatus == "" && (organizer.PANCardPublicID != "" || organizer.PANCardURL != "") {
		organizer.PANCardStatus = "uploaded"
	}

	return c.JSON(organizer)
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

	// Fetch profile
	var profile models.Profile
	config.GetDB().Collection("profiles").FindOne(c.Context(), bson.M{"organizerId": id}).Decode(&profile)

	// Infer PAN card status if missing
	if org.PANCardStatus == "" && (org.PANCardPublicID != "" || org.PANCardURL != "") {
		org.PANCardStatus = "uploaded"
	}

	cursor, err := config.GetDB().Collection("organizer_setups").Find(c.Context(), bson.M{"organizerId": id})
	var setups []models.OrganizerSetup
	if err == nil {
		cursor.All(c.Context(), &setups)
	}

	return c.JSON(fiber.Map{
		"organizer": org,
		"profile":   profile,
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

func UpdateOrganizer(c *fiber.Ctx) error {
	id := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}

	var payload struct {
		Organizer models.Organizer        `json:"organizer"`
		Profile   models.Profile          `json:"profile"`
		Setups    []models.OrganizerSetup `json:"setups"`
	}

	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}

	config.GetDB().Collection("organizers").UpdateOne(c.Context(), bson.M{"_id": objID}, bson.M{"$set": bson.M{
		"email": payload.Organizer.Email,
		"name":  payload.Organizer.Name,
	}})

	config.GetDB().Collection("profiles").UpdateOne(c.Context(), bson.M{"organizerId": objID}, bson.M{"$set": payload.Profile}, options.Update().SetUpsert(true))

	for _, s := range payload.Setups {
		if s.ID != primitive.NilObjectID {
			config.GetDB().Collection("organizer_setups").UpdateOne(c.Context(), bson.M{"_id": s.ID}, bson.M{"$set": s})
		}
	}

	return c.JSON(fiber.Map{"message": "organizer updated successfully"})
}
