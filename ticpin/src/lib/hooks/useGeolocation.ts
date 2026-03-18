'use client';

import { useState, useEffect, useCallback } from 'react';

export interface LocationData {
    name: string;
    display_name: string;
    district: string;
    state: string;
}

export function useGeolocation() {
    const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);

    const saveLocation = useCallback((loc: LocationData | string) => {
        let locationData: LocationData;
        
        if (typeof loc === 'string') {
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

        setCurrentLocation(locationData);
        localStorage.setItem('ticpin_location_v2', JSON.stringify(locationData));
        window.dispatchEvent(new CustomEvent('location-change', { detail: locationData }));
    }, []);

    const clearLocation = useCallback(() => {
        setCurrentLocation(null);
        localStorage.removeItem('ticpin_location_v2');
        window.dispatchEvent(new CustomEvent('location-change', { detail: null }));
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('ticpin_location_v2');
        if (saved) {
            try {
                setCurrentLocation(JSON.parse(saved));
            } catch {
                localStorage.removeItem('ticpin_location_v2');
            }
            return;
        }

        // Fallback for old version
        const oldSaved = localStorage.getItem('ticpin_location');
        if (oldSaved) {
            saveLocation(oldSaved);
            localStorage.removeItem('ticpin_location');
            return;
        }

        if (!navigator.geolocation) return;

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
                    
                    saveLocation({
                        name: name,
                        display_name: data.display_name,
                        district: district,
                        state: state
                    });
                } catch {
                    // silently fail
                }
            },
            () => { /* permission denied */ }
        );
    }, [saveLocation]);

    return { currentLocation, saveLocation, clearLocation };
}
