'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import VenueCard from '@/components/play/VenueCard';
import FilterBar from '@/components/play/FilterBar';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';

interface RealPlay {
    id: string;
    name: string;
    city?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    category?: string;
    rating?: number;
}

const filters = ['Top rated'];

export default function FootballPage() {
    const [venues, setVenues] = useState<RealPlay[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        fetch('/backend/api/play?category=FOOTBALL', { credentials: 'include' })
            .then(r => r.json())
            .then((data: RealPlay[]) => {
                setVenues(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            <main className="space-y-12 md:space-y-20">

                {/* Hero Banner Section */}
                <section className="relative w-full h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden"
                    style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #D1E9FF 100%)' }}>
                    <div className="flex items-center gap-8 md:gap-12 px-4">
                        <div className="relative">
                            <img
                                src="/play/playfb.png"
                                alt="Football"
                                className="w-[280px] md:w-[280px] h-auto object-contain drop-shadow-xl"
                            />
                        </div>
                        <div className="h-[60px] md:h-[100px] w-[2px] bg-black/20" />
                        <h1 className="text-4xl md:text-7xl font-semibold text-black uppercase">
                            Football
                        </h1>
                    </div>
                </section>

                <div className="mx-auto max-w-[1440px] px-4 md:px-10 lg:px-16 space-y-12 md:space-y-16 pb-12 md:pb-20">
                    <div className="flex items-center gap-4">
                        <FilterBar
                            filters={['All', ...filters]}
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                        />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : venues.length === 0 ? (
                        <div className="text-center py-20 text-zinc-400 text-lg">No football venues found</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto">
                            {venues
                                .filter(v => activeFilter === 'All' || (activeFilter === 'Top rated' && (v.rating || 0) >= 4))
                                .map((venue) => (
                                    <Link key={venue.id} href={`/play/${venue.id}`}>
                                        <VenueCard
                                            name={venue.name}
                                            location={venue.city ?? ''}
                                            image={venue.portrait_image_url || venue.landscape_image_url || '/play/m.png'}
                                        />
                                    </Link>
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
