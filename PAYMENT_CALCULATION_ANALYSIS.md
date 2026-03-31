# 💰 Payment Calculation Logic - Complete Analysis

## 📊 Visual Payment Flow Chart

```
┌─────────────────────────────────────────────────────────────────┐
│                   TICPIN PAYMENT CALCULATION                   │
└─────────────────────────────────────────────────────────────────┘

STEP 1: BASE AMOUNT
┌──────────────────────────────────────┐
│  Order Amount (Service Cost)         │
│  ≡ What user pays for service       │
│  | Example: ₹1000 for play booking  │
│  | Example: ₹5000 for dining       │
│  └─────────┬──────────────────────────┘
│            │
│            ▼
STEP 2: ADD BOOKING FEE (INCLUDES GST)
┌──────────────────────────────────────┐
│  Booking Fee Calculation:            │
│                                      │
│  • Base Fee = Order Amount × 10%     │
│    └─ For ₹1000 = ₹100              │
│                                      │
│  • GST on Fee = Base Fee ÷ 1.13      │
│    (18% integrated GST)              │
│                                      │
│  • Total Fee = ₹100 (final)          │
│    (Can be split as)                 │
│    - Base: ~₹88                      │
│    - GST: ~₹12                       │
│  └─────────┬──────────────────────────┘
│            │
│            ▼
STEP 3: APPLY DISCOUNTS (Deducted from total)
┌──────────────────────────────────────┐
│  Discount Sources:                   │
│                                      │
│  a) Coupon Discount                  │
│     └─ Fixed or % off                │
│                                      │
│  b) Offer Discount                   │
│     └─ Entity-specific promotion     │
│                                      │
│  c) TicPass Discount                 │
│     └─ 10% OR Benefit Value          │
│     └─ Used from benefits (qty-1)    │
│                                      │
│  Total Discount = Σ(all above)       │
│  └─────────┬──────────────────────────┘
│            │
│            ▼
STEP 4: CALCULATE GRAND TOTAL (Final Amount to Pay)
┌──────────────────────────────────────┐
│  GRAND TOTAL FORMULA:                │
│                                      │
│  ┌────────────────────────────┐      │
│  │ Order Amount               │      │
│  │ + Booking Fee (w/ GST)     │      │
│  │ - Total Discount           │      │
│  │ = GRAND TOTAL              │      │
│  └────────────────────────────┘      │
│                                      │
│  Math:                               │
│  = ₹1000 + ₹100 - ₹110              │
│  = ₹990                              │
│                                      │
│  Min: ₹0 (if discount ≥ total)       │
│  └─────────┬──────────────────────────┘
│            │
│            ▼
STEP 5: PAYMENT & SETTLEMENT
┌──────────────────────────────────────┐
│  User Pays: ₹990 (Grand Total)       │
│                                      │
│  Ticpin Keeps (10% of service):      │
│  └─ Platform Profit = ₹100 (10%)     │
│                                      │
│  Venue/Organizer Gets:               │
│  └─ Net Amount = ₹900 (90%)          │
│                                      │
│  GST Handling:                       │
│  └─ 18% on booking fee (~₹12)        │
│     submitted to tax authority       │
│  └─────────────────────────────────────┘
```

---

## 📈 Real World Examples

### EXAMPLE 1: Play Court Booking (₹1000 base)
```
Step 1 - Order Amount:           ₹1,000.00
         (Court booking for 1 hour)
         
Step 2 - Booking Fee:            ₹100.00
         (10% platform fee + 18% GST)
         Breakdown:
         ├─ Base Fee: ₹88.49
         └─ GST (18%): ₹11.51
         
Step 3a - No Coupon:             ₹0.00
Step 3b - No Offer:              ₹0.00
Step 3c - TicPass (10% discount):₹100.00
         (User has active pass)
         
Step 4 - GRAND TOTAL:            ₹1,000 + ₹100 - ₹100 = ₹1,000.00

Settlement:
├─ Ticpin Profit:               ₹100.00 (10% of ₹1000)
└─ Venue Gets:                  ₹900.00 (90% of ₹1000)
```

