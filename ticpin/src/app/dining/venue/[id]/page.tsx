import type { Metadata } from 'next';
import DiningVenueDetailClient from './DiningVenueDetailClient';
import { notFound } from 'next/navigation';

interface OfferRecord {
    id: string;
    title: string;
    description: string;
    image?: string;
    discount_type: 'percent' | 'flat';
    discount_value: number;
    applies_to: string;
    entity_ids?: string[];
    valid_until: string;
    is_active: boolean;
    created_at: string;
}

interface RealDining {
    id: string;
    name: string;
    description?: string;
    city?: string;
    venue_name?: string;
    venue_address?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    gallery_urls?: string[];
    menu_urls?: string[];
    time?: string;
    rating?: number;
    faqs?: { question: string; answer: string }[];
    terms?: string;
    prohibited_items?: string[];
    guide?: {
        facilities?: string[];
    };
}

async function getVenueData(id: string): Promise<RealDining | null> {
    try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${base}/api/dining/${id}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch dining venue data:", error);
        return null;
    }
}

async function getVenueOffers(id: string): Promise<OfferRecord[]> {
    try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${base}/api/dining/${id}/offers`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Failed to fetch dining offers:", error);
        return [];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const venue = await getVenueData(id);
    if (!venue) return { title: 'Not Found | Ticpin' };
    return {
        title: `${venue.name} | Dining | Ticpin`,
        description: venue.description ?? `Reserve a table at ${venue.name} on Ticpin.`,
        openGraph: {
            title: venue.name,
            description: venue.description ?? `Reserve a table at ${venue.name}`,
            images: venue.landscape_image_url ? [{ url: venue.landscape_image_url }] : [],
        },
    };
}

export default async function DiningVenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [venue, offers] = await Promise.all([getVenueData(id), getVenueOffers(id)]);

    if (!venue) {
        notFound();
    }

    return <DiningVenueDetailClient venue={venue} id={id} offers={offers} />;
}