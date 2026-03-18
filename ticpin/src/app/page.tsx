import { headers } from 'next/headers';
import MobileHome from '@/components/mobile/MobileHome';

async function getMobileData() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mobile/home`, { cache: 'no-store' });
        if (!res.ok) return { events: [], dinings: [], plays: [] };
        return await res.json();
    } catch (err) {
        console.error("Failed to fetch mobile data:", err);
        return { events: [], dinings: [], plays: [] };
    }
}

export default async function Home() {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const isMobile = /mobile/i.test(userAgent);

    if (isMobile) {
        const data = await getMobileData();
        return <MobileHome events={data.events || []} dinings={data.dinings || []} plays={data.plays || []} />;
    }

    // Default desktop behavior
    const { redirect } = await import('next/navigation');
    redirect('/play');
}
