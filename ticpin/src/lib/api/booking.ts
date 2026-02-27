const BASE = '/backend/api';

export interface BookingTicketItem {
    category: string;
    price: number;
    quantity: number;
}

export interface CreateBookingPayload {
    user_email: string;
    event_id: string;
    event_name: string;
    tickets: BookingTicketItem[];
    order_amount: number;
    booking_fee: number;
    coupon_code?: string;
    offer_id?: string;
}

export interface CreateDiningPayload {
    user_email: string;
    dining_id: string;
    venue_name: string;
    date: string;
    time_slot: string;
    guests: number;
    order_amount: number;
    booking_fee: number;
    coupon_code?: string;
    offer_id?: string;
}

export interface CreatePlayPayload {
    user_email: string;
    play_id: string;
    venue_name: string;
    date: string;
    slot: string;
    tickets: BookingTicketItem[];
    order_amount: number;
    booking_fee: number;
    coupon_code?: string;
    offer_id?: string;
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
    /** Create an event booking (no auth required) */
    createEventBooking: async (payload: CreateBookingPayload): Promise<BookingResult> => {
        const res = await fetch(`${BASE}/bookings/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        orderAmount: number
    ): Promise<CouponValidateResult> => {
        const res = await fetch(`${BASE}/coupons/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, event_id: eventId, order_amount: orderAmount }),
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
};
