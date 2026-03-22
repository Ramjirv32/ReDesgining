package event

import (
	"context"
	"errors"
	"fmt"
	"time"

	"ticpin-backend/cache"
	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func calculateMinPrice(categories []models.TicketCategory) float64 {
	if len(categories) == 0 {
		return 0
	}
	min := categories[0].Price
	for _, cat := range categories {
		if cat.Price < min {
			min = cat.Price
		}
	}
	return min
}

func Create(e *models.Event) error {
	orgCol := config.OrgsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var org models.Organizer
	if err := orgCol.FindOne(ctx, bson.M{"_id": e.OrganizerID}, options.FindOne().SetProjection(bson.M{"isVerified": 1, "categoryStatus": 1})).Decode(&org); err != nil {
		return errors.New("organizer not found")
	}
	if !org.IsVerified {
		return errors.New("organizer is not verified")
	}
	if org.CategoryStatus["events"] != "approved" {
		return errors.New("organizer is not approved for the events category")
	}

	if len(e.TicketCategories) > 0 {
		e.PriceStartsFrom = calculateMinPrice(e.TicketCategories)
	}

	e.ID = primitive.NewObjectID()
	if e.Status == "" {
		e.Status = "draft"
	}
	e.CreatedAt = time.Now()
	e.UpdatedAt = time.Now()
	col := config.EventsCol
	ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel2()
	fmt.Printf("DEBUG: Create - Creating event: %+v\n", e)
	_, err := col.InsertOne(ctx2, e)
	fmt.Printf("DEBUG: Create - Event created: %+v\n", err)
	return err
}

func GetAll(category string, artist string, limit int, after string) ([]models.Event, string, error) {
	fmt.Printf("DEBUG: GetAll called with category=%s, artist=%s, limit=%d, after=%s\n", category, artist, limit, after)

	db := config.GetDB()
	if db == nil {
		fmt.Printf("DEBUG: GetAll - Database connection is nil!\n")
		return nil, "", errors.New("database connection failed")
	}
	fmt.Printf("DEBUG: GetAll - Collection name: %s\n", db.Collection("events").Name())

	testCount, err := db.Collection("events").CountDocuments(context.Background(), bson.M{})
	if err != nil {
		fmt.Printf("DEBUG: GetAll - Error counting events: %v\n", err)
	} else {
		fmt.Printf("DEBUG: GetAll - Collection test count: %d\n", testCount)
	}

	filter := bson.M{}
	if category != "" && category != "all" {
		filter["category"] = category
		fmt.Printf("DEBUG: GetAll - Applied category filter: %s\n", category)
	}
	if artist != "" {
		filter["artist"] = bson.M{"$regex": artist, "$options": "i"}
		fmt.Printf("DEBUG: GetAll - Applied artist filter: %s\n", artist)
	}

	var testEvent models.Event
	err = db.Collection("events").FindOne(context.Background(), bson.M{}).Decode(&testEvent)
	if err != nil {
		fmt.Printf("DEBUG: GetAll - Error finding test event: %v\n", err)
	} else {
		fmt.Printf("DEBUG: GetAll - Test event found: %+v\n", testEvent)
	}

	query := bson.M{}
	if after != "" {
		if objectID, err := primitive.ObjectIDFromHex(after); err == nil {
			query["_id"] = bson.M{"$gt": objectID}
			fmt.Printf("DEBUG: GetAll - Applied after cursor: %s\n", after)
		}
	}

	if limit <= 0 || limit > 100 {
		limit = 20
	}
	fmt.Printf("DEBUG: GetAll - Using limit: %d\n", limit)

	finalFilter := bson.M{}
	andConditions := []bson.M{}

	if len(filter) > 0 {
		for k, v := range filter {
			andConditions = append(andConditions, bson.M{k: v})
		}
	}
	if len(query) > 0 {
		for k, v := range query {
			andConditions = append(andConditions, bson.M{k: v})
		}
	}

	if len(andConditions) > 0 {
		finalFilter = bson.M{"$and": andConditions}
	}

	fmt.Printf("DEBUG: GetAll - Final filter: %+v\n", finalFilter)

	opts := options.Find().
		SetSort(bson.D{{Key: "_id", Value: 1}}).
		SetLimit(int64(limit)).
		SetProjection(bson.M{
			"_id": 1, "name": 1, "category": 1, "sub_category": 1, "city": 1,
			"venue_name": 1, "venue_address": 1, "date": 1, "time": 1,
			"portrait_image_url": 1, "landscape_image_url": 1, "price_starts_from": 1,
			"status": 1, "artists": 1,
		})

	cursor, err := db.Collection("events").Find(context.Background(), finalFilter, opts)
	if err != nil {
		fmt.Printf("DEBUG: GetAll - Error finding events: %v\n", err)
		return nil, "", err
	}
	defer cursor.Close(context.Background())

	var events []models.Event
	if err = cursor.All(context.Background(), &events); err != nil {
		fmt.Printf("DEBUG: GetAll - Error decoding events: %v\n", err)
		return nil, "", err
	}

	fmt.Printf("DEBUG: GetAll - Found %d events total\n", len(events))
	for i, event := range events {
		fmt.Printf("DEBUG: GetAll - Event %d: ID=%s, Name=%s, Status=%s, Category=%s\n", i, event.ID.Hex(), event.Name, event.Status, event.Category)
	}

	nextCursor := ""
	if len(events) > 0 && len(events) >= limit {
		nextCursor = events[len(events)-1].ID.Hex()
	}

	count, err := db.Collection("events").CountDocuments(context.Background(), bson.M{})
	if err != nil {
		fmt.Printf("DEBUG: GetAll - Error counting events: %v\n", err)
	} else {
		fmt.Printf("DEBUG: GetAll - Total events in database: %d\n", count)
	}

	nextCursor = ""
	if len(events) > 0 && len(events) >= limit {
		nextCursor = events[len(events)-1].ID.Hex()
	}

	if len(events) > 0 {
		cacheManager := cache.NewCacheManager()
		cacheParams := []interface{}{category, artist, limit, after}
		cacheManager.SetList("event", cacheParams, events, cache.TTLMedium)
	}

	fmt.Printf("DEBUG: GetAll - Returning events and cursor: %s\n", nextCursor)

	return events, nextCursor, nil
}

func GetAllForAdmin(category string, limit int, after string) ([]models.Event, string, error) {
	fmt.Printf("DEBUG: GetAllForAdmin called with category=%s, limit=%d, after=%s\n", category, limit, after)
	col := config.EventsCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}

	if category != "" && category != "all" {
		filter["category"] = category
	}
	if after != "" {
		if oid, err := primitive.ObjectIDFromHex(after); err == nil {
			filter["_id"] = bson.M{"$gt": oid}
		}
	}

	if limit <= 0 || limit > 100 {
		limit = 20
	}

	opts := options.Find().SetLimit(int64(limit)).SetSort(bson.M{"_id": 1})

	cursor, err := col.Find(ctx, filter, opts)
	if err != nil {
		return nil, "", err
	}
	defer cursor.Close(ctx)

	var events []models.Event
	if err := cursor.All(ctx, &events); err != nil {
		return nil, "", err
	}

	nextCursor := ""
	if len(events) > 0 {
		nextCursor = events[len(events)-1].ID.Hex()
	}

	return events, nextCursor, nil
}

