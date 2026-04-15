'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DiningBookingsRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/bookings?type=dining');
    }, [router]);
    
    return null;
}
