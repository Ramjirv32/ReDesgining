import { Metadata } from 'next';
import EventsClient from './EventsClient';

export const metadata: Metadata = {
    title: "Events | Ticpin",
    description: "Explore and book the most exciting music, comedy, and performance events on Ticpin.",
};

interface EventArtist {
    name: string;
    image_url?: string;
}

interface RealEvent {
    id: string;
    name: string;
    city?: string;
    date?: string;
    time?: string;
    price_starts_from?: number;
    portrait_image_url?: string;
    landscape_image_url?: string;
    category?: string;
    venue_type?: string;
    artists?: EventArtist[];
    status?: string;
}

async function getEvents(): Promise<RealEvent[]> {
    try {
        const response = await fetch('http://localhost:9000/api/events', {
            cache: 'no-store'
        });
        if (!response.ok) return [];
        const data = await response.json();
        return (Array.isArray(data) ? data : []).filter((e: RealEvent) => e.status === 'approved');
    } catch (err) {
        console.error("Failed to fetch events:", err);
        return [];
    }
}

export default async function EventsPage() {
    const events = await getEvents();
    return <EventsClient initialEvents={events} />;
}
