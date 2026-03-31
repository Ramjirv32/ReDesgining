# Play Booking Flow - Comprehensive Bug Analysis

## Overview
Complete analysis of the play booking system to identify logic bugs, race conditions, data validation issues, and business logic errors across frontend and backend.

---

## CRITICAL BUGS FOUND

### 🔴 BUG1: Discount Recalculation Bug When Offer + Coupon Applied
**Location**: `Back/controller/booking/play.go` Lines 367-382 (CreatePlayBooking handler)
**Severity**: HIGH - Financial Impact
**Issue**: When both offer and coupon are applied, the discount calculation doesn't account for diminishing returns properly.

```go
// Current code (BUGGY):
if req.OfferID != "" {
    offerResult, err := offersvc.ValidateOffer(req.OfferID, req.PlayID, req.OrderAmount)
    if err == nil {
        offerObjID = offerResult.Offer.ID
        discountAmount += offerResult.DiscountAmount  // ← ADDING to discountAmount
    }
}

// Cap total discount to order subtotal
if discountAmount > req.OrderAmount {
    discountAmount = req.OrderAmount
}
```

**Problem**: 
- If coupon gives 20% discount = ₹200 (on ₹1000 order)
- If offer then gives flat ₹150 discount
- Total discount = ₹200 + ₹150 = ₹350 (3.5x discount when capped)
- BUT the backend fee calculation uses the ORIGINAL order amount, not the discounted amount
- When both discounts cap to order amount, the user gets grand total = ₹0 but backend already applied fee on original amount

**Fix Needed**:
```go
// Should apply discount to discounted subtotal OR recalculate fee after discount
discountAmount += offerResult.DiscountAmount
// Then recalculate fee based on (orderAmount - discountAmount)
if discountAmount >req.OrderAmount {
    discountAmount = req.OrderAmount
}
grandTotal = (req.OrderAmount + req.BookingFee) - discountAmount
// This still applies fee on full amount - SHOULD RECALCULATE FEE
```

---

### 🔴 BUG2: Ticpass Applied But Offer/Coupon Not Recalculated
**Location**: `Back/controller/booking/play.go` Lines 390-415
**Severity**: HIGH - double-discount bug
**Issue**: When Ticpass is applied with free booking benefit, the existing offer/coupon discounts are not cleared.

```go
if req.UseTicpass && req.UserID != "" {
    pass, err := passsvc.GetActiveByUserID(req.UserID)
    if err == nil && pass != nil {
        if pass.Benefits.TurfBookings.Remaining > 0 {
            // Free Turf Booking Benefit: 100% discount on order amount
            discountAmount = req.OrderAmount  // ← OVERWRITES coupon/offer but includes booking fee
            ticpassApplied = true
            ticpassToDecrement = true
            ...
        }
    }
}
```

