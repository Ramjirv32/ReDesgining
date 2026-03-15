import EventCategoryClient from '../EventCategoryClient';

async function getScreeningsEvents() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events?category=Screenings`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        const events = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        return events.filter((e: any) => e.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch screenings events:", error);
        return [];
    }
}

export default async function ScreeningsPage() {
    const events = await getScreeningsEvents();
    return (
        <EventCategoryClient
            events={events}
            categoryName="Screenings"
            categoryImage="/events/Projector Icon 1.svg"
            gradient="linear-gradient(180deg, #FFFFFF 0%, #B4E9FF 100%)"
        />
    );
}
