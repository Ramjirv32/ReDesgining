import CategoryClient from '../CategoryClient';

async function getTennisVenues() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/play?category=TENNIS`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (Array.isArray(data) ? data : []).filter((v: any) => v.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch tennis venues:", error);
        return [];
    }
}

export default async function TennisPage() {
    const venues = await getTennisVenues();
    return (
        <CategoryClient
            venues={venues}
            categoryName="Tennis"
            categoryImage="/play/playtens.png"
        />
    );
}
