'use client';

import { useState } from 'react';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import AppBanner from '@/components/layout/AppBanner';
import ExploreCard from '@/components/events/ExploreCard';
import ArtistAvatar from '@/components/events/ArtistAvatar';
import FilterButton from '@/components/events/FilterButton';
import EventCard from '@/components/events/EventCard';
import { artists, events } from '@/data/mockData';



import MobileEvents from '@/components/MobileEvents';

export default function EventsPage() {
    const [activeFilter, setActiveFilter] = useState('Today');
    const [showLeftArrow, setShowLeftArrow] = useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        setShowLeftArrow(container.scrollLeft > 20);
    };

    return (
        <>
            {/* Desktop View */}
            <div className="hidden md:block min-h-screen bg-white">
                <main className="mx-auto max-w-[1440px] px-4 md:px-10 lg:px-16 py-8 md:py-12 space-y-12 md:space-y-20">
                    <section>
                        <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold mb-6 md:mb-8 uppercase text-black tracking-normal text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>Explore Events</h2>
                        <ExploreCard />
                    </section>

                    <section>
                        <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold mb-6 md:mb-8 uppercase text-black tracking-normal text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>Artists</h2>
                        <div className="relative group">
                            <div
                                id="artists-container"
                                onScroll={handleScroll}
                                className="flex gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12 overflow-x-auto py-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
                            >
                                {artists.map((artist) => (
                                    <ArtistAvatar
                                        key={artist.id}
                                        id={artist.id}
                                        name={artist.name}
                                        image={artist.image}
                                    />
                                ))}
                            </div>

                            {showLeftArrow && (
                                <button
                                    onClick={() => {
                                        const container = document.getElementById('artists-container');
                                        if (container) {
                                            container.scrollBy({ left: -400, behavior: 'smooth' });
                                        }
                                    }}
                                    className="absolute -left-6 top-1/2 -translate-y-1/2 bg-white rounded-full w-12 h-12 items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200 hidden md:flex z-20 animate-in fade-in zoom-in duration-200"
                                    aria-label="Previous artists"
                                >
                                    <svg
                                        className="w-6 h-6 text-gray-700"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}
                            {/* Next Button */}
                            <button
                                onClick={() => {
                                    const container = document.getElementById('artists-container');
                                    if (container) {
                                        container.scrollBy({ left: 400, behavior: 'smooth' });
                                    }
                                }}
                                className="absolute -right-6 top-1/2 -translate-y-1/2 bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200 hidden md:flex z-20"
                                aria-label="Next artists"
                            >
                                <svg
                                    className="w-6 h-6 text-gray-700"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </section>

                    <section>
                        <div className="mb-6">
                            <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold mb-6 md:mb-8 uppercase text-black tracking-normal text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>All events</h2>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {['Filters', 'Today', 'Tomorrow', 'Music'].map((filter) => (
                                    <FilterButton
                                        key={filter}
                                        label={filter}
                                        active={activeFilter === filter}
                                        onClick={() => setActiveFilter(filter)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                            {events.map((event) => (
                                <EventCard
                                    key={event.id}
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

            {/* Mobile View */}
            <div className="block md:hidden">
                <MobileEvents />
            </div>
        </>
    );
}
