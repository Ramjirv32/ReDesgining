import type { Metadata } from 'next';
import EventDetailClient from './EventDetailClient';
import { notFound } from 'next/navigation';

interface Artist {
    name: string;
    image_url?: string;
    description?: string;
}

interface FAQ {
    question: string;
    answer: string;
}

interface EventGuide {
    languages?: string[];
    min_age?: number;
    venue_type?: string;
    audience_type?: string;
    is_kid_friendly?: boolean;
    is_pet_friendly?: boolean;
}

interface EventData {
    id: string;
    name: string;
    description?: string;
    category?: string;
    sub_category?: string;
    city?: string;
    date?: string;
    time?: string;
    duration?: string;
    venue_name?: string;
    venue_address?: string;
    google_map_link?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    gallery_urls?: string[];
    price_starts_from?: number;
    tickets_needed_for?: string;
    artists?: Artist[];
    faqs?: FAQ[];
    guide?: EventGuide;
    status?: string;
    terms?: string;
}

async function getEventData(id: string): Promise<EventData | null> {
    try {
        const base = process.env.BACKEND_URL ?? 'http://localhost:9000';
        const res = await fetch(`${base}/api/events/${id}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch event data:", error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const event = await getEventData(id);
    if (!event) return { title: 'Not Found | Ticpin' };
    return {
        title: `${event.name} | Events | Ticpin`,
        description: event.description ?? `Book tickets for ${event.name} on Ticpin.`,
        openGraph: {
            title: event.name,
            description: event.description ?? `Book tickets for ${event.name}`,
            images: event.landscape_image_url ? [{ url: event.landscape_image_url }] : [],
        },
    };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await getEventData(id);

    if (!event) {
        notFound();
    }

    return <EventDetailClient event={event} id={id} />;
}
