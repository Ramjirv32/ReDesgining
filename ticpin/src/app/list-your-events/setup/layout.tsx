'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrganizerSession } from '@/lib/auth/organizer';

export default function EventsSetupLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [hasCheckedSession, setHasCheckedSession] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setHasCheckedSession(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!hasCheckedSession) return;
        
        const session = getOrganizerSession();
        if (!session) {
            router.replace('/list-your-events/Login');
        } else {
            setIsAuthorized(true);
        }
    }, [hasCheckedSession, router]);

    if (!isAuthorized || !hasCheckedSession) {
        return <div className="h-[calc(100vh-80px)] w-full bg-zinc-50 animate-pulse" />;
    }

    return <>{children}</>;
}
