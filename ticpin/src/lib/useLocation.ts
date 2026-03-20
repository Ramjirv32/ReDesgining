'use client';

import { useState, useEffect } from 'react';

/**
 * Returns the user-selected/detected city from location store.
 * Re-renders automatically when the location changes across the app.
 */
import { LocationData } from './hooks/useGeolocation';
import { useLocationStore } from '../store/useLocationStore';

export function useLocation(): string {
    const [location, setLocation] = useState<string>('');
    const { currentLocation } = useLocationStore();

    useEffect(() => {
        if (!currentLocation) {
            setLocation('');
        } else {
            if (currentLocation.district || currentLocation.state) {
                setLocation([currentLocation.district || currentLocation.name, currentLocation.state].filter(Boolean).join(', '));
            } else {
                setLocation(currentLocation.name);
            }
        }
    }, [currentLocation]);

    useEffect(() => {
        const handler = (e: Event) => {
            const data = (e as CustomEvent<LocationData | string | null>).detail;
            if (!data) {
                setLocation('');
            } else if (typeof data === 'string') {
                setLocation(data);
            } else {
                if (data.district || data.state) {
                    setLocation([data.district || data.name, data.state].filter(Boolean).join(', '));
                } else {
                    setLocation(data.name);
                }
            }
        };
        window.addEventListener('location-change', handler);
        return () => window.removeEventListener('location-change', handler);
    }, []);

    return location;
}
