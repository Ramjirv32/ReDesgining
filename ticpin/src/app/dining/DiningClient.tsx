'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useLocation } from '@/lib/useLocation';
import Link from 'next/link';
import Image from 'next/image';
import FilterButton from '@/components/dining/FilterButton';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
const FilterModal = dynamic(() => import('@/components/modals/FilterModal'), { ssr: false });
import EventCard from '@/components/dining/Eventcard';

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
    status?: string;
}

interface OfferRecord {
    id: string;
    title: string;
    description: string;
    image?: string;
    discount_type: 'percent' | 'flat';
    discount_value: number;
    applies_to: string;
    entity_ids?: string[];
    valid_until: string;
    is_active: boolean;
    created_at: string;
}

export default function DiningClient({
    initialVenues,
    initialOffers
}: {
    initialVenues: RealDining[],
    initialOffers: OfferRecord[]
}) {
    const [activeFilter, setActiveFilter] = useState('All');
    const [venues] = useState<RealDining[]>(initialVenues);
    const [offers] = useState<OfferRecord[]>(initialOffers);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [modalFilters, setModalFilters] = useState<Record<string, string[]>>({});

    const selectedCategories = modalFilters.dining_category ?? [];
    const selectedAmenities = modalFilters.amenities ?? [];
    const selectedSort = (modalFilters.sort ?? [])[0] ?? '';
    const selectedLocation = useLocation();
    const cityFilter = selectedLocation ? selectedLocation.split(',')[0].trim().toLowerCase() : '';

    const filteredVenues = useMemo(() => {
        let result = venues.filter(v => {
            // Filter by city
            if (cityFilter && !v.city?.toLowerCase().includes(cityFilter)) return false;
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
            result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        } else if (selectedSort === 'Price : Low to High') {
            result = [...result].sort((a, b) => {
                const aAny = a as unknown as Record<string, number>;
                const bAny = b as unknown as Record<string, number>;
                return (aAny.price ?? 0) - (bAny.price ?? 0);
            });
        } else if (selectedSort === 'Price : High to Low') {
            result = [...result].sort((a, b) => {
                const aAny = a as unknown as Record<string, number>;
                const bAny = b as unknown as Record<string, number>;
                return (bAny.price ?? 0) - (aAny.price ?? 0);
            });
        }
        return result;
    }, [venues, cityFilter, activeFilter, selectedCategories, selectedAmenities, selectedSort]);

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
                                    <h3 className="text-xl md:text-2xl font-medium text-black whitespace-pre-line leading-tight">
                                        Premium{"\n"}dining
                                    </h3>
                                </div>
                                <div className="flex-1 relative w-full flex items-end justify-end">
                                    <div className="relative w-[150px] h-[180px] -mr-4">
                                        <Image
                                            src="/dining/diningimg1.png"
                                            alt="Premium dining"
                                            fill
                                            className="object-contain object-right-bottom"
                                            priority
                                            sizes="(max-width: 768px) 170px, 170px"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Club & Chill, Pure Veg, etc. */}
                        {[
                            { title: "Club &\nChill", img: "/dining/diningimg2.png", href: "/dining/club-chill" },
                            { title: "Pure\nveg", img: "/dining/diningimg3.png", href: "/dining/pure-veg" },
                            { title: "Cafe\nvibes", img: "/dining/diningimg4.png", href: "/dining/cafe-vibes" },
                            { title: "Family\nfavourites", img: "/dining/diningimg5.png", href: "/dining/family-favourites" },
                            { title: "Bar &\nbites", img: "/dining/diningimg6.png", href: "/dining/bar-bites" }
                        ].map((cat, i) => (
                            <Link key={i} href={cat.href} className="block flex-shrink-0 cursor-pointer">
                                <div
                                    className="rounded-[30px] border border-transparent flex flex-col group overflow-hidden relative"
                                    style={{
                                        background: 'linear-gradient(105.73deg, #866BFF -160.73%, #BDB1F3 93.19%) padding-box, linear-gradient(135deg, #686868 0%, #D0D0D0 100%) border-box',
                                        width: '170px',
                                        height: '252px'
                                    }}
                                >
                                    <div className="px-[20px] pt-[20px] pb-1 font-[family-name:var(--font-anek-latin)]">
                                        <h3 className="text-xl md:text-2xl font-medium text-black whitespace-pre-line leading-tight">
                                            {cat.title}
                                        </h3>
                                    </div>
                                    <div className="flex-1 relative w-full flex items-end justify-end">
                                        <div className="relative w-[150px] h-[180px] -mr-4">
                                            <Image
                                                src={cat.img}
                                                alt={cat.title}
                                                fill
                                                className="object-contain object-right-bottom"
                                                priority={i === 0}
                                                sizes="(max-width: 768px) 170px, 170px"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {offers.length > 0 && (
                    <section>
                        <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold tracking-normal mb-6 md:mb-8 uppercase text-black text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>Exclusive Offers</h2>
                        <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4">
                            {offers.map((offer) => {
                                const targetId = offer.entity_ids?.[0];
                                const href = targetId ? `/dining/venue/${targetId}` : '#';
                                return (
                                    <Link key={offer.id} href={href} className="flex-shrink-0 group block overflow-hidden rounded-[8px]">
                                        <div className="relative w-[340px] h-[155.4px] rounded-[8px] overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
                                            {offer.image ? (
                                                <>
                                                    <Image
                                                        src={offer.image}
                                                        alt={offer.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 768px) 340px, 340px"
                                                    />
                                                    <div className="absolute top-3 left-3 bg-[#AC9BF7] text-white px-3 py-1 rounded-[4px] text-[12px] font-bold uppercase z-10">
                                                        {offer.discount_type === 'flat' ? `₹${offer.discount_value} OFF` : `${offer.discount_value}% OFF`}
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                                        <h3 className="text-white font-bold text-sm truncate">{offer.title}</h3>
                                                        <p className="text-white/80 text-xs truncate">{offer.description}</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-[#AC9BF7] flex flex-col items-center justify-center p-4">
                                                    <div className="bg-white/20 px-3 py-1 rounded-[4px] text-[12px] font-bold uppercase mb-2">
                                                        {offer.discount_type === 'flat' ? `₹${offer.discount_value} OFF` : `${offer.discount_value}% OFF`}
                                                    </div>
                                                    <span className="text-white font-bold text-lg text-center">{offer.title}</span>
                                                    <p className="text-white/80 text-sm text-center mt-1">{offer.description}</p>
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
                    {filteredVenues.length === 0 ? (
                        <div className="text-center py-20 text-zinc-400 text-lg">No restaurants available</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {filteredVenues.map((res) => (
                                <Link key={res.id} href={`/dining/venue/${res.name}`}>
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
