package listings

import (
	"context"
	"time"

	"ticpin-backend/config"
	diningservice "ticpin-backend/services/dining"
	eventservice "ticpin-backend/services/event"
	playservice "ticpin-backend/services/play"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ── helper ────────────────────────────────────────────────────────────────

func deleteDoc(collection string, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	col := config.GetDB().Collection(collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = col.DeleteOne(ctx, bson.M{"_id": objID})
	return err
}

// ── Events ────────────────────────────────────────────────────────────────

func ListAllEvents(c *fiber.Ctx) error {
	events, err := eventservice.GetAll("", "")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(events)
}

func UpdateEventStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}
	var body struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil || body.Status == "" {
		return c.Status(400).JSON(fiber.Map{"error": "status is required"})
	}
	if body.Status != "pending" && body.Status != "approved" && body.Status != "rejected" {
		return c.Status(400).JSON(fiber.Map{"error": "status must be pending, approved, or rejected"})
	}
	col := config.GetDB().Collection("events")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = col.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": bson.M{"status": body.Status, "updated_at": time.Now()}})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "event status updated", "status": body.Status})
}

// ── Dining ────────────────────────────────────────────────────────────────

func ListAllDining(c *fiber.Ctx) error {
	dinings, err := diningservice.GetAll()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(dinings)
}

func UpdateDiningStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}
	var body struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil || body.Status == "" {
		return c.Status(400).JSON(fiber.Map{"error": "status is required"})
	}
	if body.Status != "pending" && body.Status != "approved" && body.Status != "rejected" {
		return c.Status(400).JSON(fiber.Map{"error": "status must be pending, approved, or rejected"})
	}
	col := config.GetDB().Collection("dinings")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = col.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": bson.M{"status": body.Status, "updated_at": time.Now()}})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "dining status updated", "status": body.Status})
}

// ── Play ──────────────────────────────────────────────────────────────────

func ListAllPlay(c *fiber.Ctx) error {
	plays, err := playservice.GetAll("")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(plays)
}

func UpdatePlayStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}
	var body struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil || body.Status == "" {
		return c.Status(400).JSON(fiber.Map{"error": "status is required"})
	}
	if body.Status != "pending" && body.Status != "approved" && body.Status != "rejected" {
		return c.Status(400).JSON(fiber.Map{"error": "status must be pending, approved, or rejected"})
	}
	col := config.GetDB().Collection("plays")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = col.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": bson.M{"status": body.Status, "updated_at": time.Now()}})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "play status updated", "status": body.Status})
}

func DeleteEvent(c *fiber.Ctx) error {
	if err := deleteDoc("events", c.Params("id")); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "event deleted"})
}

func DeleteDining(c *fiber.Ctx) error {
	if err := deleteDoc("dinings", c.Params("id")); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "dining deleted"})
}

func DeletePlay(c *fiber.Ctx) error {
	if err := deleteDoc("plays", c.Params("id")); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "play deleted"})
}
