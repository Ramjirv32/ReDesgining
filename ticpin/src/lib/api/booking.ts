const BASE = '/backend/api';

export interface BookingTicketItem {
    category: string;
    price: number;
    quantity: number;
}

export interface CreateBookingPayload {
    user_email: string;
    user_name: string;
    user_phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    nationality: string;
    event_id: string;
    event_name: string;
    tickets: BookingTicketItem[];
    order_amount: number;
    booking_fee: number;
    coupon_code?: string;
    offer_id?: string;
    user_id?: string;
    payment_id?: string;
    payment_gateway?: string;
}

export interface CreateDiningPayload {
    user_email: string;
    user_name: string;
    user_phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    nationality: string;
    dining_id: string;
    venue_name: string;
    date: string;
    time_slot: string;
    guests: number;
    order_amount: number;
    booking_fee: number;
    coupon_code?: string;
    offer_id?: string;
    user_id?: string;
    payment_id?: string;
    payment_gateway?: string;
}

export interface CreatePlayPayload {
    user_email: string;
    user_name: string;
    user_phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    nationality: string;
    play_id: string;
    venue_name: string;
    date: string;
    slot: string;
    duration: number;
    tickets: BookingTicketItem[];
    order_amount: number;
    booking_fee: number;
    coupon_code?: string;
    offer_id?: string;
    user_id?: string;
    payment_id?: string;
    payment_gateway?: string;
}

export interface PaymentOrderRequest {
    amount: number;
    customer_id?: string;
    customer_email?: string;
    customer_phone: string;
    return_url?: string;
    type?: string; // "event", "play", "dining"
}

export interface PaymentOrderResponse {
    gateway: 'cashfree' | 'razorpay';
    order_id: string;
    payment_session_id?: string; // Cashfree
    razorpay_key?: string;       // Razorpay
}

export interface BookingResult {
    booking_id: string;
    grand_total: number;
    discount_amount: number;
    status: string;
    message: string;
}

export interface OfferItem {
    id: string;
    title: string;
    description: string;
    discount_type: 'percent' | 'flat';
    discount_value: number;
    valid_until: string;
}

export interface CouponValidateResult {
    valid: boolean;
    discount_amount: number;
    coupon: {
        code: string;
        discount_type: string;
        discount_value: number;
    };
}

export interface AvailabilityResult {
    booked: Record<string, number>;
}

export const bookingApi = {
    /** Create a payment order (picks Cashfree or Razorpay via traffic weight) */
    createPaymentOrder: async (payload: PaymentOrderRequest): Promise<PaymentOrderResponse> => {
        const res = await fetch(`${BASE}/payment/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Payment order creation failed');
        return data as PaymentOrderResponse;
    },

    /** Create an event booking (no auth required) */
    createEventBooking: async (payload: CreateBookingPayload): Promise<BookingResult> => {
        const res = await fetch(`${BASE}/bookings/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Booking failed');
        return data as BookingResult;
    },

    /** Validate a coupon code */
    validateCoupon: async (
        code: string,
        eventId: string,
        orderAmount: number,
        userId?: string
    ): Promise<CouponValidateResult> => {
        const res = await fetch(`${BASE}/coupons/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ code, event_id: eventId, order_amount: orderAmount, user_id: userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Invalid coupon');
        return data as CouponValidateResult;
    },

    /** Create a dining booking */
    createDiningBooking: async (payload: CreateDiningPayload): Promise<BookingResult> => {
        const res = await fetch(`${BASE}/bookings/dining`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Dining booking failed');
        return data as BookingResult;
    },

    /** Create a play booking */
    createPlayBooking: async (payload: CreatePlayPayload): Promise<BookingResult> => {
        const res = await fetch(`${BASE}/bookings/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Play booking failed');
        return data as BookingResult;
    },

    /** Get active offers for an event */
    getEventOffers: async (eventId: string): Promise<OfferItem[]> => {
        const res = await fetch(`${BASE}/events/${eventId}/offers`);
        const data = await res.json();
        if (!res.ok) return [];
        return data as OfferItem[];
    },

    /** Get active offers for dining */
    getDiningOffers: async (diningId: string): Promise<OfferItem[]> => {
        const res = await fetch(`${BASE}/dining/${diningId}/offers`);
        const data = await res.json();
        if (!res.ok) return [];
        return data as OfferItem[];
    },

    /** Get active offers for play */
    getPlayOffers: async (playId: string): Promise<OfferItem[]> => {
        const res = await fetch(`${BASE}/play/${playId}/offers`);
        const data = await res.json();
        if (!res.ok) return [];
        return data as OfferItem[];
    },

    /** Get seat availability (booked counts) for an event */
    getEventAvailability: async (eventId: string): Promise<AvailabilityResult> => {
        const res = await fetch(`${BASE}/events/${eventId}/availability`);
        const data = await res.json();
        if (!res.ok) return { booked: {} };
        return data as AvailabilityResult;
    },

    /** Get active coupons for a category.
     *  Pass userId to also receive user-specific coupons for that user;
     *  without it only global (unrestricted) coupons are returned.
     */
    getCouponsByCategory: async (category: string, userId?: string): Promise<any[]> => {
        const url = userId
            ? `${BASE}/coupons/${category}?user_id=${encodeURIComponent(userId)}`
            : `${BASE}/coupons/${category}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) return [];
        return Array.isArray(data) ? data : [];
    },
    /** Fetch all bookings for a user by multiple identifiers */
    getUserBookings: async ({ email, phone, userId }: { email?: string; phone?: string; userId?: string }): Promise<any[]> => {
        const params = new URLSearchParams();
        if (email) params.append('email', email);
        if (phone) params.append('phone', phone);
        if (userId) params.append('userId', userId);
        
        const res = await fetch(`${BASE}/bookings/user/history?${params.toString()}`, {
            credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) return [];
        return data as any[];
    },
    /** Get detailed booking information by ID */
    getBookingDetails: async (bookingId: string, userId?: string): Promise<any> => {
        const url = userId
            ? `${BASE}/bookings/${bookingId}?user_id=${encodeURIComponent(userId)}`
            : `${BASE}/bookings/${bookingId}`;
        const res = await fetch(url, {
            credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get booking details');
        return data;
    },

    /** Cancel a booking by ID and category */
    cancelBooking: async (id: string, category: string): Promise<{ message: string }> => {
        const res = await fetch(`${BASE}/bookings/${id}/cancel?category=${category}`, {
            method: 'PUT',
            credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');
        return data;
    },
};
