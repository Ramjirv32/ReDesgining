import CategoryClient from '../CategoryClient';

interface RealPlay {
    id: string;
    name: string;
    city?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    category?: string;
    rating?: number;
    price_starts_from?: number;
}

async function getCricketVenues(): Promise<RealPlay[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/play?category=Cricket`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
        console.error("Failed to fetch cricket venues:", error);
        return [];
    }
}

export default async function CricketPage() {
    const venues = await getCricketVenues();
    return (
        <CategoryClient
            venues={venues}
            categoryName="CRICKET"
            categoryImage="/play/playck.png"
        />
    );
}
