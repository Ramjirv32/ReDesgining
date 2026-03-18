'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganizerPage() {
    const router = useRouter();
    const [hasCheckedSession, setHasCheckedSession] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setHasCheckedSession(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!hasCheckedSession) return;
        router.replace('/organizer/dashboard');
    }, [hasCheckedSession, router]);

    return null;
}
