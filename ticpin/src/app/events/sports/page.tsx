import EventCategoryClient from '../EventCategoryClient';

async function getSportsEvents() {
    try {
        const res = await fetch('http://localhost:9000/api/events?category=Sports', {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (Array.isArray(data) ? data : []).filter((e: any) => e.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch sports events:", error);
        return [];
    }
}

export default async function SportsPage() {
    const events = await getSportsEvents();
    return (
        <EventCategoryClient
            events={events}
            categoryName="Sports"
            categoryImage="/events/eventssports.png"
            gradient="linear-gradient(180deg, #FFFFFF 0%, #BAE6FD 100%)"
        />
    );
}
