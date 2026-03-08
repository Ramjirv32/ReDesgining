'use client';

import { useState, useEffect } from 'react';
import { getOrganizerSession } from '@/lib/auth/organizer';
import type { OrganizerSession } from '@/lib/auth/organizer';

export function useSessionSync(disabled: boolean) {
    const [session, setSession] = useState<OrganizerSession | null>(null);

    useEffect(() => {
        if (disabled) return;

        const load = () => setSession(getOrganizerSession());
        load();

        window.addEventListener('organizer-auth-change', load);
        return () => window.removeEventListener('organizer-auth-change', load);
    }, [disabled]);

    return { session, setSession };
}
