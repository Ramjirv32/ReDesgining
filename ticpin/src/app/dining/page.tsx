import { Metadata } from 'next';
import DiningClient from './DiningClient';

export const metadata: Metadata = {
    title: "Dining | Ticpin",
    description: "Discover the best dining experiences, from premium restaurants to cozy cafes on Ticpin.",
};

interface RealDining {
    id: string;
    name: string;
    city?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    rating?: number;
    description?: string;
    category?: string;
    amenities?: string[];
    serves_alcohol?: boolean;
    discount?: number;
    status?: string;
}

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

async function getDiningData() {
    try {
        const [venuesRes, offersRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dining`, { cache: 'no-store' }),
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offers/dining`, { cache: 'no-store' })
        ]);

        const venuesData = await venuesRes.json();
        const offersData = await offersRes.json();

        return {
            venues: (Array.isArray(venuesData) ? venuesData : (venuesData?.data || [])).filter((v: RealDining) => v.status === 'approved'),
            offers: Array.isArray(offersData) ? offersData : []
        };
    } catch (error) {
        console.error("Failed to fetch dining data:", error);
        return { venues: [], offers: [] };
    }
}

export default async function DiningPage() {
    const { venues, offers } = await getDiningData();
    return <DiningClient initialVenues={venues} initialOffers={offers} />;
}