'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SportCategoryCard from '@/components/play/SportCategoryCard';
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

const sportsCategories = [
    { name: 'CRICKET', image: '/play/playck.png', href: '/play/cricket' },
    { name: 'FOOTBALL', image: '/play/playfb.png', href: '/play/football' },
    { name: 'PICKLEBALL', image: '/play/playpb.png', href: '/play/pickleball' },
    { name: 'TENNIS', image: '/play/playtens.png', href: '/play/tennis' },
    { name: 'BADMINTON', image: '/play/playbm.png', href: '/play/badminton' },
    { name: 'TABLE TENNIS', image: '/play/playtt.png', href: '/play/table-tennis' },
    { name: 'BASKETBALL', image: '/play/playbb.png', href: '/play/basketball' },
];

const filters = ['All', 'Top Rated', 'Cricket', 'Pickleball', 'Badminton', 'Football', 'Tennis', 'Basketball', 'Table Tennis'];

export default function PlayPage() {
    const [venues, setVenues] = useState<RealPlay[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [modalFilters, setModalFilters] = useState<Record<string, string[]>>({});

    useEffect(() => {
        fetch('/backend/api/play', { credentials: 'include' })
            .then(r => r.json())
            .then((data: RealPlay[]) => {
                setVenues(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const selectedSports = modalFilters.sports ?? [];
    const selectedDimensions = modalFilters.dimension ?? [];
    const selectedSort = (modalFilters.sort ?? [])[0] ?? '';

    let filteredVenues = venues.filter(v => {
        // Chip filter
        if (activeFilter !== 'All') {
            if (activeFilter === 'Top Rated') {
                if ((v.rating || 0) < 4) return false;
            } else {
                if (v.category?.toLowerCase() !== activeFilter.toLowerCase()) return false;
            }
        }
        // Modal → Sports multi-select
        if (selectedSports.length > 0) {
            if (!selectedSports.some(s => v.category?.toLowerCase() === s.toLowerCase())) return false;
        }
        // Modal → Dimension multi-select
        if (selectedDimensions.length > 0) {
            const vAny = v as unknown as Record<string, unknown>;
            if (!selectedDimensions.some(d => (vAny.dimension as string)?.toLowerCase() === d.toLowerCase())) return false;
        }
        return true;
    });

    // Sort
    if (selectedSort === 'Rating : High to Low') {
        filteredVenues = [...filteredVenues].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (selectedSort === 'Price : Low to High') {
        filteredVenues = [...filteredVenues].sort((a, b) => {
            const aAny = a as unknown as Record<string, number>;
            const bAny = b as unknown as Record<string, number>;
            return (aAny.price ?? 0) - (bAny.price ?? 0);
        });
    } else if (selectedSort === 'Price : High to Low') {
        filteredVenues = [...filteredVenues].sort((a, b) => {
            const aAny = a as unknown as Record<string, number>;
            const bAny = b as unknown as Record<string, number>;
            return (bAny.price ?? 0) - (aAny.price ?? 0);
        });
    }

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
                            filters={filters}
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                            type="play"
                            onApply={setModalFilters}
                        />
                    </div>

                    {/* Venues Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredVenues.length === 0 ? (
                        <div className="text-center py-20 text-zinc-400 text-lg">No sports venues found for "{activeFilter}"</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl">
                            {filteredVenues.map((venue) => (
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
                </section>

            </main>
            <BottomBanner />
            <Footer />
        </div>
    );
}
