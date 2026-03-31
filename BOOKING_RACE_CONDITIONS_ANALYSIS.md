# Booking System - Race Conditions & Bug Analysis 🐛

## CRITICAL RACE CONDITIONS FOUND

### 🔴 RC1: EXPIRED BOOKING WINDOW - Multiple Cancellations
**Severity: CRITICAL**

#### Problem
When a booking is between midnight on expiration date and when the cancel API evaluates the date:
- User CAN still see "Cancel" button (frontend checks `getBookingStatus()` which compares dates)
- User clicks "Cancel" → API checks expiry → Returns error "cannot cancel expired booking"
- **Race Condition**: Button visibility != API behavior

```
Timeline:
T=00:00:01 AM (Day after booking)
├─ Frontend loads page
├─ getBookingStatus() = EXPIRED (date < today)
├─ Cancel button HIDDEN ✅
├─ User manually calls API: /bookings/{id}/cancel
├─ API fetches booking
├─ API checks booking date (if booking has old date parsing logic)
└─ API may allow or reject based on time zone issues
```

**Root Cause**:
- `cancel.go` line 151: Date parsing happens INSIDE cancel attempt
- If date string is malformed, parse fails → no expiry check → CAN cancel expired booking ❌

#### Questions:
1. **Are dates stored consistently?** Check all booking date formats:
   - Event: `event.Date.Format("02 January, 2006")` (from Event model)
   - Play: `b.Date` (string stored as-is in PlayBooking)
   - Dining: `b.Date` (string stored as-is in DiningBooking)
   - **INCONSISTENCY DETECTED**: Events use formatted dates, Play/Dining use raw strings
   
2. **What happens if date parsing fails?** Line 165:
   ```go
   if err == nil {  // Only checks expiry if date parsed successfully
       // ... expiry check
   }
   // If err != nil, NO EXPIRY CHECK - CAN CANCEL EXPIRED BOOKING!
   ```

3. **Time zone issues?** Line 166:
   ```go
   todayUTC := time.Now().Truncate(24 * time.Hour)
   ```
   - Uses local time, not UTC
   - Cross-region requests may have time zone mismatches

#### Fix Needed:
```go
// CURRENT (vulnerable):
if err == nil {
    // check expiry
}

// SHOULD BE:
if err != nil {
    return c.Status(400).JSON(fiber.Map{"error": "invalid booking date"})
}
// Always check expiry
if bTimeUTC.Before(todayUTC) {
    return c.Status(400).JSON(fiber.Map{"error": "cannot cancel expired booking"})
}
```

---

### 🔴 RC2: Concurrent Payment + Cancel Race
**Severity: HIGH**

#### Problem
User can cancel booking while payment is being processed:

```
Timeline:
T=0ms:  User clicks "Complete Booking" with payment
T=5ms:  Payment gateway starts processing
T=10ms: User rapidly clicks browser back → "Cancel Booking"
T=15ms: POST /bookings/{id}/cancel reaches backend
        Status check: booking.Status = "pending" (payment still processing)
        ✅ Cancel SUCCEEDS
T=20ms: Payment completes → webhook tries to confirm booking
        UPDATE: status = "booked" (overwrites "cancelled")
        User has active booking but thinks it's cancelled!
```

#### Current Code Issues in `cancel.go`:
```go
// Line 127 checks status ONCE at start
if bookingStatus == "cancelled" {
    return c.Status(400).JSON(fiber.Map{"error": "booking already cancelled"})
}

// But between this check and the update (line 188), 
// payment webhook could change status to "booked"
// No transaction! No atomic check-and-update!

// Line 188:
_, err := col.UpdateOne(ctx, bson.M{"_id": bookingPrimitiveID}, update)
```

#### Questions:
1. **Is there transactional protection?** NO - uses separate FindOne + UpdateOne
2. **Can payment webhook run concurrently?** Need to check if webhooks have locking
3. **What if booking is ALREADY paid?** Status would be "booked" or "confirmed", cancel would fail (✓ good)
4. **What about locks cleanup?** Happens in goroutine after cancel completes → race condition!

#### Fix Needed:
Use MongoDB atomic operations:
```go
// Atomic update with condition check
result, err := col.UpdateOne(ctx,
    bson.M{
        "_id": bookingPrimitiveID,
        "status": bson.M{
            "$nin": []string{"booked", "confirmed", "paid"},
        },
    },
    update,
)
if result.MatchedCount == 0 {
    return c.Status(400).JSON(fiber.Map{"error": "booking cannot be cancelled (already confirmed or paid)"})
}
```

