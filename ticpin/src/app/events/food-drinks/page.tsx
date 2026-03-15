import EventCategoryClient from '../EventCategoryClient';

async function getFoodDrinksEvents() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events?category=Food%20%26%20Drinks`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        const events = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        return events.filter((e: any) => e.status === 'approved');
    } catch (error) {
        console.error("Failed to fetch food & drinks events:", error);
        return [];
    }
}

export default async function FoodDrinksPage() {
    const events = await getFoodDrinksEvents();
    return (
        <EventCategoryClient
            events={events}
            categoryName="Food & Drinks"
            categoryImage="/events/Dining 1.svg"
            gradient="linear-gradient(180deg, #FFFFFF 0%, #8290D5 100%)"
        />
    );
}
