export interface Venue {
  id: number
  name: string
  location: string
  image: string
  category: string
}

export const venues: Venue[] = [
  {
    id: 1,
    name: 'Central Sports Complex',
    location: 'Downtown',
    image: 'https://images.unsplash.com/photo-1541534741688-6078c64b52d2?w=400&h=250&fit=crop',
    category: 'Play venues',
  },
  {
    id: 2,
    name: 'Green Field Arena',
    location: 'North District',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop',
    category: 'Play venues',
  },
  {
    id: 3,
    name: 'Elite Sports Hub',
    location: 'West End',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=250&fit=crop',
    category: 'Play venues',
  },
  {
    id: 4,
    name: 'Riverside Tennis Club',
    location: 'South Park',
    image: 'https://images.unsplash.com/photo-1595435064215-62d293f06424?w=400&h=250&fit=crop',
    category: 'Play venues',
  },
  {
    id: 5,
    name: 'Urban Sports Center',
    location: 'Midtown',
    image: 'https://images.unsplash.com/photo-1526232761682-d71e07fb5042?w=400&h=250&fit=crop',
    category: 'Play venues',
  },
  {
    id: 6,
    name: 'Premium Cricket Ground',
    location: 'East Village',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=250&fit=crop',
    category: 'Play venues',
  },
  {
    id: 7,
    name: 'Community Sports Field',
    location: 'Suburb',
    image: 'https://images.unsplash.com/photo-1459865264687-595d6540cbd4?w=400&h=250&fit=crop',
    category: 'Play venues',
  },
  {
    id: 8,
    name: 'Professional Arena',
    location: 'City Center',
    image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=400&h=250&fit=crop',
    category: 'Play venues',
  },
]
