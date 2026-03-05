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
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func parseTimeMins(s string) (int, error) {
	s = strings.TrimSpace(s)
	
	t, err := time.Parse("03:04 PM", s)
	if err != nil {
		
		t, err = time.Parse("3:04 PM", s)
		if err != nil {
			
			t, err = time.Parse("15:04", s)
			if err != nil {
				return 0, fmt.Errorf("cannot parse time %q", s)
			}
		}
	}
	return t.Hour()*60 + t.Minute(), nil
}

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

const slotMin = 30 

func venueHours(play *models.Play) (open, close int) {
	const fallbackOpen = 6 * 60   
	const fallbackClose = 22 * 60 

	openT := strings.TrimSpace(play.OpeningTime)
	closeT := strings.TrimSpace(play.ClosingTime)

	
	if openT == "" || closeT == "" {
		parts := strings.SplitN(play.Time, " - ", 2)
		if len(parts) == 2 {
			openT = strings.TrimSpace(parts[0])
			closeT = strings.TrimSpace(parts[1])
		}
	}

	s, err1 := parseTimeMins(openT)
	e, err2 := parseTimeMins(closeT)
	if err1 != nil || err2 != nil || e <= s {
		return fallbackOpen, fallbackClose
	}
	return s, e
}

func slotCount(open, close int) int {
	return (close - open) / slotMin
}

func slotIndex(open, startMin int) int {
	if startMin < open {
		return -1
	}
	rem := startMin - open
	if rem%slotMin != 0 {
		return -1 
	}
	return rem / slotMin
}

func toStartMin(open, idx int) int {
	return open + idx*slotMin
}

func generateSlots(open, close int) []string {
	var slots []string
	for cur := open; cur+slotMin <= close; cur += slotMin {
		slots = append(slots, formatTimeMins(cur)+" - "+formatTimeMins(cur+slotMin))
	}
	return slots
}

func slotLabelStartMin(label string) int {
	parts := strings.SplitN(label, " - ", 2)
	if len(parts) != 2 {
		return -1
	}
	m, err := parseTimeMins(parts[0])
	if err != nil {
		return -1
	}
	return m
}

