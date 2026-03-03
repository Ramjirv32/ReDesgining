import EventCategoryClient from '../EventCategoryClient';

async function getComedyEvents() {
    try {
        const res = await fetch('http://localhost:9000/api/events?category=Comedy', {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (Array.isArray(data) ? data : []).filter((e: any) => e.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch comedy events:", error);
        return [];
    }
}

export default async function ComedyPage() {
    const events = await getComedyEvents();
    return (
        <EventCategoryClient
            events={events}
            categoryName="Comedy"
            categoryImage="/events/eventscomedy.png"
            gradient="linear-gradient(180deg, #FFFFFF 0%, #FECACA 100%)"
        />
    );
}
