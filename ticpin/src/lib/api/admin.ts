const ADMIN_BASE = '/backend/api/admin';
const ORG_BASE = '/backend/api/organizer';

async function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${ADMIN_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Admin request failed');
    return data as T;
}

// ─── Organizer types ──────────────────────────────────────────────────────────

export interface OrganizerListItem {
    id: string;
    email: string;
    name: string;
    isVerified: boolean;
    categoryStatus: Record<string, string>;
    createdAt: string;
}

export interface OrganizerDetail {
    organizer: OrganizerListItem;
    setups: Array<{
        id: string;
        category: string;
        orgType: string;
        pan: string;
        panName: string;
        panDOB: string;
        panCardUrl: string;
        bankAccountNo: string;
        bankIfsc: string;
        bankName: string;
        accountHolder: string;
        backupEmail: string;
        backupPhone: string;
        updatedAt: string;
        rejectionReason?: string;
    }>;
    profile: {
        name?: string;
        phone?: string;
        address?: string;
        country?: string;
        state?: string;
        district?: string;
        profilePhoto?: string;
    };
}

export interface OrganizerListResponse {
    organizers: OrganizerListItem[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface AdminStats {
    totalOrganizers: number;
    pendingSetups: number;
    approvedSetups: number;
    rejectedSetups: number;
}

// ─── Listings types ───────────────────────────────────────────────────────────

export type ListingStatus = 'pending' | 'approved' | 'rejected';

export interface AdminListing {
    _id?: string;
    id?: string;
    name?: string;
    description?: string;
    title?: string;
    category?: string;
    sub_category?: string;
    city?: string;
    status: ListingStatus;
    organizer_id?: string;
    organizer_name?: string;
    created_at?: string;
    updated_at?: string;
    createdAt?: string;
    updatedAt?: string;
    // Images
    image?: string;
    images?: string[];
    portrait_image_url?: string;
    landscape_image_url?: string;
    gallery_urls?: string[];
    // event-specific
    date?: string;
    time?: string;
    venue?: string;
    venue_name?: string;
    venue_address?: string;
    google_map_link?: string;
    price_starts_from?: number;
    duration?: string;
    artist_name?: string;
    artists?: Array<{ name: string; description?: string; image_url?: string }>;
    ticket_categories?: Array<{
        name: string;
        price: number;
        capacity: number;
        has_image?: boolean;
        image_url?: string
    }>;
    faqs?: Array<{ question: string; answer: string }>;
    guide?: {
        venue_type?: string;
        audience_type?: string;
        min_age?: number;
        ticket_age_limit?: number;
        languages?: string[];
        is_kid_friendly?: boolean;
        is_pet_friendly?: boolean;
        facilities?: string[];
        event_instructions?: string;
    };
    prohibited_items?: string[];
    tickets_needed_for?: string;
    terms?: string;
    points_of_contact?: Array<{ name: string; phone: string; email: string }>;
    sales_notifications?: Array<{ type: string; message: string }>;
    instagram_link?: string;
    youtube_video_url?: string;
    legal_info?: string;
    payment?: {
        organizer_name?: string;
        gstin?: string;
        account_number?: string;
        ifsc?: string;
        account_type?: string;
        mobile?: string;
    };
    // dining-specific
    cuisine?: string;
    address?: string;
    // play-specific
    sport_type?: string;
    price_per_slot?: number;
}

// ─── Offer & Coupon types ─────────────────────────────────────────────────────

export interface CreateOfferPayload {
    title: string;
    description: string;
    image?: File;  // optional image file
    discount_type: 'percent' | 'flat';
    discount_value: number;
    applies_to: 'event' | 'play' | 'dining';
    entity_ids?: string[];   // one or more listing IDs
    valid_until: string;
}

export interface CreateCouponPayload {
    code: string;
    description?: string;
    category: 'event' | 'play' | 'dining';
    discount_type: 'percent' | 'flat';
    discount_value: number;
    valid_from: string;
    valid_until: string;
    max_uses: number;
    user_ids?: string[];     // optional — empty = global (all users)
}

export interface OfferRecord {
    id: string;
    title: string;
    description: string;
    image?: string;  // Cloudinary URL
    discount_type: 'percent' | 'flat';
    discount_value: number;
    applies_to: string;
    entity_ids?: string[];
    valid_until: string;
    is_active: boolean;
    created_at: string;
}

export interface CouponRecord {
    id: string;
    code: string;
    category: string;
    discount_type: string;
    discount_value: number;
    valid_from: string;
    valid_until: string;
    max_uses: number;
    used_count: number;
    is_active: boolean;
    created_at: string;
    user_id?: string;
    user_ids?: (string | { $oid: string })[];
}

export interface UserRecord {
    id: string;
    name: string;
    phone: string;
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {

    // ── Auth ──────────────────────────────────────────────────────────────────

    /** POST /api/admin/login */
    login: (email: string, password: string) =>
        adminRequest<{ message: string; email: string }>('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    /** POST /api/organizer/logout — clear session cookie */
    logout: async () => {
        try {
            await fetch('/backend/api/organizer/logout', { method: 'POST', credentials: 'include' });
        } catch (e) { console.error(e); }
        if (typeof window !== 'undefined') {
            const { clearOrganizerSession } = await import('@/lib/auth/organizer');
            clearOrganizerSession();
        }
    },

    // ── Stats ─────────────────────────────────────────────────────────────────

    /** GET /api/admin/stats */
    getStats: () => adminRequest<AdminStats>('/stats'),

    // ── Organizers ────────────────────────────────────────────────────────────

    /** GET /api/admin/organizers?page=&limit= */
    listOrganizers: (page = 1, limit = 20) =>
        adminRequest<OrganizerListResponse>(`/organizers?page=${page}&limit=${limit}`),

    /** GET /api/admin/organizers/:id */
    getOrganizerDetail: (id: string) =>
        adminRequest<OrganizerDetail>(`/organizers/${id}`),

    /** PUT /api/admin/organizers/:id/status */
    updateCategoryStatus: (
        id: string,
        category: string,
        status: 'approved' | 'rejected' | 'pending',
        reason?: string,
    ) =>
        adminRequest<{ message: string; category: string; status: string }>(
            `/organizers/${id}/status`,
            { method: 'PUT', body: JSON.stringify({ category, status, reason }) },
        ),

    /** DELETE /api/admin/organizers/:id */
    deleteOrganizer: (id: string) =>
        adminRequest<{ message: string }>(`/organizers/${id}`, { method: 'DELETE' }),

    // ── Events ────────────────────────────────────────────────────────────────

    /** GET /api/admin/events */
    listEvents: () => adminRequest<AdminListing[]>('/events'),

    /** PUT /api/admin/events/:id/status */
    updateEventStatus: (id: string, status: ListingStatus) =>
        adminRequest<{ message: string; status: string }>(`/events/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),

    /** PUT /api/admin/events/:id */
    updateEvent: (id: string, payload: Partial<AdminListing>) =>
        adminRequest<{ message: string }>(`/events/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        }),

    /** DELETE /api/admin/events/:id */
    deleteEvent: (id: string) =>
        adminRequest<{ message: string }>(`/events/${id}`, { method: 'DELETE' }),

    // ── Dining ────────────────────────────────────────────────────────────────

    /** GET /api/admin/dining */
    listDining: () => adminRequest<AdminListing[]>('/dining'),

    /** PUT /api/admin/dining/:id/status */
    updateDiningStatus: (id: string, status: ListingStatus) =>
        adminRequest<{ message: string; status: string }>(`/dining/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),

    /** PUT /api/admin/dining/:id */
    updateDining: (id: string, payload: Partial<AdminListing>) =>
        adminRequest<{ message: string }>(`/dining/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        }),

    /** DELETE /api/admin/dining/:id */
    deleteDining: (id: string) =>
        adminRequest<{ message: string }>(`/dining/${id}`, { method: 'DELETE' }),

    // ── Play ──────────────────────────────────────────────────────────────────

    /** GET /api/admin/play */
    listPlay: () => adminRequest<AdminListing[]>('/play'),

    /** PUT /api/admin/play/:id/status */
    updatePlayStatus: (id: string, status: ListingStatus) =>
        adminRequest<{ message: string; status: string }>(`/play/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),

    /** PUT /api/admin/play/:id */
    updatePlay: (id: string, payload: Partial<AdminListing>) =>
        adminRequest<{ message: string }>(`/play/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        }),

    /** DELETE /api/admin/play/:id */
    deletePlay: (id: string) =>
        adminRequest<{ message: string }>(`/play/${id}`, { method: 'DELETE' }),

    // ── Offers ────────────────────────────────────────────────────────────────

    /** POST /api/admin/offers */
    createOffer: async (payload: CreateOfferPayload): Promise<OfferRecord> => {
        const formData = new FormData();
        formData.append('title', payload.title);
        formData.append('description', payload.description);
        formData.append('discount_type', payload.discount_type);
        formData.append('discount_value', String(payload.discount_value));
        formData.append('applies_to', payload.applies_to);
        formData.append('valid_until', payload.valid_until);

        if (payload.entity_ids) {
            payload.entity_ids.forEach(id => formData.append('entity_ids', id));
        }

        if (payload.image) {
            formData.append('image', payload.image);
        }

        const res = await fetch(`${ADMIN_BASE}/offers`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to create offer');
        return data.offer;
    },

    /** GET /api/admin/offers */
    listOffers: () => adminRequest<OfferRecord[]>('/offers'),

    // ── Coupons ───────────────────────────────────────────────────────────────

    /** POST /api/admin/coupons */
    createCoupon: async (payload: CreateCouponPayload): Promise<CouponRecord> => {
        const res = await adminRequest<{ message: string; coupon: CouponRecord }>('/coupons', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return res.coupon;
    },

    /** GET /api/admin/coupons */
    listCoupons: () => adminRequest<CouponRecord[]>('/coupons'),

    /** GET /api/coupons/:category — get active coupons for a category (public) */
    getCouponsByCategory: (category: string) =>
        fetch(`/backend/api/coupons/${category}`)
            .then(res => res.json())
            .then(data => data as CouponRecord[])
            .catch(() => []),

    /** GET /api/offers/:category — get active offers for a category (public) */
    getOffersByCategory: (category: string) =>
        fetch(`/backend/api/offers/${category}`)
            .then(res => res.json())
            .then(data => data as OfferRecord[])
            .catch(() => []),

    /** GET /api/admin/users — for coupon user-selector */
    listUsers: () => adminRequest<UserRecord[]>('/users'),
};

// ─── Media upload ─────────────────────────────────────────────────────────────

/** Upload a media file to Cloudinary via the organizer upload endpoint */
export async function uploadMedia(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${ORG_BASE}/upload-media`, {
        method: 'POST',
        credentials: 'include',
        body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Upload failed');
    return data.url as string;
}
