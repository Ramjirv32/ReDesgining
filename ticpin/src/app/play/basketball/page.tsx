import CategoryClient from '../CategoryClient';

async function getBasketballVenues() {
    try {
        const res = await fetch('http://localhost:9000/api/play?category=BASKETBALL', {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (Array.isArray(data) ? data : []).filter((v: any) => v.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch basketball venues:", error);
        return [];
    }
}

export default async function BasketballPage() {
    const venues = await getBasketballVenues();
    return (
        <CategoryClient
            venues={venues}
            categoryName="Basketball"
            categoryImage="/play/playbb.png"
        />
    );
}
