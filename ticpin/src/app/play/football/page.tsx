import CategoryClient from '../CategoryClient';

async function getFootballVenues() {
    try {
        const res = await fetch('http://localhost:9000/api/play?category=FOOTBALL', {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (Array.isArray(data) ? data : []).filter((v: any) => v.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch football venues:", error);
        return [];
    }
}

export default async function FootballPage() {
    const venues = await getFootballVenues();
    return (
        <CategoryClient
            venues={venues}
            categoryName="Football"
            categoryImage="/play/playfb.png"
        />
    );
}
