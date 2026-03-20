package offer

import (
	"context"
	"errors"
	"fmt"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ValidationResult struct {
	Offer          models.EventOffer
	DiscountAmount float64
}

func Create(o *models.EventOffer) error {
	o.ID = primitive.NewObjectID()
	o.CreatedAt = time.Now()
	col := config.GetDB().Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := col.InsertOne(ctx, o)
	return err
}

func ValidateOffer(offerID string, entityID string, orderAmount float64) (*ValidationResult, error) {
	col := config.GetDB().Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(offerID)
	if err != nil {
		return nil, errors.New("invalid offer ID")
	}

	var offer models.EventOffer
	err = col.FindOne(ctx, bson.M{"_id": objID}).Decode(&offer)
	if err != nil {
		return nil, errors.New("offer not found")
	}

	// Check if offer is active
	if !offer.IsActive {
		return nil, errors.New("offer is not active")
	}

	// Check if offer is still valid
	if time.Now().After(offer.ValidUntil) {
		return nil, errors.New("offer has expired")
	}

	// Check if offer applies to this entity
	entityObjID, err := primitive.ObjectIDFromHex(entityID)
	if err != nil {
		return nil, errors.New("invalid entity ID")
	}

	applies := false
	if offer.EntityIDs != nil {
		for _, id := range offer.EntityIDs {
			if id == entityObjID {
				applies = true
				break
			}
		}
	}

	if !applies {
		return nil, errors.New("offer does not apply to this entity")
	}

	// Calculate discount
	var discountAmount float64
	if offer.DiscountType == "percent" {
		discountAmount = orderAmount * (offer.DiscountValue / 100)
	} else {
		discountAmount = offer.DiscountValue
	}

	// Ensure discount doesn't exceed order amount
	if discountAmount > orderAmount {
		discountAmount = orderAmount
	}

	return &ValidationResult{
		Offer:          offer,
		DiscountAmount: discountAmount,
	}, nil
}

func GetAll() ([]models.EventOffer, error) {
	col := config.GetDB().Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := col.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	offers := []models.EventOffer{}
	if err := cursor.All(ctx, &offers); err != nil {
		return nil, err
	}
	return offers, nil
}

func GetForEntity(entityType string, entityID string) ([]models.EventOffer, error) {
	objID, err := primitive.ObjectIDFromHex(entityID)
	if err != nil {
		return nil, err
	}
	col := config.GetDB().Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"applies_to":  entityType,
		"is_active":   true,
		"valid_until": bson.M{"$gt": time.Now()},
		"entity_ids":  bson.M{"$elemMatch": bson.M{"$eq": objID}},
	}

	// Debug logging
	fmt.Printf("DEBUG: GetForEntity filter - entityType: %s, entityID: %s\n", entityType, entityID)

	cursor, err := col.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	offers := []models.EventOffer{}
	if err := cursor.All(ctx, &offers); err != nil {
		return nil, err
	}

	// Debug logging
	fmt.Printf("DEBUG: Found %d offers for %s %s\n", len(offers), entityType, entityID)
	for _, offer := range offers {
		fmt.Printf("DEBUG: Offer - ID: %s, Title: %s, AppliesTo: %s\n", offer.ID.Hex(), offer.Title, offer.AppliesTo)
	}

	return offers, nil
}
func GetByCategory(category string) ([]models.EventOffer, error) {
	col := config.GetDB().Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"applies_to":  category,
		"is_active":   true,
		"valid_until": bson.M{"$gt": time.Now()},
	}
	cursor, err := col.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	offers := []models.EventOffer{}
	if err := cursor.All(ctx, &offers); err != nil {
		return nil, err
	}
	return offers, nil
}

func Update(id string, o *models.EventOffer) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	col := config.GetDB().Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	updateFields := bson.M{
		"title":          o.Title,
		"description":    o.Description,
		"discount_type":  o.DiscountType,
		"discount_value": o.DiscountValue,
		"applies_to":     o.AppliesTo,
		"entity_ids":     o.EntityIDs,
		"valid_until":    o.ValidUntil,
		"is_active":      o.IsActive,
		"updated_at":     time.Now(),
	}

	if o.Image != "" {
		updateFields["image"] = o.Image
	}

	update := bson.M{"$set": updateFields}

	_, err = col.UpdateOne(ctx, bson.M{"_id": objID}, update)
	return err
}

func Delete(id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	col := config.GetDB().Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = col.DeleteOne(ctx, bson.M{"_id": objID})
	return err
}