func GetByID(id string, bypassCache bool) (*models.Event, error) {

	cacheKey := "event:" + id
	if !bypassCache {
		if val, ok := cache.GlobalCache.Get(cacheKey); ok {
			if e, ok := val.(*models.Event); ok {
				return e, nil
			}
		}
	}

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {

		e, errNamed := GetByName(id)
		if errNamed == nil {
			cache.GlobalCache.Set(cacheKey, e, 5*time.Minute)
			return e, nil
		}
		return nil, err
	}
	col := config.EventsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var e models.Event
	if err := col.FindOne(ctx, bson.M{"_id": objID}).Decode(&e); err != nil {
		return nil, err
	}

	cache.GlobalCache.Set(cacheKey, &e, 5*time.Minute)

	return &e, nil
}

func GetEventOffers(eventIdentifier string) ([]models.EventOffer, error) {
	col := config.GetDB().Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := col.Find(ctx, bson.M{"is_active": true})
	if err != nil {
		return []models.EventOffer{}, nil
	}
	defer cursor.Close(ctx)

	var offers []models.EventOffer
	if err := cursor.All(ctx, &offers); err != nil {
		return []models.EventOffer{}, nil
	}

	validOffers := []models.EventOffer{}
	now := time.Now()
	for _, offer := range offers {
		if offer.ValidUntil.After(now) {
			validOffers = append(validOffers, offer)
		}
	}

	return validOffers, nil
}

func GetByName(name string) (*models.Event, error) {
	col := config.EventsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var e models.Event
	if err := col.FindOne(ctx, bson.M{"name": name}).Decode(&e); err != nil {
		return nil, err
	}
	return &e, nil
}

