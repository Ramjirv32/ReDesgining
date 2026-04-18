'use client';

import { ChevronLeft, Share2, ChevronRight, Star, ChevronDown, MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MobileEventDetailsProps {
    event: {
        id: number | string;
        name: string;
        date: string;
        time: string;
        location: string;
        image?: string;
        ticketPrice?: string;
    };
}

export default function MobileEventDetails({ event }: MobileEventDetailsProps) {
    const router = useRouter();

    return (
        <div className="md:hidden min-h-screen w-full bg-[#EAEAEA] font-sans selection:bg-[#866BFF]/20 overflow-x-hidden relative" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
            {/* 1. Top Image Section - 10.1 1 */}
            <div className="relative w-full h-[536px] bg-[#110D2C] shrink-0">
                {event.image ? (
                    <img
                        src={event.image.startsWith('.') ? event.image.substring(1) : event.image}
                        alt={event.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full p-6 flex flex-col items-center justify-center relative bg-[#110D2C]">
                        {/* Reusing the fancy background from MobileHome */}
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
                        <img src="/mobile_icons/event clicking/Vector 1.svg" className="w-4 h-4" alt="Hub" />
                    </button>
                    <button className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center shadow-md">
                        <img src="/mobile_icons/event clicking/share.svg" className="w-4 h-4" alt="Share" />
                    </button>
                </div>

                {/* Progress Indicators - Ellipse 32, 33 */}
                <div className="absolute bottom-[24px] left-0 right-0 flex justify-center gap-1.5 z-20">
                    <div className="w-1 h-1 rounded-full bg-white shadow-sm" />
                    <div className="w-1 h-1 rounded-full bg-[#686868]" />
                </div>
            </div>

            {/* 2. Content Section - Rectangle 320 */}
            <div className="relative -mt-[11px] w-full bg-white rounded-t-[15px] px-6 pt-6 pb-32 min-h-[1000px]">
                {/* Event Name & Date */}
                <div className="mb-6">
                    <h1 className="text-[20px] font-semibold text-black mb-1 uppercase tracking-tight" style={{ lineHeight: '22px' }}>
                        {event.name}
                    </h1>
                    <p className="text-[15px] font-medium text-[#5331EA]" style={{ lineHeight: '16px' }}>
                        {event.date} {event.time}
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
                                <p className="text-[15px] font-medium text-black leading-tight">{event.location}</p>
                                <p className="text-[10px] font-medium text-[#686868] uppercase tracking-wider">{`{DISTANCE FROM CURRENT LOCATION}`}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-[#686868] rotate-[-360deg]" />
                    </div>

                    <div className="w-full h-[0.5px] bg-[#AEAEAE]" />

                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <MapPin size={20} className="text-black opacity-70" />
                            </div>
                            <div>
                                <p className="text-[15px] font-medium text-black leading-tight">{`{GATES OPEN TIME}`}</p>
                                <p className="text-[10px] font-medium text-[#686868] uppercase tracking-wider">View full schedule & timeline</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-[#686868] rotate-[-360deg]" />
                    </div>
                </div>

                {/* Offers Section */}
                <div className="mb-10">
                    <h2 className="text-[20px] font-semibold text-black mb-4">Offers for you</h2>
                    <div className="w-full h-[120px] bg-[#AC9BF7] rounded-[8px]" />
                </div>

                {/* About the event */}
                <div className="mb-12">
                    <h2 className="text-[20px] font-semibold text-black mb-2" style={{ lineHeight: '22px' }}>About the event</h2>
                    <div className="grid grid-cols-4 gap-x-2 gap-y-1 mb-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                            <span key={i} className="text-[12px] font-medium text-black uppercase tracking-tight" style={{ lineHeight: '13px' }}>{`{EVENT ABOUT}`}</span>
                        ))}
                    </div>
                    <button className="text-[15px] font-semibold text-black flex items-center gap-1 leading-none">
                        Read more
                        <ChevronRight size={12} className="text-black transform translate-y-[0.5px]" />
                    </button>
                </div>

                {/* Things to Know */}
                <div className="mb-12 mt-[-15px]">
                    <h2 className="text-[20px] font-semibold text-black mb-6 " style={{ lineHeight: '22px' }}>Things to Know</h2>
                    <div className="space-y-4 mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <img src="/mobile_icons/event clicking/language.svg" className="w-[23px] h-[23px]" alt="Language" />
                            </div>
                            <p className="text-[15px] font-medium text-black uppercase">{`{EVENT LAUNGUAGE}`}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <img src="/mobile_icons/event clicking/users-alt.svg" className="w-[23px] h-[23px]" alt="Users" />
                            </div>
                            <p className="text-[15px] font-medium text-black uppercase">{`{MIN AGE TICKET REQUIRED}`}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E4E4E4] rounded-[10px] flex items-center justify-center">
                                <img src="/mobile_icons/event clicking/ticket.svg" className="w-[22px] h-[22px]" alt="Ticket" />
                            </div>
                            <p className="text-[15px] font-medium text-black uppercase">{`{MIN AGE FOR ENTRY}`}</p>
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
                        <div className="w-full h-[61px] border border-[#686868] rounded-[15px] flex items-center justify-between px-5">
                            <span className="text-[15px] font-semibold text-black">Frequently Asked Questions</span>
                            <ChevronDown size={20} className="text-[#686868]" />
                        </div>
                        <div className="w-full h-[61px] border border-[#686868] rounded-[15px] flex items-center justify-between px-5">
                            <span className="text-[15px] font-semibold text-black">Event Terms & Conditions</span>
                            <ChevronDown size={20} className="text-[#686868]" />
                        </div>
                    </div>
                </div>

                {/* Ask Anything AI */}
                <div className="flex justify-center mb-10">
                    <div className="p-[1px] bg-gradient-to-r from-[#866BFF] to-[#B26BE9] rounded-full">
                        <button className="flex items-center justify-center gap-2 px-6 h-[44px] w-[170px] bg-white rounded-full active:scale-95 transition-all">
                            <img src="/mobile_icons/event clicking/Vector.svg" className="w-[20px] h-[20px]" alt="AI" />
                            <span className="text-[17px] font-semibold bg-gradient-to-r from-[#866BFF] to-[#B26BE9] bg-clip-text text-transparent whitespace-nowrap">Ask anything</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Sticky Footer - Rectangle 326 */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] h-[83px] bg-[#F5F5F5] rounded-[40px] flex items-center justify-between px-8 z-[100]">
                <div className="flex items-center gap-1.5">
                    <span className="text-[18px] font-semibold text-black uppercase">{event.ticketPrice || '{PRICE}'}</span>
                    <span className="text-[12px] font-medium text-[#686868]">onwards</span>
                </div>
                <button className="w-[138px] h-[51px] bg-black text-white rounded-[40px] font-medium text-[18px] active:scale-95 transition-all flex items-center justify-center">
                    Book tickets
                </button>
            </div>
        </div>
    );
}
