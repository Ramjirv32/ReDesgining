'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import { ChevronDown, MapPin, Clock, ParkingCircle, Bath, Shirt, Droplets, Wind, Wifi, X, Plus, ShowerHead, Utensils, Lock, HeartPulse, Armchair, Toilet } from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import { useOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import MobilePlayDetails from '@/components/mobile/MobilePlayDetails';

const AuthModal = dynamic(() => import('@/components/modals/AuthModal'), { ssr: false });
const OrganizerLogoutModal = dynamic(() => import('@/components/modals/OrganizerLogoutModal'), { ssr: false });

/**
 * Converts any stored time string to 12-hr AM/PM display format.
 * Handles: "09:00" (24-hr), "9:00" (24-hr), "09:00 AM" (already 12-hr).
 * For composite "HH:MM - HH:MM" strings, converts both halves.
 */
function toDisplayTime(t: string): string {
    if (!t) return t;
    const s = t.trim();

    // Composite "open - close" — convert both sides
    if (s.includes(' - ')) {
        const [a, b] = s.split(' - ');
        return `${toDisplayTime(a.trim())} - ${toDisplayTime(b.trim())}`;
    }

    // Already has AM/PM — return as-is
    if (/AM|PM/i.test(s)) return s;

    // Pure 24-hr "HH:MM" or "H:MM"
    const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) {
        let h = parseInt(m24[1], 10);
        const min = m24[2];
        const period = h >= 12 ? 'PM' : 'AM';
        if (h === 0) h = 12;
        else if (h > 12) h -= 12;
        return `${String(h).padStart(2, '0')}:${min} ${period}`;
    }

    return s; // unrecognised — show as-is
}

interface RealPlay {
    id: string;
    name: string;
    description?: string;
    category?: string;
    sub_category?: string;
    city?: string;
    venue_name?: string;
    venue_address?: string;
    google_map_link?: string;
    instagram_link?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    card_video_url?: string;
    gallery_urls?: string[];
    secondary_banner_url?: string;
    time?: string;
    opening_time?: string;
    closing_time?: string;
    courts?: { id: string; name: string; type: string; price: number; image_url?: string }[];
    guide?: { facilities: string[] | string; is_pet_friendly: boolean };
    event_instructions?: string;
    youtube_video_url?: string;
    prohibited_items?: string[];
    faqs?: { question: string; answer: string }[];
    terms?: string;
    price_starts_from?: number;
}

