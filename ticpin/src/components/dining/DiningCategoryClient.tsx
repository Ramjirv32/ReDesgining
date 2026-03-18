'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import FilterButton from '@/components/dining/FilterButton';
import EventCard from '@/components/dining/Eventcard';

interface Restaurant {
    id: string;
    name: string;
    city: string;
    portrait_image_url: string;
    price_starts_from: number;
    category: string;
    createdAt: string;
}

interface DiningCategoryClientProps {
    category: string;
    title: string;
    image: string;
}

export default function DiningCategoryClient({ category, title, image }: DiningCategoryClientProps) {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Filters');

    useEffect(() => {
        const fetchRestaurants = async () => {
            setLoading(true);
            try {
                // Determine base URL, favoring environment variable if available
                const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9000';
                const url = new URL(`${baseUrl}/api/dining`);
                url.searchParams.append('category', category);
                
                const res = await fetch(url.toString());
                const data = await res.json();
                
                if (data && data.data) {
                    setRestaurants(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch restaurants:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRestaurants();
    }, [category]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Available Today';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + 
               ' / ' + 
               date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            <main className="space-y-12 md:space-y-20">
                {/* Hero Banner Section */}
                <section className="relative w-full h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden"
                    style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #E7E0FF 100%)' }}>
                    <div className="flex items-center gap-8 md:gap-12 px-4">
                        <div className="relative">
                            <Image
                                src={image}
                                alt={title}
                                width={280}
                                height={280}
                                className="w-[180px] md:w-[280px] h-auto object-contain drop-shadow-xl"
                            />
                        </div>
                        <div className="h-[60px] md:h-[100px] w-[2px] bg-black/20" />
                        <h1 className="text-4xl md:text-7xl font-semibold text-black uppercase">
                            {title}
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
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-[480px] bg-zinc-100 animate-pulse rounded-[15px] border border-zinc-200" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {restaurants.length > 0 ? (
                                restaurants.map((res) => (
                                    <Link key={res.id} href={`/dining/venue/${res.id}`}>
                                        <EventCard
                                            title={res.name}
                                            location={res.city}
                                            date={formatDate(res.createdAt)}
                                            image={res.portrait_image_url}
                                            price={res.price_starts_from || '100'}
                                            rating={4.5}
                                        />
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center py-32 text-zinc-400">
                                    <p className="text-xl font-medium mb-2">No restaurants found</p>
                                    <p className="text-sm">We couldn't find any restaurants in the "{title}" category.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <BottomBanner />
            <Footer />
        </div>
    );
}
