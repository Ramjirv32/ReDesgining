'use client';

import EventCard from '@/components/dining/Eventcard';
import CouponCard from '@/components/dining/CouponCard';
import Link from 'next/link';
import Image from 'next/image';
import AppBanner from '@/components/layout/AppBanner';
import { useState, useEffect } from 'react';
import FilterButton from '@/components/dining/FilterButton';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import FilterModal from '@/components/modals/FilterModal';
import { adminApi, OfferRecord } from '@/lib/api/admin';

interface RealDining {
    id: string;
    name: string;
    city?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    rating?: number;
    description?: string;
    category?: string;
    amenities?: string[];
    serves_alcohol?: boolean;
    discount?: number;
}

// Fallback offers removed, using state instead

export default function DiningPage() {
    const [activeFilter, setActiveFilter] = useState('All');
    const [venues, setVenues] = useState<RealDining[]>([]);
    const [offers, setOffers] = useState<OfferRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [modalFilters, setModalFilters] = useState<Record<string, string[]>>({});

    useEffect(() => {
        // Fetch restaurants
        fetch('/backend/api/dining', { credentials: 'include' })
            .then(r => r.json())
            .then((data: RealDining[]) => {
                setVenues(Array.isArray(data) ? data : []);
            })
            .catch(() => { });

        // Fetch exclusive dining offers
        adminApi.getOffersByCategory('dining')
            .then(data => setOffers(data))
            .catch(() => { });

        setLoading(false);
    }, []);

    const selectedCategories = modalFilters.dining_category ?? [];
    const selectedAmenities = modalFilters.amenities ?? [];
    const selectedSort = (modalFilters.sort ?? [])[0] ?? '';

    let filteredVenues = venues.filter(v => {
        // Chip filter
        if (activeFilter === 'Top rated') {
            if ((v.rating ?? 0) < 4) return false;
        } else if (activeFilter === 'Pure Veg') {
            const text = `${v.name} ${v.description ?? ''} ${v.category ?? ''}`.toLowerCase();
            if (!text.includes('veg')) return false;
        } else if (activeFilter === 'Serves Alcohol') {
            if (!v.serves_alcohol) {
                const text = `${v.name} ${v.description ?? ''} ${v.category ?? ''}`.toLowerCase();
                if (!text.includes('alcohol') && !text.includes('bar') && !text.includes('beer') && !text.includes('wine')) return false;
            }
        } else if (activeFilter === '50% OFF') {
            if ((v.discount ?? 0) < 50) return false;
        }
        // Modal → Category multi-select
        if (selectedCategories.length > 0) {
            if (!selectedCategories.some(c => v.category?.toLowerCase().includes(c.toLowerCase()))) return false;
        }
        // Modal → Amenities multi-select
        if (selectedAmenities.length > 0) {
            if (!selectedAmenities.some(a => v.amenities?.some(va => va.toLowerCase().includes(a.toLowerCase())))) return false;
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
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-pink-50">

            <main className="mx-auto max-w-[1440px] px-4 md:px-10 lg:px-16 py-8 md:py-12 space-y-12 md:space-y-20">
                <section>
                    <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold mb-6 md:mb-8 uppercase text-black tracking-normal text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>Explore Dining</h2>
                    <div className="flex flex-wrap gap-4 md:gap-6 pb-4">
                        {/* Premium Dining */}
                        <Link href="/dining/premium-dining" className="block flex-shrink-0 cursor-pointer">
                            <div
                                className="rounded-[30px] border border-transparent flex flex-col group overflow-hidden relative"
                                style={{
                                    background: 'linear-gradient(105.73deg, #866BFF -160.73%, #BDB1F3 93.19%) padding-box, linear-gradient(135deg, #686868 0%, #D0D0D0 100%) border-box',
                                    width: '170px',
                                    height: '252px'
                                }}
                            >
                                <div className="px-[20px] pt-[20px] pb-1">
                                    <h3 className="text-xl md:text-2xl font-medium text-black whitespace-pre-line">
                                        Premium{"\n"}dining
                                    </h3>
                                </div>
                                <div className="flex-1 relative w-full flex items-end justify-end">
                                    <div style={{ width: '200px', height: '180px', marginRight: '-30px' }}>
                                        <Image
                                            src="/dining/diningimg1.png"
                                            alt="Premium dining"
                                            fill
                                            className="object-contain"
                                            style={{
                                                objectPosition: "bottom right",
                                                marginBottom: '-15px'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Club & Chill */}
                        <div
                            className="flex-shrink-0 rounded-[30px] border border-transparent flex flex-col group cursor-pointer overflow-hidden relative"
                            style={{
                                background: 'linear-gradient(105.73deg, #866BFF -160.73%, #BDB1F3 93.19%) padding-box, linear-gradient(135deg, #686868 0%, #D0D0D0 100%) border-box',
                                width: '170px',
                                height: '252px'
                            }}
                        >
                            <div className="px-[20px] pt-[20px] pb-1">
                                <h3 className="text-xl md:text-2xl font-medium text-black whitespace-pre-line">
                                    Club &{"\n"}Chill
                                </h3>
                            </div>
                            <div className="flex-1 relative w-full flex items-end justify-end">
                                <div className="relative" style={{ width: '180px', height: '180px', marginRight: '-25px' }}>
                                    <Image
                                        src="/dining/diningimg2.png"
                                        alt="Club & Chill"
                                        fill
                                        className="object-contain"
                                        style={{
                                            objectPosition: "bottom right",
                                            marginBottom: '-15px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pure Veg */}
                        <div
                            className="flex-shrink-0 rounded-[30px] border border-transparent flex flex-col group cursor-pointer overflow-hidden relative"
                            style={{
                                background: 'linear-gradient(105.73deg, #866BFF -160.73%, #BDB1F3 93.19%) padding-box, linear-gradient(135deg, #686868 0%, #D0D0D0 100%) border-box',
                                width: '170px',
                                height: '252px'
                            }}
                        >
                            <div className="px-[20px] pt-[20px] pb-1">
                                <h3 className="text-xl md:text-2xl font-medium text-black whitespace-pre-line">
                                    Pure{"\n"}veg
                                </h3>
                            </div>
                            <div className="flex-1 relative w-full flex items-end justify-end">
                                <div className="relative" style={{ width: '180px', height: '180px', marginRight: '-25px' }}>
                                    <Image
                                        src="/dining/diningimg3.png"
                                        alt="Pure veg"
                                        fill
                                        className="object-contain"
                                        style={{
                                            objectPosition: "bottom right",
                                            marginBottom: '-15px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cafe Vibes */}
                        <div
                            className="flex-shrink-0 rounded-[30px] border border-transparent flex flex-col group cursor-pointer overflow-hidden relative"
                            style={{
                                background: 'linear-gradient(105.73deg, #866BFF -160.73%, #BDB1F3 93.19%) padding-box, linear-gradient(135deg, #686868 0%, #D0D0D0 100%) border-box',
                                width: '170px',
                                height: '252px'
                            }}
                        >
                            <div className="px-[20px] pt-[20px] pb-1">
                                <h3 className="text-xl md:text-2xl font-medium text-black whitespace-pre-line">
                                    Cafe{"\n"}vibes
                                </h3>
                            </div>
                            <div className="flex-1 relative w-full flex items-end justify-end">
                                <div className="relative" style={{ width: '180px', height: '180px', marginRight: '-25px' }}>
                                    <Image
                                        src="/dining/diningimg4.png"
                                        alt="Cafe vibes"
                                        fill
                                        className="object-contain"
                                        style={{
                                            objectPosition: "bottom right",
                                            marginBottom: '-15px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Family Favourites */}
                        <div
                            className="flex-shrink-0 rounded-[30px] border border-transparent flex flex-col group cursor-pointer overflow-hidden relative"
                            style={{
                                background: 'linear-gradient(105.73deg, #866BFF -160.73%, #BDB1F3 93.19%) padding-box, linear-gradient(135deg, #686868 0%, #D0D0D0 100%) border-box',
                                width: '170px',
                                height: '252px'
                            }}
                        >
                            <div className="px-[20px] pt-[20px] pb-1">
                                <h3 className="text-xl md:text-2xl font-medium text-black whitespace-pre-line">
                                    Family{"\n"}favourites
                                </h3>
                            </div>
                            <div className="flex-1 relative w-full flex items-end justify-end">
                                <div className="relative" style={{ width: '180px', height: '180px', marginRight: '-25px' }}>
                                    <Image
                                        src="/dining/diningimg5.png"
                                        alt="Family favourites"
                                        fill
                                        className="object-contain"
                                        style={{
                                            objectPosition: "bottom right",
                                            marginBottom: '-15px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bar & Bites */}
                        <div
                            className="flex-shrink-0 rounded-[30px] border border-transparent flex flex-col group cursor-pointer overflow-hidden relative"
                            style={{
                                background: 'linear-gradient(105.73deg, #866BFF -160.73%, #BDB1F3 93.19%) padding-box, linear-gradient(135deg, #686868 0%, #D0D0D0 100%) border-box',
                                width: '170px',
                                height: '252px'
                            }}
                        >
                            <div className="px-[20px] pt-[20px] pb-1">
                                <h3 className="text-xl md:text-2xl font-medium text-black whitespace-pre-line">
                                    Bar &{"\n"}bites
                                </h3>
                            </div>
                            <div className="flex-1 relative w-full flex items-end justify-end">
                                <div className="relative" style={{ width: '180px', height: '180px', marginRight: '-25px' }}>
                                    <Image
                                        src="/dining/diningimg6.png"
                                        alt="Bar & bites"
                                        fill
                                        className="object-contain"
                                        style={{
                                            objectPosition: "bottom right",
                                            marginBottom: '-15px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {offers.length > 0 && (
                    <section>
                        <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold tracking-normal mb-6 md:mb-8 uppercase text-black text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>Exclusive Offers</h2>
                        <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4">
                            {offers.map((offer) => {
                                // Find where to navigate (take first entity if available)
                                const targetId = offer.entity_ids?.[0];
                                const href = targetId ? `/dining/venue/${targetId}` : '#';

                                return (
                                    <Link key={offer.id} href={href} className="flex-shrink-0 group block overflow-hidden rounded-[8px]">
                                        <div className="relative w-[340px] h-[155.4px] rounded-[8px] overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
                                            {offer.image ? (
                                                <>
                                                    <img
                                                        src={offer.image}
                                                        alt={offer.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute top-3 left-3 bg-[#AC9BF7] text-white px-3 py-1 rounded-[4px] text-[12px] font-bold uppercase">
                                                        {offer.discount_type === 'flat' ? `₹${offer.discount_value} OFF` : `${offer.discount_value}% OFF`}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-[#AC9BF7] flex items-center justify-center">
                                                    <span className="text-white font-bold text-xl">{offer.title}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="space-y-6 md:space-y-8">
                    <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold tracking-normal uppercase text-black text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>All Restaurants</h2>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['Filters', 'All', 'Top rated', 'Pure Veg', 'Serves Alcohol', '50% OFF'].map((filter) => (
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
                    {/* Restaurants Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredVenues.length === 0 ? (
                        <div className="text-center py-20 text-zinc-400 text-lg">No restaurants available</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {filteredVenues.map((res) => (
                                <Link key={res.id} href={`/dining/venue/${res.id}`}>
                                    <EventCard
                                        variant="wide"
                                        title={res.name}
                                        location={res.city ?? ''}
                                        date="Rating"
                                        tag="Live Now"
                                        image={res.portrait_image_url || res.landscape_image_url || '/dining/venue-placeholder.jpg'}
                                        rating={res.rating ?? 4.0}
                                    />
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* <div className="mt-20">
                    <AppBanner />
                </div> */}

            </main>
            <BottomBanner />
            <Footer />
            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                type="dining"
                onApply={setModalFilters}
            />
        </div>
    );
}