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

async function getEventData(name: string): Promise<EventData | null> {
    try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${base}/api/events/${encodeURIComponent(name)}`, {
            next: { revalidate: 60 }, // ISR: revalidate every 60s
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch event data:", error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
    const { name } = await params;
    const event = await getEventData(name);
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

export default async function EventDetailPage({ params }: { params: Promise<{ name: string }> }) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const event = await getEventData(decodedName);

    if (!event) {
        notFound();
    }

    return <EventDetailClient event={event} id={event.id} />;
}
