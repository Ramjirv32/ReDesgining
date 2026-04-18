'use client';

import { ChevronLeft, Share2, ChevronRight, Star, ChevronDown, MapPin, Navigation, PhoneCall, Sparkles, Users, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MobileDiningDetailsProps {
    venue: {
        id: number | string;
        title: string;
        location: string;
        image?: string;
        rating?: string | number;
    };
}

export default function MobileDiningDetails({ venue }: MobileDiningDetailsProps) {
    const router = useRouter();

    return (
        <div className="md:hidden min-h-screen w-full bg-white font-sans selection:bg-[#866BFF]/20 overflow-x-hidden relative" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
            {/* 1. Hero Image Section - Specified Height 225px */}
            <div className="relative w-full h-[225px] shrink-0 bg-white">
                <img
                    src="/mob dining.jpg"
                    alt={venue.title}
                    className="w-full h-full object-cover"
                />

                {/* Overlaid Buttons - Using the Ellipse specs from design (31x31 px at top 18px) */}
                <div className="absolute top-[18px] left-[15px] w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center shadow-sm cursor-pointer" onClick={() => router.back()}>
                    <ChevronLeft size={16} className="text-black transform rotate-0" />
                </div>

                <div className="absolute top-[18px] right-[56px] w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center shadow-sm">
                    <img src="/mobile_icons/event clicking/Vector 1.svg" className="w-[14px] h-[17px]" alt="Hub" />
                </div>

                <div className="absolute top-[18px] right-[15px] w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center shadow-sm">
                    <img src="/mobile_icons/event clicking/share.svg" className="w-[14px] h-[17px]" alt="Share" />
                </div>
            </div>

            {/* 2. Gallery Thumbnails - Responsive squares to fit all mobile screen sizes */}
            <div className="flex gap-[10px] px-[12px] mt-[10px] items-center overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="w-[calc((100vw-44px)/3)] aspect-square bg-[#AC9BF7] rounded-[15px] flex-shrink-0 snap-start" />
                ))}
            </div>

            {/* 3. Main Content Section - Rectangle 320 at top 355px (approx 1px below thumbnails end) */}
            <div className="relative mt-[1px] w-full bg-white rounded-t-[15px] px-[21px] pb-32">

                {/* Horizontal Divider - Line 96 at top 380px (25px from container start) */}
                <div className="w-full h-[0.5px] bg-[#AEAEAE] absolute top-[25px] left-0 right-0" />

                {/* Dining Name & Rating - top 395px (40px from container start) */}
                <div className="pt-[40px] flex justify-between items-start mb-1.5">
                    <h1 className="text-[20px] font-semibold text-black uppercase tracking-tight leading-[22px] max-w-[280px]">
                        {venue.title}
                    </h1>

                    {/* Rating Badge - Specs Rectangle 331/337 */}
                    <div className="w-[36px] h-[38px] rounded-[7px] flex flex-col items-center overflow-hidden shrink-0">
                        {/* Top Green Section with Green Border */}
                        <div className="w-full bg-[#65B54E] h-[19px] flex items-center justify-center gap-[3px] border-t border-x border-b border-[#65B54E] rounded-t-[7px]">
                            <span className="text-white text-[12px] font-bold leading-none mt-[1px]">--</span>
                            <img src="/mobile_icons/dining click/Star 3.svg" className="w-[9px] h-[9px]" alt="Star" />
                        </div>
                        {/* Bottom White Section with Grey Border */}
                        <div className="flex-1 flex items-center justify-center w-full h-[19px] bg-white border-b border-x border-[#AEAEAE] rounded-b-[7px]">
                            <img src="/mobile_icons/dining click/Black HD Google Logo 1.svg" className="w-[28px] h-auto" alt="Google" />
                        </div>
                    </div>
                </div>

                {/* Location - top 427px (72px from container start) */}
                <p className="text-[15px] font-medium text-[#5331EA] leading-[16px] mb-2 font-anek-latin">
                    {venue.location} | {'{DISTANCE FROM CURRENT LOCATION}'}
                </p>

                {/* Closes By - top 454px (99px from container start) */}
                <p className="text-[14px] font-medium text-[#B12C2E] mb-6 font-anek-latin">
                    {'{CLOSES BY TIME}'}
                </p>

                {/* Action Buttons - top 499px (144px from container start) */}
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
                    <button className="flex-shrink-0 px-4 h-[39px] border border-[#AEAEAE] rounded-[10px] flex items-center justify-center gap-2 bg-white">
                        <img src="/mobile_icons/dining click/Vector.svg" className="w-[16px] h-[16px]" alt="Directions" />
                        <span className="text-[18px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>Directions</span>
                    </button>
                    <button className="flex-shrink-0 px-4 h-[39px] border border-[#AEAEAE] rounded-[10px] flex items-center justify-center gap-2 bg-white">
                        <img src="/mobile_icons/dining click/phone.svg" className="w-[18px] h-[18px]" alt="Call" />
                        <span className="text-[18px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>Call</span>
                    </button>
                </div>

                {/* Offers Section - top 568px (213px from container start) */}
                <div className="mb-14">
                    <h2 className="text-[20px] font-semibold text-black mb-4 tracking-tight mt-[-10px]" style={{ fontFamily: 'Anek Latin' }}>Offers for you</h2>
                    <div className="w-full h-[120px] bg-[#AC9BF7] rounded-[8px]" />
                </div>

                {/* Menu Section - top 755px (400px from container start) */}
                <div className="mb-14">
                    <h2 className="text-[20px] font-semibold text-black mb-4 tracking-tight mt-[-20px]" style={{ fontFamily: 'Anek Latin' }}>Menu</h2>
                    <div className="grid grid-cols-2 gap-[10px] w-fit">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-[119px] h-[119px] bg-[#AC9BF7] rounded-[15px]" />
                        ))}
                    </div>
                </div>

                {/* Available Facilities - top 1032px (677px from container start) */}
                <div className="mb-14">
                    <h2 className="text-[20px] font-semibold text-black mb-4 tracking-tight mt-[-20px]" style={{ fontFamily: 'Anek Latin' }}>Available facilities</h2>
                    <div className="grid grid-cols-4 gap-y-3 font-medium mb-6">
                        {['{FACILITIES}', '{FACILITIES}', '{FACILITIES}', '{FACILITIES}', '{FACILITIES}', '{FACILITIES}', '{FACILITIES}', '{FACILITIES}', '{FACILITIES}', '{FACILITIES}', '{FACILITIES}', '{FACILITIES}'].map((item, i) => (
                            <span key={i} className="text-[12px] text-black font-medium">{item}</span>
                        ))}
                    </div>
                    <button className="text-[14px] font-bold text-black flex items-center gap-1">
                        Read more
                        <ChevronRight size={12} className="text-black transform translate-y-[0.5px]" />
                    </button>
                </div>

                {/* Things to Know - top 1176px (821px from container start) */}
                <div className="mb-14">
                    <h2 className="text-[20px] font-semibold text-black mb-6 tracking-tight mt-[-20px]" style={{ fontFamily: 'Anek Latin' }}>Things to Know</h2>
                    <div className="space-y-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <img src="/mobile_icons/event clicking/users-alt.svg" className="w-[23px] h-[23px]" alt="Users" />
                            </div>
                            <p className="text-[15px] font-medium text-black uppercase" style={{ fontFamily: 'Anek Latin' }}>{`{MIN AGE TICKET REQUIRED}`}</p>
                        </div>
                        <div className="w-full h-[1px] bg-[#D9D9D9]" />
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <img src="/mobile_icons/event clicking/ticket.svg" className="w-[22px] h-[22px]" alt="Ticket" />
                            </div>
                            <p className="text-[15px] font-medium text-black uppercase" style={{ fontFamily: 'Anek Latin' }}>{`{MIN AGE FOR ENTRY}`}</p>
                        </div>
                    </div>
                    <button className="text-[14px] font-bold text-black flex items-center gap-1">
                        Read more
                        <ChevronRight size={12} className="text-black transform translate-y-[0.5px]" />
                    </button>
                </div>

                {/* More Section - top 1375px (1020px from container start) */}
                <div className="mb-14">
                    <h2 className="text-[20px] font-semibold text-black tracking-tight mb-4 mt-[-20px]" style={{ fontFamily: 'Anek Latin' }}>More</h2>
                    <div className="space-y-4">
                        <div className="w-full h-[61px] border border-[#686868] rounded-[15px] flex items-center justify-between px-5">
                            <span className="text-[15px] font-semibold text-black">Frequently Asked Questions</span>
                            <ChevronDown size={20} className="text-[#686868]" />
                        </div>
                        <div className="w-full h-[61px] border border-[#686868] rounded-[15px] flex items-center justify-between px-5">
                            <span className="text-[15px] font-semibold text-black">Restaurant Terms & Conditions</span>
                            <ChevronDown size={20} className="text-[#686868]" />
                        </div>
                    </div>
                </div>

                {/* Footer Booking Bar - Sticky/Floating at bottom 1891px (1536 from container start) */}
                <div className="relative mx-auto mt-10 w-full h-[83px] bg-[#F5F5F5] rounded-[40px] flex items-center justify-between px-4 z-10 gap-2">
                    <div className="flex-1 flex items-center justify-between bg-white rounded-full px-4 h-[51px] border border-[#D9D9D9]">
                        <span className="text-[17px] font-medium text-black whitespace-nowrap" style={{ fontFamily: 'Anek Latin' }}>{`{ NUM }`} guests</span>
                        <ChevronDown size={18} className="text-black opacity-60" />
                    </div>
                    <button className="flex-1 h-[51px] bg-black text-white rounded-[40px] font-medium text-[18px] active:scale-95 transition-all flex items-center justify-center leading-none px-2" style={{ fontFamily: 'Anek Latin' }}>
                        Book a table
                    </button>
                </div>
            </div>
        </div>
    );
}
