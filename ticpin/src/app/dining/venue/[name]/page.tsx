import type { Metadata } from 'next';
import DiningVenueDetailClient from './DiningVenueDetailClient';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import MobileDiningDetails from '@/components/mobile/MobileDiningDetails';

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

async function getVenueData(name: string): Promise<RealDining | null> {
    try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${base}/api/dining/${encodeURIComponent(name)}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch dining venue data:", error);
        return null;
    }
}

async function getVenueOffers(name: string): Promise<OfferRecord[]> {
    try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${base}/api/dining/${encodeURIComponent(name)}/offers`, {
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

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const venue = await getVenueData(decodedName);
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


async function getMobileVenueData(id: string) {
    try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${base}/api/mobile/dining/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch mobile dining data:", error);
        return null;
    }
}

export default async function DiningVenueDetailPage({ params }: { params: Promise<{ name: string }> }) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const isMobile = /mobile/i.test(userAgent);

    const venue = await getVenueData(decodedName);

    if (!venue) {
        notFound();
    }

    if (isMobile) {
        const mobileData = await getMobileVenueData(venue.id);
        if (mobileData) {
            return <MobileDiningDetails venue={mobileData.venue} offers={mobileData.offers || []} />;
        }
    }

    const offers = await getVenueOffers(decodedName);
    return <DiningVenueDetailClient venue={venue} id={venue.id} offers={offers} />;
}