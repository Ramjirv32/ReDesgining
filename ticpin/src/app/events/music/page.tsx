import EventCategoryClient from '../EventCategoryClient';

async function getMusicEvents() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events?category=Music`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        const events = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        return events.filter((e: any) => e.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch music events:", error);
        return [];
    }
}

export default async function MusicPage() {
    const events = await getMusicEvents();
    return (
        <EventCategoryClient
            events={events}
            categoryName="Music"
            categoryImage="/events/eventsmusic.png"
            gradient="linear-gradient(180deg, #FFFFFF 0%, #D8B4FE 100%)"
        />
    );
}
