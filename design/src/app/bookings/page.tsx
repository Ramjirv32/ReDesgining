'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function BookingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'dining' | 'events' | 'play'>('play');

    const tabs = [
        { id: 'dining', label: 'Dining' },
        { id: 'events', label: 'Events' },
        { id: 'play', label: 'Play' },
    ];

    const bookings = [
        {
            type: 'play',
            name: '{PLAY NAME}',
            court: '{COURT}',
            dateTime: '{DAY} {DATE} {MONTH} {TIME}',
            location: '{LOCATION}',
            status: 'Confirmed'
        }
    ];

    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-white border-b border-[#D9D9D9] z-50">
                {/* Logo - Fixed left position */}
                <div className="absolute left-4 md:left-[37px] top-0 bottom-0 flex items-center">
                    <Link href="/">
                        <img src="/ticpin-logo-black.png" alt="TICPIN" className="h-6 md:h-7 w-auto" />
                    </Link>
                </div>

                {/* Title - Centered */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <h1 className="text-[20px] md:text-[34px] font-semibold text-black leading-none whitespace-nowrap pointer-events-auto">
                        Review your bookings
                    </h1>
                </div>
            </header>

            <main className="pt-16 md:pt-20 pb-20 px-4 flex flex-col items-center">
                {/* Tabs Section */}
                <div className="mt-[47px] bg-[#E1E1E1] rounded-[40px] p-[6px] flex items-center max-w-full overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-[30px] md:px-[45px] py-[10px] rounded-[40px] text-[18px] md:text-[25px] font-medium transition-all duration-300 whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-black text-white' 
                                : 'text-black'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Section */}
                <div className="mt-[30px] w-full max-w-[460px]">
                    {activeTab === 'play' ? (
                        bookings.map((booking, idx) => (
                            <div key={idx} className="bg-white border-[0.5px] border-[#686868] rounded-[25px] px-[35px] pt-[35px] pb-[20px] relative">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-[25px] font-medium text-black leading-tight uppercase">{booking.name}</h3>
                                        <p className="text-[20px] font-normal text-[#686868] leading-tight uppercase">{booking.court}</p>
                                    </div>
                                    <div className="w-[134px] h-[75px] bg-[#FFEF9A] rounded-[15px]" />
                                </div>

                                <div className="mt-2 space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-[17px] font-medium text-[#686868] leading-none">Date & Time</p>
                                        <div className="text-[22px] font-medium text-black uppercase leading-[1.2]">
                                            <div>{booking.dateTime.split(' ').slice(0, 3).join(' ')}</div>
                                            <div>{booking.dateTime.split(' ').slice(3).join(' ')}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mt-[-8px]">
                                        <p className="text-[17px] font-medium text-[#686868] leading-none">Location</p>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[22px] font-medium text-black uppercase leading-none">{booking.location}</p>
                                            <img src="/play/dir.svg" alt="Directions" className="w-8 h-8" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-[18px] pt-3 border-t border-[#D1D1D1] flex justify-between items-center">
                                    <div className="bg-[#D6FAE5] px-4 py-1.5 rounded-[9px] flex items-center justify-center min-w-[104px]">
                                        <span className="text-[15px] font-bold text-[#009133]">Confirmed</span>
                                    </div>
                                    <Link href={`/bookings/${idx}`} className="flex items-center gap-1 text-black hover:opacity-70 transition-opacity">
                                        <span className="text-[15px] font-semibold">View details</span>
                                        <span className="text-[14px]">›</span>
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-zinc-50 rounded-[25px] border border-dashed border-zinc-300">
                            <p className="text-zinc-500 text-lg">No {activeTab} bookings found</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
