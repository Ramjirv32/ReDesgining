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
    },

    createPassOrder: async (userId: string, phone: string): Promise<any> => {
        const res = await fetch('/backend/api/payment/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                customer_id: userId,
                customer_phone: phone,
                type: 'pass',
                amount: 799 // Updated from test price 1 to 799
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create order');
        return data;
    },

    verifyPassPayment: async (verificationData: { 
        razorpay_payment_id: string, 
        razorpay_order_id: string, 
        razorpay_signature: string, 
        user_id: string,
        email: string,
        phone: string
    }): Promise<{ success: boolean }> => {
        const res = await fetch('/backend/api/payment/verify-pass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(verificationData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');
        return data;
    }
};
