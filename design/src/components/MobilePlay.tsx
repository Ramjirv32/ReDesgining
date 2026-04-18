'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import Link from 'next/link';

const sportsCategories = [
    { name: 'Cricket', image: '/play/playck.png', top: '260px', left: '55px', bgTop: '232px', bgLeft: '42px' },
    { name: 'Football', image: '/play/playfb.png', top: '234px', left: '142px', bgTop: '232px', bgLeft: '156px' },
    { name: 'Pickleball', image: '/play/playpb.png', top: '261px', left: '283px', bgTop: '232px', bgLeft: '270px' },
    { name: 'Tennis', image: '/play/playtens.png', top: '399px', left: '54px', bgTop: '372px', bgLeft: '42px' },
    { name: 'Badminton', image: '/play/playbm.png', top: '391px', left: '157px', bgTop: '372px', bgLeft: '156px' },
    { name: 'Table Tennis', image: '/play/playtt.png', top: '388px', left: '271px', bgTop: '372px', bgLeft: '270px' },
    { name: 'Basketball', image: '/play/playbb.png', top: '539px', left: '50px', bgTop: '512px', bgLeft: '42px' },
];

const nearYouVenues = [
    {
        sport: 'CRICKET',
        venues: [
            { id: 1, name: 'Name', location: 'Location' },
            { id: 11, name: 'Name', location: 'Location' },
            { id: 111, name: 'Name', location: 'Location' },
        ]
    },
    {
        sport: 'FOOTBALL',
        venues: [
            { id: 2, name: 'Name', location: 'Location' },
            { id: 22, name: 'Name', location: 'Location' },
        ]
    },
    {
        sport: 'PICKLEBALL',
        venues: [
            { id: 3, name: 'Name', location: 'Location' },
            { id: 33, name: 'Name', location: 'Location' },
        ]
    },
];

const allVenues = [
    { id: 4, name: 'Name', location: 'Location' }
];

