'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import FilterButton from '@/components/dining/FilterButton';
import EventCard from '@/components/dining/Eventcard';

const premiumDiningRestaurants = [
    { id: 1, title: 'The Grand Buffet', location: 'Downtown', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop', rating: 4.8 },
    { id: 2, title: 'Sushi Zen', location: 'Midtown', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=500&fit=crop', rating: 4.5 },
    { id: 3, title: 'Steakhouse Elite', location: 'Riverside', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=500&fit=crop', rating: 4.7 },
    { id: 4, title: 'Le Petit Cafe', location: 'Old Town', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=500&fit=crop', rating: 4.2 },
    { id: 5, title: 'Skyline Bar', location: 'Rooftop', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=500&fit=crop', rating: 4.6 },
    { id: 6, title: 'Spice Garden', location: 'Main Street', image: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=800&h=500&fit=crop', rating: 4.4 },
    { id: 7, title: 'The Grand Buffet', location: 'Downtown', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop', rating: 4.8 },
    { id: 8, title: 'Sushi Zen', location: 'Midtown', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=500&fit=crop', rating: 4.5 },
    { id: 9, title: 'Steakhouse Elite', location: 'Riverside', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=500&fit=crop', rating: 4.7 },
];

export default function PremiumDiningPage() {
    const [activeFilter, setActiveFilter] = useState('Filters');

    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            <main className="space-y-12 md:space-y-20">

                {/* Hero Banner Section */}
                <section className="relative w-full h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden"
                    style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #E7E0FF 100%)' }}>
                    <div className="flex items-center gap-8 md:gap-12 px-4">
                        <div className="relative">
                            <Image
                                src="/dining/diningimg1.png"
                                alt="Premium Dining"
                                width={280}
                                height={280}
                                className="w-[180px] md:w-[280px] h-auto object-contain drop-shadow-xl"
                            />
                        </div>
                        <div className="h-[60px] md:h-[100px] w-[2px] bg-black/20" />
                        <h1 className="text-4xl md:text-7xl font-semibold text-black uppercase">
                            Premium Dining
                        </h1>
                    </div>
                </section>

                <div className="mx-auto max-w-[1440px] px-4 md:px-10 lg:px-16 space-y-12 md:space-y-16 pb-12 md:pb-20">
                    {/* Filters Section */}
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
                        {premiumDiningRestaurants.map((res, i) => (
                            <Link key={i} href={`/dining/venue/${res.id}`}>
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
                </div>
            </main>

            <BottomBanner />
            <Footer />
        </div>
    );
}
