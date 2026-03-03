import type { Metadata } from 'next';
import DiningVenueDetailClient from './DiningVenueDetailClient';
import { notFound } from 'next/navigation';

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
    time?: string;
    rating?: number;
    faqs?: { question: string; answer: string }[];
    terms?: string;
    prohibited_items?: string[];
}

async function getVenueData(id: string): Promise<RealDining | null> {
    try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${base}/api/dining/${id}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch dining venue data:", error);
        return null;
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
    const venue = await getVenueData(id);

    if (!venue) {
        notFound();
    }

    return <DiningVenueDetailClient venue={venue} id={id} />;
}