import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
    detectGeolocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set, get) => ({
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
                window.dispatchEvent(new CustomEvent('location-change', { detail: locationData }));
            },

            clearLocation: () => {
                set({ currentLocation: null });
                window.dispatchEvent(new CustomEvent('location-change', { detail: null }));
            },

            detectGeolocation: async () => {
                if (!navigator.geolocation) return;
                set({ isLoading: true });

                const API_KEY = "AIzaSyC2gFDSPGY7wtSFHzYwzbPkP6tcq61Lmt8";

                return new Promise<void>((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        async ({ coords }) => {
                            try {
                                const res = await fetch(
                                    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${API_KEY}`
                                );
                                const data = await res.json();
                                
                                if (data.results && data.results.length > 0) {
                                    let city = "";
                                    let district = "";
                                    let state = "";
                                    let area = "";

                                    // Find components from the most specific result
                                    const components = data.results[0].address_components;
                                    components.forEach((c: any) => {
                                        if (c.types.includes("sublocality") || c.types.includes("neighborhood")) area = c.long_name;
                                        if (c.types.includes("locality")) city = c.long_name;
                                        if (c.types.includes("administrative_area_level_2")) district = c.long_name;
                                        if (c.types.includes("administrative_area_level_1")) state = c.long_name;
                                    });

                                    // Refine city if locality is missing (common in some Indian areas)
                                    const finalCity = city || district || area || "Unknown";

                                    const loc = {
                                        name: finalCity,
                                        display_name: data.results[0].formatted_address,
                                        district: district,
                                        state: state
                                    };

                                    get().setLocation(loc);
                                }
                            } catch (e) {
                                console.error('Geocoding error:', e);
                                set({ error: 'Failed to geocode location' });
                            } finally {
                                set({ isLoading: false });
                                resolve();
                            }
                        },
                        () => {
                            set({ isLoading: false });
                            resolve();
                        },
                        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                    );
                });
            }
        }),
        {
            name: 'ticpin-location-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
