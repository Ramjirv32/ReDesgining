import CategoryClient from '../CategoryClient';

async function getPickleballVenues() {
    try {
        const res = await fetch('http://localhost:9000/api/play?category=PICKLEBALL', {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (Array.isArray(data) ? data : []).filter((v: any) => v.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch pickleball venues:", error);
        return [];
    }
}

export default async function PickleballPage() {
    const venues = await getPickleballVenues();
    return (
        <CategoryClient
            venues={venues}
            categoryName="Pickleball"
            categoryImage="/play/playpb.png"
        />
    );
}
