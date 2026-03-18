'use client';

import { useState, useEffect } from 'react';

/**
 * Returns the user-selected/detected city from localStorage.
 * Re-renders automatically when the location changes across the app.
 */
import { LocationData } from './hooks/useGeolocation';

export function useLocation(): string {
    const [location, setLocation] = useState<string>('');

    useEffect(() => {
        const getFormattedLocation = () => {
            const v2 = localStorage.getItem('ticpin_location_v2');
            if (v2) {
                try {
                    const data = JSON.parse(v2) as LocationData;
                    if (data.district || data.state) {
                        return [data.district || data.name, data.state].filter(Boolean).join(', ');
                    }
                    return data.name;
                } catch { }
            }
            return localStorage.getItem('ticpin_location') ?? '';
        };

        setLocation(getFormattedLocation());

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
