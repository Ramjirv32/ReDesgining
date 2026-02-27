'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, MapPin, Star, ChevronDown, ChevronRight, PhoneCall } from 'lucide-react';
import BookingCard from '@/components/dining/venue/BookingCard';
import CouponCard from '@/components/dining/CouponCard';

interface RealDining {
    id: string;
    name: string;
    description?: string;
    city?: string;
    venue_name?: string;
    venue_address?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    gallery_urls?: string[];
    time?: string;
    rating?: number;
    faqs?: { question: string; answer: string }[];
    terms?: string;
    prohibited_items?: string[];
}

export default function DiningVenueDetail() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id ?? '';
    const [venue, setVenue] = useState<RealDining | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    useEffect(() => {
        if (!id) return;
        fetch(`/backend/api/dining/${id}`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: RealDining) => {
                setVenue(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!venue) {
        return <div className="min-h-screen flex items-center justify-center">Restaurant not found</div>;
    }

    const smallImages = (venue.gallery_urls && venue.gallery_urls.length > 0)
        ? venue.gallery_urls.slice(0, 4)
        : ['/images.png', '/images.png', '/images.png', '/images.png'];

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

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,800px)_392px] gap-4 justify-center">

                    <div className="space-y-8 md:space-y-10">
                        <div className="h-[300px] md:h-[450px] rounded-[32px] overflow-hidden shadow-sm">
                            <img
                                src={venue.landscape_image_url || venue.portrait_image_url || "/login/banner.jpeg"}
                                className="w-full h-full object-cover"
                                alt={venue.name}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h1 className="text-[36px] font-semibold tracking-tight text-black leading-tight uppercase">{venue.name}</h1>
                                <div className="flex items-center gap-2 py-1">
                                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-white text-[11px] font-semibold rounded bg-[#298103]">
                                        {venue.rating || '4.0'} <Star size={10} className="fill-white" />
                                    </div>
                                    <span className="text-zinc-300">|</span>
                                    <div className="flex items-center gap-1.5 text-[14px] text-zinc-600 font-medium">
                                        <span className="text-[#298103]">Open</span>
                                        <span className="text-zinc-400">{venue.time || 'All day'}</span>
                                    </div>
                                </div>
                                <p className="text-[15px] text-zinc-500 font-medium uppercase tracking-wider">{venue.city || 'Bangalore'}</p>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button className="flex items-center gap-2.5 px-6 py-2.5 border border-zinc-300 rounded-full bg-[#f8f4ff] text-[16px] font-semibold text-black hover:bg-zinc-50 transition-colors uppercase">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-[15deg]">
                                        <path d="M3 11l19-9-9 19-2-8-8-2z" />
                                    </svg> Directions
                                </button>
                                <button className="flex items-center gap-2.5 px-6 py-2.5 border border-zinc-300 rounded-full bg-[#f8f4ff] text-[16px] font-semibold text-black hover:bg-zinc-50 transition-colors uppercase">
                                    <PhoneCall size={18} /> Call
                                </button>
                            </div>
                            <hr className="mt-8 border-zinc-400" />
                        </div>

                        <section className="space-y-6">
                            <h2 className="text-[32px] font-semibold text-black uppercase">About</h2>
                            <p className="text-zinc-500 text-lg font-medium leading-relaxed">
                                {venue.description || "Indulge in an exquisite culinary journey at our venue. We offer a perfect blend of ambiance and taste, creating unforgettable dining memories for you and your loved ones."}
                            </p>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[32px] font-semibold text-black uppercase">Offers</h2>
                                <button className="text-[14px] font-semibold text-black flex items-center gap-1 uppercase">
                                    See all <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                                <CouponCard discount="FLAT 30% OFF" code="DINING30" />
                                <CouponCard discount="BUY 1 GET 1" code="BOGO" />
                                <CouponCard discount="20% ON DRINKS" code="CHEERS20" />
                            </div>
                        </section>

                        {venue.gallery_urls && venue.gallery_urls.length > 0 && (
                            <section className="space-y-6">
                                <h2 className="text-[32px] font-semibold text-black uppercase">Gallery</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {venue.gallery_urls.map((url, i) => (
                                        <div key={i} className="aspect-square rounded-[24px] overflow-hidden border border-zinc-100 shadow-sm bg-white">
                                            <img src={url} className="w-full h-full object-cover" alt={`Gallery Item ${i}`} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {venue.prohibited_items && venue.prohibited_items.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-[32px] font-semibold text-black uppercase">Information</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 font-semibold">
                                    {venue.prohibited_items.map((item, i) => (
                                        <span key={i} className="text-[14px] text-zinc-500 uppercase flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full" /> {item}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="space-y-4">
                            <h2 className="text-[32px] font-semibold text-black uppercase">Venue</h2>
                            <div className="flex items-center justify-between px-6 py-6 bg-white border border-zinc-200 rounded-[24px] shadow-sm">
                                <div className="space-y-1">
                                    <h3 className="text-[20px] font-semibold text-zinc-800 uppercase">{venue.venue_name || venue.name}</h3>
                                    <p className="text-[16px] font-semibold text-zinc-400 uppercase">{venue.venue_address || venue.city}</p>
                                </div>
                                <button className="flex items-center gap-1.5 px-4 py-2 bg-transparent border border-zinc-300 rounded-[10px] text-black font-medium uppercase tracking-tight text-[18px] hover:bg-zinc-50 transition-colors">
                                    <MapPin size={18} strokeWidth={1.5} /> GET DIRECTIONS
                                </button>
                            </div>
                        </section>

                        {(venue.faqs && venue.faqs.length > 0) && (
                            <div className="space-y-4">
                                {venue.faqs.map((faq, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                        className={`w-full flex flex-col p-6 bg-white border border-zinc-200 rounded-[20px] cursor-pointer shadow-sm`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[20px] font-semibold text-black">{faq.question}</h3>
                                            <ChevronDown size={20} className={`text-zinc-400 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                                        </div>
                                        {activeFaq === i && (
                                            <div className="mt-4 text-zinc-500 text-base font-semibold">
                                                <p>{faq.answer}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[300px] md:h-[450px]">
                            {smallImages.map((src, i) => (
                                <div key={i} className="rounded-[24px] overflow-hidden shadow-sm h-full border border-zinc-50 bg-white">
                                    <img src={src} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                                </div>
                            ))}
                        </div>

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