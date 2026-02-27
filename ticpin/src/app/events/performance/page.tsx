'use client';

import { useState, useEffect } from 'react';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import FilterButton from '@/components/events/FilterButton';
import EventCard from '@/components/events/EventCard';

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
}

export default function PerformancePage() {
    const [activeFilter, setActiveFilter] = useState('Today');
    const [events, setEvents] = useState<RealEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/backend/api/events?category=Performance', { credentials: 'include' })
            .then(r => r.json())
            .then((data: RealEvent[]) => {
                setEvents(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const formatDate = (iso?: string) => {
        if (!iso) return '';
        return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            <main className="space-y-12 md:space-y-20">

                {/* Hero Banner Section */}
                <section className="relative w-full h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden"
                    style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #D8B4FE 100%)' }}>
                    <div className="flex items-center gap-8 md:gap-12 px-4">
                        <div className="relative">
                            <img
                                src="/events/eventperfomance.png"
                                alt="Performance"
                                className="w-[180px] md:w-[280px] h-auto object-contain drop-shadow-xl"
                            />
                        </div>
                        <div className="h-[60px] md:h-[100px] w-[2px] bg-black/20" />
                        <h1 className="text-4xl md:text-7xl font-semibold text-black uppercase">
                            PERFORMANCE
                        </h1>
                    </div>
                </section>

                <div className="mx-auto max-w-[1440px] px-4 md:px-10 lg:px-16 space-y-12 md:space-y-16 pb-12 md:pb-20">
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

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-20 text-zinc-400 text-lg">No events found in Performance</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto">
                            {events.map((event) => (
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
                </div>
            </main>

            <BottomBanner />
            <Footer />
        </div>
    );
}