### EXAMPLE 2: Dining Reservation (₹5000 base + 50% Coupon)
```
Step 1 - Order Amount:           ₹5,000.00
         (Restaurant reservation for 4 people)
         
Step 2 - Booking Fee:            ₹500.00
         (10% platform fee + 18% GST)
         Breakdown:
         ├─ Base Fee: ₹442.48
         └─ GST (18%): ₹57.52
         
Step 3a - Coupon (50% off):      ₹2,500.00
         (User has valid coupon)
         
Step 3b - Offer:                 ₹0.00
         
Step 3c - TicPass:               ₹0.00
         (No TicPass used)
         
Total Discount:                 ₹2,500.00

Step 4 - GRAND TOTAL:            ₹5,000 + ₹500 - ₹2,500 = ₹3,000.00

Amount User Pays:               ₹3,000.00

Settlement:
├─ Ticpin Profit:               ₹500.00 (10% on ₹5000)
├─ Coupon Discount (from venue):₹2,500.00 (50% off)
└─ Venue Gets:                  ₹3,000.00 (after discount)
```

### EXAMPLE 3: Event Ticket (₹2000 + TicPass + Offer)
```
Step 1 - Order Amount:           ₹2,000.00
         (2 event tickets @ ₹1000 each)
         
Step 2 - Booking Fee:            ₹200.00
         (10% platform fee + 18% GST)
         
Step 3a - Offer (5% off):        ₹100.00
         (Event-specific offer)
         
Step 3b - Coupon:                ₹0.00
         
Step 3c - TicPass (10% benefit): ₹200.00
         (Member discount)
         
Total Discount:                 ₹300.00

Step 4 - GRAND TOTAL:            ₹2,000 + ₹200 - ₹300 = ₹1,900.00

Amount User Pays:               ₹1,900.00

Settlement:
├─ Ticpin Profit:               ₹200.00 (10% on ₹2000)
├─ Discounts Shared:            ₹300.00
│  ├─ Offer (Ticpin bears): ₹100.00
│  └─ TicPass: ₹200.00
└─ Event Org Gets:              ₹1,700.00
```

---

## 🔄 Key Formulas

### Booking Fee Calculation
```
Booking Fee = (Order Amount × 10%) ÷ 1.13
            = Order Amount × 0.0885

Why ÷ 1.13?
- Because GST (18%) is INTEGRATED into the fee
- So we back out to get the base fee
- Then add back the GST amount for reporting
```

### Grand Total Formula
```
Grand Total = Order Amount + Booking Fee - Total Discount

where Total Discount = Coupon + Offer + TicPass

CONSTRAINT: Grand Total ≥ 0 (minimum ₹0)
```

### Ticpin Profit (10% Model)
```
Ticpin Profit = Order Amount × 10%
              = Order Amount × 0.10

This is FIXED 10% commission on service amount
NOT affected by discounts applied
```

---

## 💡 Important Rules

| Rule | Details | Example |
|------|---------|---------|
| **Booking Fee** | Always 10% of order amount + 18% GST integrated | ₹1000 order → ₹100 fee (not ₹118) |
| **Ticpin Profit** | Fixed 10% on ORDER AMOUNT (not affected by discounts) | Even with ₹500 discount, Ticpin keeps ₹100 on ₹1000 |
| **Discount Source** | Can be: Coupon, Offer, or TicPass | Can combine multiple |
| **Minimum Grand Total** | Never goes below ₹0 | If discount > (order + fee), grand total = ₹0 |
| **GST Handling** | 18% tax integrated in booking fee | ₹100 fee = ₹88 base + ₹12 GST |
| **TicPass Benefit** | Uses qty-1 benefit from pass with each booking | Pass has 100 benefits, uses 1 per booking |
| **Free Bookings** | If Grand Total = ₹0, no payment gateway needed | Event organizers don't lose money |