func buildOccupiedGrid(
	ctx context.Context,
	playID primitive.ObjectID,
	date string,
	open, close int,
	venueSlots []string,
) (map[string][]bool, error) {

	col := config.PlayBookingsCol
	cursor, err := col.Find(ctx, bson.M{
		"play_id": playID,
		"date":    date,
		"status":  "booked",
	}, options.Find().SetProjection(bson.M{
		"slot":     1,
		"duration": 1,
		"tickets":  1,
	}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var bookings []models.PlayBooking
	if err := cursor.All(ctx, &bookings); err != nil {
		return nil, err
	}

	n := slotCount(open, close)
	
	labelToIdx := make(map[string]int, len(venueSlots))
	for i, s := range venueSlots {
		labelToIdx[s] = i
	}

	grid := map[string][]bool{}

	for _, b := range bookings {
		
		startIdx, found := labelToIdx[b.Slot]
		if !found {
			
			sm := slotLabelStartMin(b.Slot)
			if sm < 0 {
				continue
			}
			startIdx = slotIndex(open, sm)
			if startIdx < 0 {
				continue
			}
		}

		dur := b.Duration
		if dur <= 0 {
			dur = 1
		}

		for _, ticket := range b.Tickets {
			courtName := ticket.Category
			if _, ok := grid[courtName]; !ok {
				grid[courtName] = make([]bool, n)
			}
			
			for i := 0; i < dur; i++ {
				idx := startIdx + i
				if idx < n {
					grid[courtName][idx] = true
				}
			}
		}
	}

	return grid, nil
}

func IsAvailable(
	ctx context.Context,
	playID primitive.ObjectID,
	date string,
	startSlotLabel string, 
	durationSlots int, 
	courtName string,
) (bool, error) {

	var play models.Play
	if err := config.PlaysCol.FindOne(ctx, bson.M{"_id": playID}).Decode(&play); err != nil {
		return false, fmt.Errorf("play not found: %w", err)
	}
	open, close := venueHours(&play)
	venueSlots := generateSlots(open, close)
	n := slotCount(open, close)

	
	startMin := slotLabelStartMin(startSlotLabel)
	if startMin < 0 {
		return false, fmt.Errorf("invalid slot label %q", startSlotLabel)
	}
	si := slotIndex(open, startMin)
	if si < 0 || si+durationSlots > n {
		return false, fmt.Errorf("slot %q is outside venue operating hours", startSlotLabel)
	}

	grid, err := buildOccupiedGrid(ctx, playID, date, open, close, venueSlots)
	if err != nil {
		return false, err
	}

	courtGrid := grid[courtName] 

	
	for i := 0; i < durationSlots; i++ {
		if courtGrid != nil && si+i < len(courtGrid) && courtGrid[si+i] {
			return false, nil 
		}
	}
	return true, nil
}

func FindNextAvailable(
	ctx context.Context,
	playID primitive.ObjectID,
	date string,
	requestedStartLabel string, 
	durationSlots int,
	courtName string,
) (string, error) {

	var play models.Play
	if err := config.PlaysCol.FindOne(ctx, bson.M{"_id": playID}).Decode(&play); err != nil {
		return "", fmt.Errorf("play not found: %w", err)
	}
	open, close := venueHours(&play)
	venueSlots := generateSlots(open, close)
	n := slotCount(open, close)

	
	fromIdx := 0
	if requestedStartLabel != "" {
		sm := slotLabelStartMin(requestedStartLabel)
		if sm >= 0 {
			idx := slotIndex(open, sm)
			if idx > 0 {
				fromIdx = idx
			}
		}
	}

	grid, err := buildOccupiedGrid(ctx, playID, date, open, close, venueSlots)
	if err != nil {
		return "", err
	}
	courtGrid := grid[courtName]

	
	for j := fromIdx; j+durationSlots <= n; j++ {
		free := true
		for k := 0; k < durationSlots; k++ {
			if courtGrid != nil && j+k < len(courtGrid) && courtGrid[j+k] {
				free = false
				break
			}
		}
		if free {
			
			return venueSlots[j], nil
		}
	}
	return "", nil 
}

func GetPlayBookedSlots(playIDHex string, date string) ([]string, error) {
	playID, err := primitive.ObjectIDFromHex(playIDHex)
	if err != nil {
		return nil, errors.New("invalid play_id")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var play models.Play
	if err := config.PlaysCol.FindOne(ctx, bson.M{"_id": playID}).Decode(&play); err != nil {
		return nil, fmt.Errorf("play not found: %w", err)
	}
	open, close := venueHours(&play)
	venueSlots := generateSlots(open, close)

	grid, err := buildOccupiedGrid(ctx, playID, date, open, close, venueSlots)
	if err != nil {
		return nil, err
	}

	
	var result []string
	for courtName, slots := range grid {
		for i, taken := range slots {
			if taken && i < len(venueSlots) {
				result = append(result, venueSlots[i]+"|"+courtName)
			}
		}
	}
	return result, nil
}

func CreatePlay(b *models.PlayBooking) error {
	if b.UserEmail == "" {
		return errors.New("user email is required")
	}
	if b.PlayID.IsZero() {
		return errors.New("play area id is required")
	}
	if b.Date == "" || b.Slot == "" {
		return errors.New("date and slot are required")
	}
	if len(b.Tickets) == 0 {
		return errors.New("at least one court/ticket is required")
	}

	duration := b.Duration
	if duration <= 0 {
		duration = 1
	}
	b.Duration = duration

	
	session, err := config.MongoClient.StartSession()
	if err != nil {
		return fmt.Errorf("could not start session: %w", err)
	}
	defer session.EndSession(context.Background())

	_, err = session.WithTransaction(context.Background(), func(sessCtx mongo.SessionContext) (interface{}, error) {

		
		var play models.Play
		if err := config.PlaysCol.FindOne(sessCtx, bson.M{"_id": b.PlayID}).Decode(&play); err != nil {
			return nil, fmt.Errorf("play not found: %w", err)
		}

		
		b.OrganizerID = play.OrganizerID
		if b.OrganizerID.IsZero() {
			adminID, _ := primitive.ObjectIDFromHex("000000000000000000000001")
			b.OrganizerID = adminID
		}

		
		open, close := venueHours(&play)
		venueSlots := generateSlots(open, close)
		n := slotCount(open, close)

		
		startMin := slotLabelStartMin(b.Slot)
		if startMin < 0 {
			return nil, fmt.Errorf("invalid slot format %q", b.Slot)
		}
		si := slotIndex(open, startMin)
		if si < 0 || si+duration > n {
			return nil, fmt.Errorf(
				"slot %q is outside this venue's operating hours (%s – %s)",
				b.Slot, formatTimeMins(open), formatTimeMins(close),
			)
		}

		
		grid, err := buildOccupiedGrid(sessCtx, b.PlayID, b.Date, open, close, venueSlots)
		if err != nil {
			return nil, err
		}

		
		
		for _, ticket := range b.Tickets {
			courtGrid := grid[ticket.Category]
			for i := 0; i < duration; i++ {
				idx := si + i
				if courtGrid != nil && idx < len(courtGrid) && courtGrid[idx] {
					
					nextLabel, _ := FindNextAvailable(
						sessCtx, b.PlayID, b.Date, venueSlots[si], duration, ticket.Category,
					)
					msg := fmt.Sprintf(
						"court %q is already booked during %s",
						ticket.Category, b.Slot,
					)
					if nextLabel != "" {
						msg += fmt.Sprintf(". Next available slot: %s", nextLabel)
					}
					return nil, errors.New(msg)
				}
			}
		}

		
		b.ID = primitive.NewObjectID()
		b.Status = "booked"
		b.BookedAt = time.Now()

		_, err = config.PlayBookingsCol.InsertOne(sessCtx, b)
		return nil, err
	})

	return err
}
