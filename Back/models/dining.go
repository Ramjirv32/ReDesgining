package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DiningOffer struct {
	Discount string `bson:"discount" json:"discount"`
	Code     string `bson:"code" json:"code"`
}

type Dining struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizerID        primitive.ObjectID `bson:"organizer_id" json:"organizer_id"`
	Name               string             `bson:"name" json:"name"`
	Description        string             `bson:"description" json:"description"`
	Category           string             `bson:"category" json:"category"`
	SubCategory        string             `bson:"sub_category" json:"sub_category"`
	Date               time.Time          `bson:"date" json:"date"`
	Time               string             `bson:"time" json:"time"`
	Duration           string             `bson:"duration" json:"duration"`
	City               string             `bson:"city" json:"city"`
	VenueName          string             `bson:"venue_name" json:"venue_name"`
	VenueAddress       string             `bson:"venue_address" json:"venue_address"`
	InstagramLink      string             `bson:"instagram_link" json:"instagram_link"`
	GoogleMapLink      string             `bson:"google_map_link" json:"google_map_link"`
	GoogleBusinessLink string             `bson:"google_business_link" json:"google_business_link"`
	PortraitImageURL   string             `bson:"portrait_image_url" json:"portrait_image_url"`
	LandscapeImageURL  string             `bson:"landscape_image_url" json:"landscape_image_url"`
	CardVideoURL       string             `bson:"card_video_url" json:"card_video_url"`
	GalleryURLs        []string           `bson:"gallery_urls" json:"gallery_urls"`
	MenuURLs           []string           `bson:"menu_urls" json:"menu_urls"`
	Guide              EventGuide         `bson:"guide" json:"guide"`
	EventInstructions  string             `bson:"event_instructions" json:"event_instructions"`
	YoutubeVideoURL    string             `bson:"youtube_video_url" json:"youtube_video_url"`
	ProhibitedItems    []string           `bson:"prohibited_items" json:"prohibited_items"`
	FAQs               []FAQ              `bson:"faqs" json:"faqs"`
	PriceStartsFrom    float64            `bson:"price_starts_from" json:"price_starts_from"`
	Terms              string             `bson:"terms" json:"terms"`
	Payment            PaymentDetails     `bson:"payment" json:"payment"`
	PointsOfContact    []ContactPerson    `bson:"points_of_contact" json:"points_of_contact"`
	SalesNotifications []SalesContact     `bson:"sales_notifications" json:"sales_notifications"`
	Status             string             `bson:"status" json:"status"`
	CreatedAt          time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt          time.Time          `bson:"updatedAt" json:"updatedAt"`
}