---

## 🗂️ Where Each Calculation Happens

### Backend (Go)
```go
// File: Back/controller/booking/play.go (line ~315)
// Calculate booking fee
bookingFee := Math.Round(orderAmount * 0.1)

// Calculate final total
grandTotal = (orderAmount + bookingFee) - discountAmount
if grandTotal < 0 {
    grandTotal = 0
}

// Store in database
booking.OrderAmount = orderAmount      // ₹1000
booking.BookingFee = bookingFee        // ₹100
booking.DiscountAmount = discountAmount // ₹100
booking.GrandTotal = grandTotal        // ₹1000
```

### Frontend (TypeScript/React)
```tsx
// File: ticpin/src/app/play/[name]/book/review/page.tsx
const orderAmount = cart.totalPrice;
const bookingFee = Math.round(orderAmount * 0.1);

// Calculate discount
const totalDiscount = couponDiscount + offerDiscount + ticpassDiscount;

// Final total
const grandTotal = Math.max(0, orderAmount + bookingFee - totalDiscount);
```

### Component: Price Breakdown
```tsx
// File: ticpin/src/components/booking/PriceBreakdown.tsx
const totalDiscount = couponDiscount + offerDiscount + ticpassDiscount;
const grandTotal = (orderAmount + bookingFee) - totalDiscount;
```

---

## 🎯 Business Logic Summary

| Who | Gets What | From Where |
|-----|-----------|-----------|
| **User** | Every ₹100 discount reduces their bill | Coupons, Offers, TicPass benefits |
| **Ticpin** | ₹10 profit per ₹100 booking | Booking Fee (10% of order) |
| **Venue** | ₹90 net per ₹100 booking minus discounts | Order Amount (90% after platform fee) |
| **Tax Authority** | ₹18 GST per ₹100 booking fee | Integrated in booking fee |
| **TicPass Members** | ₹10 discount per ₹100 benefit used | Pass benefits (qty-1 per booking) |

---

## ⚙️ When Discount is GREATER than Total

```
Scenario: Order ₹1000 + Fee ₹100 = ₹1100 total
         But user has ₹1000 discount (100% coupon)
         
Raw Calculation: ₹1100 - ₹1000 = ₹100
Expected: ₹100 or ₹0 ?

ANSWER: ₹0 (booking is FREE)

Code:
if grandTotal < 0 {
    grandTotal = 0
}

Why? Because we can't charge NEGATIVE amounts
Venue still gets ₹1000 compensation from platform
Only user pays ₹0
```

---

## 📱 Payment Gateway Integration

```
WHEN: Grand Total > 0
├─ Show Razorpay/Cashfree payment button
└─ Amount sent = grandTotal * 100 (paise)

WHEN: Grand Total = 0
├─ Skip payment gateway entirely
├─ Auto-confirm booking
└─ Send booking confirmation email
```

---

## ✅ Validation Rules During Calculation

1. **Order Amount** ≥ ₹0
2. **Booking Fee** = Order × 10% (always calculated)
3. **Each Discount** must be ≥ ₹0
4. **Grand Total** must be ≥ ₹0 (minimum)
5. **No Discount** can exceed total before applying
6. **Multiple Discounts** stack additively (not multiplicative)

---

## 🔍 Payment Status Tracking

```
Database Fields:
├─ order_amount: ₹1000 (original service cost)
├─ booking_fee: ₹100 (platform fee + GST)
├─ discount_amount: ₹100 (total discounts)
├─ coupon_code: "SAVE50" (if used)
├─ offer_id: ObjectID (if used)
├─ ticpass_applied: true/false
├─ grand_total: ₹1000 (final amount paid)
├─ payment_gateway: "razorpay" or "cashfree"
├─ payment_id: "pay_12345xyz"
└─ status: "booked" (after successful payment)
```

This comprehensive breakdown shows:
✅ What users pay
✅ What Ticpin profits from
✅ How discounts stack
✅ Where GST fits in
✅ How everything integrates
