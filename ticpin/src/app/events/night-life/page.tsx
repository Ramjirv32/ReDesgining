import EventCategoryClient from '../EventCategoryClient';

async function getNightLifeEvents() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events?category=Night%20Life`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        const events = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        return events.filter((e: any) => e.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch night life events:", error);
        return [];
    }
}

export default async function NightLifePage() {
    const events = await getNightLifeEvents();
    return (
        <EventCategoryClient
            events={events}
            categoryName="Night Life"
            categoryImage="/events/Night Life Icon 1.svg"
            gradient="linear-gradient(180deg, #FFFFFF 0%, #FAFDAA 100%)"
        />
    );
}
