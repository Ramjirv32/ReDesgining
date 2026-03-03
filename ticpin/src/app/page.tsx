import HomeClient from './HomeClient';

interface RealPlay {
  id: string;
  name: string;
  city?: string;
  portrait_image_url?: string;
  landscape_image_url?: string;
  category?: string;
  rating?: number;
  price_starts_from?: number;
}

async function getVenues(): Promise<RealPlay[]> {
  try {
    const res = await fetch('http://localhost:9000/api/play', {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).filter((v: any) => v.status === 'approved');
  } catch (error) {
    console.error("Failed to fetch play venues:", error);
    return [];
  }
}

export default async function Home() {
  const venues = await getVenues();
  return <HomeClient initialVenues={venues} />;
}
