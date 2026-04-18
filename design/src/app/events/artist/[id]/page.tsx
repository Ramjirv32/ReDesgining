'use client';

import { useParams } from 'next/navigation';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import EventCard from '@/components/events/EventCard';
import { artists, events } from '@/data/mockData';

export default function ArtistDetailPage() {
    const { id } = useParams();
    const artistId = Number(id);
    const artist = artists.find((a) => a.id === artistId) || artists[0];

    // Mocking events for this specific artist
    const artistEvents = Array(8).fill(events[0]);

    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            <main className="mx-auto max-w-[1440px] px-4 md:px-10 lg:px-16 py-8 md:py-16 space-y-12 md:space-y-20">

                {/* Artist Profile Header */}
                <section className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16">
                    <div className="w-[280px] h-[280px] md:w-[400px] md:h-[400px] rounded-[30px] overflow-hidden flex-shrink-0">
                        <img
                            src={artist.image}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <h1 className="text-4xl md:text-6xl font-bold text-black">
                            {artist.name}
                        </h1>
                        <div className="space-y-4">
                            {/* Mock bio content as per the reference image */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-zinc-500 text-sm md:text-base font-medium uppercase tracking-tight">
                                {Array(12).fill("ARTIST CONTENT").map((text, i) => (
                                    <span key={i}>{text}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* All Events Section */}
                <section className="space-y-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-black uppercase">
                        ALL EVENTS
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {artistEvents.map((event, i) => (
                            <EventCard
                                key={i}
                                id={event.id.toString()}
                                name={event.name}
                                location={event.location}
                                date={event.date}
                                time={event.time}
                                ticketPrice={event.ticketPrice}
                                image={event.image}
                            />
                        ))}
                    </div>
                </section>

            </main>

            <BottomBanner />
            <Footer />
        </div>
    );
}
