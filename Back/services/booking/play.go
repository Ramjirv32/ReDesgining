package booking

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/models"
	"ticpin-backend/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

func generateSlots(open, close int) []string {
	var slots []string
	for cur := open; cur+slotMin <= close; cur += slotMin {
		slots = append(slots, formatTimeMins(cur)+" - "+formatTimeMins(cur+slotMin))
	}
	return slots
}

func findNextFromGrid(grid map[string][]bool, venueSlots []string, n, fromIdx, durationSlots int, courtName string) string {
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
			return venueSlots[j]
		}
	}
	return ""
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
	excludeLockKey string,
) (map[string][]bool, error) {
	// ✅ FIX: Exclude locks with same lock_key (user's own locks)
	// Only check other users' locks, not current user's own locks
	// This allows users to retry their own reservations

	col := config.PlayBookingsCol
	cursor, err := col.Find(ctx, bson.M{
		"play_id": playID,
		"date":    date,
		"status":  bson.M{"$in": []string{"booked", "confirmed"}},
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

	// Process BOOKINGS
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

	// ✅ FIX: Also check LOCKS table (pre-payment reservations)
	// This ensures users can't book a slot that's already locked
	lockCol := config.SlotLocksCol
	lockFilter := bson.M{
		"play_id": playID,
		"date":    date,
		// Only check locks WITHOUT booking_id (purely pre-payment locks)
		// Locks with booking_id are already in PlayBookings, so skip them
		"booking_id": bson.M{"$exists": false},
	}
	// ✅ CRITICAL FIX 2: Exclude same user's own locks
	// Only block OTHER users' locks, not the current user's own lock_key
	if excludeLockKey != "" {
		lockFilter["lock_key"] = bson.M{"$ne": excludeLockKey}
	}
	lockCursor, err := lockCol.Find(ctx, lockFilter, options.Find().SetProjection(bson.M{
		"slot":       1,
		"court_name": 1,
	}))
	if err != nil {
		return nil, err
	}
	defer lockCursor.Close(ctx)

	var locks []bson.M
	if err := lockCursor.All(ctx, &locks); err != nil {
		return nil, err
	}

	// Process LOCKS (only active, non-booked locks)
	for _, lock := range locks {
		slot, ok := lock["slot"].(string)
		if !ok {
			continue
		}
		courtName, ok := lock["court_name"].(string)
		if !ok {
			continue
		}

		lockIdx, found := labelToIdx[slot]
		if !found {
			sm := slotLabelStartMin(slot)
			if sm < 0 {
				continue
			}
			lockIdx = slotIndex(open, sm)
			if lockIdx < 0 {
				continue
			}
		}

		if _, ok := grid[courtName]; !ok {
			grid[courtName] = make([]bool, n)
		}
		if lockIdx < n {
			grid[courtName][lockIdx] = true
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
	lockKey string,
) (bool, error) {

	var play models.Play
	if err := config.PlaysCol.FindOne(ctx, bson.M{"_id": playID}).Decode(&play); err != nil {
		return false, fmt.Errorf("play not found: %w", err)
	}

	// Validate that the court exists in the venue
	validCourt := false
	for _, court := range play.Courts {
		if court.Name == courtName {
			validCourt = true
			break
		}
	}
	if !validCourt {
		return false, fmt.Errorf("court %q does not exist in this venue", courtName)
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

	grid, err := buildOccupiedGrid(ctx, playID, date, open, close, venueSlots, lockKey)
	if err != nil {
		return false, err
	}

	courtGrid := grid[courtName]
	// If court has no bookings yet, it's available
	if courtGrid == nil {
		return true, nil
	}

	for i := 0; i < durationSlots; i++ {
		if si+i < len(courtGrid) && courtGrid[si+i] {
			return false, nil
		}
	}
	return true, nil
}

// ✅ Old signature for backward compatibility (calls with empty string)
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

	grid, err := buildOccupiedGrid(ctx, playID, date, open, close, venueSlots, "")
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
func FindNextAvailable(
	ctx context.Context,
	playID primitive.ObjectID,
	date string,
	requestedStartLabel string,
	durationSlots int,
	courtName string,
	lockKey string,
) (string, error) {

	var play models.Play
	if err := config.PlaysCol.FindOne(ctx, bson.M{"_id": playID}).Decode(&play); err != nil {
		return "", fmt.Errorf("play not found: %w", err)
	}

	// Validate that the court exists in the venue
	validCourt := false
	for _, court := range play.Courts {
		if court.Name == courtName {
			validCourt = true
			break
		}
	}
	if !validCourt {
		return "", fmt.Errorf("court %q does not exist in this venue", courtName)
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

	grid, err := buildOccupiedGrid(ctx, playID, date, open, close, venueSlots, lockKey)
	if err != nil {
		return "", err
	}
	courtGrid := grid[courtName]
	// If court has no bookings yet, all slots are available
	if courtGrid == nil {
		if fromIdx < n {
			return venueSlots[fromIdx], nil
		}
		return "", nil
	}

	for j := fromIdx; j+durationSlots <= n; j++ {
		free := true
		for k := 0; k < durationSlots; k++ {
			if j+k < len(courtGrid) && courtGrid[j+k] {
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

	todayStr := time.Now().Format("2006-01-02")
	if b.Date < todayStr {
		return fmt.Errorf("cannot book a slot in the past (date: %s)", b.Date)
	}

	duration := b.Duration
	if duration <= 0 {
		duration = 1
	}

	const maxDuration = 16
	if duration > maxDuration {
		return fmt.Errorf("duration cannot exceed %d slots (%d hours)", maxDuration, maxDuration/2)
	}
	b.Duration = duration

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var play models.Play
	if err := config.PlaysCol.FindOne(ctx, bson.M{"_id": b.PlayID}).Decode(&play); err != nil {
		return fmt.Errorf("play not found: %w", err)
	}

	b.OrganizerID = play.OrganizerID

	open, close := venueHours(&play)
	venueSlots := generateSlots(open, close)
	n := slotCount(open, close)

	startMin := slotLabelStartMin(b.Slot)
	if startMin < 0 {
		return fmt.Errorf("invalid slot format %q", b.Slot)
	}
	si := slotIndex(open, startMin)
	if si < 0 || si+duration > n {
		return fmt.Errorf(
			"slot %q is outside this venue's operating hours (%s – %s)",
			b.Slot, formatTimeMins(open), formatTimeMins(close),
		)
	}

	grid, err := buildOccupiedGrid(ctx, b.PlayID, b.Date, open, close, venueSlots, b.LockKey)
	if err != nil {
		return err
	}

	// Validate that all courts exist in the venue
	// Create a map of valid court names from the venue
	validCourts := make(map[string]bool)
	for _, court := range play.Courts {
		validCourts[court.Name] = true
	}

	// Validate each ticket references a valid court
	for _, ticket := range b.Tickets {
		if !validCourts[ticket.Category] {
			return fmt.Errorf("court %q does not exist in this venue", ticket.Category)
		}
	}

	for _, ticket := range b.Tickets {
		courtGrid := grid[ticket.Category]
		// Additional validation: court should exist in grid (even if no bookings)
		if courtGrid == nil {
			// This is normal for courts with no existing bookings
			courtGrid = make([]bool, n)
		}
		for i := 0; i < duration; i++ {
			idx := si + i
			if idx < n && courtGrid[idx] {
				nextLabel := findNextFromGrid(grid, venueSlots, n, si+1, duration, ticket.Category)
				msg := fmt.Sprintf(
					"court %q is already booked during %s",
					ticket.Category, b.Slot,
				)
				if nextLabel != "" {
					msg += fmt.Sprintf(". Next available slot: %s", nextLabel)
				}
				return errors.New(msg)
			}
		}
	}

	b.ID = primitive.NewObjectID()
	b.BookingID = utils.HashObjectID(b.ID)
	if b.Status == "" {
		b.Status = "booked"
	}
	b.BookedAt = time.Now()

	// ✅ FIX: Convert existing locks to booking (don't insert new ones)
	// If lock_key is provided, update those locks with the booking_id
	// Otherwise, these are free/ticpass bookings - no locks needed
	if b.LockKey != "" {
		// ✅ CRITICAL FIX 3: Convert locks and validate they existed
		// This prevents orphaned bookings if locks expired
		res, err := config.SlotLocksCol.UpdateMany(ctx, bson.M{
			"lock_key": b.LockKey,
		}, bson.M{
			"$set": bson.M{
				"booking_id": b.ID,
			},
		})
		if err != nil {
			return fmt.Errorf("could not convert locks to booking: %w", err)
		}
		// ✅ CRITICAL: Verify locks were found (not expired)
		if res.MatchedCount == 0 {
			return errors.New("slot locks expired, please retry booking")
		}
	}

	_, err = config.PlayBookingsCol.InsertOne(ctx, b)
	if err != nil {
		// Clean up locks if booking insertion fails
		if b.LockKey != "" {
			cleanCtx, cleanCancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cleanCancel()
			// Remove booking_id from locks on failure
			_, _ = config.SlotLocksCol.UpdateMany(cleanCtx, bson.M{
				"lock_key": b.LockKey,
			}, bson.M{
				"$unset": bson.M{
					"booking_id": "",
				},
			})
		}
		return err
	}
	return nil
}
func DeletePlayLocks(bookingID primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := config.SlotLocksCol.DeleteMany(ctx, bson.M{"booking_id": bookingID})
	return err
}
