'use client';

import { useState } from 'react';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import FilterButton from '@/components/events/FilterButton';
import EventCard from '@/components/events/EventCard';
import { events } from '@/data/mockData';

const musicEvents = Array(8).fill(events.find(e => e.id === 1) || events[0]);

export default function MusicPage() {
    const [activeFilter, setActiveFilter] = useState('Today');

    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            <main className="space-y-12 md:space-y-20">

                {/* Hero Banner Section */}
                <section className="relative w-full h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden"
                    style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #D8B4FE 100%)' }}>
                    <div className="flex items-center gap-8 md:gap-12 px-4">
                        <div className="relative">
                            <img
                                src="/events/eventsmusic.png"
                                alt="Music"
                                className="w-[180px] md:w-[280px] h-auto object-contain drop-shadow-xl"
                            />
                        </div>
                        <div className="h-[60px] md:h-[100px] w-[2px] bg-black/20" />
                        <h1 className="text-4xl md:text-7xl font-semibold text-black">
                            MUSIC
                        </h1>
                    </div>
                </section>

                <div className="mx-auto max-w-[1440px] px-4 md:px-10 lg:px-16 space-y-12 md:space-y-16 pb-12 md:pb-20">
                    {/* Filters Section */}
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {['Filters', 'Today', 'Tomorrow'].map((filter) => (
                            <FilterButton
                                key={filter}
                                label={filter}
                                active={activeFilter === filter}
                                onClick={() => setActiveFilter(filter)}
                            />
                        ))}
                    </div>

                    {/* Events Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto">
                        {musicEvents.map((event, i) => (
                            <EventCard
                                key={i}
                                id={event.id?.toString()}
                                name={event.name}
                                location={event.location}
                                date={event.date}
                                time={event.time}
                                ticketPrice={event.ticketPrice}
                                image={event.image}
                            />
                        ))}
                    </div>
                </div>
            </main>

            <BottomBanner />
            <Footer />
        </div>
    );
}
