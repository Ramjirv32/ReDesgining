'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import { ChevronDown, MapPin, Clock } from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import AuthModal from '@/components/modals/AuthModal';

interface RealPlay {
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
    faqs?: { question: string; answer: string }[];
    terms?: string;
    price_starts_from?: number;
}

export default function PlayDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id ?? '';
    const [venue, setVenue] = useState<RealPlay | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const session = useUserSession();

    useEffect(() => {
        if (!id) return;
        fetch(`/backend/api/play/${id}`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: RealPlay) => {
                setVenue(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const handleBook = () => {
        if (!venue) return;
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }
        router.push(`/play/${id}/book`);
    };

    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!venue) {
        return <div className="min-h-screen flex items-center justify-center">Venue not found</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFFCED] via-white to-white font-[family-name:var(--font-anek-latin)]">
            <main className="max-w-[1440px] mx-auto px-4 md:px-14 py-8">
                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-12">
                        <div className="relative w-full h-[350px] md:h-[500px] rounded-[30px] overflow-hidden shadow-sm">
                            <img
                                src={venue.landscape_image_url || venue.portrait_image_url || "/login/banner.jpeg"}
                                alt={venue.name}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/10 transition-opacity hover:opacity-0" />
                        </div>

                        <section className="space-y-4">
                            <h2 className="text-3xl font-semibold text-black uppercase">About the Venue</h2>
                            <div className="relative">
                                <p className={`text-[#686868] text-lg font-medium leading-relaxed ${!isAboutExpanded && 'line-clamp-3'}`}>
                                    {venue.description || "Experience the finest sports infrastructure at our venue. Whether you're a professional athlete or a weekend warrior, we provide the perfect environment for your favorite sports."}
                                </p>
                                <button
                                    onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                                    className="flex items-center gap-1 mt-2 text-black font-bold"
                                >
                                    Show {isAboutExpanded ? 'less' : 'more'} <ChevronDown className={`transition-transform grow-0 ${isAboutExpanded ? 'rotate-180' : ''}`} size={16} />
                                </button>
                            </div>
                        </section>

                        {venue.time && (
                            <section className="space-y-4">
                                <h2 className="text-2xl font-semibold text-black uppercase">Venue Guide</h2>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#D9D9D9] rounded-[10px] flex items-center justify-center text-[#686868]">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#686868] font-medium uppercase tracking-wider">Timing</p>
                                        <p className="text-base font-medium text-black">{venue.time}</p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {venue.gallery_urls && venue.gallery_urls.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-2xl font-semibold text-black uppercase">Gallery</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {venue.gallery_urls.map((url, i) => (
                                        <div key={i} className="aspect-square rounded-[20px] overflow-hidden border border-zinc-200">
                                            <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-black uppercase">Venue</h2>
                            <div className="p-6 bg-white rounded-[20px] border border-[#686868]/30 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-xl text-[#686868] font-medium uppercase">{venue.venue_name || venue.name}</h4>
                                    <p className="text-lg text-[#686868] font-medium">{venue.venue_address || venue.city}</p>
                                </div>
                                <button className="flex items-center gap-1.5 px-4 py-2 bg-transparent border border-zinc-300 rounded-[10px] text-black font-medium uppercase tracking-tight text-[18px] hover:bg-zinc-50 transition-colors">
                                    <MapPin size={18} strokeWidth={1.5} /> GET DIRECTIONS
                                </button>
                            </div>
                        </section>

                        <div className="space-y-4">
                            {(venue.faqs && venue.faqs.length > 0) && (
                                <div
                                    className="p-6 bg-white border border-[#686868]/30 rounded-[20px] cursor-pointer"
                                    onClick={() => toggleAccordion('faq')}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-semibold text-black">Frequently Asked Questions</h3>
                                        <ChevronDown className={`transition-transform text-[#686868] ${openAccordion === 'faq' ? 'rotate-180' : ''}`} />
                                    </div>
                                    {openAccordion === 'faq' && (
                                        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {venue.faqs.map((faq, i) => (
                                                <div key={i}>
                                                    <p className="font-bold text-black">{faq.question}</p>
                                                    <p className="text-[#686868]">{faq.answer}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {venue.terms && (
                                <div
                                    className="p-6 bg-white border border-[#686868]/30 rounded-[20px] cursor-pointer"
                                    onClick={() => toggleAccordion('terms')}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-semibold text-black uppercase">Terms & Conditions</h3>
                                        <ChevronDown className={`transition-transform text-[#686868] ${openAccordion === 'terms' ? 'rotate-180' : ''}`} />
                                    </div>
                                    {openAccordion === 'terms' && (
                                        <div className="mt-4 text-[#686868] text-base font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                                            {venue.terms}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full lg:w-[400px]">
                        <div className="lg:sticky lg:top-32 space-y-6">
                            <div className="bg-white border border-[#686868]/30 rounded-[20px] overflow-hidden shadow-sm">
                                <div className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-semibold text-black uppercase">{venue.name}</h3>
                                        <div className="space-y-1">
                                            <p className="text-xl text-[#686868] font-medium">Starts from ₹{venue.price_starts_from ?? 0}</p>
                                            <p className="text-xl text-[#686868] font-medium mt-[15px]">{venue.city}</p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-[#686868]/20">
                                        <button
                                            onClick={handleBook}
                                            className="w-full h-[54px] bg-black text-white rounded-[12px] flex items-center justify-center active:scale-[0.98]"
                                        >
                                            <span
                                                style={{
                                                    transform: 'scaleY(2)',
                                                    display: 'inline-block',
                                                    fontFamily: "var(--font-anek-tamil)",
                                                    fontWeight: 600,
                                                    lineHeight: 1
                                                }}
                                                className="text-[18px] tracking-wider uppercase"
                                            >
                                                BOOK SLOTS
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <BottomBanner />
            <Footer />
            <AuthModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSuccess={() => router.push(`/play/${id}/book`)}
            />
        </div>
    );
}