---

### 🔴 RC3: Pass Refund Without Lock Release
**Severity: HIGH**

#### Problem
In `cancel.go` lines 177-194, refund and lock cleanup happen in parallel goroutines:

```go
go func() {
    _ = bookingsvc.DeletePlayLocks(bookingPrimitiveID)  // Goroutine 1
}()

// Inline:
if b.TicpassApplied {
    go func() {
        // ... passsvc.RefundTurfBooking() - Goroutine 2
    }()
}
```

**Race conditions**:
1. Both goroutines may execute concurrently → no guaranteed order
2. If refund fails silently (`_ = ...`), lock never cleaned
3. If lock cleanup fails, pass benefit still refunded → inconsistent state
4. No context timeout on goroutines → could hang indefinitely

#### Questions:
1. **What if refund fails?** Error is ignored → silent failure
2. **What if lock delete fails?** Error is ignored → slots stay locked for 15 mins
3. **Can user create new booking with same slot?** Locks prevent it, but this is timing-dependent
4. **What about concurrent refund requests?** Multiple cancel clicks could refund TicPass multiple times!

---

### 🔴 RC4: Cancellation Email Race
**Severity: MEDIUM**

#### Problem
`cancel.go` line 215: Email sent in goroutine after UpdateOne:

```go
go func() {
    // Fetch booking details again
    // Send email
}()
```

Issues:
1. Booking ALREADY updated to "cancelled" → if user queries immediately, sees cancelled status
2. But email may not arrive for seconds/minutes
3. If service crashes between UpdateOne and goroutine execution, email never sent
4. No retry logic

#### Questions:
1. **User checks booking immediately after clicking cancel** - sees cancelled status but hasn't received email yet. Expected?
2. **What if email service is down?** Silent failure → no confirmation sent to user
3. **Can same booking be cancelled twice** (by multiple requests) and send two emails?

---

## ADDITIONAL BUGS (Non-Race Condition)

### 🟡 BUG1: Frontend Cancel Button Logic Missing Expiry Check
**Severity: HIGH**

#### Current Code in `[id]/page.tsx` line 288:
```tsx
{getBookingStatus(booking) !== 'CANCELLED' && getBookingStatus(booking) !== 'EXPIRED' && (
    <button onClick={handleCancel}>
        Cancel Booking
    </button>
)}
```

✅ GOOD: Frontend hides button when expired

#### BUT Problem: `getBookingStatus()` uses DATE COMPARISON:
```ts
// line 16 in booking-status.ts
const bookingDate = new Date(booking.date);
const today = new Date();
today.setHours(0, 0, 0, 0);
bookingDate.setHours(0, 0, 0, 0);

if (bookingDate < today) {
    return 'EXPIRED';
}
```

**Issues**:
1. Date parsing can fail silently → `isNaN(bookingDate.getTime())` returns date, doesn't crash
2. Date format varies by booking type → some dates may not parse correctly
3. If date parsing fails, function returns original status (probably "booked"), button stays visible despite expiry

#### Questions:
1. **What date format is in `booking.date`?** Is it consistent across all booking types?
2. **What happens if date is null/undefined?** Button would show (bug!)
3. **What about time zone?** Frontend uses local timezone, backend uses servertime

---

### 🟡 BUG2: Missing Refund Logic for Coupons/Offers
**Severity: MEDIUM**

#### Problem
When booking is cancelled, no refund handling for:
- Coupon usage counter
- Offer usage counter
- Payment method status

Current code ONLY handles TicPass refund, nothing else.

#### Questions:
1. **Should coupon usage be reversed?** If user used coupon "Max 2 uses", after cancel does count go back to 1?
2. **Should offer be available again?** If offer was "Max 1 booking per user", can user use it again?
3. **What about refund to payment gateway?** Cashfree webhook handling?

---

### 🟡 BUG3: Authorization Check Could Be Bypassed
**Severity: MEDIUM**

#### Problem in `cancel.go` lines 125-129:
```go
hasAccess := (authUserID != "" && authUserID == bookingUserID) ||
    (authPhone != "" && authPhone == bookingPhone) ||
    (authPhone != "" && authPhone == bookingUserID) ||  // 🔴 WEIRD!
    (c.Locals("isAdmin") == true)
```

