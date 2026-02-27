export const CATEGORY_DATA: Record<string, string[]> = {
    "Fine Dining": ["Indian", "Chinese", "Continental", "Italian", "Japanese", "French"],
    "Casual Dining": ["Multi-cuisine", "North Indian", "South Indian", "Coastal", "Oriental"],
    "Cafe": ["Coffee Shop", "Bakery", "Bistro", "Tea House"],
    "Bar & Pub": ["Gastropub", "Sports Bar", "Brewery", "Resto-bar"],
    "Fast Food": ["Burgers & Sandwiches", "Pizza", "Tacos & Burritos", "Fried Chicken"],
    "Buffet": ["Luxury Buffet", "Family Buffet", "Global Buffet"],
    "Lounge": ["Chill-out Lounge", "Hookah Lounge", "Sky Lounge"],
    "Rooftop": ["Rooftop Bar", "Rooftop Restaurant"],
    "Desserts": ["Ice-cream Parlour", "Patisserie", "Chocolatier"]
};

export const CATEGORIES = Object.keys(CATEGORY_DATA);

export const CITIES = [
    "Chennai",
    "Bangalore",
    "Mumbai",
    "Delhi",
    "Hyderabad",
    "Kochi",
    "Goa"
];
