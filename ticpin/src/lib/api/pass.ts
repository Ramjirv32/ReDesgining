const BASE = '/backend/api/pass';

export interface BenefitCounter {
    total: number;
    used: number;
    remaining: number;
}

export interface DiningVoucherBenefit extends BenefitCounter {
    value_each: number;
}

export interface PassBenefits {
    turf_bookings: BenefitCounter;
    dining_vouchers: DiningVoucherBenefit;
    events_discount_active: boolean;
}

export interface TicpinPass {
    id: string;
    user_id: string;
    phone: string;
    payment_id: string;
    order_id: string;
    price: number;
    status: string;
    start_date: string;
    end_date: string;
    benefits: PassBenefits;
    createdAt: string;
    updatedAt: string;
}

export const passApi = {
    getActivePass: async (userId: string): Promise<TicpinPass | null> => {
        try {
            const res = await fetch(`${BASE}/user/${userId}`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data;
        } catch (err) {
            console.error('Failed to fetch active pass:', err);
            return null;
        }
    },
    
    getLatestPass: async (userId: string): Promise<TicpinPass | null> => {
        try {
            console.log('Fetching latest pass for:', userId);
            const res = await fetch(`${BASE}/user/${userId}/latest`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (!res.ok) {
                console.log('Latest pass response not OK:', res.status);
                return null;
            }
            const data = await res.json();
            console.log('Latest pass data:', data);
            return data;
        } catch (err) {
            console.error('Failed to fetch latest pass:', err);
            return null;
        }
    },

    useTurf: async (passId: string): Promise<TicpinPass> => {
        const res = await fetch(`${BASE}/${passId}/use-turf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to use turf benefit');
        return data;
    },

    useDining: async (passId: string): Promise<TicpinPass> => {
        const res = await fetch(`${BASE}/${passId}/use-dining`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to use dining benefit');
        return data;
    }
};
