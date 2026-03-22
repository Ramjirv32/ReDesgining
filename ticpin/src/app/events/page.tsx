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
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events`, {
            cache: 'no-store'
        });
        if (!response.ok) {
            console.warn(`Backend responded with ${response.status} for events fetch`);
            return [];
        }
        const data = await response.json();
        const events = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        
        if (events.length === 0) {
            console.log("No events returned from backend /api/events");
        }
        
        // Return all events regardless of status - let EventsClient handle filtering
        return events;
    } catch (err) {
        console.error("Failed to fetch events from backend:", err);
        return [];
    }
}

export default async function EventsPage() {
    const events = await getEvents();
    return <EventsClient initialEvents={events} />;
}
