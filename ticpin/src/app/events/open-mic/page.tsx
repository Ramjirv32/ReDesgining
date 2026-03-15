import EventCategoryClient from '../EventCategoryClient';

async function getOpenMicEvents() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events?category=Open%20Mic`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        const events = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        return events.filter((e: any) => e.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch open mic events:", error);
        return [];
    }
}

export default async function OpenMicPage() {
    const events = await getOpenMicEvents();
    return (
        <EventCategoryClient
            events={events}
            categoryName="Open Mic"
            categoryImage="/events/Open Mic Icon 1.svg"
            gradient="linear-gradient(180deg, #FFFFFF 0%, #FFEF96 100%)"
        />
    );
}