export default function PlayDetailClient({ venue, id }: { venue: RealPlay, id: string }) {
    const router = useRouter();
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isOrgLogoutModalOpen, setIsOrgLogoutModalOpen] = useState(false);
    const [isFacilitiesModalOpen, setIsFacilitiesModalOpen] = useState(false);
    const session = useUserSession();
    const organizerSession = useOrganizerSession();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleBook = () => {
        if (!venue) return;
        
        // 1. If Organizer is logged in, they CANNOT book
        if (organizerSession) {
            setIsOrgLogoutModalOpen(true);
            return;
        }

        // 2. If no User session, show generic login
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }

        // 3. Proceed to booking
        router.push(`/play/${encodeURIComponent(venue.name)}/book`);
    };

    const handleOrganizerLogout = () => {
        clearOrganizerSession();
        setIsOrgLogoutModalOpen(false);
        setIsLoginModalOpen(true);
    };

    const toggleAccordion = (section: string) => {
        setOpenAccordion(openAccordion === section ? null : section);
    };

    // Mobile view
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        return <MobilePlayDetails venue={venue} offers={[]} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFFCED] via-white to-white font-[family-name:var(--font-anek-latin)]">
            <main className="max-w-[1440px] mx-auto px-4 md:px-14 py-8">
                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-12">
                        <div className="relative w-full h-[350px] md:h-[500px] rounded-[30px] overflow-hidden shadow-sm">
                            <Image
                                src={venue.landscape_image_url || venue.portrait_image_url || "/login/banner.jpeg"}
                                alt={venue.name}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-black/10 transition-opacity hover:opacity-0" />
                        </div>

                        <section className="space-y-4">
                            <h2 className="text-3xl font-semibold text-black uppercase">About the Venue</h2>
                            <div className="relative">
                                <div 
                                    className={`text-[#686868] text-lg font-medium leading-relaxed prose prose-zinc max-w-none ${!isAboutExpanded && 'line-clamp-3'}`}
                                    dangerouslySetInnerHTML={{ __html: venue.description || "Experience the finest sports infrastructure at our venue. Whether you're a professional athlete or a weekend warrior, we provide the perfect environment for your favorite sports." }}
                                />
                                <button
                                    onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                                    className="flex items-center gap-1 mt-2 text-black font-bold"
                                >
                                    Show {isAboutExpanded ? 'less' : 'more'} <ChevronDown className={`transition-transform grow-0 ${isAboutExpanded ? 'rotate-180' : ''}`} size={16} />
                                </button>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-semibold text-black uppercase">Venue Guide</h2>
                                {(() => {
                                    const facs = Array.isArray(venue.guide?.facilities)
                                        ? venue.guide.facilities
                                        : venue.guide?.facilities
                                            ? String(venue.guide.facilities).split(',').map(f => f.trim()).filter(Boolean)
                                            : [];
                                    if (facs.length > 2) {
                                        return (
                                            <button 
                                                onClick={() => setIsFacilitiesModalOpen(true)}
                                                className="flex items-center gap-1 text-black font-semibold text-[15px] hover:opacity-70 transition-opacity"
                                            >
                                                See all <ChevronDown size={16} className="-rotate-90" />
                                            </button>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {venue.time && (
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#D9D9D9] rounded-[10px] flex items-center justify-center text-[#686868]">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#686868] font-medium uppercase tracking-wider mb-1">TIMINGS</p>
                                            <p className="text-base font-semibold text-black">
                                                {((venue.opening_time && venue.opening_time.trim().replace(/-/g, '') !== '') && (venue.closing_time && venue.closing_time.trim().replace(/-/g, '') !== ''))
                                                    ? `${toDisplayTime(venue.opening_time)} - ${toDisplayTime(venue.closing_time)}`
                                                    : (venue.time && venue.time.trim().replace(/-/g, '') !== '' ? toDisplayTime(venue.time) : 'N/A')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {venue.guide && (() => {
                                    const facs = Array.isArray(venue.guide.facilities)
                                        ? venue.guide.facilities
                                        : venue.guide.facilities
                                            ? String(venue.guide.facilities).split(',').map(f => f.trim()).filter(Boolean)
                                            : [];
                                    
                                    const getIcon = (name: string) => {
                                        const n = name.toLowerCase();
                                        if (n.includes('park')) return <ParkingCircle size={24} />;
                                        if (n.includes('chang')) return <Shirt size={24} />;
                                        if (n.includes('shower')) return <ShowerHead size={24} />;
                                        if (n.includes('wash') || n.includes('restroom') || n.includes('toilet')) return <Toilet size={24} />;
                                        if (n.includes('water')) return <Droplets size={24} />;
                                        if (n.includes('ac') || n.includes('air')) return <Wind size={24} />;
                                        if (n.includes('wifi') || n.includes('internet')) return <Wifi size={24} />;
                                        if (n.includes('cafe') || n.includes('food') || n.includes('cafeter')) return <Utensils size={24} />;
                                        if (n.includes('locker')) return <Lock size={24} />;
                                        if (n.includes('first aid') || n.includes('firstaid') || n.includes('medical')) return <HeartPulse size={24} />;
                                        if (n.includes('seat')) return <Armchair size={24} />;
                                        if (n.includes('equip') || n.includes('rental')) return <Armchair size={24} />;
                                        return <Plus size={24} />;
                                    };

                                    const displayFacs = facs.slice(0, 2); // Show only 2 facilities to make total 3 with timings

                                    return (
                                        <>
                                            {displayFacs.map((f) => (
                                                <div key={f} className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-[#D9D9D9] rounded-[10px] flex items-center justify-center text-[#686868]">
                                                        {getIcon(f)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-[#686868] font-medium uppercase tracking-wider mb-1">FACILITY</p>
                                                        <p className="text-base font-semibold text-black uppercase">{f}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    );
                                })()}
                            </div>
                        </section>

                        {venue.courts && venue.courts.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-2xl font-semibold text-black uppercase">Available Courts</h2>
                                <div className="space-y-3">
                                    {venue.courts.map((court, index) => (
                                        <div key={`${court.id}-${index}`} className="flex items-center gap-4 p-4 bg-white rounded-[16px] border border-zinc-200">
                                            <div className="w-[90px] h-[70px] rounded-[12px] overflow-hidden shrink-0 bg-[#D9D9D9] relative">
                                                {court.image_url ? (
                                                    <Image src={court.image_url} alt={court.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-zinc-400 text-[10px] font-bold uppercase">COURT</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-lg font-semibold text-black uppercase">{court.name}</p>
                                                <p className="text-sm text-[#686868] font-medium">{court.type}</p>
                                            </div>
                                            <p className="text-lg font-bold text-black">₹{court.price}<span className="text-sm font-medium text-[#686868]">/hr</span></p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {(venue.gallery_urls && venue.gallery_urls.length > 0) || venue.secondary_banner_url ? (
                            <section className="space-y-4">
                                <h2 className="text-2xl font-semibold text-black uppercase">Gallery</h2>
                                {venue.gallery_urls && venue.gallery_urls.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {venue.gallery_urls.map((url, i) => (
                                            <div key={url} className="aspect-square rounded-[20px] overflow-hidden border border-zinc-200 relative">
                                                <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {venue.secondary_banner_url && (
                                    <div className="w-full rounded-[20px] overflow-hidden border border-zinc-200 relative aspect-video">
                                        <Image
                                            src={venue.secondary_banner_url}
                                            alt="Secondary Banner"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                            </section>
                        ) : null}

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-black uppercase">Venue</h2>
                            <div className="p-6 bg-white rounded-[20px] border border-[#686868]/30 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-xl text-[#686868] font-medium uppercase">{venue.venue_name || venue.name}</h4>
                                    <p className="text-lg text-[#686868] font-medium">{venue.venue_address || venue.city}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (venue.google_map_link) {
                                            window.open(venue.google_map_link, '_blank');
                                        }
                                    }}
                                    className="flex items-center gap-1 px-3 py-2 bg-transparent border border-zinc-300 rounded-[10px] text-black font-medium uppercase tracking-tight text-[13px] whitespace-nowrap hover:bg-zinc-50 transition-colors shrink-0"
                                >
                                    <MapPin size={14} strokeWidth={1.5} /> GET DIRECTIONS
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
                                                <div key={`faq-${i}-${faq.question}`}>
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
                                        <div className="space-y-3">
                                            {venue.sub_category && (
                                                <div>
                                                    <p className="text-xs text-[#686868] font-medium uppercase tracking-wider mb-0.5">Play options</p>
                                                    <p className="text-lg text-black font-medium">{venue.sub_category}</p>
                                                </div>
                                            )}
                                            {venue.city && (
                                                <div>
                                                    <p className="text-xs text-[#686868] font-medium uppercase tracking-wider mb-0.5">Location</p>
                                                    <p className="text-lg text-black font-medium">{venue.city}</p>
                                                </div>
                                            )}
                                            {venue.price_starts_from != null && (
                                                <p className="text-lg text-black font-semibold mt-1">From ₹{venue.price_starts_from} / hr</p>
                                            )}
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
                onSuccess={() => router.push(`/play/${encodeURIComponent(venue.name)}/book`)}
            />
            <OrganizerLogoutModal
                isOpen={isOrgLogoutModalOpen}
                onClose={() => setIsOrgLogoutModalOpen(false)}
                onConfirm={handleOrganizerLogout}
                organizerName={organizerSession?.email}
            />

            {/* Facilities Modal */}
            {isFacilitiesModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[30px] w-full max-w-[600px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 flex items-center justify-between border-b border-zinc-100">
                            <h3 className="text-2xl font-bold text-black uppercase">All Facilities</h3>
                            <button onClick={() => setIsFacilitiesModalOpen(false)} className="text-[#AEAEAE] hover:text-black transition-colors">
                                <X size={32} />
                            </button>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {(() => {
                                    const facs = Array.isArray(venue.guide?.facilities)
                                        ? venue.guide?.facilities
                                        : venue.guide?.facilities
                                            ? String(venue.guide.facilities).split(',').map(f => f.trim()).filter(Boolean)
                                            : [];
                                    
                                    const getIcon = (name: string) => {
                                        const n = name.toLowerCase();
                                        if (n.includes('park')) return <ParkingCircle size={20} />;
                                        if (n.includes('chang')) return <Shirt size={20} />;
                                        if (n.includes('shower')) return <ShowerHead size={20} />;
                                        if (n.includes('wash') || n.includes('restroom') || n.includes('toilet')) return <Toilet size={20} />;
                                        if (n.includes('water')) return <Droplets size={20} />;
                                        if (n.includes('ac') || n.includes('air')) return <Wind size={20} />;
                                        if (n.includes('wifi') || n.includes('internet')) return <Wifi size={20} />;
                                        if (n.includes('cafe') || n.includes('food') || n.includes('cafeter')) return <Utensils size={20} />;
                                        if (n.includes('locker')) return <Lock size={20} />;
                                        if (n.includes('first aid') || n.includes('firstaid') || n.includes('medical')) return <HeartPulse size={20} />;
                                        if (n.includes('seat')) return <Armchair size={20} />;
                                        if (n.includes('equip') || n.includes('rental')) return <Armchair size={20} />;
                                        return <Plus size={20} />;
                                    };

                                    return facs.map((f) => (
                                        <div key={f} className="flex items-center gap-3 p-4 bg-[#F5F5F5] rounded-[15px]">
                                            <div className="text-[#686868]">{getIcon(f)}</div>
                                            <span className="text-[17px] font-semibold text-black uppercase">{f}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                        <div className="p-8 bg-zinc-50 flex justify-center">
                            <button 
                                onClick={() => setIsFacilitiesModalOpen(false)}
                                className="px-12 h-[50px] bg-black text-white rounded-[15px] text-[18px] font-bold uppercase"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
