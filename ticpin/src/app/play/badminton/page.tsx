import CategoryClient from '../CategoryClient';

async function getBadmintonVenues() {
    try {
        const res = await fetch('http://localhost:9000/api/play?category=BADMINTON', {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (Array.isArray(data) ? data : []).filter((v: any) => v.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch badminton venues:", error);
        return [];
    }
}

export default async function BadmintonPage() {
    const venues = await getBadmintonVenues();
    return (
        <CategoryClient
            venues={venues}
            categoryName="Badminton"
            categoryImage="/play/playbm.png"
        />
    );
}
