'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Admin login is handled by the organizer login page.
// If the email matches the admin email, the OTP verify flow
// sets isAdmin:true in the session and redirects here → /admin.
export default function AdminLoginPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/list-your-events/Login');
    }, [router]);
    return null;
}
