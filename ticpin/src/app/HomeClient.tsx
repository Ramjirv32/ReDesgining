'use client';

import { useState, useMemo } from 'react';
import SportCategoryCard from '@/components/play/SportCategoryCard';
import VenueCard from '@/components/play/VenueCard';
import FilterBar from '@/components/play/FilterBar';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { sportsCategories, venueFilters } from '@/data/constants';

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

export default function HomeClient({ initialVenues }: { initialVenues: RealPlay[] }) {
    const [activeFilter, setActiveFilter] = useState('All');

    const filteredVenues = useMemo(() => {
        return initialVenues.filter(v => {
            if (activeFilter === 'All') return true;
            if (activeFilter === 'Top Rated') return (v.rating || 0) >= 4;
            return v.category?.toLowerCase() === activeFilter.toLowerCase();
        });
    }, [initialVenues, activeFilter]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFFCED] via-white to-white font-[family-name:var(--font-anek-latin)]">
            <main className="mx-auto max-w-[1440px] px-4 md:px-10 lg:px-16 py-8 md:py-12 space-y-12 md:space-y-20">

                {/* Explore Sports Section */}
                <section className="space-y-8 md:space-y-10">
                    <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold mb-6 md:mb-8 uppercase text-black tracking-normal text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>Explore Sports</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 px-2 max-w-5xl">
                        {sportsCategories.map((sport, i) => (
                            <SportCategoryCard
                                key={i}
                                name={sport.name}
                                image={sport.image}
                                href={sport.href}
                                priority={i < 2}
                            />
                        ))}
                    </div>
                </section>

                {/* All Sports Venues Section */}
                <section className="space-y-8 md:space-y-10">
                    <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold mb-6 md:mb-8 uppercase text-black tracking-normal text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>All Sports Venues</h2>

                    {/* Filters */}
                    <div>
                        <FilterBar
                            filters={['All', ...venueFilters]}
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                        />
                    </div>

                    {/* Venues Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl">
                        {filteredVenues.length === 0 ? (
                            <div className="col-span-full text-center py-20 text-zinc-400">No venues found in this category</div>
                        ) : (
                            filteredVenues.map((venue) => (
                                <Link key={venue.id} href={`/play/${encodeURIComponent(venue.name)}`}>
                                    <VenueCard
                                        name={venue.name}
                                        location={venue.city ?? 'Location'}
                                        image={venue.portrait_image_url || venue.landscape_image_url || '/play/m.png'}
                                        priceStartsFrom={venue.price_starts_from}
                                    />
                                </Link>
                            ))
                        )}
                    </div>
                </section>

            </main>
            <BottomBanner />
            <Footer />
        </div>
    );
}