**Problem**: 
- User applies coupon for ₹100 discount
- Ticpass kicks in and sets `discountAmount = orderAmount` (full 100% on turf bookings)
- But this happens AFTER coupon calculation
- Grand Total correctly becomes 0, but the system still:
  1. Records the coupon as used (consumed user's quota)
  2. May double-count Ticpass benefit usage in multi-step bookings

**The Real Issue**: When Ticpass applies free turf booking:
- Should IGNORE offer/coupon and mark them as "not applicable"
- Currently, it overwrites discountAmount but still records the coupon as consumed

**Scenario**:
1. User has Ticpass with 1 free turf booking
2. User applies coupon code for 10% off
3. System applies Ticpass (100% discount)
4. Coupon is consumed/tracked (BUG - should not be)
5. User tries to book again → thinks they have 1 free left, but used it + coupon

---

### 🔴 BUG3: Missing `cancelled_at` Timestamp in Booking Status Check
**Location**: `ticpin/src/app/bookings/play/[id]/page.tsx` Line 97
**Severity**: MEDIUM - State Management
**Issue**: Frontend doesn't set `cancelled_at` timestamp when displaying cancelled booking status

```tsx
// Frontend receives this from backend:
if (response?.message?.includes('cancelled successfully')) {
    // But response doesn't include cancelled_at timestamp
    // So booking.cancelled_at from DB isn't refreshed in local state
}
```

**Problem**:
- Backend sets `cancelled_at: time.Now()` when cancelling
- Frontend doesn't request/update this field  
- UI shows booking as cancelled but can't show exact time when
- In `/bookings/play/[id]/page.tsx`, the booking state becomes stale

**Scenario**:
1. User cancels booking at 2:34 PM
2. Backend updates with `cancelled_at: 2:34 PM timestamp`
3. Frontend gets success message but old booking object still has no `cancelled_at`
4. Refetch doesn't happen immediately (1 second delay at line 69)
5. User sees "cancelled" status but no timestamp

---

### 🔴 BUG4: Slot Duration Validation Allows Invalid Ranges
**Location**: `Back/services/booking/play.go` Lines 465-468
**Severity**: MEDIUM - Edge Case
**Issue**: No validation that selected duration doesn't exceed venue closing time when combined with start slot

```go
if duration > maxDuration {
    return fmt.Errorf("duration cannot exceed %d slots (%d hours)", maxDuration, maxDuration/2)
}
b.Duration = duration
```

**Problem**:
- Venue open: 6 AM - 10 PM = 16 hours = 32 units of 30-min slots
- User selects slot starting at 9:45 PM (for 30-min slots = minute 585)
- Max duration in system = 16 slots (8 hours)  
- User requests 8 hours starting 9:45 PM = ends at 5:45 AM next day
- Backend validates: 585 + 16 <= 660 (22:00) → 601 <= 660 ✓ (appears valid)
- BUT: This actually allows booking that spans midnight!

**Current Check** (line 495):
```go
if si < 0 || si+duration > n {
    return fmt.Errorf("slot %q is outside this venue's operating hours", b.Slot)
}
```

This checks: `si + duration > n` but `n = slotCount(open, close)` = 32 for 6AM-10PM
- If `si` = 585 (9:45 PM) and `duration` = 16, then `585 + 16 = 601` vs `n = 1440` minutes? NO!
- Actually `n = slotCount(6*60, 22*60)` = (1320-360)/30 = 32 slots
- So check is: `585 + 16 > 32`? NO, 585 is in absolute minutes, 16 is slot count
- **ACTUAL BUG**: Mixing absolute minutes with slot indices!

Let me trace:
```
venueHours: 6:00 - 22:00 (360 min - 1320 min)
slotCount: (1320-360)/30 = 32 slots
startMin of "21:45 - 22:15" = 1305 min
slotIndex(360, 1305) = (1305-360)/30 = 31
si = 31
Check: si + duration > n → 31 + 8 > 32 → TRUE → ERROR ✓ (actually works)
```

Actually on second read, it DOES work correctly. The `si` is correct (the slot index, not absolute minutes). This is NOT a bug.

**Retract BUG4 - This is actually working correctly.**

---

### 🔴 BUG5: Race Condition in Discount Capping Logic
**Location**: `Back/controller/booking/play.go` Lines 376-382
**Severity**: MEDIUM - Logic Error  
**Issue**: Offer discount can push `discountAmount` over the order amount if applied after coupon

```go
var discountAmount float64

// Apply coupon first
if req.CouponCode != "" {
    result, err := couponsvc.Validate(...)
    if err == nil {
        discountAmount = result.DiscountAmount  // e.g., ₹200
    }
}

// Apply offer (could be much larger)
var offerObjID primitive.ObjectID
if req.OfferID != "" {
    offerResult, err := offersvc.ValidateOffer(...)
    if err == nil {
        offerObjID = offerResult.Offer.ID
        discountAmount += offerResult.DiscountAmount  // e.g., += ₹300 → ₹500 total
    }
}

// Cap happens AFTER both are added
if discountAmount > req.OrderAmount {  // e.g., ₹500 > ₹400
    discountAmount = req.OrderAmount   // Capped to ₹400
}
```

**The Bug**: 
- Frontend shows offer says "₹300 off" 
- Coupon says "₹200 off"
- User expects: ₹300 + ₹200 = ₹500 discount on ₹1000 → grand total ₹500
- But if order is actually ₹400:
  - Backend calculates: ₹200 + ₹300 = ₹500, capped to ₹400
  - Grand total = (₹400 + ₹40 fee) - ₹400 = ₹40
  - But frontend showed different math!
  
**Scenario**: Order is split into multiple courts
- Frontend shows: Court A ₹200 + Court B ₹200 = ₹400 subtotal, calculated as ₹1000!
- Backend recalculates correctly as ₹400
- Frontend sent orderAmount: ₹1000 -> Backend receives ₹400
- Security check catches this → ERROR
- But if security check is lenient: DOUBLE DISCOUNT APPLIED

---

### 🔴 BUG6: Booking Can Be Confirmed Twice with Same Lock Key
**Location**: `Back/services/booking/play.go` Lines 529-543 (CreatePlay)
**Severity**: HIGH - Dunplication Bug
**Issue**: When converting locks to bookings, no check that locks weren't already converted

```go
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
```

**The Bug**: 
- Lock is created with `lock_key = "ABC123"`
- User initiates payment → booking staged with status="pending"
- Payment succeeds → booking confirmation called with same lock key
- UpdateMany finds lock with `lock_key = "ABC123"` that ALREADY has `booking_id`!
- Updates again (idempotent in this case)
- BUT: What if payment webhook + user manual confirmation happen together?
  - First request finds lock: {lock_key: "ABC123", booking_id: null}
  - Second request finds same lock
  - Both create TWO separate bookings pointing to same lock?

**The Real Issue**: No atomicity guarantee that:
1. Lock is converted to exactly ONE booking
2. Lock isn't processed twice in parallel

**Scenario**:
1. User reserves slot at 2:00:00 PM → lock created
2. User clicks "Pay Now" → booking created with status="pending"
3. At 2:00:02 PM, payment webhook arrives: calls booking API with payment_id + order_id
4. At 2:00:03 PM, user manually retries payment → calls booking API AGAIN
5. Both requests see: existing booking with status="pending"
6. Code at line 74-95 handles existing pending → skips booking creation
7. BUT if there's a race between initial booking creation and payment confirmation
   - Could create two bookings for same lock

---

### 🔴 BUG7: Ticpass Applied Without Checking Restocking Order
**Location**: `Back/controller/booking/play.go` Lines 416-430
**Severity**: MEDIUM - Business Logic
**Issue**: When Ticpass is applied as free booking, the benefit is NOT decremented immediately (waits for success confirmation), but concurrent bookings might skip the check

```go
if req.UseTicpass && req.UserID != "" {
    pass, err := passsvc.GetActiveByUserID(req.UserID)
    if err == nil && pass != nil {
        if pass.Benefits.TurfBookings.Remaining > 0 {
            // ... sets ticpassApplied = true, ticpassToDecrement = true
            fmt.Printf("DEBUG: Ticpass will be applied for user %s if booking succeeds. Pass ID: %s\n", req.UserID, passID)
        }
    }
}
```

Then later at line 428 (after CreatePlay succeeds):
```go
// Only decrement Ticpass benefit AFTER successful booking creation (for new bookings, not pending confirmations)
if ticpassToDecrement && passID != "" && (booking.Status == "booked" || booking.Status == "confirmed") {
    _, err = passsvc.UseTurfBooking(passID)
    if err != nil {
        fmt.Printf("ERROR: Failed to decrement Ticpass turf benefit after successful booking: %v\n", err)
        // Don't fail the booking since it's already created, but log the error
    }
}
```

**The Bug**:
- User has 1 free turf booking left
- Booking 1: Frontend shows "1 free booking", checks pass via API → ✓ remaining=1
- Booking 1: Starts booking process, ticpassToDecrement=true
- Booking 2 (concurrent): Frontend shows "1 free booking", checks pass via API → ✓ remaining=1
- Booking 2: Starts booking process, ticpassToDecrement=true
- Booking 1: CreatePlay succeeds, then UseTurfBooking() → remaining becomes 0
- Booking 2: CreatePlay succeeds (SHOULDN'T because should check remaining again!), then UseTurfBooking() → ERROR
- User loses remaining benefits randomly

**The Real Issue**: 
- `UseTurfBooking` is called AFTER booking committed
- No atomic transaction linking Ticpass decrement to booking creation
- Two concurrent "free booking with Ticpass" requests can both succeed

---

### 🔴 BUG8: Date String Comparison Bug in Cancellation
**Location**: `Back/controller/booking/user/cancel.go` Lines 184-195
**Severity**: MEDIUM - Edge Case
**Issue**: String date comparison works only if dates are in consistent YYYY-MM-DD format, but database might have mixed formats

```go
// FIX RC1: Always validate date parsing and check expiry (fail if date invalid)
var bookingDateStr string
switch b := bookingFound.(type) {
case *models.Booking:
    var event models.Event
    if err := config.EventsCol.FindOne(ctx, bson.M{"_id": b.EventID}).Decode(&event); err == nil {
        bookingDateStr = event.Date.Format("02 January, 2006")  // ← FORMAT A
    }
case *models.PlayBooking:
    bookingDateStr = b.Date  // ← COULD BE ANY FORMAT
case *models.DiningBooking:
    bookingDateStr = b.Date   // ← COULD BE ANY FORMAT
}
```

**The Bug**:
- PlayBooking.Date stored in format "2025-12-15" (YYYY-MM-DD)
- Event.Date formatted as "02 January, 2006" when retrieved
- Later code attempts to parse all with multiple layouts:
  ```go
  layouts := []string{"02 January, 2006", "2006-01-02", "January 02, 2006"}
  ```
- This works, BUT: if PlayBooking.Date is stored in an OLD format like "December 15, 2025"
- It will fail to match any layout IF new format was used in update!

**Scenario**:
1. Old booking created with date "December 15, 2025"
2. System updated to use "2025-12-15" format
3. User tries to cancel old booking
4. Can't parse date → ERROR instead of checking expiry

---

## POTENTIAL LOGIC BUGS (Lower Priority)

### 🟡 BUG9: No Idempotency Check for Coupon Usage Increment
**Location**: `Back/controller/booking/play.go` Line 432
**Issue**: If payment webhook retries, coupon usage incremented multiple times

```go
if !couponIDToIncrement.IsZero() {
    _ = couponsvc.IncrementUsage(couponIDToIncrement, couponMaxUses, req.UserID, req.UserEmail, bookingID, grandTotal)
}
```

**Problem**: No check if coupon already incremented for this booking
- Webhook calls this endpoint → coupon incremented
- Webhook retries → coupon incremented again
- User's coupon quota artificially consumed

---

### 🟡 BUG10: Missing Validation for Empty Courts in Play Venue
**Location**: `Back/models/play.go` Line 21
**Issue**: Courts array can theoretically be empty but validation says `min=1`

```go
Courts []Court `bson:"courts" json:"courts" validate:"required,min=1"`
```

**But when fetching play for booking:**
```go
play, err := playservice.GetByID(req.PlayID, true)
if err != nil {
    return c.Status(404).JSON(fiber.Map{"error": "play not found"})
}
```

**Doesn't re-validate** that `len(play.Courts) > 0`

If play data becomes corrupted and courts deleted:
- Backend wouldn't reject booking → would create invalid booking

---

### 🟡 BUG11: Booking Fee Hardcoded as "10%" But Can Be Modified in Request
**Location**: `Back/controller/booking/play.go` Lines 360-363
**Severity**: LOW - Accepted Design
**Issue**: Frontend can send ANY booking_fee value; backend "fixes" it but only by validation threshold

```go
// 3. Verify booking fee (10% standard)
expectedFee := float64(int(expectedSubtotal * 0.1))
if req.BookingFee < expectedFee-1 || req.BookingFee > expectedFee+1 {
    req.BookingFee = expectedFee // Force correct fee
}
```

**Problem**: 
- Tolerance is ±1 rupee (line 362)
- If expectedFee=100, accepts 99-101
- If frontend sends 98 or 102, corrects to 100
- But subtotal sent by frontend might be wrong!
- Better approach: ALWAYS calculate fee fresh, never trust frontend

Actually, this is being done correctly - the code recalculates and forces the correct fee.

**Not actually a BUG - by design.**

---

## Summary of Critical Fixes Needed

| Bug | Location | Severity | Fix |
|-----|----------|----------|-----|
| BUG1 | play.go:376-382 | HIGH | When offer+coupon applied, recalculate booking fee on reduced subtotal |
| BUG2 | play.go:390-415 | HIGH | Clear coupon/offer application when Ticpass free benefit used |
| BUG3 | page.tsx:97 | MEDIUM | Ensure `cancelled_at` field included in booking state refresh |
| BUG5 | play.go:376-382 | MEDIUM | Apply discount cap BEFORE sending to client for display |
| BUG6 | play.go:529-543 | HIGH | Use atomic transaction or upsert to prevent double-booking of locks |
| BUG7 | play.go:416-430 | MEDIUM | Check Ticpass remaining atomically when staging booking |
| BUG8 | cancel.go:189 | MEDIUM | Normalize all dates to YYYY-MM-DD before storage |
| BUG9 | play.go:432 | LOW | Add idempotency check for coupon increment (use booking_id as key) |
| BUG10 | GetByID | LOW | Re-validate courts.length > 0 when fetching venue for booking |

