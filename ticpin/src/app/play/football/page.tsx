import CategoryClient from '../CategoryClient';

async function getFootballVenues() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/play?category=FOOTBALL`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        return list.filter((v: any) => v.status === 'approved');
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
