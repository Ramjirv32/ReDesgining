package booking

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// parseTimeMins parses "09:00 AM" / "9:00 AM" → minutes since midnight.
func parseTimeMins(s string) (int, error) {
	s = strings.TrimSpace(s)
	t, err := time.Parse("03:04 PM", s)
	if err != nil {
		t, err = time.Parse("3:04 PM", s)
		if err != nil {
			return 0, fmt.Errorf("cannot parse time %q: %w", s, err)
		}
	}
	return t.Hour()*60 + t.Minute(), nil
}

// formatTimeMins converts minutes since midnight → "09:00 AM" / "12:00 PM".
func formatTimeMins(mins int) string {
	h := mins / 60
	m := mins % 60
	period := "AM"
	if h >= 12 {
		period = "PM"
	}
	dh := h % 12
	if dh == 0 {
		dh = 12
	}
	return fmt.Sprintf("%02d:%02d %s", dh, m, period)
}

// generateSlots returns 30-minute slot strings (e.g. "09:00 AM - 09:30 AM") from
// openingTime to closingTime, derived from the venue's stored opening/closing fields.
// Falls back to full-day range if either field is empty.
func generateSlots(openingTime, closingTime string) []string {
	start, err1 := parseTimeMins(openingTime)
	end, err2 := parseTimeMins(closingTime)
	if err1 != nil || err2 != nil || end <= start {
		// fallback: 05:00 AM – 11:00 PM
		start = 5 * 60
		end = 23 * 60
	}
	var slots []string
	for cur := start; cur+30 <= end; cur += 30 {
		slots = append(slots, formatTimeMins(cur)+" - "+formatTimeMins(cur+30))
	}
	return slots
}

// slotStartMins converts a slot string ("09:00 AM - 10:00 AM") → start minutes.
// Returns -1 if unparseable.
func slotStartMins(slot string) int {
	parts := strings.SplitN(slot, " - ", 2)
	if len(parts) != 2 {
		return -1
	}
	m, err := parseTimeMins(parts[0])
	if err != nil {
		return -1
	}
	return m
}

// getVenueSlots fetches the play and returns its dynamic 1-hour slot list.
func getVenueSlots(ctx context.Context, playID primitive.ObjectID) ([]string, error) {
	var play models.Play
	if err := config.PlaysCol.FindOne(ctx, bson.M{"_id": playID}).Decode(&play); err != nil {
		return nil, fmt.Errorf("play not found: %w", err)
	}
	openT := play.OpeningTime
	closeT := play.ClosingTime
	// Fallback: parse from play.Time ("09:00 AM - 09:00 PM")
	if openT == "" || closeT == "" {
		parts := strings.SplitN(play.Time, " - ", 2)
		if len(parts) == 2 {
			openT = strings.TrimSpace(parts[0])
			closeT = strings.TrimSpace(parts[1])
		}
	}
	return generateSlots(openT, closeT), nil
}

