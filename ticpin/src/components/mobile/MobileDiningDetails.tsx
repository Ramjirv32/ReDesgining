'use client';

import { ChevronLeft, Share2, ChevronRight, Star, ChevronDown, MapPin, Navigation, PhoneCall, Sparkles, Users, Ticket } from 'lucide-react';
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

interface MobileDiningDetailsProps {
    venue: {
        id: string;
        name: string;
        description?: string;
        city?: string;
        venue_name?: string;
        venue_address?: string;
        portrait_image_url?: string;
        landscape_image_url?: string;
        gallery_urls?: string[];
        menu_urls?: string[];
        time?: string;
        rating?: number;
        faqs?: { question: string; answer: string }[];
        terms?: string;
        prohibited_items?: string[];
        guide?: {
            facilities?: string[];
        };
        google_map_link?: string;
    };
    offers: OfferRecord[];
}

export default function MobileDiningDetails({ venue, offers }: MobileDiningDetailsProps) {
    const router = useRouter();
    const session = useUserSession();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [guests, setGuests] = useState(2);

    const handleBook = () => {
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }
        router.push(`/dining/venue/${encodeURIComponent(venue.name)}/book`);
    };

    const toggleAccordion = (section: string) => {
        setOpenAccordion(openAccordion === section ? null : section);
    };

    const facilities = venue.guide?.facilities || [];
    const galleryImages = venue.gallery_urls?.slice(0, 3) || [];

    return (
        <div className="md:hidden min-h-screen w-full bg-white font-sans selection:bg-[#866BFF]/20 overflow-x-hidden relative" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
            {/* 1. Hero Image Section */}
            <div className="relative w-full h-[225px] shrink-0 bg-white">
                <img
                    src={venue.landscape_image_url || venue.portrait_image_url || "/login/banner.jpeg"}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                />

                {/* Overlaid Buttons */}
                <div className="absolute top-[18px] left-[15px] w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center shadow-sm cursor-pointer" onClick={() => router.back()}>
                    <ChevronLeft size={16} className="text-black" />
                </div>

                <div className="absolute top-[18px] right-[56px] w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center shadow-sm">
                    <img src="/mobile_icons/event clicking/Vector 1.svg" className="w-[14px] h-[17px]" alt="Hub" />
                </div>

                <div className="absolute top-[18px] right-[15px] w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center shadow-sm">
                    <img src="/mobile_icons/event clicking/share.svg" className="w-[14px] h-[17px]" alt="Share" />
                </div>
            </div>

            {/* 2. Gallery Thumbnails */}
            <div className="flex gap-[10px] px-[12px] mt-[10px] items-center overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                {galleryImages.length > 0 ? galleryImages.map((url, i) => (
                    <div key={i} className="w-[calc((100vw-44px)/3)] aspect-square rounded-[15px] flex-shrink-0 snap-start relative overflow-hidden bg-[#AC9BF7]">
                        <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                )) : (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="w-[calc((100vw-44px)/3)] aspect-square bg-[#AC9BF7] rounded-[15px] flex-shrink-0 snap-start" />
                    ))
                )}
            </div>

            {/* 3. Main Content Section */}
            <div className="relative mt-[1px] w-full bg-white rounded-t-[15px] px-[21px] pb-32">
                {/* Horizontal Divider */}
                <div className="w-full h-[0.5px] bg-[#AEAEAE] absolute top-[25px] left-0 right-0" />

                {/* Dining Name & Rating */}
                <div className="pt-[40px] flex justify-between items-start mb-1.5">
                    <h1 className="text-[20px] font-semibold text-black uppercase tracking-tight leading-[22px] max-w-[280px]">
                        {venue.name}
                    </h1>

                    {/* Rating Badge */}
                    <div className="w-[36px] h-[38px] rounded-[7px] flex flex-col items-center overflow-hidden shrink-0">
                        {/* Top Green Section */}
                        <div className="w-full bg-[#65B54E] h-[19px] flex items-center justify-center gap-[3px] border-t border-x border-b border-[#65B54E] rounded-t-[7px]">
                            <span className="text-white text-[12px] font-bold leading-none mt-[1px]">{venue.rating || '--'}</span>
                            <img src="/mobile_icons/dining click/Star 3.svg" className="w-[9px] h-[9px]" alt="Star" />
                        </div>
                        {/* Bottom White Section */}
                        <div className="flex-1 flex items-center justify-center w-full h-[19px] bg-white border-b border-x border-[#AEAEAE] rounded-b-[7px]">
                            <img src="/mobile_icons/dining click/Black HD Google Logo 1.svg" className="w-[28px] h-auto" alt="Google" />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <p className="text-[15px] font-medium text-[#5331EA] leading-[16px] mb-2 font-anek-latin">
                    {venue.city || 'Bangalore'} | {'{DISTANCE FROM CURRENT LOCATION}'}
                </p>

                {/* Closes By */}
                <p className="text-[14px] font-medium text-[#B12C2E] mb-6 font-anek-latin">
                    {venue.time || 'Open all day'}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mb-10 overflow-x-auto scrollbar-hide py-1">
                    <button
                        className="flex-shrink-0 px-4 h-[39px] rounded-[10px] flex items-center justify-center gap-2"
                        style={{
                            border: '1px solid transparent',
                            backgroundImage: 'linear-gradient(white, white), linear-gradient(to right, #866BFF, #B26BE9)',
                            backgroundOrigin: 'border-box',
                            backgroundClip: 'padding-box, border-box'
                        }}
                    >
                        <img src="/mobile_icons/dining click/star.svg" className="w-[18px] h-[18px]" alt="Star" />
                        <span className="text-[16px] font-medium text-[#8D6BFF] whitespace-nowrap" style={{ fontFamily: 'Anek Latin' }}>What’s good here?</span>
                    </button>
                    {venue.google_map_link && (
                        <button 
                            onClick={() => window.open(venue.google_map_link, '_blank')}
                            className="flex-shrink-0 px-4 h-[39px] border border-[#AEAEAE] rounded-[10px] flex items-center justify-center gap-2 bg-white"
                        >
                            <img src="/mobile_icons/dining click/Vector.svg" className="w-[16px] h-[16px]" alt="Directions" />
                            <span className="text-[18px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>Directions</span>
                        </button>
                    )}
                    <button className="flex-shrink-0 px-4 h-[39px] border border-[#AEAEAE] rounded-[10px] flex items-center justify-center gap-2 bg-white">
                        <img src="/mobile_icons/dining click/phone.svg" className="w-[18px] h-[18px]" alt="Call" />
                        <span className="text-[18px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>Call</span>
                    </button>
                </div>

                {/* Offers Section - Only show if offers exist */}
                {offers.length > 0 && (
                    <div className="mb-14">
                        <h2 className="text-[20px] font-semibold text-black mb-4 tracking-tight mt-[-10px]" style={{ fontFamily: 'Anek Latin' }}>Offers for you</h2>
                        {offers[0].image && (
                            <div className="w-full h-[120px] rounded-[8px] overflow-hidden">
                                <img 
                                    src={offers[0].image} 
                                    alt={offers[0].title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Menu Section */}
                {venue.menu_urls && venue.menu_urls.length > 0 && (
                    <div className="mb-14">
                        <h2 className="text-[20px] font-semibold text-black mb-4 tracking-tight mt-[-20px]" style={{ fontFamily: 'Anek Latin' }}>Menu</h2>
                        <div className="grid grid-cols-2 gap-[10px] w-fit">
                            {venue.menu_urls.slice(0, 4).map((url, i) => (
                                <div key={i} className="w-[119px] h-[119px] bg-[#AC9BF7] rounded-[15px] overflow-hidden">
                                     <img src={url} className="w-full h-full object-cover" alt="Menu" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Facilities */}
                {facilities.length > 0 && (
                    <div className="mb-14">
                        <h2 className="text-[20px] font-semibold text-black mb-4 tracking-tight mt-[-20px]" style={{ fontFamily: 'Anek Latin' }}>Available facilities</h2>
                        <div className="grid grid-cols-2 gap-y-3 font-medium mb-6">
                            {facilities.map((item, i) => (
                                <span key={i} className="text-[12px] text-black font-medium">{item}</span>
                            ))}
                        </div>
                        <button className="text-[14px] font-bold text-black flex items-center gap-1">
                            Read more
                            <ChevronRight size={12} className="text-black transform translate-y-[0.5px]" />
                        </button>
                    </div>
                )}

                {/* Things to Know */}
                <div className="mb-14">
                    <h2 className="text-[20px] font-semibold text-black mb-6 tracking-tight mt-[-20px]" style={{ fontFamily: 'Anek Latin' }}>Things to Know</h2>
                    <div className="space-y-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <img src="/mobile_icons/event clicking/users-alt.svg" className="w-[23px] h-[23px]" alt="Users" />
                            </div>
                            <p className="text-[15px] font-medium text-black uppercase" style={{ fontFamily: 'Anek Latin' }}>All ages welcome</p>
                        </div>
                        <div className="w-full h-[1px] bg-[#D9D9D9]" />
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <img src="/mobile_icons/event clicking/ticket.svg" className="w-[22px] h-[22px]" alt="Ticket" />
                            </div>
                            <p className="text-[15px] font-medium text-black uppercase" style={{ fontFamily: 'Anek Latin' }}>Reservation required</p>
                        </div>
                    </div>
                    <button className="text-[14px] font-bold text-black flex items-center gap-1">
                        Read more
                        <ChevronRight size={12} className="text-black transform translate-y-[0.5px]" />
                    </button>
                </div>

                {/* More Section */}
                <div className="mb-14">
                    <h2 className="text-[20px] font-semibold text-black tracking-tight mb-4 mt-[-20px]" style={{ fontFamily: 'Anek Latin' }}>More</h2>
                    <div className="space-y-4">
                        <div className="w-full h-[61px] border border-[#686868] rounded-[15px] flex items-center justify-between px-5 cursor-pointer" onClick={() => toggleAccordion('faq')}>
                            <span className="text-[15px] font-semibold text-black">Frequently Asked Questions</span>
                            <ChevronDown size={20} className={`text-[#686868] transition-transform ${openAccordion === 'faq' ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="w-full h-[61px] border border-[#686868] rounded-[15px] flex items-center justify-between px-5 cursor-pointer" onClick={() => toggleAccordion('terms')}>
                            <span className="text-[15px] font-semibold text-black">Restaurant Terms & Conditions</span>
                            <ChevronDown size={20} className={`text-[#686868] transition-transform ${openAccordion === 'terms' ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                </div>

                {/* Footer Booking Bar */}
                <div className="relative mx-auto mt-10 w-full h-[83px] bg-[#F5F5F5] rounded-[40px] flex items-center justify-between px-4 z-10 gap-2">
                    <div className="flex-1 flex items-center justify-between bg-white rounded-full px-4 h-[51px] border border-[#D9D9D9]">
                        <span className="text-[17px] font-medium text-black whitespace-nowrap" style={{ fontFamily: 'Anek Latin' }}>{guests} guests</span>
                        <ChevronDown size={18} className="text-black opacity-60" />
                    </div>
                    <button 
                        onClick={handleBook}
                        className="flex-1 h-[51px] bg-black text-white rounded-[40px] font-medium text-[18px] active:scale-95 transition-all flex items-center justify-center leading-none px-2" 
                        style={{ fontFamily: 'Anek Latin' }}
                    >
                        Book a table
                    </button>
                </div>
            </div>

            <AuthModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSuccess={() => router.push(`/dining/venue/${encodeURIComponent(venue.name)}/book`)}
            />
        </div>
    );
}

