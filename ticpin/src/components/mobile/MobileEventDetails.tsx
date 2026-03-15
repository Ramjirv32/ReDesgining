'use client';

import { ChevronLeft, Share2, ChevronRight, Star, ChevronDown, MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserSession } from '@/lib/auth/user';
import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/modals/AuthModal'), { ssr: false });

interface OfferRecord {
    id: string;
    title: string;
    description: string;
    image?: string;
    discount_type: 'percent' | 'flat';
    discount_value: number;
}

interface MobileEventDetailsProps {
    event: {
        id: string;
        name: string;
        description?: string;
        date?: string;
        time?: string;
        venue_name?: string;
        venue_address?: string;
        city?: string;
        portrait_image_url?: string;
        landscape_image_url?: string;
        gallery_urls?: string[];
        ticket_starts_from?: number;
        artist_details?: { name: string; profession?: string; image_url?: string }[];
        event_category?: string;
        age_limit?: string;
        language?: string;
        faqs?: { question: string; answer: string }[];
        terms?: string;
    };
    offers: OfferRecord[];
}

export default function MobileEventDetails({ event, offers }: MobileEventDetailsProps) {
    const router = useRouter();
    const session = useUserSession();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    const handleBook = () => {
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }
        router.push(`/events/${event.id}/book/tickets`);
    };

    const toggleAccordion = (section: string) => {
        setOpenAccordion(openAccordion === section ? null : section);
    };

    const displayDate = event.date || 'Date TBA';
    const displayTime = event.time || 'Time TBA';
    const displayPrice = event.ticket_starts_from ? `₹${event.ticket_starts_from}` : '{PRICE}';

    return (
        <div className="md:hidden min-h-screen w-full bg-[#EAEAEA] font-sans selection:bg-[#866BFF]/20 overflow-x-hidden relative" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
            {/* Top Image Section */}
            <div className="relative w-full h-[536px] bg-[#110D2C] shrink-0">
                {event.landscape_image_url || event.portrait_image_url ? (
                    <Image
                        src={event.landscape_image_url || event.portrait_image_url!}
                        alt={event.name}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="w-full h-full p-6 flex flex-col items-center justify-center relative bg-[#110D2C]">
                        <div className="absolute inset-0 opacity-40">
                            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_30%_30%,#DFFF00_0%,transparent_40%),radial-gradient(circle_at_70%_70%,#5331EA_0%,transparent_50%),radial-gradient(circle_at_90%_20%,#DFFF00_0%,transparent_30%)] blur-[80px]" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <h1 className="text-[44px] font-black text-[#DFFF00] italic leading-[0.8] tracking-tighter uppercase text-center"
                                style={{
                                    fontFamily: "var(--font-anek-tamil-condensed), sans-serif",
                                    transform: 'skewX(-16deg) scaleY(1.3)',
                                    textShadow: '0 0 15px rgba(223, 255, 0, 0.5)'
                                }}>
                                THE TICPIN<br />PLAY<br />FESTIVAL
                            </h1>
                        </div>
                    </div>
                )}

                {/* Overlaid Buttons */}
                <div className="absolute top-6 left-4 flex gap-2">
                    <button onClick={() => router.back()} className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center shadow-md">
                        <ChevronLeft size={20} className="text-black" />
                    </button>
                </div>

                <div className="absolute top-6 right-4 flex gap-3">
                    <button className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center shadow-md">
                        <Share2 size={16} className="text-black" />
                    </button>
                </div>

                {/* Progress Indicators */}
                <div className="absolute bottom-[24px] left-0 right-0 flex justify-center gap-1.5 z-20">
                    <div className="w-1 h-1 rounded-full bg-white shadow-sm" />
                    <div className="w-1 h-1 rounded-full bg-[#686868]" />
                </div>
            </div>

            {/* Content Section */}
            <div className="relative -mt-[11px] w-full bg-white rounded-t-[15px] px-6 pt-6 pb-32 min-h-[1000px]">
                {/* Event Name & Date */}
                <div className="mb-6">
                    <h1 className="text-[20px] font-semibold text-black mb-1 uppercase tracking-tight" style={{ lineHeight: '22px' }}>
                        {event.name}
                    </h1>
                    <p className="text-[15px] font-medium text-[#5331EA]" style={{ lineHeight: '16px' }}>
                        {displayDate} {displayTime}
                    </p>
                </div>

                {/* Venue & Gates Open */}
                <div className="space-y-4 mb-10">
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <MapPin size={20} className="text-black opacity-70" />
                            </div>
                            <div>
                                <p className="text-[15px] font-medium text-black leading-tight">{event.venue_name || event.city || 'Venue TBA'}</p>
                                <p className="text-[10px] font-medium text-[#686868] uppercase tracking-wider">{event.venue_address || 'Location TBA'}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-[#686868]" />
                    </div>

                    <div className="w-full h-[0.5px] bg-[#AEAEAE]" />

                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <Clock size={20} className="text-black opacity-70" />
                            </div>
                            <div>
                                <p className="text-[15px] font-medium text-black leading-tight">{event.time || 'Doors open at 6:00 PM'}</p>
                                <p className="text-[10px] font-medium text-[#686868] uppercase tracking-wider">View full schedule & timeline</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-[#686868]" />
                    </div>
                </div>

                {/* Offers Section */}
                {offers.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-[20px] font-semibold text-black mb-4">Offers for you</h2>
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                            {offers.map((offer) => (
                                <div key={offer.id} className="flex-shrink-0 w-[200px] h-[120px] bg-[#AC9BF7] rounded-[8px] p-4 flex flex-col justify-between">
                                    <div>
                                        <p className="text-white text-[14px] font-bold">{offer.discount_type === 'flat' ? `₹${offer.discount_value} OFF` : `${offer.discount_value}% OFF`}</p>
                                        <p className="text-white/80 text-[12px]">{offer.title}</p>
                                    </div>
                                    <p className="text-white text-[10px] bg-white/20 px-2 py-1 rounded text-center">{offer.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* About the event */}
                <div className="mb-12">
                    <h2 className="text-[20px] font-semibold text-black mb-2" style={{ lineHeight: '22px' }}>About the event</h2>
                    <p className="text-[14px] text-zinc-600 font-medium leading-relaxed mb-4">
                        {event.description || 'Join us for an unforgettable experience. More details coming soon!'}
                    </p>
                    <button className="text-[15px] font-semibold text-black flex items-center gap-1 leading-none">
                        Read more
                        <ChevronRight size={12} className="text-black transform translate-y-[0.5px]" />
                    </button>
                </div>

                {/* Artist Section */}
                {event.artist_details && event.artist_details.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-[20px] font-semibold text-black mb-4" style={{ lineHeight: '22px' }}>Artist</h2>
                        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                            {event.artist_details.map((artist, i) => (
                                <div key={i} className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded-full bg-[#AC9BF7] overflow-hidden relative mb-2">
                                        {artist.image_url && (
                                            <Image src={artist.image_url} alt={artist.name} fill className="object-cover" />
                                        )}
                                    </div>
                                    <p className="text-[12px] text-center font-medium text-black">{artist.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Things to Know */}
                <div className="mb-12 mt-[-15px]">
                    <h2 className="text-[20px] font-semibold text-black mb-6" style={{ lineHeight: '22px' }}>Things to Know</h2>
                    <div className="space-y-4 mb-4">
                        {event.language && (
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                    <span className="text-[12px] font-bold text-[#686868]">{event.language.slice(0, 2).toUpperCase()}</span>
                                </div>
                                <p className="text-[15px] font-medium text-black uppercase">{event.language}</p>
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <Users size={20} className="text-[#686868]" />
                            </div>
                            <p className="text-[15px] font-medium text-black uppercase">{event.age_limit || '18+ Age limit'}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <Ticket size={20} className="text-[#686868]" />
                            </div>
                            <p className="text-[15px] font-medium text-black uppercase">Ticket required for entry</p>
                        </div>
                    </div>
                    <button className="text-[15px] font-semibold text-black flex items-center gap-1 leading-none">
                        Read more
                        <ChevronRight size={12} className="text-black transform translate-y-[0.5px]" />
                    </button>
                </div>

                {/* More Section */}
                <div className="space-y-4 mb-12 mt-[-15px]">
                    <h2 className="text-[20px] font-semibold text-black" style={{ lineHeight: '22px' }}>More</h2>
                    <div className="space-y-4">
                        {(event.faqs && event.faqs.length > 0) && (
                            <div
                                onClick={() => toggleAccordion('faq')}
                                className="w-full h-[61px] border border-[#686868] rounded-[15px] flex items-center justify-between px-5 cursor-pointer"
                            >
                                <span className="text-[15px] font-semibold text-black">Frequently Asked Questions</span>
                                <ChevronDown size={20} className={`text-[#686868] transition-transform ${openAccordion === 'faq' ? 'rotate-180' : ''}`} />
                            </div>
                        )}
                        {event.terms && (
                            <div
                                onClick={() => toggleAccordion('terms')}
                                className="w-full h-[61px] border border-[#686868] rounded-[15px] flex items-center justify-between px-5 cursor-pointer"
                            >
                                <span className="text-[15px] font-semibold text-black">Event Terms & Conditions</span>
                                <ChevronDown size={20} className={`text-[#686868] transition-transform ${openAccordion === 'terms' ? 'rotate-180' : ''}`} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Ask Anything AI */}
                <div className="flex justify-center mb-10">
                    <div className="p-[1px] bg-gradient-to-r from-[#866BFF] to-[#B26BE9] rounded-full">
                        <button className="flex items-center justify-center gap-2 px-6 h-[44px] w-[170px] bg-white rounded-full active:scale-95 transition-all">
                            <Sparkles size={20} className="text-[#866BFF]" />
                            <span className="text-[17px] font-semibold bg-gradient-to-r from-[#866BFF] to-[#B26BE9] bg-clip-text text-transparent whitespace-nowrap">Ask anything</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] h-[83px] bg-[#F5F5F5] rounded-[40px] flex items-center justify-between px-8 z-[100]">
                <div className="flex items-center gap-1.5">
                    <span className="text-[18px] font-semibold text-black uppercase">{displayPrice}</span>
                    <span className="text-[12px] font-medium text-[#686868]">onwards</span>
                </div>
                <button 
                    onClick={handleBook}
                    className="w-[138px] h-[51px] bg-black text-white rounded-[40px] font-medium text-[18px] active:scale-95 transition-all flex items-center justify-center"
                >
                    Book tickets
                </button>
            </div>

            <AuthModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSuccess={() => router.push(`/events/${event.id}/book/tickets`)}
            />
        </div>
    );
}

// Import missing icons
import { Users, Ticket, Sparkles } from 'lucide-react';
