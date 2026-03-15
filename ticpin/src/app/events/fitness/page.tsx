import EventCategoryClient from '../EventCategoryClient';

async function getFitnessEvents() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events?category=Fitness`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        const events = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        return events.filter((e: any) => e.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch fitness events:", error);
        return [];
    }
}

export default async function FitnessPage() {
    const events = await getFitnessEvents();
    return (
        <EventCategoryClient
            events={events}
            categoryName="Fitness"
            categoryImage="/events/Dumbells Icon 1.svg"
            gradient="linear-gradient(180deg, #FFFFFF 0%, #98C5FF 100%)"
        />
    );
}
