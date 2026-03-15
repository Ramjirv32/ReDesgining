'use client';

import { ChevronLeft, Share2, ChevronRight, Star, ChevronDown, MapPin, Clock, PhoneCall } from 'lucide-react';
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

interface Court {
    id: string;
    name: string;
    type: string;
    price: number;
    image_url?: string;
}

interface MobilePlayDetailsProps {
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
        opening_time?: string;
        closing_time?: string;
        time?: string;
        courts?: Court[];
        guide?: {
            facilities?: string[];
            is_pet_friendly?: boolean;
        };
        faqs?: { question: string; answer: string }[];
        terms?: string;
        google_map_link?: string;
        price_starts_from?: number;
    };
    offers?: OfferRecord[];
}

export default function MobilePlayDetails({ venue, offers = [] }: MobilePlayDetailsProps) {
    const router = useRouter();
    const session = useUserSession();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    const handleBook = () => {
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }
        router.push(`/play/${encodeURIComponent(venue.name)}/book`);
    };

    const toggleAccordion = (section: string) => {
        setOpenAccordion(openAccordion === section ? null : section);
    };

    const galleryImages = venue.gallery_urls?.slice(0, 3) || [];
    const facilities = venue.guide?.facilities || [];

    // Format time display
    const displayTime = venue.opening_time && venue.closing_time
        ? `${venue.opening_time} - ${venue.closing_time}`
        : venue.time || '6:00 AM - 10:00 PM';

    return (
        <div className="md:hidden min-h-screen w-full bg-white font-sans selection:bg-[#866BFF]/20 overflow-x-hidden relative" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
            {/* Hero Image Section */}
            <div className="relative w-full h-[225px] shrink-0 bg-white">
                <Image
                    src={venue.landscape_image_url || venue.portrait_image_url || "/login/banner.jpeg"}
                    alt={venue.name}
                    fill
                    className="object-cover"
                    priority
                />

                {/* Overlaid Buttons */}
                <div className="absolute top-[18px] left-[15px] w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center shadow-sm cursor-pointer" onClick={() => router.back()}>
                    <ChevronLeft size={16} className="text-black" />
                </div>

                <div className="absolute top-[18px] right-[15px] w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Share2 size={16} className="text-black" />
                </div>
            </div>

            {/* Gallery Thumbnails */}
            <div className="flex gap-[10px] px-[12px] mt-[10px] items-center overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                {galleryImages.length > 0 ? galleryImages.map((url, i) => (
                    <div key={i} className="w-[calc((100vw-44px)/3)] aspect-square rounded-[15px] flex-shrink-0 snap-start relative overflow-hidden bg-[#AC9BF7]">
                        <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" />
                    </div>
                )) : (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="w-[calc((100vw-44px)/3)] aspect-square bg-[#AC9BF7] rounded-[15px] flex-shrink-0 snap-start" />
                    ))
                )}
            </div>

            {/* Main Content Section */}
            <div className="relative mt-[1px] w-full bg-white rounded-t-[15px] px-[21px] pb-32">
                {/* Horizontal Divider */}
                <div className="w-full h-[0.5px] bg-[#AEAEAE] absolute top-[25px] left-0 right-0" />

                {/* Venue Name & Rating */}
                <div className="pt-[40px] flex justify-between items-start mb-1.5">
                    <h1 className="text-[20px] font-semibold text-black uppercase tracking-tight leading-[22px] max-w-[280px]">
                        {venue.name}
                    </h1>

                    {/* Rating Badge */}
                    <div className="w-[36px] h-[38px] rounded-[7px] flex flex-col items-center overflow-hidden shrink-0">
                        <div className="w-full bg-[#65B54E] h-[19px] flex items-center justify-center gap-[3px] border-t border-x border-b border-[#65B54E] rounded-t-[7px]">
                            <span className="text-white text-[12px] font-bold leading-none mt-[1px]">4.5</span>
                            <Star size={9} className="text-white fill-white" />
                        </div>
                        <div className="flex-1 flex items-center justify-center w-full h-[19px] bg-white border-b border-x border-[#AEAEAE] rounded-b-[7px]">
                            <span className="text-[8px] font-bold text-[#4285F4]">G</span>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <p className="text-[15px] font-medium text-[#5331EA] leading-[16px] mb-2 font-anek-latin">
                    {venue.city || 'Bangalore'}
                </p>

                {/* Timings */}
                <p className="text-[14px] font-medium text-black mb-6 font-anek-latin flex items-center gap-2">
                    <Clock size={14} /> {displayTime}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mb-10 overflow-x-auto scrollbar-hide py-1">
                    {venue.google_map_link && (
                        <button 
                            onClick={() => window.open(venue.google_map_link, '_blank')}
                            className="flex-shrink-0 px-4 h-[39px] border border-[#AEAEAE] rounded-[10px] flex items-center justify-center gap-2 bg-white"
                        >
                            <MapPin size={16} className="text-black" />
                            <span className="text-[18px] font-medium text-black">Directions</span>
                        </button>
                    )}
                </div>

                {/* Courts Section */}
                {venue.courts && venue.courts.length > 0 && (
                    <div className="mb-14">
                        <h2 className="text-[20px] font-semibold text-black mb-4 tracking-tight mt-[-10px]">Available Courts</h2>
                        <div className="space-y-3">
                            {venue.courts.map((court) => (
                                <div key={court.id} className="flex items-center gap-4 p-4 bg-white rounded-[16px] border border-zinc-200">
                                    <div className="w-[80px] h-[60px] rounded-[12px] overflow-hidden shrink-0 bg-[#D9D9D9] relative">
                                        {court.image_url ? (
                                            <Image src={court.image_url} alt={court.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-zinc-400 text-[10px] font-bold uppercase">COURT</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[16px] font-semibold text-black uppercase">{court.name}</p>
                                        <p className="text-[12px] text-[#686868] font-medium">{court.type}</p>
                                    </div>
                                    <p className="text-[16px] font-bold text-black">₹{court.price}<span className="text-[12px] font-medium text-[#686868]">/hr</span></p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Offers Section */}
                {offers.length > 0 && (
                    <div className="mb-14">
                        <h2 className="text-[20px] font-semibold text-black mb-4 tracking-tight mt-[-10px]">Offers for you</h2>
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                            {offers.map((offer) => (
                                <div key={offer.id} className="flex-shrink-0 w-[200px] h-[120px] bg-gradient-to-r from-[#AC9BF7] to-[#866BFF] rounded-[12px] p-4 flex flex-col justify-between">
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

                {/* Available Facilities */}
                {facilities.length > 0 && (
                    <div className="mb-14">
                        <h2 className="text-[20px] font-semibold text-black mb-4 tracking-tight mt-[-20px]">Available facilities</h2>
                        <div className="grid grid-cols-2 gap-y-3 font-medium mb-6">
                            {facilities.map((item, i) => (
                                <span key={i} className="text-[12px] text-black font-medium flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-[#866BFF] rounded-full" /> {item}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Things to Know */}
                <div className="mb-14">
                    <h2 className="text-[20px] font-semibold text-black mb-6 tracking-tight mt-[-20px]">Things to Know</h2>
                    <div className="space-y-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <Clock size={20} className="text-[#686868]" />
                            </div>
                            <p className="text-[15px] font-medium text-black uppercase">Book slots in advance</p>
                        </div>
                        <div className="w-full h-[1px] bg-[#D9D9D9]" />
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <Star size={20} className="text-[#686868]" />
                            </div>
                            <p className="text-[15px] font-medium text-black uppercase">Carry your own equipment</p>
                        </div>
                    </div>
                </div>

                {/* More Section */}
                <div className="mb-14">
                    <h2 className="text-[20px] font-semibold text-black tracking-tight mb-4 mt-[-20px]">More</h2>
                    <div className="space-y-4">
                        {(venue.faqs && venue.faqs.length > 0) && (
                            <div
                                onClick={() => toggleAccordion('faq')}
                                className="w-full h-[61px] border border-[#686868] rounded-[15px] flex items-center justify-between px-5 cursor-pointer"
                            >
                                <span className="text-[15px] font-semibold text-black">Frequently Asked Questions</span>
                                <ChevronDown size={20} className={`text-[#686868] transition-transform ${openAccordion === 'faq' ? 'rotate-180' : ''}`} />
                            </div>
                        )}
                        {venue.terms && (
                            <div
                                onClick={() => toggleAccordion('terms')}
                                className="w-full h-[61px] border border-[#686868] rounded-[15px] flex items-center justify-between px-5 cursor-pointer"
                            >
                                <span className="text-[15px] font-semibold text-black">Venue Terms & Conditions</span>
                                <ChevronDown size={20} className={`text-[#686868] transition-transform ${openAccordion === 'terms' ? 'rotate-180' : ''}`} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Booking Bar */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] h-[83px] bg-[#F5F5F5] rounded-[40px] flex items-center justify-between px-8 z-[100]">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[18px] font-semibold text-black uppercase">
                            {venue.price_starts_from ? `₹${venue.price_starts_from}` : '₹200'}
                        </span>
                        <span className="text-[12px] font-medium text-[#686868]">/hr onwards</span>
                    </div>
                    <button 
                        onClick={handleBook}
                        className="w-[138px] h-[51px] bg-black text-white rounded-[40px] font-medium text-[18px] active:scale-95 transition-all flex items-center justify-center"
                    >
                        Book slots
                    </button>
                </div>
            </div>

            <AuthModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSuccess={() => router.push(`/play/${encodeURIComponent(venue.name)}/book`)}
            />
        </div>
    );
}
