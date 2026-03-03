'use client';

import { useState, useEffect } from 'react';

/**
 * Returns the user-selected/detected city from localStorage.
 * Re-renders automatically when the location changes across the app.
 */
export function useLocation(): string {
    const [location, setLocation] = useState<string>(() => {
        if (typeof window === 'undefined') return '';
        return localStorage.getItem('ticpin_location') ?? '';
    });

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<string>).detail;
            setLocation(detail ?? '');
        };
        window.addEventListener('location-change', handler);
        return () => window.removeEventListener('location-change', handler);
    }, []);

    return location;
}
