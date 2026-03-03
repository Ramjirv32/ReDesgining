import { Metadata } from 'next';
import PlayClient from './PlayClient';

export const metadata: Metadata = {
    title: "Play | Ticpin",
    description: "Find and book the best sports venues, from cricket nets to badminton courts on Ticpin.",
};

interface RealPlay {
    id: string;
    name: string;
    city?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    category?: string;
    rating?: number;
    status?: string;
    price_starts_from?: number;
}

async function getVenues(): Promise<RealPlay[]> {
    try {
        const res = await fetch('http://localhost:9000/api/play', {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (Array.isArray(data) ? data : []).filter((v: RealPlay) => v.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch venues:", error);
        return [];
    }
}

export default async function PlayPage() {
    const venues = await getVenues();
    return <PlayClient initialVenues={venues} />;
}
