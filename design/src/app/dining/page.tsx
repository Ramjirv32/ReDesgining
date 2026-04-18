'use client';

import EventCard from '@/components/dining/Eventcard';
import CouponCard from '@/components/dining/CouponCard';
import Link from 'next/link';
import Image from 'next/image';
import AppBanner from '@/components/layout/AppBanner';
import { useState } from 'react';
import FilterButton from '@/components/dining/FilterButton';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';

const diningCategories = [
    { name: 'Premium\ndining', image: '/dining/diningimg1.png', align: 'center' },
    { name: 'Club &\nChill', image: '/dining/diningimg2.png', align: 'center' },
    { name: 'Pure\nveg', image: '/dining/diningimg3.png', align: 'center' },
    { name: 'Cafe\nvibes', image: '/dining/diningimg4.png', align: 'center' },
    { name: 'Family\nfavourites', image: '/dining/diningimg5.png', align: 'center' },
    { name: 'Bar &\nbites', image: '/dining/diningimg6.png', align: 'center' }
];
const offers = [
    { discount: '50%', code: 'DETAILS' },
    { discount: '30%', code: 'WELCOME' },
    { discount: '20%', code: 'OFFER20' },
    { discount: '50%', code: 'DETAILS' },
];

const restaurants = [
    { id: 1, title: 'The Grand Buffet', location: 'Downtown', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop', rating: 4.8 },
    { id: 2, title: 'Sushi Zen', location: 'Midtown', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=500&fit=crop', rating: 4.5 },
    { id: 3, title: 'Steakhouse Elite', location: 'Riverside', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=500&fit=crop', rating: 4.7 },
    { id: 4, title: 'Le Petit Cafe', location: 'Old Town', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=500&fit=crop', rating: 4.2 },
    { id: 5, title: 'Skyline Bar', location: 'Rooftop', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=500&fit=crop', rating: 4.6 },
    { id: 6, title: 'Spice Garden', location: 'Main Street', image: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=800&h=500&fit=crop', rating: 4.4 },
];



export default function DiningPage() {
    const [activeFilter, setActiveFilter] = useState('Filters');

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

                <section>
                    <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold tracking-normal mb-6 md:mb-8 uppercase text-black text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>Exclusive Offers</h2>
                    <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4">
                        {offers.map((offer, i) => (
                            <div key={i} className="flex-shrink-0">
                                <CouponCard discount={offer.discount} code={offer.code} />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-6 md:space-y-8">
                    <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold tracking-normal uppercase text-black text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>All Restaurants</h2>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['Filters', 'Top rated', 'Pure Veg', 'Serves Alcohol', '50% OFF'].map((filter) => (
                            <FilterButton
                                key={filter}
                                label={filter}
                                active={activeFilter === filter}
                                onClick={() => setActiveFilter(filter)}
                            />
                        ))}
                    </div>
                    {/* Restaurants Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {restaurants.map((res) => (
                            <Link key={res.id} href={`/dining/venue/${res.id}`}>
                                <EventCard
                                    variant="wide"
                                    title={res.title}
                                    location={res.location}
                                    date="Rating"
                                    tag="Flat 50% Off"
                                    image={res.image}
                                    rating={res.rating}
                                />
                            </Link>
                        ))}
                    </div>
                </section>

                {/* <div className="mt-20">
                    <AppBanner />
                </div> */}

            </main>
            <BottomBanner />
            <Footer />
        </div>
    );
}