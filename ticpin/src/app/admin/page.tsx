'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getOrganizerSession } from '@/lib/auth/organizer';
import AdminPanelComponent from "@/components/Admin Panel/adminpanel";

export default function Page() {
    const router = useRouter();

    useEffect(() => {
        const session = getOrganizerSession();
        if (!session || !session.isAdmin) {
            router.replace('/admin/login');
        }
    }, [router]);

    const session = getOrganizerSession();
    if (!session || !session.isAdmin) {
        return null;
    }

    return <AdminPanelComponent />;
}
