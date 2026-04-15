package booking

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"ticpin-backend/config"
	"ticpin-backend/models"
)

var (
	ErrSlotAlreadyLocked = errors.New("slot is already locked by another user")
)

func CreateSlotLock(ctx context.Context, req models.LockRequest) (*models.SlotLock, error) {
	col := config.SlotLocksCol

	refID, err := primitive.ObjectIDFromHex(req.ReferenceID)
	if err != nil {
		return nil, fmt.Errorf("invalid reference id: %w", err)
	}

	// 1. Check if this exact slot is already locked by SOMEONE ELSE
	conflictFilter := bson.M{
		"type":         req.Type,
		"reference_id": refID,
		"date":         req.Date,
		"slot":         req.Slot,
		"lock_key":     bson.M{"$ne": req.LockKey}, // Someone else
		"booking_id":   bson.M{"$exists": false},   // Not converted to absolute booking
		"expires_at":   bson.M{"$gt": time.Now()},  // Still valid
	}
	if req.Type == "play" && req.CourtName != "" {
		conflictFilter["court_name"] = req.CourtName
	}
	if req.Type == "play" {
		conflictFilter["play_id"] = refID
	}

	count, err := col.CountDocuments(ctx, conflictFilter)
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, ErrSlotAlreadyLocked
	}

	// 2. Enforce limits for THIS user (lock_key)
	var maxLocks int64 = 1
	if req.Type == "play" {
		maxLocks = 2
	} else if req.Type == "event" {
		maxLocks = 10
	} else if req.Type == "dining" {
		maxLocks = 1
	}

	userLocksFilter := bson.M{
		"lock_key":   req.LockKey,
		"type":       req.Type,
		"booking_id": bson.M{"$exists": false},
		"expires_at": bson.M{"$gt": time.Now()},
	}
	
	cursor, err := col.Find(ctx, userLocksFilter, options.Find().SetSort(bson.M{"created_at": 1}))
	if err == nil {
		var activeLocks []models.SlotLock
		if cursor.All(ctx, &activeLocks) == nil {
			if int64(len(activeLocks)) >= maxLocks {
				numToDelete := len(activeLocks) - int(maxLocks) + 1
				for i := 0; i < numToDelete; i++ {
					col.DeleteOne(ctx, bson.M{"_id": activeLocks[i].ID})
				}
			}
		}
	}

	// 3. Insert or Update the current slot lock
	sameSlotFilter := bson.M{
		"lock_key":     req.LockKey,
		"type":         req.Type,
		"reference_id": refID,
		"date":         req.Date,
		"slot":         req.Slot,
	}
	if req.Type == "play" {
		sameSlotFilter["play_id"] = refID
		if req.CourtName != "" {
			sameSlotFilter["court_name"] = req.CourtName
		}
	}

	now := time.Now()
	expiresAt := now.Add(5 * time.Minute)

	update := bson.M{
		"$set": bson.M{
			"expires_at": expiresAt,
			"created_at": now,
		},
	}
	if req.Type == "play" {
		update["$set"].(bson.M)["play_id"] = refID
	}

	opts := options.Update().SetUpsert(true)
	_, err = col.UpdateOne(ctx, sameSlotFilter, update, opts)
	if err != nil {
		return nil, err
	}

	// Fetch to return
	var locked models.SlotLock
	err = col.FindOne(ctx, sameSlotFilter).Decode(&locked)
	return &locked, err
}

func UnlockSlot(ctx context.Context, req models.UnlockRequest) error {
	col := config.SlotLocksCol

	refID, _ := primitive.ObjectIDFromHex(req.ReferenceID)

	filter := bson.M{
		"lock_key":     req.LockKey,
		"type":         req.Type,
		"reference_id": refID,
		"date":         req.Date,
		"slot":         req.Slot,
		"booking_id":   bson.M{"$exists": false},
	}
	if req.Type == "play" {
		filter["play_id"] = refID
		if req.CourtName != "" {
			filter["court_name"] = req.CourtName
		}
	}

	_, err := col.DeleteOne(ctx, filter)
	return err
}

func GetUserActiveLocks(ctx context.Context, lockKey string, lockType string) ([]models.SlotLock, error) {
	col := config.SlotLocksCol
	filter := bson.M{
		"lock_key":   lockKey,
		"type":       lockType,
		"booking_id": bson.M{"$exists": false},
		"expires_at": bson.M{"$gt": time.Now()},
	}

	cursor, err := col.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var locks []models.SlotLock
	if err := cursor.All(ctx, &locks); err != nil {
		return nil, err
	}

	return locks, nil
}
