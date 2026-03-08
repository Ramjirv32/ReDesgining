'use client';

import { useState, useEffect, useCallback } from 'react';

export function useGeolocation() {
    const [currentLocation, setCurrentLocation] = useState('');

    const saveLocation = useCallback((loc: string) => {
        setCurrentLocation(loc);
        localStorage.setItem('ticpin_location', loc);
        window.dispatchEvent(new CustomEvent('location-change', { detail: loc }));
    }, []);

    const clearLocation = useCallback(() => {
        setCurrentLocation('');
        localStorage.removeItem('ticpin_location');
        window.dispatchEvent(new CustomEvent('location-change', { detail: '' }));
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('ticpin_location');
        if (saved) {
            setCurrentLocation(saved);
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
                    const city =
                        data.address?.city ||
                        data.address?.town ||
                        data.address?.village ||
                        data.address?.county ||
                        '';
                    const state = data.address?.state || '';
                    const label = city && state ? `${city}, ${state}` : (city || state || '');
                    if (label) saveLocation(label);
                } catch {
                    // silently fail
                }
            },
            () => { /* permission denied */ }
        );
    }, [saveLocation]);

    return { currentLocation, saveLocation, clearLocation };
}
