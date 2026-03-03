'use client';

import { useState, useEffect } from 'react';

/**
 * Returns the user-selected/detected city from localStorage.
 * Re-renders automatically when the location changes across the app.
 */
export function useLocation(): string {
    const [location, setLocation] = useState<string>('');

    useEffect(() => {
        // Read initial value from localStorage after hydration to avoid SSR mismatch
        const storedLocation = localStorage.getItem('ticpin_location') ?? '';
        if (storedLocation) {
            setLocation(storedLocation);
        }

        const handler = (e: Event) => {
            const detail = (e as CustomEvent<string>).detail;
            setLocation(detail ?? '');
        };
        window.addEventListener('location-change', handler);
        return () => window.removeEventListener('location-change', handler);
    }, []);

    return location;
}
