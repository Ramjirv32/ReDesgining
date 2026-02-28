import { create } from 'zustand';

interface Artist {
    name: string;
    image_url: string;
    description: string;
}

interface TicketCategory {
    name: string;
    price: string;
    capacity: string;
    image_url: string;
    has_image: boolean;
}

interface Guide {
    languages: string[];
    minAge: number;
    ticketRequiredAboveAge: number;
    venueType: string;
    audienceType: string;
    isKidFriendly: boolean;
    isPetFriendly: boolean;
    gatesOpenBefore: boolean;
    gatesOpenBeforeValue: number;
    gatesOpenBeforeUnit: string;
}

interface Payment {
    organizerName: string;
    gstin: string;
    accountNumber: string;
    ifsc: string;
    accountType: string;
}

interface CreateEventState {
    eventName: string;
    portraitUrl: string;
    landscapeUrl: string;
    venueAddress: string;
    venueName: string;
    googleMapLink: string;
    instagramLink: string;
    videoUrl: string;
    galleryUrls: string[];
    eventDate: string;
    eventTime: string;
    duration: string;
    description: string;

    guide: Guide;
    payment: Payment;

    artists: Artist[];
    ticketCategories: TicketCategory[];

    pocs: { name: string; email: string; mobile: string }[];
    salesNotifs: { email: string; mobile: string }[];

    selections: {
        category: string;
        subCategory: string;
        city: string;
    };

    // Actions
    updateField: (field: string, value: any) => void;
    updateGuide: (updates: Partial<Guide>) => void;
    updatePayment: (updates: Partial<Payment>) => void;
    updateSelections: (updates: Partial<{ category: string; subCategory: string; city: string }>) => void;
    setArtists: (artists: Artist[]) => void;
    setTicketCategories: (categories: TicketCategory[]) => void;
    setPocs: (pocs: { name: string; email: string; mobile: string }[]) => void;
    setSalesNotifs: (notifs: { email: string; mobile: string }[]) => void;
    setGalleryUrls: (urls: string[]) => void;
    reset: () => void;
}

const initialState = {
    eventName: '',
    portraitUrl: '',
    landscapeUrl: '',
    venueAddress: '',
    venueName: '',
    googleMapLink: '',
    instagramLink: '',
    videoUrl: '',
    galleryUrls: [],
    eventDate: '',
    eventTime: '',
    duration: '',
    description: '',
    guide: {
        languages: [],
        minAge: 0,
        ticketRequiredAboveAge: 0,
        venueType: 'Indoor',
        audienceType: 'Seated',
        isKidFriendly: false,
        isPetFriendly: false,
        gatesOpenBefore: false,
        gatesOpenBeforeValue: 1,
        gatesOpenBeforeUnit: 'Minutes'
    },
    payment: {
        organizerName: '',
        gstin: '',
        accountNumber: '',
        ifsc: '',
        accountType: ''
    },
    artists: [],
    ticketCategories: [],
    pocs: [],
    salesNotifs: [],
    selections: {
        category: 'Select Category',
        subCategory: 'Select Sub-Category',
        city: 'Select City'
    }
};

export const useCreateEventStore = create<CreateEventState>((set) => ({
    ...initialState,

    updateField: (field, value) => set((state) => ({ ...state, [field]: value })),

    updateGuide: (updates) => set((state) => ({
        guide: { ...state.guide, ...updates }
    })),

    updatePayment: (updates) => set((state) => ({
        payment: { ...state.payment, ...updates }
    })),

    updateSelections: (updates) => set((state) => ({
        selections: { ...state.selections, ...updates }
    })),

    setArtists: (artists) => set({ artists }),
    setTicketCategories: (ticketCategories) => set({ ticketCategories }),
    setPocs: (pocs) => set({ pocs }),
    setSalesNotifs: (salesNotifs) => set({ salesNotifs }),
    setGalleryUrls: (galleryUrls) => set({ galleryUrls }),

    reset: () => set(initialState)
}));