**Line 127**: `(authPhone != "" && authPhone == bookingUserID)`
- Compares phone number with UserID (which should be MongoDB ObjectID)
- Always false unless UserID is literally a phone number!
- This OR logic is redundant and dangerous

#### Questions:
1. **Why is authPhone compared to bookingUserID?** Is this intentional or a bug?
2. **Can admin always cancel any booking?** isAdmin check has no role validation
3. **What if both isAdmin and regular user?** First condition matches, no issue

---

### 🟡 BUG4: Slot Lock Cleanup Uses Wrong ID
**Severity: HIGH**

#### Problem in `cancel.go` lines 176-178:
```go
if category == "play" || category == "dining" {
    go func() {
        _ = bookingsvc.DeletePlayLocks(bookingPrimitiveID)  // Wrong ID!
    }()
}
```

`DeletePlayLocks()` accepts `bookingPrimitiveID` (MongoDB ObjectID from booking._id)

**But** booking has a `booking_id` field (string ID) and `lock_key` field (random key for current locks)

Questions:
1. **What does DeletePlayLocks() actually delete?** Does it use _id or booking_id to find locks?
2. **Should it delete based on lock_key instead?** For idempotency?
3. **What if booking_id != _id?** Locks might not be found!

---

### 🟡 BUG5: Missing Validation on Category Parameter
**Severity: LOW**

#### Problem in `cancel.go` lines 21-22:
```go
id := c.Params("id")
category := c.Query("category")  // Optional, can be empty!
```

Test cases:
```
✅ /bookings/123/cancel?category=play        → Works
✅ /bookings/123/cancel?category=dining      → Works
❓ /bookings/123/cancel                      → No category - loops through all collections
❌ /bookings/123/cancel?category=invalid     → Falls through, still tries all collections
```

#### Questions:
1. **Should category be required?** Current code works without it (has fallback)
2. **Is fallback slow?** Tries event_bookings, then play_bookings, then dining_bookings
3. **Should we validate category?** Reject invalid values?

---

## SUMMARY TABLE

| Risk ID | Issue | Type | Severity | Status |
|---------|-------|------|----------|--------|
| RC1 | Expired Booking Cancellation Window | Race Condition | 🔴 CRITICAL | Needs Fix |
| RC2 | Concurrent Payment + Cancel | Race Condition | 🔴 CRITICAL | Needs Fix |
| RC3 | Pass Refund Without Lock Safety | Race Condition | 🔴 CRITICAL | Needs Fix |
| RC4 | Cancellation Email Race | Race Condition | 🟡 MEDIUM | Needs Review |
| BUG1 | Date Parsing Inconsistency | Logic Bug | 🟡 MEDIUM | Needs Fix |
| BUG2 | No Coupon/Offer Refund | Missing Logic | 🟡 MEDIUM | Needs Design |
| BUG3 | Strange Auth Logic | Code Smell | 🟡 MEDIUM | Needs Review |
| BUG4 | Lock Cleanup ID Mismatch | Logic Bug | 🔴 CRITICAL | Needs Fix |
| BUG5 | Weak Category Validation | Input Validation | 🟡 LOW | Nice to Fix |

---

## RECOMMENDED FIXES (Priority Order)

### ✅ IMMEDIATE (Today)
1. **RC2**: Add atomic check-and-update for concurrent payment race
2. **RC1**: Ensure date parsing always succeeds or reject request
3. **BUG4**: Verify lock cleanup uses correct ID

### 🟡 SOON (This Week)
4. **RC3**: Add proper error handling for pass refund
5. **BUG1**: Standardize date formats across all booking types
6. **BUG3**: Clean up authorization logic

### 📅 LATER (Next Sprint)
7. **RC4**: Implement reliable email delivery (queue, retry)
8. **BUG2**: Design coupon/offer refund policy
9. **BUG5**: Add strict category validation

---

## TESTING CHECKLIST

- [ ] Test: Cancel booking 1 second after midnight on expiry date
- [ ] Test: Rapid cancel clicks (should idempotent fail on second click)
- [ ] Test: Cancel during payment processing (payment + cancel simultaneously)
- [ ] Test: Cancel + refund with TicPass - verify slots unlock
- [ ] Test: Cancel with malformed date in database
- [ ] Test: Cancel with null/missing date field
- [ ] Test: Cancel across different time zones
- [ ] Test: Cancel with various category values (valid, invalid, missing)
- [ ] Test: Admin cancel vs user cancel permissions
- [ ] Test: Verify email sent after cancel (check logs)

