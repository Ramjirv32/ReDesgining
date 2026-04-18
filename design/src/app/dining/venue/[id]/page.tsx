'use client';

import { useRouter, useParams } from 'next/navigation';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, MapPin, Star, ChevronDown, ChevronRight, CheckCircle2, Navigation, PhoneCall } from 'lucide-react';
import { useState, useEffect } from 'react';
import BookingCard from '@/components/dining/venue/BookingCard';
import CouponCard from '@/components/dining/CouponCard';
import AppBanner from '@/components/layout/AppBanner';
import MobileDiningDetails from '@/components/MobileDiningDetails';

const restaurants = [
    { id: 1, title: 'The Grand Buffet', location: 'Downtown', image: '/login/banner.jpeg', rating: 4.8 },
    { id: 2, title: 'Sushi Zen', location: 'Midtown', image: '/login/banner.jpeg', rating: 4.5 },
    { id: 3, title: 'Steakhouse Elite', location: 'Riverside', image: '/login/banner.jpeg', rating: 4.7 },
    { id: 4, title: 'Le Petit Cafe', location: 'Old Town', image: '/login/banner.jpeg', rating: 4.2 },
    { id: 5, title: 'Skyline Bar', location: 'Rooftop', image: '/login/banner.jpeg', rating: 4.6 },
    { id: 6, title: 'Spice Garden', location: 'Main Street', image: '/login/banner.jpeg', rating: 4.4 },
];

