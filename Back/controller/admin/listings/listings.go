package listings

import (
	"context"
	"time"

	"ticpin-backend/cache"
	"ticpin-backend/config"
	"ticpin-backend/models"
	diningservice "ticpin-backend/services/dining"
	eventservice "ticpin-backend/services/event"
	playservice "ticpin-backend/services/play"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func deleteDoc(collection string, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	col := config.GetDB().Collection(collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = col.DeleteOne(ctx, bson.M{"_id": objID})
	if err == nil {

		keyType := collection
		if collection == "plays" {
			keyType = "play"
		} else if collection == "events" {
			keyType = "event"
		} else if collection == "dinings" {
			keyType = "dining"
		}
		cache.GlobalCache.Delete(keyType + ":" + id)
	}
	return err
}

func ListAllEvents(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	after := c.Query("after")

	events, nextCursor, err := eventservice.GetAllForAdmin("", limit, after)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"data":        events,
		"next_cursor": nextCursor,
	})
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
	cache.GlobalCache.Delete("event:" + id)
	return c.JSON(fiber.Map{"message": "event status updated", "status": body.Status})
}

func UpdateEvent(c *fiber.Ctx) error {
	id := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}
	var update models.Event
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}
	update.UpdatedAt = time.Now()

	col := config.GetDB().Collection("events")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingEvent models.Event
	err = col.FindOne(ctx, bson.M{"_id": objID}).Decode(&existingEvent)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "event not found"})
	}

	update.OrganizerID = existingEvent.OrganizerID

	_, err = col.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": update})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	cache.GlobalCache.Delete("event:" + id)
	return c.JSON(fiber.Map{"message": "event updated"})
}

func ListAllDining(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	after := c.Query("after")

	dinings, nextCursor, err := diningservice.GetAllForAdmin("", limit, after)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"data":        dinings,
		"next_cursor": nextCursor,
	})
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
	cache.GlobalCache.Delete("dining:" + id)
	return c.JSON(fiber.Map{"message": "dining status updated", "status": body.Status})
}

func UpdateDining(c *fiber.Ctx) error {
	id := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}
	var update models.Dining
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}
	update.UpdatedAt = time.Now()

	col := config.GetDB().Collection("dinings")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingDining models.Dining
	err = col.FindOne(ctx, bson.M{"_id": objID}).Decode(&existingDining)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "dining not found"})
	}

	update.OrganizerID = existingDining.OrganizerID

	_, err = col.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": update})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	cache.GlobalCache.Delete("dining:" + id)
	return c.JSON(fiber.Map{"message": "dining updated"})
}

func ListAllPlay(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	after := c.Query("after")

	plays, nextCursor, err := playservice.GetAll("", "", limit, after)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"data":        plays,
		"next_cursor": nextCursor,
	})
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
	cache.GlobalCache.Delete("play:" + id)
	return c.JSON(fiber.Map{"message": "play status updated", "status": body.Status})
}

func UpdatePlay(c *fiber.Ctx) error {
	id := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}
	var update models.Play
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}
	update.UpdatedAt = time.Now()

	col := config.GetDB().Collection("plays")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingPlay models.Play
	err = col.FindOne(ctx, bson.M{"_id": objID}).Decode(&existingPlay)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "play not found"})
	}

	update.OrganizerID = existingPlay.OrganizerID

	_, err = col.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": update})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	cache.GlobalCache.Delete("play:" + id)
	return c.JSON(fiber.Map{"message": "play updated"})
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