export default function MobilePlay() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const placeholders = ["events", "dining", "play"];

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [placeholders.length]);

    return (
        <div className="md:hidden min-h-screen w-full relative overflow-x-hidden font-sans pb-10"
            style={{ background: 'linear-gradient(180deg, #FFF7CD -311.56%, #FFFFFF 100%)', fontFamily: 'var(--font-anek-latin), sans-serif' }}>

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

            {/* 4. Explore Sports Section */}
            <div className="mt-[-20px] px-[18px]">
                <h2 className="text-[20px] font-medium text-black mb-6 tracking-tight">Explore Sports</h2>

                {/* 5. Sports Categories Grid - 3 Column Layout */}
                <div className="grid grid-cols-3 gap-x-[25px] gap-y-4">
                    {sportsCategories.map((sport, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="w-[89px] h-[120px] rounded-[25px] border border-[#E1E1E1]/60 flex flex-col items-center justify-start pt-3 relative overflow-visible cursor-pointer transition-transform active:scale-95 group"
                                style={{ background: 'linear-gradient(180deg, #FFFFFF 50%, #E7C200 159.52%)' }}>
                                <span className="text-[10px] font-medium text-black tracking-tight z-10">{sport.name}</span>

                                {/* Image Overlaying the bottom */}
                                <div className="absolute inset-x-0 -bottom-1 flex justify-center z-20 pointer-events-none">
                                    <img
                                        src={sport.image}
                                        alt={sport.name}
                                        className={`${sport.name === 'Football' ? 'w-[110px] h-[110px] -bottom-2 scale-110' : 'w-[80px] h-[80px]'} object-contain`}
                                        style={{
                                            transform: sport.name === 'Badminton' ? 'rotate(12.48deg)' : 'none'
                                        }}
                                    />
                                </div>
                                {/* Subtle Shadow Ellipse 49, 48, etc. */}
                                <div className="absolute inset-x-0 bottom-1 flex justify-center">
                                    <div className="w-[59px] h-[11px] bg-black/10 rounded-full" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 6. {SPORT NAME} COURT NEAR YOU - Horizontal Slider */}
            <div className="mt-[40px] space-y-12 ml-[18px]">
                {nearYouVenues.map((section, idx) => (
                    <div key={idx} className="relative">
                        <h3 className="text-[15px] font-medium text-black text-center mb-6 uppercase tracking-tight">
                            {section.sport} COURT NEAR YOU
                        </h3>
                        <div className="flex gap-4 overflow-x-auto px-[18px] scrollbar-hide snap-x snap-mandatory">
                            {section.venues.map((venue, vIdx) => (
                                <div key={vIdx} className="flex-shrink-0 w-[262px] h-[241px] bg-white rounded-[15px] border-[0.5px] border-[#AEAEAE] overflow-hidden flex flex-col active:scale-[0.98] transition-all cursor-pointer snap-start mb-1">
                                    <div className="h-[148px] w-full relative overflow-hidden">
                                        <img src="/mob dining.jpg" className="w-full h-full object-cover" alt="Venue" />
                                        {/* Hot Icon - Top Rated Indicator */}
                                        <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center border border-white/20">
                                            <img src="/mobile_icons/Vector 2.svg" alt="Hot" className="w-[18px] h-[18px] object-contain" />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white flex flex-col justify-between flex-1">
                                        <div className="flex flex-col">
                                            <h4 className="text-[24px] font-medium text-black leading-[26px] tracking-tight">{venue.name}</h4>
                                            <p className="text-[16px] font-medium text-[#686868] mt-1 line-clamp-1">{venue.location}</p>
                                        </div>

                                        {/* Play options button */}
                                        <div className="mt-auto">
                                            <div className="px-3 h-[24px] w-fit min-w-[75px] bg-[#D9D9D9] rounded-[15px] flex items-center justify-center">
                                                <span className="text-[10px] font-medium text-black">Play options</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* 7. All Sports Venues Section - top 1601px */}
            <div className="mt-[60px] px-[18px]">
                <h3 className="text-[20px] font-medium text-black mb-6 uppercase tracking-tight">All Sports Venues</h3>

                {/* Filters - Rectangle 43, 271, etc. */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    <button className="flex-shrink-0 px-3 h-[31px] border border-black rounded-[9px] flex items-center gap-1.5 bg-white">
                        <img src="/filter 1.png" className="w-[14px] h-[12px] object-contain invert" alt="Filter" />
                        <span className="text-[15px] font-medium text-black">Filters</span>
                    </button>
                    <button className="flex-shrink-0 px-3 h-[31px] border border-black rounded-[9px] flex items-center justify-center bg-white">
                        <span className="text-[15px] font-medium text-black">Top rated</span>
                    </button>
                    <button className="flex-shrink-0 px-3 h-[31px] border border-black rounded-[9px] flex items-center justify-center bg-white">
                        <span className="text-[15px] font-medium text-black">Cricket</span>
                    </button>
                    <button className="flex-shrink-0 px-3 h-[31px] border border-black rounded-[9px] flex items-center justify-center bg-white">
                        <span className="text-[15px] font-medium text-black">Pickleball</span>
                    </button>
                </div>

                {/* All Venue Cards - Rectangle 32/281 styles */}
                <div className="space-y-6">
                    {allVenues.map((venue, idx) => (
                        <div key={idx} className="w-full max-w-[366px] h-[336px] bg-white rounded-[15px] border border-[#AEAEAE] overflow-hidden flex flex-col mx-auto active:scale-[0.98] transition-all cursor-pointer">
                            <div className="h-[200px] w-full relative overflow-hidden">
                                <img src="/mob dining.jpg" className="w-full h-full object-cover" alt="Venue" />
                            </div>
                            <div className="p-5 flex-1 bg-white flex flex-col justify-between">
                                <div className="flex flex-col">
                                    <h4 className="text-[24px] font-medium text-black leading-[26px]">{venue.name}</h4>
                                    <p className="text-[16px] font-medium text-[#686868] mt-2">{venue.location}</p>
                                </div>
                                <div className="mt-4">
                                    <div className="w-[92px] h-[28px] bg-[#D9D9D9] rounded-[15px] flex items-center justify-center">
                                        <span className="text-[14px] font-medium text-black">Play options</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 8. Bottom Ticpin Pass Banner - image 16 2 */}
            <div className="mt-10 px-[18px] pb-10">
                <div className="w-full max-w-[327px] aspect-[327/109] rounded-[15px] overflow-hidden mx-auto">
                    <img src="/ticpin banner.jpg" className="w-full h-full object-cover" alt="Ticpin Pass" />
                </div>
            </div>

        </div>
    );
}

