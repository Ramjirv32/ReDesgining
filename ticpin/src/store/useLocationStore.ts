import { create } from 'zustand';

export interface LocationData {
    name: string;
    display_name: string;
    district: string;
    state: string;
}

interface LocationState {
    currentLocation: LocationData | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setLocation: (location: LocationData | string | null) => void;
    clearLocation: () => void;
    syncFromBrowser: () => void;
    detectGeolocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
    currentLocation: null,
    isLoading: false,
    error: null,

    setLocation: (loc) => {
        let locationData: LocationData | null = null;
        if (!loc) {
            locationData = null;
        } else if (typeof loc === 'string') {
            const parts = loc.split(',').map(s => s.trim());
            locationData = {
                name: parts[0] || '',
                display_name: loc,
                district: parts[0] || '',
                state: parts[1] || ''
            };
        } else {
            locationData = loc;
        }

        set({ currentLocation: locationData });
        if (locationData) {
            localStorage.setItem('ticpin_location_v2', JSON.stringify(locationData));
        } else {
            localStorage.removeItem('ticpin_location_v2');
        }
        window.dispatchEvent(new CustomEvent('location-change', { detail: locationData }));
    },

    clearLocation: () => {
        set({ currentLocation: null });
        localStorage.removeItem('ticpin_location_v2');
        window.dispatchEvent(new CustomEvent('location-change', { detail: null }));
    },

    syncFromBrowser: () => {
        const saved = localStorage.getItem('ticpin_location_v2');
        if (saved) {
            try {
                set({ currentLocation: JSON.parse(saved) });
            } catch {
                localStorage.removeItem('ticpin_location_v2');
            }
        }
    },

    detectGeolocation: async () => {
        if (!navigator.geolocation) return;
        set({ isLoading: true });

        return new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async ({ coords }) => {
                    try {
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
                            { headers: { 'Accept-Language': 'en' } }
                        );
                        const data = await res.json();
                        const name = data.name || data.address?.suburb || data.address?.neighbourhood || data.address?.city || '';
                        const district = data.address?.state_district || data.address?.county || '';
                        const state = data.address?.state || '';

                        const loc = {
                            name: name,
                            display_name: data.display_name,
                            district: district,
                            state: state
                        };

                        get().setLocation(loc);
                    } catch {
                        set({ error: 'Failed to geocode location' });
                    } finally {
                        set({ isLoading: false });
                        resolve();
                    }
                },
                () => {
                    set({ isLoading: false });
                    resolve();
                }
            );
        });
    }
}));
