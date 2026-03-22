package chat

import (
	"context"
	"net/http"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func getQuestions(c *fiber.Ctx) error {
	category := c.Query("category", "")

	filter := bson.M{}
	if category != "" {
		filter["category"] = category
	}

	opts := options.Find().SetSort(bson.M{"order": 1})

	cursor, err := config.ChatQuestionsCol.Find(context.Background(), filter, opts)
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch questions")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch questions"})
	}
	defer cursor.Close(context.Background())

	var questions []models.ChatQuestion
	if err := cursor.All(context.Background(), &questions); err != nil {
		log.Error().Err(err).Msg("Failed to decode questions")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch questions"})
	}

	if len(questions) == 0 {
		questions = getDummyQuestions(category)
	}

	return c.JSON(questions)
}

func getDummyQuestions(category string) []models.ChatQuestion {
	allQuestions := map[string][]models.ChatQuestion{
		"dining": {
			{Question: "How do I list my restaurant on Ticpin?", Answer: "To list your restaurant, go to 'List Your Dining' and complete the registration form with your restaurant details."},
			{Question: "How do I update my menu?", Answer: "You can update your menu from the organizer dashboard by editing your dining listing."},
			{Question: "How do I manage bookings?", Answer: "All bookings can be managed from your organizer dashboard under the 'Bookings' section."},
			{Question: "How do I add photos of my restaurant?", Answer: "Go to your dining listing edit page and use the image upload section to add photos."},
			{Question: "How do I set my restaurant timings?", Answer: "Edit your dining listing and update the opening hours in the details section."},
		},
		"event": {
			{Question: "How do I create an event?", Answer: "Go to 'List Your Events' and fill in the event details form to create a new event."},
			{Question: "How do I sell tickets for my event?", Answer: "Create an event and add ticket categories with pricing in the ticketing section."},
			{Question: "How do I track event attendance?", Answer: "View attendee details in your organizer dashboard under the specific event."},
			{Question: "How do I cancel an event?", Answer: "Contact our support team to cancel or reschedule your event."},
			{Question: "How do I add performers to my event?", Answer: "Edit your event and add artist/performer details in the lineup section."},
		},
		"play": {
			{Question: "How do I list my sports facility?", Answer: "Go to 'List Your Play' and complete the registration for your sports venue."},
			{Question: "How do I set slot pricing?", Answer: "Edit your play listing and configure slot-based pricing in the pricing section."},
			{Question: "How do I manage court bookings?", Answer: "All court bookings can be managed from your organizer dashboard."},
			{Question: "How do I add new courts?", Answer: "Edit your play listing and add courts in the courts management section."},
			{Question: "How do I block unavailable slots?", Answer: "Use the availability settings in your organizer dashboard to block dates."},
		},
	}

	if category != "" {
		if q, ok := allQuestions[category]; ok {
			return q
		}
	}

	var result []models.ChatQuestion
	for _, qs := range allQuestions {
		result = append(result, qs...)
	}
	return result
}
