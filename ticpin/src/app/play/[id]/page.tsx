import type { Metadata } from 'next';
import PlayDetailClient from './PlayDetailClient';

interface RealPlay {
    id: string;
    name: string;
    description?: string;
    category?: string;
    sub_category?: string;
    city?: string;
    venue_name?: string;
    venue_address?: string;
    google_map_link?: string;
    instagram_link?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    card_video_url?: string;
    gallery_urls?: string[];
    secondary_banner_url?: string;
    time?: string;
    courts?: { id: string; name: string; type: string; price: number; image_url?: string }[];
    guide?: { facilities: string[] | string; is_pet_friendly: boolean };
    event_instructions?: string;
    youtube_video_url?: string;
    prohibited_items?: string[];
    faqs?: { question: string; answer: string }[];
    terms?: string;
    price_starts_from?: number;
}

async function getVenueData(id: string): Promise<RealPlay | null> {
    try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${base}/api/play/${id}`, {
            next: { revalidate: 60 }, // ISR: revalidate every 60s
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch venue data:", error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const venue = await getVenueData(id);
    if (!venue) return { title: 'Not Found | Ticpin' };
    return {
        title: `${venue.name} | Play | Ticpin`,
        description: venue.description ?? `Book slots at ${venue.name} on Ticpin.`,
        openGraph: {
            title: venue.name,
            description: venue.description ?? `Book slots at ${venue.name}`,
            images: venue.landscape_image_url ? [{ url: venue.landscape_image_url }] : [],
        },
    };
}

export default async function PlayDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const venue = await getVenueData(id);

    if (!venue) {
        return <div className="min-h-screen flex items-center justify-center">Venue not found</div>;
    }

    return <PlayDetailClient venue={venue} id={id} />;
}