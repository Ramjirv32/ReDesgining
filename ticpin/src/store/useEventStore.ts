import { create } from 'zustand';

interface EventArtist {
    name: string;
    image_url?: string;
}

interface RealEvent {
    id: string;
    name: string;
    city?: string;
    date?: string;
    time?: string;
    price_starts_from?: number;
    portrait_image_url?: string;
    landscape_image_url?: string;
    category?: string;
    venue_type?: string;
    artists?: EventArtist[];
    status?: string;
}

interface EventState {
    events: RealEvent[];
    loading: boolean;
    error: string | null;
    activeFilter: string;
    modalFilters: Record<string, string[]>;

    // Actions
    setEvents: (events: RealEvent[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setActiveFilter: (filter: string) => void;
    setModalFilters: (filters: Record<string, string[]>) => void;
    fetchEvents: () => Promise<void>;
}

export const useEventStore = create<EventState>((set) => ({
    events: [],
    loading: false,
    error: null,
    activeFilter: 'All',
    modalFilters: {},

    setEvents: (events) => set({ events }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setActiveFilter: (activeFilter) => set({ activeFilter }),
    setModalFilters: (modalFilters) => set({ modalFilters }),

    fetchEvents: async () => {
        set({ loading: true, error: null });
        try {
            const response = await fetch('/backend/api/events', { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to fetch events');
            const data = await response.json();
            const list = (Array.isArray(data) ? data : []).filter((e: RealEvent) => e.status === 'approved');
            set({ events: list, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },
}));
