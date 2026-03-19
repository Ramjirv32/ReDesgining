package scripts

import (
	"context"
	"log"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// CleanupExpiredOffers removes expired offers and coupons from database and Cloudinary
func CleanupExpiredOffers() {
	ctx := context.Background()

	// Get collections
	offersCol := config.GetDB().Collection("offers")
	couponsCol := config.GetDB().Collection("coupons")

	// Calculate cutoff date (valid_until + 1 day ago)
	cutoffDate := time.Now().AddDate(0, 0, -1) // 1 day ago

	log.Printf("Starting cleanup of offers/coupons expired before: %s", cutoffDate.Format("2006-01-02 15:04:05"))
	log.Println("Cloudinary cleanup not implemented - images will remain in Cloudinary")

	// Clean up expired offers
	cleanupOffers(ctx, offersCol, cutoffDate)

	// Clean up expired coupons
	cleanupCoupons(ctx, couponsCol, cutoffDate)

	log.Println("Cleanup completed")
}

func cleanupOffers(ctx context.Context, col *mongo.Collection, cutoffDate time.Time) {
	// Find expired offers
	filter := bson.M{
		"valid_until": bson.M{"$lt": cutoffDate},
		"is_active":   true,
	}

	cursor, err := col.Find(ctx, filter)
	if err != nil {
		log.Printf("Error finding expired offers: %v", err)
		return
	}
	defer cursor.Close(ctx)

	deletedCount := 0

	for cursor.Next(ctx) {
		var offer models.EventOffer
		if err := cursor.Decode(&offer); err != nil {
			log.Printf("Error decoding offer: %v", err)
			continue
		}

		// Delete from database
		_, err = col.DeleteOne(ctx, bson.M{"_id": offer.ID})
		if err != nil {
			log.Printf("Error deleting offer %s: %v", offer.ID.Hex(), err)
			continue
		}

		deletedCount++
		log.Printf("Deleted expired offer: %s (%s)", offer.Title, offer.ID.Hex())
	}

	log.Printf("Offers cleanup: %d deleted", deletedCount)
}

func cleanupCoupons(ctx context.Context, col *mongo.Collection, cutoffDate time.Time) {
	// Find expired coupons
	filter := bson.M{
		"valid_until": bson.M{"$lt": cutoffDate},
		"is_active":   true,
	}

	cursor, err := col.Find(ctx, filter)
	if err != nil {
		log.Printf("Error finding expired coupons: %v", err)
		return
	}
	defer cursor.Close(ctx)

	deletedCount := 0

	for cursor.Next(ctx) {
		var coupon models.Coupon
		if err := cursor.Decode(&coupon); err != nil {
			log.Printf("Error decoding coupon: %v", err)
			continue
		}

		// Delete from database
		_, err = col.DeleteOne(ctx, bson.M{"_id": coupon.ID})
		if err != nil {
			log.Printf("Error deleting coupon %s: %v", coupon.ID.Hex(), err)
			continue
		}

		deletedCount++
		log.Printf("Deleted expired coupon: %s (%s)", coupon.Code, coupon.ID.Hex())
	}

	log.Printf("Coupons cleanup: %d deleted", deletedCount)
}
