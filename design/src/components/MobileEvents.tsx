'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { artists, events } from '@/data/mockData';
import Link from 'next/link';

export default function MobileEvents() {
    const router = useRouter();
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Today');
    const placeholders = ["events", "dining", "play"];

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const categories = [
        { name: 'Music', icon: '/events/Events 1.svg', bg: 'linear-gradient(360deg, #A1BFFF -49.4%, #FFFFFF 50%)' },
        { name: 'Comedy', icon: '/events/Comedy Icon.jpg 1.svg', bg: 'linear-gradient(360deg, #FFCA74 -5.56%, #FFFFFF 61.51%)' },
        { name: 'Shows', icon: '/events/Performance Icon 1.svg', bg: 'linear-gradient(360deg, #FFCECD -5.56%, #FFFFFF 61.51%)' },
        { name: 'Fests & Fairs', icon: '/events/Fests & Fairs Icon 1.svg', bg: 'linear-gradient(180deg, #FFFFFF 0%, #FFCA74 100%)' },
        { name: 'Fitness', icon: '/events/Dumbells Icon 1.svg', bg: 'linear-gradient(180deg, #FFFFFF 0%, #A1BFFF 100%)' },
        { name: 'Sports', icon: '/events/Sports Icon 2.svg', bg: 'linear-gradient(360deg, #FFE58A -5.56%, #FFFFFF 61.51%)' },
        { name: 'Food & Drinks', icon: '/events/Dining 1.svg', bg: 'linear-gradient(360deg, #8290D5 -5.56%, #FFFFFF 61.51%)' },
        { name: 'Night Life', icon: '/events/Night Life Icon 1.svg', bg: 'linear-gradient(360deg, #FAFDAA -5.56%, #FFFFFF 61.51%)' },
        { name: 'Screenings', icon: '/events/Projector Icon 1.svg', bg: 'linear-gradient(180deg, #FFFFFF 0%, #8290D5 100%)' },
        { name: 'Open Mic', icon: '/events/Open Mic Icon 1.svg', bg: 'linear-gradient(180deg, #FFFFFF 0%, #FFE58A 100%)' },
    ];

    return (
        <div className="md:hidden min-h-screen bg-white font-sans overflow-x-hidden pb-10" style={{ fontFamily: "'Anek Latin', sans-serif" }}>
            {/* 1. Header Section */}
            <header className="px-6 pt-7 pb-4">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-2">
                        <MapPin size={17} className="text-zinc-800" />
                        <span className="text-[15px] font-medium text-black leading-none">Location Name</span>
                    </div>
                    <div
                        className="w-[35px] h-[35px] rounded-full bg-[#D9D9D9] flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={() => router.push('/profile')}
                    >
                        <img src="/profile icon.svg" alt="Profile" className="w-5 h-5" />
                    </div>
                </div>

                {/* 2. Search Bar - Rectangle 253 */}
                <div className="relative w-full h-[48px] bg-white rounded-[28px] border border-[#AEAEAE] flex items-center px-5 mb-14">
                    <Search size={22} className="text-[#AEAEAE] flex-shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ml-3 w-full bg-transparent border-none outline-none text-[15px] font-medium text-black placeholder:text-[#AEAEAE]"
                        placeholder=""
                    />
                    {
                        !searchQuery && (
                            <div className="absolute left-[54px] top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                                <span className="text-[15px] font-medium text-[#AEAEAE]">Search for</span>
                                <div className="relative h-5 w-20 overflow-hidden">
                                    {placeholders.map((text, i) => (
                                        <span
                                            key={i}
                                            className={`absolute left-0 top-0 text-[15px] font-medium text-[#AEAEAE] h-5 flex items-center transition-all duration-700 ease-in-out ${i === placeholderIndex ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
                                                }`}
                                        >
                                            {text}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                </div >

                {/* 3. Horizontal Divider Line 60 */}
                < div className="w-full h-[1px] bg-[#AEAEAE] opacity-100 mb-6 mt-[-20px]" />
            </header>

            {/* Explore Events Section */}
            <section className="mt-[32px]">
                <h2 className="text-[20px] font-medium text-black mb-[20px] px-[18px]">Explore events</h2>
                <div className="grid grid-rows-2 grid-flow-col gap-[15px] overflow-x-auto scrollbar-hide px-[18px] pb-4">
                    {categories.map((cat, i) => (
                        <div key={i} className="flex flex-col items-center gap-[10px] flex-shrink-0 w-[89px]">
                            <div
                                className="w-[89px] h-[120px] rounded-[25px] border border-[rgba(225,225,225,0.6)] flex flex-col items-center pt-[15px] relative"
                                style={{ background: cat.bg }}
                            >
                                <div className="px-1 text-center">
                                    <span className="text-[10px] font-medium text-black uppercase block leading-tight">{cat.name}</span>
                                </div>

                                <div className="absolute inset-x-0 bottom-[10px] flex justify-center">
                                    <div className="w-[59px] h-[11px] bg-black/10 rounded-full blur-[2px]" />
                                </div>
                                <div className="mt-auto mb-[20px] w-full flex justify-center px-2">
                                    <img src={cat.icon} alt={cat.name} className="max-w-[70%] h-[50px] object-contain" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Artist Section (Set down) */}
            <section className="mt-[42px] px-[18px]">
                <h2 className="text-[20px] font-medium text-black mb-[20px]">Artist in your Ticpin</h2>
                <div className="flex gap-[20px] overflow-x-auto scrollbar-hide">
                    {artists.map((artist) => (
                        <div key={artist.id} className="flex flex-col items-center gap-[10px] flex-shrink-0">
                            <div className="w-[113px] h-[113px] rounded-full bg-[#D9D9D9] overflow-hidden border border-[#D9D9D9]">
                                <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[15px] font-medium text-black">{artist.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Filters */}
            <div className="mt-[32px] px-[18px] flex items-center gap-[10px] overflow-x-auto scrollbar-hide">
                <button className="h-[31px] px-3 border border-black rounded-[9px] flex items-center gap-2 flex-shrink-0">
                    <SlidersHorizontal size={14} />
                    <span className="text-[15px] font-medium">Filters</span>
                </button>
                {['Today', 'Tomorrow', 'Music'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`h-[31px] px-4 border border-black rounded-[9px] flex-shrink-0 text-[15px] font-medium transition-colors ${activeFilter === filter ? 'bg-black text-white' : 'bg-transparent text-black'}`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Event List */}
            <div className="mt-[30px] px-[18px] grid grid-cols-2 gap-[16px]">
                {events.map((event) => (
                    <div key={event.id} className="flex flex-col bg-white rounded-[30px] border-[0.5px] border-black overflow-hidden" onClick={() => router.push(`/events/${event.id}`)}>
                        <div className="aspect-[175/233] relative bg-[#E4E4E4]">
                            <img src={event.image.replace('./', '/')} alt={event.name} className="w-full h-full object-cover" />
                            <div className="absolute top-[12px] right-[12px] w-[22px] h-[22px] bg-[#E4E4E4] rounded-[6px] flex items-center justify-center">
                                <img src="/mobile_icons/Vector 2.svg" className="w-[12px] h-[12px]" alt="Hot" />
                            </div>
                        </div>
                        <div className="p-3">
                            <h3 className="text-[20px] font-bold text-black uppercase leading-[22px] line-clamp-1">{event.name}</h3>
                            <p className="text-[15px] font-medium text-[#5331EA] mt-1">{event.date.split(',')[0]}, {event.time}</p>
                            <p className="text-[15px] font-medium text-[#686868] mt-[2px]">{event.location}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Ticpin Pass Banner */}
            <div className="mt-[40px] px-[18px]">
                <Link href="/ticpass" className="block w-full h-[109px] rounded-[15px] overflow-hidden">
                    <img src="/ticpin banner.jpg" alt="Ticpin Pass" className="w-full h-full object-cover" />
                </Link>
            </div>
        </div>
    );
}
