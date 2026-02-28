'use client';

import { useRouter, useParams } from 'next/navigation';
import { Share2, MapPin, ChevronDown, Ticket, Timer, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import DOMPurify from 'isomorphic-dompurify';
import { useUserSession } from '@/lib/auth/user';
import AuthModal from '@/components/modals/AuthModal';
import { DetailSkeleton } from '@/components/ui/Skeleton';

interface Artist {
    name: string;
    image_url?: string;
    description?: string;
}

interface FAQ {
    question: string;
    answer: string;
}

interface EventGuide {
    languages?: string[];
    min_age?: number;
    venue_type?: string;
    audience_type?: string;
    is_kid_friendly?: boolean;
    is_pet_friendly?: boolean;
}

interface EventData {
    id: string;
    name: string;
    description?: string;
    category?: string;
    sub_category?: string;
    city?: string;
    date?: string;
    time?: string;
    duration?: string;
    venue_name?: string;
    venue_address?: string;
    google_map_link?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    gallery_urls?: string[];
    price_starts_from?: number;
    tickets_needed_for?: string;
    artists?: Artist[];
    faqs?: FAQ[];
    guide?: EventGuide;
    status?: string;
    terms?: string;
}

export default function EventDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const session = useUserSession();

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetch(`/backend/api/events/${id}`, { credentials: 'include' })
            .then(r => {
                if (!r.ok) throw new Error('Event not found');
                return r.json();
            })
            .then(d => { setEvent(d); setLoading(false); })
            .catch((err) => { setError(err.message || 'Failed to load event.'); setLoading(false); });
    }, [id]);

    useEffect(() => {
        if (!loading) window.scrollTo(0, 0);
    }, [loading]);

    const handleBook = () => {
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }
        router.push(`/events/${id}/book/tickets`);
    };

    const formattedDate = useMemo(() => {
        if (!event?.date) return '';
        return new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }, [event?.date]);

    const processedDesc = useMemo(() => {
        if (!event?.description) return { plain: '', isLong: false };
        const sanitized = DOMPurify.sanitize(event.description);
        const plainText = sanitized.replace(/<[^>]+>/g, '');
        return {
            html: sanitized,
            isLong: plainText.length > 400
        };
    }, [event?.description]);

    const bannerImg = useMemo(() => event?.portrait_image_url || event?.landscape_image_url || '', [event]);

    if (loading) return <div className="min-h-screen bg-[#ECE8FD]"><DetailSkeleton /></div>;

    if (error || !event) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#ECE8FD]">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-black">Oops!</h2>
                <p className="text-[#686868] text-lg">{error || 'This event is currently unavailable'}</p>
            </div>
            <button
                onClick={() => router.push('/events')}
                className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-zinc-800 transition-all shadow-lg"
            >
                <ArrowLeft size={18} /> Browse Other Events
            </button>
        </div>
    );

    return (
        <div className="min-h-screen font-[family-name:var(--font-anek-latin)]" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)' }}>

            <main className="max-w-[1440px] mx-auto px-4 md:px-14 py-8 space-y-12">

                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-12">
                        {/* Banner */}
                        <div className="relative w-full h-[350px] md:h-[500px] rounded-[30px] overflow-hidden shadow-sm group">
                            {bannerImg ? (
                                <Image
                                    src={bannerImg}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    alt={event.name}
                                    fill
                                    priority
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-[#D3CBF5] to-[#7B2FF7] flex items-center justify-center">
                                    <span className="text-white text-5xl font-bold opacity-20">{event.name}</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/10 transition-opacity hover:opacity-0" />
                        </div>

                        {/* About Section */}
                        <section className="space-y-4">
                            <h2 className="text-3xl font-bold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>About the Event</h2>
                            <div className="relative">
                                <div
                                    className={`text-[20px] font-medium text-[#686868] leading-relaxed ${!showFullDesc && processedDesc.isLong ? 'max-h-[160px] overflow-hidden' : ''}`}
                                    style={{ fontFamily: 'var(--font-anek-latin)' }}
                                    dangerouslySetInnerHTML={{ __html: processedDesc.html || '<p>No description provided.</p>' }}
                                />
                                {processedDesc.isLong && (
                                    <button onClick={() => setShowFullDesc(!showFullDesc)} className="flex items-center gap-1 mt-4 text-black font-bold" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                        {showFullDesc ? 'Show less' : 'Show more'} <ChevronDown className={`transition-transform duration-300 ${showFullDesc ? 'rotate-180' : ''}`} size={16} />
                                    </button>
                                )}
                            </div>
                        </section>

                        <div className="w-full h-[1px] bg-[#686868]/30" />

                        {/* Overview Section */}
                        <section className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-bold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Event Overview</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-[56px] h-[56px] bg-[#FFFBFB] rounded-[15px] shadow-sm flex items-center justify-center border border-[#AEAEAE]/10">
                                        <div className="w-[18px] h-[18px] border-2 border-black rounded-full" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Language</span>
                                        <span className="text-[20px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                            {event.guide?.languages?.length ? event.guide.languages.filter(Boolean).join(', ') : 'TBA'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5">
                                    <div className="w-[56px] h-[56px] bg-[#FFFBFB] rounded-[15px] shadow-sm flex items-center justify-center border border-[#AEAEAE]/10">
                                        <Timer className="w-[21px] h-[25px] text-[#686868]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Duration</span>
                                        <span className="text-[20px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>{event.duration || 'TBA'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5">
                                    <div className="w-[56px] h-[56px] bg-[#FFFBFB] rounded-[15px] shadow-sm flex items-center justify-center border border-[#AEAEAE]/10">
                                        <Ticket className="w-[24px] h-[24px] text-[#686868]" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Tickets Needed For</span>
                                        <span className="text-[20px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>{event.tickets_needed_for || 'All ages'}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Artist Section */}
                        {event.artists && event.artists.length > 0 && (
                            <section className="space-y-6">
                                <h2 className="text-3xl font-bold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Artist</h2>
                                <div className="flex flex-col gap-6">
                                    {event.artists.map((artist, idx) => (
                                        <div key={idx} className="flex items-center gap-10">
                                            <div className="relative w-[169px] h-[169px] bg-white rounded-[15px] shadow-sm border border-[#AEAEAE]/20 overflow-hidden flex items-center justify-center">
                                                {artist.image_url ? (
                                                    <Image src={artist.image_url} alt={artist.name} fill className="object-cover" />
                                                ) : (
                                                    <span className="text-4xl font-bold text-[#7B2FF7] opacity-40">{artist.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <span className="text-[24px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>{artist.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Gallery Section */}
                        {event.gallery_urls && event.gallery_urls.length > 0 && (
                            <section className="space-y-6">
                                <h2 className="text-3xl font-bold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Gallery</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {event.gallery_urls.slice(0, 4).map((src, i) => (
                                        <div key={i} className="relative aspect-square rounded-[20px] overflow-hidden border border-zinc-200 shadow-sm">
                                            <Image src={src} fill className="object-cover" alt={`Gallery ${i}`} />
                                        </div>
                                    ))}
                                </div>
                                {event.landscape_image_url && (
                                    <div className="relative w-full h-[300px] md:h-[450px] rounded-[30px] overflow-hidden shadow-sm mt-8">
                                        <Image src={event.landscape_image_url} fill className="object-cover" alt="Gallery Banner" />
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Venue Section */}
                        <section className="space-y-6">
                            <h2 className="text-3xl font-bold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Venue</h2>
                            <div className="p-6 bg-white rounded-[20px] border border-[#AEAEAE]/30 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-xl text-[#686868] font-bold" style={{ fontFamily: 'var(--font-anek-latin)' }}>{event.venue_name || 'Venue TBA'}</h4>
                                    <p className="text-xl text-[#686868] font-medium" style={{ fontFamily: 'var(--font-anek-latin)' }}>{event.venue_address || event.city || 'Address not provided'}</p>
                                </div>
                                {event.google_map_link ? (
                                    <a
                                        href={event.google_map_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-6 py-3 bg-transparent border border-zinc-300 rounded-[10px] text-black uppercase tracking-tight hover:bg-zinc-50 transition-colors text-[18px] font-bold"
                                        style={{ fontFamily: 'var(--font-anek-tamil)' }}
                                    >
                                        <MapPin size={18} strokeWidth={1.5} /> GET DIRECTIONS
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-6 py-3 bg-transparent border border-zinc-100 rounded-[10px] text-gray-300 uppercase tracking-tight text-[18px] font-bold cursor-not-allowed">
                                        <MapPin size={18} /> GET DIRECTIONS
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* FAQ and Terms */}
                        <div className="space-y-4">
                            <div className="bg-white border border-[#AEAEAE]/30 rounded-[20px] overflow-hidden">
                                <button
                                    onClick={() => setActiveFaq(activeFaq === 99 ? null : 99)}
                                    className="w-full p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-colors"
                                >
                                    <span className="text-xl font-bold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Frequently Asked Questions</span>
                                    <ChevronDown className={`w-6 h-6 text-[#686868] transition-transform ${activeFaq === 99 ? 'rotate-180' : ''}`} />
                                </button>
                                {activeFaq === 99 && (
                                    <div className="px-6 pb-6 pt-2 space-y-4 border-t border-zinc-50">
                                        {event.faqs && event.faqs.length > 0 ? (
                                            event.faqs.map((faq, i) => (
                                                <div key={i} className="space-y-1">
                                                    <p className="font-bold text-black">{faq.question}</p>
                                                    <p className="text-[#686868]">{faq.answer}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-zinc-400 italic">No FAQs available for this event.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white border border-[#AEAEAE]/30 rounded-[20px] overflow-hidden">
                                <button
                                    onClick={() => setActiveFaq(activeFaq === 100 ? null : 100)}
                                    className="w-full p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-colors"
                                >
                                    <span className="text-xl font-bold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Event Terms & Conditions</span>
                                    <ChevronDown className={`w-6 h-6 text-[#686868] transition-transform ${activeFaq === 100 ? 'rotate-180' : ''}`} />
                                </button>
                                {activeFaq === 100 && (
                                    <div className="px-6 pb-6 pt-2 border-t border-zinc-50">
                                        <div className="text-[#686868] leading-relaxed whitespace-pre-wrap">
                                            {event.terms || "Standard terms and conditions apply. Please check with the venue for specific rules."}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Booking Card */}
                    <div className="w-full lg:w-[400px]">
                        <div className="lg:sticky lg:top-32 space-y-6">
                            <div className="bg-white border border-[#AEAEAE]/30 rounded-[20px] overflow-hidden shadow-sm">
                                <div className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <h1 className="text-3xl font-bold text-black leading-tight" style={{ fontFamily: 'var(--font-anek-latin)' }}>{event.name}</h1>
                                        <div className="space-y-2">
                                            <p className="text-xl text-[#2a2a2a] font-bold" style={{ fontFamily: 'var(--font-anek-latin)' }}>{event.category}{event.sub_category ? ` · ${event.sub_category}` : ''}</p>
                                            <p className="text-xl text-[#686868] font-medium" style={{ fontFamily: 'var(--font-anek-latin)' }}>{formattedDate}</p>
                                            <p className="text-xl text-[#686868] font-medium" style={{ fontFamily: 'var(--font-anek-latin)' }}>{event.time || 'Time TBA'}</p>
                                            <p className="text-xl text-[#686868] font-medium" style={{ fontFamily: 'var(--font-anek-latin)' }}>{event.venue_name || event.city || 'Location TBA'}</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[#AEAEAE]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                                <span className="text-xs font-bold text-[#686868] tracking-wide uppercase">Starts from</span>
                                                <span className="text-2xl font-bold text-black block">₹{event.price_starts_from?.toLocaleString('en-IN') || 'TBA'}</span>
                                            </div>
                                            <button
                                                onClick={handleBook}
                                                className="w-[160px] h-[46px] bg-black text-white rounded-[10px] flex items-center justify-center active:scale-[0.98] transition-all hover:bg-zinc-800"
                                            >
                                                <span style={{ fontFamily: "var(--font-anek-tamil)", fontWeight: 600, lineHeight: 1 }} className="text-[16px] tracking-wider uppercase">BOOK TICKETS</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="w-full min-h-[410px] bg-[#2A2A2A] relative overflow-hidden text-white px-6 md:px-[80px] pt-20 md:pt-[136px] pb-10 md:pb-0">
                <div className="flex flex-col md:flex-row justify-between gap-10">
                    <div>
                        <Image src="/ticpin-logo-black.png" alt="TICPIN" width={150} height={40} className="brightness-0 invert" />
                    </div>
                    <div className="flex flex-wrap gap-6 md:gap-[40px] text-[16px] font-semibold" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        <a href="#" className="hover:text-purple-300">Terms & Conditions</a>
                        <a href="#" className="hover:text-purple-300">Privacy Policy</a>
                        <a href="#" className="hover:text-purple-300">Contact Us</a>
                        <a href="#" className="hover:text-purple-300">List your events</a>
                    </div>
                </div>

                <div className="md:absolute md:bottom-[20px] md:left-[80px] md:right-[80px] mt-12">
                    <div className="w-full h-[1px] bg-white mb-[20px] opacity-20" />
                    <div className="flex flex-col md:flex-row justify-between items-center text-[#AEAEAE] text-[16px] font-medium" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        <p className="max-w-[900px] text-center md:text-left mb-6 md:mb-0 leading-snug">
                            By accessing this page, you confirm that you have read, understood, and agreed to our Terms of Service, Cookie Policy, Privacy Policy, and Content Guidelines. All rights reserved.
                        </p>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-zinc-200 transition-colors">
                                <Share2 className="w-4 h-4 text-black" />
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            <AuthModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSuccess={() => router.push(`/events/${id}/book/tickets`)}
            />
        </div>
    );
}
