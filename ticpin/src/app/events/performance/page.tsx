import EventCategoryClient from '../EventCategoryClient';

async function getPerformanceEvents() {
    try {
        const res = await fetch('http://localhost:9000/api/events?category=Performance', {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (Array.isArray(data) ? data : []).filter((e: any) => e.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch performance events:", error);
        return [];
    }
}

export default async function PerformancePage() {
    const events = await getPerformanceEvents();
    return (
        <EventCategoryClient
            events={events}
            categoryName="Performance"
            categoryImage="/events/eventsperformance.png"
            gradient="linear-gradient(180deg, #FFFFFF 0%, #BBF7D0 100%)"
        />
    );
}
