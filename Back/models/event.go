package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type FAQ struct {
	Question string `bson:"question" json:"question"`
	Answer   string `bson:"answer" json:"answer"`
}

type ContactPerson struct {
	Name   string `bson:"name" json:"name"`
	Email  string `bson:"email" json:"email"`
	Mobile string `bson:"mobile" json:"mobile"`
}

type SalesContact struct {
	Email  string `bson:"email" json:"email"`
	Mobile string `bson:"mobile" json:"mobile"`
}

type EventGuide struct {
	Languages              []string `bson:"languages" json:"languages"`
	MinAge                 int      `bson:"min_age" json:"min_age"`
	TicketRequiredAboveAge int      `bson:"ticket_required_above_age" json:"ticket_required_above_age"`
	VenueType              string   `bson:"venue_type" json:"venue_type"`
	AudienceType           string   `bson:"audience_type" json:"audience_type"`
	IsKidFriendly          bool     `bson:"is_kid_friendly" json:"is_kid_friendly"`
	IsPetFriendly          bool     `bson:"is_pet_friendly" json:"is_pet_friendly"`
	Facilities             []string `bson:"facilities" json:"facilities"`
	GatesOpenBefore        bool     `bson:"gates_open_before" json:"gates_open_before"`
	GatesOpenBeforeValue   int      `bson:"gates_open_before_value" json:"gates_open_before_value"`
	GatesOpenBeforeUnit    string   `bson:"gates_open_before_unit" json:"gates_open_before_unit"`
}

type Artist struct {
	Name        string `bson:"name" json:"name"`
	ImageURL    string `bson:"image_url" json:"image_url"`
	Description string `bson:"description" json:"description"`
}

type TicketCategory struct {
	Name     string  `bson:"name" json:"name"`
	Price    float64 `bson:"price" json:"price"`
	Capacity int     `bson:"capacity" json:"capacity"`
	ImageURL string  `bson:"image_url" json:"image_url"`
	HasImage bool    `bson:"has_image" json:"has_image"`
}

type PaymentDetails struct {
	OrganizerName string `bson:"organizer_name" json:"organizer_name"`
	GSTIN         string `bson:"gstin" json:"gstin"`
	AccountNumber string `bson:"account_number" json:"account_number"`
	IFSC          string `bson:"ifsc" json:"ifsc"`
	AccountType   string `bson:"account_type" json:"account_type"`
}

type Event struct {
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
	GoogleMapLink      string             `bson:"google_map_link" json:"google_map_link"`
	InstagramLink      string             `bson:"instagram_link" json:"instagram_link"`
	PortraitImageURL   string             `bson:"portrait_image_url" json:"portrait_image_url"`
	LandscapeImageURL  string             `bson:"landscape_image_url" json:"landscape_image_url"`
	CardVideoURL       string             `bson:"card_video_url" json:"card_video_url"`
	GalleryURLs        []string           `bson:"gallery_urls" json:"gallery_urls"`
	Guide              EventGuide         `bson:"guide" json:"guide"`
	EventInstructions  string             `bson:"event_instructions" json:"event_instructions"`
	YoutubeVideoURL    string             `bson:"youtube_video_url" json:"youtube_video_url"`
	ProhibitedItems    []string           `bson:"prohibited_items" json:"prohibited_items"`
	FAQs               []FAQ              `bson:"faqs" json:"faqs"`
	ArtistName         string             `bson:"artist_name" json:"artist_name"`
	ArtistImageURL     string             `bson:"artist_image_url" json:"artist_image_url"`
	Artists            []Artist           `bson:"artists" json:"artists"`
	TicketCategories   []TicketCategory   `bson:"ticket_categories" json:"ticket_categories"`
	TicketsNeededFor   string             `bson:"tickets_needed_for" json:"tickets_needed_for"`
	PriceStartsFrom    float64            `bson:"price_starts_from" json:"price_starts_from"`
	Terms              string             `bson:"terms" json:"terms"`
	Payment            PaymentDetails     `bson:"payment" json:"payment"`
	PointsOfContact    []ContactPerson    `bson:"points_of_contact" json:"points_of_contact"`
	SalesNotifications []SalesContact     `bson:"sales_notifications" json:"sales_notifications"`
	Status             string             `bson:"status" json:"status"`
	CreatedAt          time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt          time.Time          `bson:"updatedAt" json:"updatedAt"`
}
