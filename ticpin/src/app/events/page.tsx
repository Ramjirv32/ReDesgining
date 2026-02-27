'use client';

import { useState, useEffect } from 'react';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import ExploreCard from '@/components/events/ExploreCard';
import ArtistAvatar from '@/components/events/ArtistAvatar';
import FilterButton from '@/components/events/FilterButton';
import EventCard from '@/components/events/EventCard';
import FilterModal from '@/components/modals/FilterModal';

interface EventArtist {
    name: string;
    image_url?: string;
}

interface RealEvent {
    id: string;
    name: string;
    city?: string;
    date?: string;
    time?: string;
    price_starts_from?: number;
    portrait_image_url?: string;
    landscape_image_url?: string;
    category?: string;
    venue_type?: string;
    artists?: EventArtist[];
    status?: string;
}

interface ArtistEntry { name: string; image: string; }

export default function EventsPage() {
    const [activeFilter, setActiveFilter] = useState('All');
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [events, setEvents] = useState<RealEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [modalFilters, setModalFilters] = useState<Record<string, string[]>>({});

    useEffect(() => {
        fetch('/backend/api/events', { credentials: 'include' })
            .then(r => r.json())
            .then((data: RealEvent[]) => {
                setEvents(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        setShowLeftArrow(container.scrollLeft > 20);
    };

    // Extract unique artists from all events
    const artistsMap = new Map<string, ArtistEntry>();
    events.forEach(ev => {
        (ev.artists ?? []).forEach(a => {
            if (a.name && !artistsMap.has(a.name)) {
                artistsMap.set(a.name, { name: a.name, image: a.image_url ?? '' });
            }
        });
    });
    const allArtists = Array.from(artistsMap.values());

    // Collect unique category filters from events
    const categoryFilters = ['Filters', 'All', ...Array.from(new Set(events.map(e => e.category).filter(Boolean) as string[]))];

    const selectedEventCategories = modalFilters.event_category ?? [];
    const selectedVenueTypes = modalFilters.venue_type ?? [];
    const selectedSort = (modalFilters.sort ?? [])[0] ?? '';

    let filteredEvents = (activeFilter === 'All'
        ? events
        : events.filter(e => e.category === activeFilter)
    ).filter(e => {
        if (selectedEventCategories.length > 0) {
            if (!selectedEventCategories.some(c => e.category?.toLowerCase().includes(c.toLowerCase()))) return false;
        }
        if (selectedVenueTypes.length > 0) {
            if (!selectedVenueTypes.some(v => e.venue_type?.toLowerCase().includes(v.toLowerCase()))) return false;
        }
        return true;
    });

    // Sort
    if (selectedSort === 'Rating : High to Low') {
        filteredEvents = [...filteredEvents].sort((a, b) => {
            const aAny = a as unknown as Record<string, number>;
            const bAny = b as unknown as Record<string, number>;
            return (bAny.rating ?? 0) - (aAny.rating ?? 0);
        });
    } else if (selectedSort === 'Price : Low to High') {
        filteredEvents = [...filteredEvents].sort((a, b) => (a.price_starts_from ?? 0) - (b.price_starts_from ?? 0));
    } else if (selectedSort === 'Price : High to Low') {
        filteredEvents = [...filteredEvents].sort((a, b) => (b.price_starts_from ?? 0) - (a.price_starts_from ?? 0));
    }

    const formatDate = (iso?: string) => {
        if (!iso) return '';
        return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-pink-50">
            <main className="mx-auto max-w-[1440px] px-4 md:px-10 lg:px-16 py-8 md:py-12 space-y-12 md:space-y-20">
                <section>
                    <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold mb-6 md:mb-8 uppercase text-black tracking-normal text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>Explore Events</h2>
                    <ExploreCard />
                </section>

                {/* Artists Section — only shown if any event has artists */}
                {allArtists.length > 0 && (
                    <section>
                        <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold mb-6 md:mb-8 uppercase text-black tracking-normal text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>Artists</h2>
                        <div className="relative group">
                            <div
                                id="artists-container"
                                onScroll={handleScroll}
                                className="flex gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12 overflow-x-auto py-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
                            >
                                {allArtists.map((artist, i) => (
                                    <ArtistAvatar
                                        key={i}
                                        name={artist.name}
                                        image={artist.image}
                                    />
                                ))}
                            </div>

                            {showLeftArrow && (
                                <button
                                    onClick={() => {
                                        const container = document.getElementById('artists-container');
                                        if (container) container.scrollBy({ left: -400, behavior: 'smooth' });
                                    }}
                                    className="absolute -left-6 top-1/2 -translate-y-1/2 bg-white rounded-full w-12 h-12 items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200 hidden md:flex z-20 animate-in fade-in zoom-in duration-200"
                                    aria-label="Previous artists"
                                >
                                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    const container = document.getElementById('artists-container');
                                    if (container) container.scrollBy({ left: 400, behavior: 'smooth' });
                                }}
                                className="absolute -right-6 top-1/2 -translate-y-1/2 bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200 hidden md:flex z-20"
                                aria-label="Next artists"
                            >
                                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </section>
                )}

                <section>
                    <div className="mb-6">
                        <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold mb-6 md:mb-8 uppercase text-black tracking-normal text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>All events</h2>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {categoryFilters.map((filter) => (
                                <FilterButton
                                    key={filter}
                                    label={filter}
                                    active={activeFilter === filter}
                                    onClick={() => {
                                        if (filter === 'Filters') {
                                            setIsFilterModalOpen(true);
                                        } else {
                                            setActiveFilter(filter);
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-20 text-zinc-400 text-lg">No events found</div>
                    ) : (
                        <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                            {filteredEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    id={event.id}
                                    name={event.name}
                                    location={event.city ?? ''}
                                    date={formatDate(event.date)}
                                    time={event.time ?? ''}
                                    ticketPrice={typeof event.price_starts_from === 'number' ? `₹${event.price_starts_from}` : '—'}
                                    image={event.portrait_image_url || event.landscape_image_url || '/events/events-1/ticpinbanner.jpg'}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>
            <BottomBanner />
            <Footer />
            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                type="events"
                onApply={setModalFilters}
            />
        </div>
    );
}

