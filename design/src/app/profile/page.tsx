'use client';

import MobileProfile from '@/components/MobileProfile';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();

    return <MobileProfile onBack={() => router.back()} />;
}