func GetByOrganizer(organizerID string) ([]models.Event, error) {
	objID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return nil, err
	}
	col := config.EventsCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := col.Find(ctx, bson.M{"organizer_id": objID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var events []models.Event
	if err := cursor.All(ctx, &events); err != nil {
		return nil, err
	}
	return events, nil
}

func Update(id string, organizerID string, update *models.Event) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	orgID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}
	col := config.EventsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var original models.Event
	if err := col.FindOne(ctx, bson.M{"_id": objID, "organizer_id": orgID}).Decode(&original); err != nil {
		return errors.New("event not found or not owned by this organizer")
	}

	updateDoc := bson.M{}
	if update.Name != "" {
		updateDoc["name"] = update.Name
	}
	if update.Category != "" {
		updateDoc["category"] = update.Category
	}
	if update.SubCategory != "" {
		updateDoc["sub_category"] = update.SubCategory
	}
	if update.City != "" {
		updateDoc["city"] = update.City
	}
	if !update.Date.IsZero() {
		updateDoc["date"] = update.Date
	}
	if update.Time != "" {
		updateDoc["time"] = update.Time
	}
	if update.Duration != "" {
		updateDoc["duration"] = update.Duration
	}
	if update.VenueName != "" {
		updateDoc["venue_name"] = update.VenueName
	}
	if update.VenueAddress != "" {
		updateDoc["venue_address"] = update.VenueAddress
	}
	if update.GoogleMapLink != "" {
		updateDoc["google_map_link"] = update.GoogleMapLink
	}
	if update.InstagramLink != "" {
		updateDoc["instagram_link"] = update.InstagramLink
	}
	if update.PortraitImageURL != "" {
		updateDoc["portrait_image_url"] = update.PortraitImageURL
	}
	if update.LandscapeImageURL != "" {
		updateDoc["landscape_image_url"] = update.LandscapeImageURL
	}
	if update.CardVideoURL != "" {
		updateDoc["card_video_url"] = update.CardVideoURL
	}
	if len(update.GalleryURLs) > 0 {
		updateDoc["gallery_urls"] = update.GalleryURLs
	}
	if update.Guide.MinAge > 0 {
		updateDoc["guide.min_age"] = update.Guide.MinAge
	}
	if len(update.Guide.Languages) > 0 {
		updateDoc["guide.languages"] = update.Guide.Languages
	}
	if update.Guide.TicketRequiredAboveAge > 0 {
		updateDoc["guide.ticket_required_above_age"] = update.Guide.TicketRequiredAboveAge
	}
	if update.Guide.VenueType != "" {
		updateDoc["guide.venue_type"] = update.Guide.VenueType
	}
	if update.Guide.AudienceType != "" {
		updateDoc["guide.audience_type"] = update.Guide.AudienceType
	}
	updateDoc["guide.is_kid_friendly"] = update.Guide.IsKidFriendly
	updateDoc["guide.is_pet_friendly"] = update.Guide.IsPetFriendly
	updateDoc["guide.gates_open_before"] = update.Guide.GatesOpenBefore
	if update.Guide.GatesOpenBeforeValue > 0 {
		updateDoc["guide.gates_open_before_value"] = update.Guide.GatesOpenBeforeValue
	}
	if update.Guide.GatesOpenBeforeUnit != "" {
		updateDoc["guide.gates_open_before_unit"] = update.Guide.GatesOpenBeforeUnit
	}
	if len(update.Guide.Facilities) > 0 {
		updateDoc["guide.facilities"] = update.Guide.Facilities
	}
	if update.EventInstructions != "" {
		updateDoc["event_instructions"] = update.EventInstructions
	}
	if update.YoutubeVideoURL != "" {
		updateDoc["youtube_video_url"] = update.YoutubeVideoURL
	}
	if len(update.ProhibitedItems) > 0 {
		updateDoc["prohibited_items"] = update.ProhibitedItems
	}
	if len(update.FAQs) > 0 {
		updateDoc["faqs"] = update.FAQs
	}
	if len(update.Artists) > 0 {
		updateDoc["artists"] = update.Artists
	}
	if len(update.TicketCategories) > 0 {
		updateDoc["ticket_categories"] = update.TicketCategories
		updateDoc["price_starts_from"] = calculateMinPrice(update.TicketCategories)
	}
	if update.Payment.OrganizerName != "" {
		updateDoc["payment.organizer_name"] = update.Payment.OrganizerName
	}
	if update.Payment.GSTIN != "" {
		updateDoc["payment.gstin"] = update.Payment.GSTIN
	}
	if update.Payment.AccountNumber != "" {
		updateDoc["payment.account_number"] = update.Payment.AccountNumber
	}
	if update.Payment.IFSC != "" {
		updateDoc["payment.ifsc"] = update.Payment.IFSC
	}
	if update.Payment.AccountType != "" {
		updateDoc["payment.account_type"] = update.Payment.AccountType
	}
	if len(update.PointsOfContact) > 0 {
		updateDoc["points_of_contact"] = update.PointsOfContact
	}
	if len(update.SalesNotifications) > 0 {
		updateDoc["sales_notifications"] = update.SalesNotifications
	}
	if update.Description != "" {
		updateDoc["description"] = update.Description
	}

	updateDoc["updatedAt"] = time.Now()
	updateDoc["status"] = "pending"

	_, err = col.UpdateOne(ctx, bson.M{"_id": objID, "organizer_id": orgID}, bson.M{"$set": updateDoc})
	if err == nil {

		cacheManager := cache.NewCacheManager()
		cacheManager.DeleteEntity("event", id)
		cacheManager.DeleteList("event")
	}
	return err
}

func Delete(id string, organizerID string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	orgID, err := primitive.ObjectIDFromHex(organizerID)
	if err != nil {
		return err
	}
	col := config.EventsCol
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := col.DeleteOne(ctx, bson.M{"_id": objID, "organizer_id": orgID})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return errors.New("event not found or not owned by this organizer")
	}

	cacheManager := cache.NewCacheManager()
	cacheManager.DeleteEntity("event", id)
	cacheManager.DeleteList("event")

	return nil
}
