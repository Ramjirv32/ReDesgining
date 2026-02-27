export interface ExploreEvent {
  id: number;
  name: string;
  image: string;
}

export interface Artist {
  id: number;
  name: string;
  image: string;
}

export interface Event {
  id: number;
  name: string;
  location: string;
  date: string;
  time: string;
  ticketPrice: string;
  image: string;
}

export const exploreEvents: ExploreEvent[] = [
  {
    id: 1,
    name: "Music",
    image: "/events/eventsmusic.png",
  },
  {
    id: 2,
    name: "Comedy",
    image: "/events/eventcomdey.png",
  },
  {
    id: 3,
    name: "Performance",
    image: "/events/eventperfomance.png",
  },
  {
    id: 4,
    name: "Sports",
    image: "/events/eventssports.png",
  },
];

export const artists: Artist[] = [
  {
    id: 1,
    name: "DJ Aurora",
    image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 2,
    name: "The Waves",
    image: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 3,
    name: "Luna Smith",
    image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 4,
    name: "Echo Band",
    image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 5,
    name: "Sarah Jazz",
    image: "https://images.pexels.com/photos/1181346/pexels-photo-1181346.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 6,
    name: "Max Powers",
    image: "https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

export const events: Event[] = [
  {
    id: 1,
    name: "Sunset Jazz & Wine Festival",
    location: "The Grand Hotel Downtown",
    date: "March 15, 2024",
    time: "7:00 PM",
    ticketPrice: "$45",
    image: "./f.jpeg",
  },
  {
    id: 2,
    name: "Electric Dreams Night",
    location: "Metro Arena",
    date: "March 18, 2024",
    time: "9:00 PM",
    ticketPrice: "$60",
    image: "./f.jpeg",
  },
  {
    id: 3,
    name: "Acoustic Sessions",
    location: "The Blue Lounge",
    date: "March 20, 2024",
    time: "6:30 PM",
    ticketPrice: "$35",
    image: "./f.jpeg",
  },
  {
    id: 4,
    name: "Rock Legends Tribute",
    location: "Starlight Theater",
    date: "March 22, 2024",
    time: "8:00 PM",
    ticketPrice: "$55",
    image: "./f.jpeg",
  },
  {
    id: 5,
    name: "Latin Rhythms Festival",
    location: "Riverside Park",
    date: "March 25, 2024",
    time: "5:00 PM",
    ticketPrice: "$40",
    image: "./f.jpeg",
  },
  {
    id: 6,
    name: "Hip Hop Block Party",
    location: "Urban Square",
    date: "March 28, 2024",
    time: "7:30 PM",
    ticketPrice: "$50",
    image: "./f.jpeg",
  },
];