export default function DiningVenueDetail() {
    const router = useRouter();
    const params = useParams();
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const venueId = Number(params.id);
    const venue = restaurants.find(r => r.id === venueId) || restaurants[0];

    if (windowWidth < 768) {
        return <MobileDiningDetails venue={venue} />;
    }

    const smallImages = [
        '/images.png',
        '/images.png',
        '/images.png',
        '/images.png',
    ];

    return (
        <div className="min-h-screen bg-[#f8f4ff] font-[family-name:var(--font-anek-latin)] text-sm md:text-base selection:bg-primary selection:text-white">
            <main className="mx-auto max-w-[1800px] px-4 md:px-14 py-4 md:py-8">
                <button
                    onClick={() => router.back()}
                    className="mb-4 md:mb-6 flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white rounded-xl border border-zinc-100 text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400"
                >
                    <ArrowLeft size={14} className="md:w-4 md:h-4" />
                    Back
                </button>

                {/* Vertical Split Layout Wrapper */}
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,800px)_392px] gap-4 justify-center">

                    {/* LEFT SIDE: Hero Image + All Other Details */}
                    <div className="space-y-8 md:space-y-10">
                        {/* Large Hero Image */}
                        <div className="h-[300px] md:h-[450px] rounded-[32px] overflow-hidden shadow-sm">
                            <img src={venue.image} className="w-full h-full object-cover" alt={venue.title} />
                        </div>

                        {/* Restaurant Name & Actions */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h1 className="text-[36px] font-semibold tracking-tight text-black leading-tight">{venue.title}</h1>
                                <div className="flex items-center gap-2 py-1">
                                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-white text-[11px] font-semibold rounded bg-[#298103]">
                                        -- <Star size={10} className="fill-white" />
                                    </div>
                                    <span className="text-zinc-300">|</span>
                                    <div className="flex items-center gap-1.5 text-[14px] text-zinc-600 font-medium">
                                        <span className="text-[#298103]">Open</span>
                                        <span className="text-zinc-400">{'{'} Time {'}'}</span>
                                    </div>
                                </div>
                                <p className="text-[15px] text-zinc-500 font-medium">{'{'} Location {'}'}</p>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button className="flex items-center gap-2.5 px-6 py-2.5 border border-zinc-300 rounded-full bg-[#f8f4ff] text-[16px] font-semibold text-black hover:bg-zinc-50 transition-colors">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-[15deg]">
                                        <path d="M3 11l19-9-9 19-2-8-8-2z" />
                                    </svg> Directions
                                </button>
                                <button className="flex items-center gap-2.5 px-6 py-2.5 border border-zinc-300 rounded-full bg-[#f8f4ff] text-[16px] font-semibold text-black hover:bg-zinc-50 transition-colors">
                                    <PhoneCall size={18} /> Call
                                </button>
                            </div>
                            <hr className="mt-8 border-zinc-400" />
                        </div>

                        {/* Offers Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[32px] font-semibold text-black">Offers</h2>
                                <button className="text-[14px] font-semibold text-black flex items-center gap-1">
                                    See all <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                                <CouponCard discount="FLAT 30% OFF" code="{ TIME }" />
                                <CouponCard discount="FLAT 30% OFF" code="{ TIME }" />
                                <CouponCard discount="FLAT 30% OFF" code="{ TIME }" />
                            </div>
                        </section>

                        {/* Menu section (2x2 Grid) */}
                        <section className="space-y-6">
                            <h2 className="text-[32px] font-semibold text-black">Menu</h2>
                            <div className="grid grid-cols-2 gap-4 w-fit">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-36 h-36 md:w-[188px] md:h-[217px] rounded-[24px] overflow-hidden border border-zinc-100 shadow-sm bg-white">
                                        <img src="/images.png" className="w-full h-full object-cover" alt={`Menu Item ${i}`} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Facilities (4 Column Grid) */}
                        <section className="space-y-4">
                            <h2 className="text-[32px] font-semibold text-black">Available facilites</h2>
                            <div className="grid grid-cols-4 gap-y-3 font-semibold">
                                {['{ ALL DATA }', '{ ALL DATA }', '{ ALL DATA }', '{ ALL DATA }', '{ ALL DATA }', '{ ALL DATA }', '{ ALL DATA }', '{ ALL DATA }'].map((item, i) => (
                                    <span key={i} className="text-[14px] text-zinc-500">{item}</span>
                                ))}
                            </div>
                        </section>

                        {/* Venue Section */}
                        <section className="space-y-4">
                            <h2 className="text-[32px] font-semibold text-black">Venue</h2>
                            <div className="flex items-center justify-between px-6 py-6 bg-white border border-zinc-200 rounded-[24px] shadow-sm">
                                <div className="space-y-1">
                                    <h3 className="text-[20px] font-semibold text-zinc-800">{'{ Venue Name }'}</h3>
                                    <p className="text-[16px] font-semibold text-zinc-400">{'{ Venue Address}'}</p>
                                </div>
                                <button className="flex items-center gap-1.5 px-4 py-2 bg-transparent border border-zinc-300 rounded-[10px] text-black font-medium uppercase tracking-tight text-[18px] hover:bg-zinc-50 transition-colors">
                                    <MapPin size={18} strokeWidth={1.5} /> GET DIRECTIONS
                                </button>
                            </div>
                        </section>

                        {/* FAQ Section */}
                        <div className="space-y-4">
                            {[
                                { id: 1, title: 'Frequently Asked Questions', content: 'Find answers to common questions about this venue.' }
                            ].map((faq) => (
                                <div
                                    key={faq.id}
                                    onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                                    className={`w-full flex flex-col p-6 bg-white border border-zinc-200 rounded-[20px] cursor-pointer shadow-sm`}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[20px] font-semibold text-black">{faq.title}</h3>
                                        <ChevronDown size={20} className={`text-zinc-400 transition-transform duration-300 ${activeFaq === faq.id ? 'rotate-180' : ''}`} />
                                    </div>
                                    {activeFaq === faq.id && (
                                        <div className="mt-4 text-zinc-500 text-base font-semibold">
                                            <p>{faq.content}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT SIDE: 4 Images + Booking Card */}
                    <div className="space-y-6">
                        {/* 2x2 Image Grid (Exactly 392px wide) */}
                        <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[300px] md:h-[450px]">
                            {smallImages.map((src, i) => (
                                <div key={i} className="rounded-[24px] overflow-hidden shadow-sm h-full border border-zinc-50 bg-white">
                                    <img src={src} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                                </div>
                            ))}
                        </div>

                        {/* Sticky Booking Card */}
                        <div className="sticky top-24 z-10">
                            <BookingCard />
                        </div>
                    </div>
                </div>


            </main>
            <BottomBanner />
            <Footer />
        </div>
    );
}