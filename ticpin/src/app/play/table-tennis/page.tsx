import CategoryClient from '../CategoryClient';

async function getTTVenues() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/play?category=TABLE TENNIS`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (Array.isArray(data) ? data : []).filter((v: any) => v.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch table tennis venues:", error);
        return [];
    }
}

export default async function TableTennisPage() {
    const venues = await getTTVenues();
    return (
        <CategoryClient
            venues={venues}
            categoryName="Table Tennis"
            categoryImage="/play/playtt.png"
        />
    );
}
