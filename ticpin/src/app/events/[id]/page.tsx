'use client';

import { useRouter, useParams } from 'next/navigation';
import { Share2, MapPin, ChevronDown, ChevronUp, Ticket, Timer, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUserSession } from '@/lib/auth/user';
import AuthModal from '@/components/modals/AuthModal';

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

    const handleBook = () => {
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }
        router.push(`/events/${id}/book/tickets`);
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (!id) return;
        fetch(`/backend/api/events/${id}`, { credentials: 'include' })
            .then(r => r.json())
            .then(d => { setEvent(d); setLoading(false); })
            .catch(() => { setError('Failed to load event.'); setLoading(false); });
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)' }}>
            <div className="w-10 h-10 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !event) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)' }}>
            <p className="text-red-500 text-lg">{error || 'Event not found'}</p>
            <button onClick={() => router.back()} className="flex items-center gap-2 text-[#7B2FF7] font-medium hover:underline">
                <ArrowLeft size={16} /> Go back
            </button>
        </div>
    );

    const bannerImg = event.portrait_image_url || event.landscape_image_url || '';
    const formattedDate = event.date
        ? new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : '';
    const plainDesc = event.description ? event.description.replace(/<[^>]+>/g, '') : '';
    const isLongDesc = plainDesc.length > 400;

    return (
        <div className="min-h-screen font-[family-name:var(--font-anek-latin)]" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)' }}>

            <main className="max-w-[1440px] mx-auto px-4 md:px-14 py-8 space-y-12">

                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-12">

                        {/* Banner */}
                        <div className="relative w-full h-[350px] md:h-[500px] rounded-[30px] overflow-hidden shadow-sm">
                            {bannerImg ? (
                                <img src={bannerImg} className="absolute inset-0 w-full h-full object-cover" alt={event.name} />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-[#D3CBF5] to-[#7B2FF7] flex items-center justify-center">
                                    <span className="text-white text-5xl font-bold opacity-20">{event.name}</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/10" />
                            <button onClick={() => router.back()} className="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-all shadow">
                                <ArrowLeft size={18} />
                            </button>
                        </div>

                        {/* About Section */}
                        <section className="space-y-4">
                            <h2 className="text-3xl font-semibold text-black">About the Event</h2>
                            <div className="relative">
                                <div
                                    className={`text-[18px] font-medium text-[#686868] leading-relaxed ${!showFullDesc && isLongDesc ? 'max-h-[120px] overflow-hidden' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: event.description || '<p>No description provided.</p>' }}
                                />
                                {isLongDesc && (
                                    <button onClick={() => setShowFullDesc(v => !v)} className="flex items-center gap-1 mt-3 text-black font-bold">
                                        {showFullDesc ? <>Show less <ChevronUp size={16} /></> : <>Show more <ChevronDown size={16} /></>}
                                    </button>
                                )}
                            </div>
                        </section>

                        <div className="w-full h-[1px] bg-[#686868]/30" />

                        {/* Overview */}
                        {(event.guide?.languages?.length || event.duration || event.tickets_needed_for) ? (
                            <section className="space-y-6">
                                <h2 className="text-3xl font-semibold text-black">Event Overview</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    {event.guide?.languages && event.guide.languages.length > 0 && (
                                        <div className="flex items-center gap-5">
                                            <div className="w-[56px] h-[56px] bg-[#FFFBFB] rounded-[15px] shadow-sm flex items-center justify-center border border-[#AEAEAE]/10">
                                                <div className="w-[18px] h-[18px] border-2 border-black rounded-full" />
                                            </div>
                                            <div>
                                                <span className="text-[14px] font-medium text-[#686868] block">Language</span>
                                                <span className="text-[20px] font-medium text-black">{event.guide.languages.filter(Boolean).join(', ')}</span>
                                            </div>
                                        </div>
                                    )}
                                    {event.duration && (
                                        <div className="flex items-center gap-5">
                                            <div className="w-[56px] h-[56px] bg-[#FFFBFB] rounded-[15px] shadow-sm flex items-center justify-center border border-[#AEAEAE]/10">
                                                <Timer className="w-[21px] h-[25px] text-[#686868]" />
                                            </div>
                                            <div>
                                                <span className="text-[14px] font-medium text-[#686868] block">Duration</span>
                                                <span className="text-[20px] font-medium text-black">{event.duration}</span>
                                            </div>
                                        </div>
                                    )}
                                    {event.tickets_needed_for && (
                                        <div className="flex items-center gap-5">
                                            <div className="w-[56px] h-[56px] bg-[#FFFBFB] rounded-[15px] shadow-sm flex items-center justify-center border border-[#AEAEAE]/10">
                                                <Ticket className="w-[24px] h-[24px] text-[#686868]" strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <span className="text-[14px] font-medium text-[#686868] block">Tickets Needed For</span>
                                                <span className="text-[20px] font-medium text-black">{event.tickets_needed_for}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        ) : null}

                        {/* Artists */}
                        {event.artists && event.artists.length > 0 && (
                            <>
                                <div className="w-full h-[1px] bg-[#686868]/30" />
                                <section className="space-y-6">
                                    <h2 className="text-3xl font-semibold text-black">
                                        {event.artists.length === 1 ? 'Artist' : 'Artists'}
                                    </h2>
                                    <div className="flex flex-wrap gap-8">
                                        {event.artists.map((artist, i) => (
                                            <div key={i} className="flex flex-col items-center gap-3">
                                                <div className="w-[150px] h-[150px] md:w-[169px] md:h-[169px] rounded-full overflow-hidden border-2 border-[#AEAEAE]/30 shadow-sm bg-[#f3f0fd] flex items-center justify-center flex-shrink-0">
                                                    {artist.image_url ? (
                                                        <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-5xl font-bold text-[#7B2FF7] opacity-40 uppercase select-none">
                                                            {artist.name.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[20px] font-semibold text-black text-center">{artist.name}</span>
                                                {artist.description && (
                                                    <p className="text-sm text-[#686868] text-center max-w-[180px] leading-snug">{artist.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}

                        {/* Gallery */}
                        {event.gallery_urls && event.gallery_urls.length > 0 && (
                            <>
                                <div className="w-full h-[1px] bg-[#686868]/30" />
                                <section className="space-y-6">
                                    <h2 className="text-3xl font-semibold text-black">Gallery</h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {event.gallery_urls.map((src, i) => (
                                            <div key={i} className="aspect-square rounded-[20px] overflow-hidden border border-zinc-200 shadow-sm">
                                                <img src={src} className="w-full h-full object-cover" alt={`Gallery ${i + 1}`} />
                                            </div>
                                        ))}
                                    </div>
                                    {event.landscape_image_url && (
                                        <div className="relative w-full h-[300px] md:h-[450px] rounded-[30px] overflow-hidden shadow-sm mt-8">
                                            <img src={event.landscape_image_url} className="absolute inset-0 w-full h-full object-cover" alt="Event" />
                                        </div>
                                    )}
                                </section>
                            </>
                        )}

                        {/* Venue */}
                        {(event.venue_name || event.venue_address) && (
                            <>
                                <div className="w-full h-[1px] bg-[#686868]/30" />
                                <section className="space-y-6">
                                    <h2 className="text-3xl font-semibold text-black">Venue</h2>
                                    <div className="p-6 bg-white rounded-[20px] border border-[#AEAEAE]/30 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            {event.venue_name && <h4 className="text-xl text-black font-semibold">{event.venue_name}</h4>}
                                            {event.venue_address && <p className="text-xl text-[#686868] font-medium">{event.venue_address}</p>}
                                            {event.city && <p className="text-base text-[#686868]">{event.city}</p>}
                                        </div>
                                        {event.google_map_link ? (
                                            <a href={event.google_map_link} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-4 py-2 border border-zinc-300 rounded-[10px] text-black uppercase tracking-tight hover:bg-zinc-50 transition-colors text-[18px] font-medium"
                                                style={{ fontFamily: 'var(--font-anek-tamil)' }}>
                                                <MapPin size={18} strokeWidth={1.5} /> GET DIRECTIONS
                                            </a>
                                        ) : (
                                            <button disabled className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 rounded-[10px] text-[#686868] uppercase tracking-tight text-[18px] font-medium opacity-40 cursor-not-allowed"
                                                style={{ fontFamily: 'var(--font-anek-tamil)' }}>
                                                <MapPin size={18} strokeWidth={1.5} /> GET DIRECTIONS
                                            </button>
                                        )}
                                    </div>
                                </section>
                            </>
                        )}

                        {/* FAQs */}
                        {event.faqs && event.faqs.length > 0 && (
                            <>
                                <div className="w-full h-[1px] bg-[#686868]/30" />
                                <section className="space-y-4">
                                    <h2 className="text-3xl font-semibold text-black">Frequently Asked Questions</h2>
                                    <div className="space-y-3">
                                        {event.faqs.map((faq, i) => (
                                            <div key={i} className="bg-white border border-[#AEAEAE]/30 rounded-[16px] overflow-hidden">
                                                <button
                                                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                                    className="w-full p-5 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                                                >
                                                    <span className="text-[17px] font-semibold text-black">{faq.question}</span>
                                                    {activeFaq === i
                                                        ? <ChevronUp size={18} className="text-[#686868] flex-shrink-0" />
                                                        : <ChevronDown size={18} className="text-[#686868] flex-shrink-0" />}
                                                </button>
                                                {activeFaq === i && (
                                                    <div className="px-5 pb-5 border-t border-[#AEAEAE]/20">
                                                        <p className="pt-4 text-[#686868] text-[15px] leading-relaxed">{faq.answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-[400px]">
                        <div className="lg:sticky lg:top-32 space-y-6">
                            <div className="bg-white border border-[#AEAEAE]/30 rounded-[20px] overflow-hidden shadow-sm">
                                <div className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <h1 className="text-3xl font-semibold text-black leading-tight">{event.name}</h1>
                                        <div className="space-y-2">
                                            {event.category && (
                                                <p className="text-base text-[#686868] font-medium">
                                                    {event.category}{event.sub_category ? ` · ${event.sub_category}` : ''}
                                                </p>
                                            )}
                                            {formattedDate && (
                                                <p className="text-base text-[#686868] font-medium">
                                                    {formattedDate}{event.time ? ` · ${event.time}` : ''}
                                                </p>
                                            )}
                                            {(event.venue_name || event.city) && (
                                                <p className="text-base text-[#686868] font-medium flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    {[event.venue_name, event.city].filter(Boolean).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[#AEAEAE]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <span className="text-xs font-medium text-[#686868] tracking-wide uppercase">Starts from</span>
                                                <span className="text-2xl font-bold text-black block">
                                                    {typeof event.price_starts_from === 'number' ? `₹${event.price_starts_from}` : '—'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleBook}
                                                className="w-[160px] h-[46px] bg-black text-white rounded-[10px] flex items-center justify-center active:scale-[0.98] transition-all"
                                            >
                                                <span style={{ fontFamily: 'var(--font-anek-tamil)', fontWeight: 600, lineHeight: 1 }} className="text-[16px] tracking-wider uppercase">
                                                    BOOK TICKETS
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full h-[410px] bg-[#2A2A2A] relative overflow-hidden text-white px-[80px] pt-[136px]">
                <div className="flex justify-between">
                    <div><img src="/ticpin-logo-black.png" alt="TICPIN" className="h-[40px] w-auto brightness-0 invert" /></div>
                    <div className="flex gap-[40px] text-[16px] font-semibold" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        <a href="#" className="hover:text-purple-300">Terms & Conditions</a>
                        <a href="#" className="hover:text-purple-300">Privacy Policy</a>
                        <a href="#" className="hover:text-purple-300">Contact Us</a>
                        <a href="#" className="hover:text-purple-300">List your events</a>
                    </div>
                    <div className="w-[110px] h-[110px] bg-[#D9D9D9] rounded-[15px] flex items-center justify-center">
                        <span className="text-black text-[36px] font-semibold">QR</span>
                    </div>
                </div>
                <div className="absolute bottom-[20px] left-[80px] right-[80px]">
                    <div className="w-full h-[1px] bg-white mb-[20px]" />
                    <div className="flex justify-between items-center text-[#686868] text-[16px] font-medium">
                        <p className="max-w-[900px]">By accessing this page, you confirm that you have read, understood, and agreed to our Terms of Service, Cookie Policy, Privacy Policy, and Content Guidelines. All rights reserved.</p>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer">
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