func GetPlayBookedSlots(playIDHex string, date string) ([]string, error) {
	playID, err := primitive.ObjectIDFromHex(playIDHex)
	if err != nil {
		return nil, errors.New("invalid play_id")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Build the venue's dynamic slot list so we can expand multi-hour bookings correctly.
	venueSlots, err := getVenueSlots(ctx, playID)
	if err != nil {
		return nil, err
	}
	// Index: slot string → position
	slotIndex := make(map[string]int, len(venueSlots))
	for i, s := range venueSlots {
		slotIndex[s] = i
	}

	col := config.PlayBookingsCol
	cursor, err := col.Find(ctx, bson.M{
		"play_id": playID,
		"date":    date,
		"status":  "booked",
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []models.PlayBooking
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	bookedCombinations := []string{}
	for _, b := range results {
		// Try to find the booking slot in the venue's dynamic slot list first.
		startIdx, found := slotIndex[b.Slot]
		if !found {
			// Legacy bookings may have used the old "HH:MM - HH:MM AM" format.
			// Fall back to minute-based position matching.
			slotMins := slotStartMins(b.Slot)
			if slotMins < 0 {
				continue
			}
			startIdx = -1
			for i, s := range venueSlots {
				if slotStartMins(s) == slotMins {
					startIdx = i
					break
				}
			}
			if startIdx == -1 {
				continue
			}
		}

		dur := b.Duration
		if dur <= 0 {
			dur = 1
		}

		for _, ticket := range b.Tickets {
			for i := 0; i < dur; i++ {
				if startIdx+i < len(venueSlots) {
					bookedCombinations = append(bookedCombinations, venueSlots[startIdx+i]+"|"+ticket.Category)
				}
			}
		}
	}
	return bookedCombinations, nil
}

func CreatePlay(b *models.PlayBooking) error {
	if b.UserEmail == "" {
		return errors.New("user email is required")
	}
	if b.PlayID.IsZero() {
		return errors.New("play area id is required")
	}

	col := config.PlayBookingsCol
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Fetch the play to get organizer and venue hours.
	var play models.Play
	if err := config.PlaysCol.FindOne(ctx, bson.M{"_id": b.PlayID}).Decode(&play); err == nil {
		b.OrganizerID = play.OrganizerID
	}
	if b.OrganizerID.IsZero() {
		adminID, _ := primitive.ObjectIDFromHex("000000000000000000000001")
		b.OrganizerID = adminID
	}

	// Build dynamic slot list from this venue's opening/closing time.
	openT := play.OpeningTime
	closeT := play.ClosingTime
	if openT == "" || closeT == "" {
		parts := strings.SplitN(play.Time, " - ", 2)
		if len(parts) == 2 {
			openT = strings.TrimSpace(parts[0])
			closeT = strings.TrimSpace(parts[1])
		}
	}
	venueSlots := generateSlots(openT, closeT)
	slotIndex := make(map[string]int, len(venueSlots))
	for i, s := range venueSlots {
		slotIndex[s] = i
	}

	// Validate that the requested slot exists in this venue's schedule.
	startIdx, valid := slotIndex[b.Slot]
	if !valid {
		// Accept legacy format by matching on start-minute.
		slotMins := slotStartMins(b.Slot)
		if slotMins >= 0 {
			for i, s := range venueSlots {
				if slotStartMins(s) == slotMins {
					startIdx = i
					valid = true
					break
				}
			}
		}
	}
	if !valid {
		return fmt.Errorf("time slot %q is outside this venue's operating hours (%s – %s)", b.Slot, openT, closeT)
	}

	duration := b.Duration
	if duration <= 0 {
		duration = 1
	}

	// Overlap check: ensure no court in this booking is already reserved for any
	// 1-hour window that falls within [startIdx, startIdx+duration).
	for _, ticket := range b.Tickets {
		cursor, err := col.Find(ctx, bson.M{
			"play_id":          b.PlayID,
			"date":             b.Date,
			"status":           "booked",
			"tickets.category": ticket.Category,
		})
		if err != nil {
			continue
		}

		var existingBookings []models.PlayBooking
		if err := cursor.All(ctx, &existingBookings); err != nil {
			cursor.Close(ctx)
			continue
		}
		cursor.Close(ctx)

		for _, eb := range existingBookings {
			ebIdx, ok := slotIndex[eb.Slot]
			if !ok {
				// Legacy format fallback
				sm := slotStartMins(eb.Slot)
				if sm < 0 {
					continue
				}
				for i, s := range venueSlots {
					if slotStartMins(s) == sm {
						ebIdx = i
						ok = true
						break
					}
				}
				if !ok {
					continue
				}
			}
			ebDur := eb.Duration
			if ebDur <= 0 {
				ebDur = 1
			}
			// [startIdx, startIdx+duration) overlaps [ebIdx, ebIdx+ebDur)
			if startIdx < ebIdx+ebDur && ebIdx < startIdx+duration {
				return fmt.Errorf("court %q is already booked during this time window", ticket.Category)
			}
		}
	}

	b.ID = primitive.NewObjectID()
	b.Status = "booked"
	b.BookedAt = time.Now()

	_, err := col.InsertOne(ctx, b)
	return err
}
