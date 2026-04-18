'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronRight, PlayCircle, Star, Bell } from 'lucide-react';
import { artists, events } from '@/data/mockData';

// --- Custom Components & Styles ---

import MobileProfile from './MobileProfile';

export default function MobileHome() {
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 390);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProfile, setShowProfile] = useState(false);
    const placeholders = ["events", "dining", "play"];
    // ... existing refs ...
    const carouselRef = useRef<HTMLDivElement>(null);
    const limelightRef = useRef<HTMLDivElement>(null);
    const playRef = useRef<HTMLDivElement>(null);
    const [scrollX, setScrollX] = useState(0);
    const [limelightScrollX, setLimelightScrollX] = useState(0);
    const [playScrollX, setPlayScrollX] = useState(0);
    const scrollEvents = [...events.slice(0, 5), ...events.slice(0, 5), ...events.slice(0, 5)];
    const limelightItems = [1, 2, 3];
    const playItems = [
        { id: 1, name: "Champions Turf", location: "HADAPSAR, PUNE" },
        { id: 2, name: "Winner's Arena", location: "KOTHRUD, PUNE" },
        { id: 3, name: "Pro Turf", location: "BANER, PUNE" }
    ];
    const scrollLimelight = [...limelightItems, ...limelightItems, ...limelightItems];
    const scrollPlay = [...playItems, ...playItems, ...playItems];

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Initial center scroll for loop
    useEffect(() => {
        if (carouselRef.current) {
            const container = carouselRef.current;
            const cardWidth = 280 + 24; // w-[280px] + gap-6 (24px)
            const itemCount = events.slice(0, 5).length;
            const initialScroll = cardWidth * itemCount;
            container.scrollLeft = initialScroll;
            setScrollX(initialScroll);
        }
        if (limelightRef.current) {
            const container = limelightRef.current;
            const cardWidth = 326 + 24; // w-[326px] + gap-6 (24px)
            const itemCount = limelightItems.length;
            const initialScroll = cardWidth * itemCount;
            container.scrollLeft = initialScroll;
            setLimelightScrollX(initialScroll);
        }
        if (playRef.current) {
            const container = playRef.current;
            const cardWidth = 326 + 24; // w-[326px] + gap-6 (24px)
            const itemCount = playItems.length;
            const initialScroll = cardWidth * itemCount;
            container.scrollLeft = initialScroll;
            setPlayScrollX(initialScroll);
        }
    }, [showProfile]); // Re-initialize scroll when coming back from profile

    const handleScroll = () => {
        if (!carouselRef.current) return;
        const container = carouselRef.current;
        const cardWidth = 280 + 24;
        const itemCount = events.slice(0, 5).length;
        const thirdWidth = cardWidth * itemCount;

        setScrollX(container.scrollLeft);

        if (container.scrollLeft <= 0) {
            container.scrollLeft = thirdWidth;
        } else if (container.scrollLeft >= thirdWidth * 2) {
            container.scrollLeft = thirdWidth;
        }
    };

    const handleLimelightScroll = () => {
        if (!limelightRef.current) return;
        const container = limelightRef.current;
        const cardWidth = 326 + 24;
        const itemCount = limelightItems.length;
        const thirdWidth = cardWidth * itemCount;

        setLimelightScrollX(container.scrollLeft);

        if (container.scrollLeft <= 0) {
            container.scrollLeft = thirdWidth;
        } else if (container.scrollLeft >= thirdWidth * 2) {
            container.scrollLeft = thirdWidth;
        }
    };

    const handlePlayScroll = () => {
        if (!playRef.current) return;
        const container = playRef.current;
        const cardWidth = 326 + 24;
        const itemCount = playItems.length;
        const thirdWidth = cardWidth * itemCount;

        setPlayScrollX(container.scrollLeft);

        if (container.scrollLeft <= 0) {
            container.scrollLeft = thirdWidth;
        } else if (container.scrollLeft >= thirdWidth * 2) {
            container.scrollLeft = thirdWidth;
        }
    };

    const router = useRouter();

    return (
        <div
            className="md:hidden min-h-screen w-full overflow-x-hidden font-sans selection:bg-[#866BFF]/20"
            style={{ background: 'white' }}
        >
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

                {/* 4. Categories Section - Rectangle 23, 254, 255 */}
                < div className="grid grid-cols-3 gap-4 px-1" >
                    {/* Dining */}
                    < div className="flex flex-col items-center" >
                        <div
                            className="w-full aspect-[106/125] rounded-[25px] border-[#D9D9D9] border flex flex-col items-center justify-center gap-2 "
                            style={{ background: 'linear-gradient(180deg, #FFFFFF 50%, #E2D9FF 100%)' }}
                        >
                            <img src="/mobile_icons/Dining 1.svg" alt="Dining" className="w-[60%] h-[60%] object-contain" />
                            <span className="text-[15px] font-medium text-black uppercase tracking-tight">DINING</span>
                        </div>
                    </div >

                    {/* Events */}
                    < div className="flex flex-col items-center" >
                        <div
                            className="w-full aspect-[106/125] rounded-[30px] border-[#D9D9D9] border flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                            style={{ background: 'linear-gradient(180deg, #FFFFFF 50%, #E2D9FF 100%)' }}
                            onClick={() => router.push('/events')}
                        >
                            <img src="/mobile_icons/Events 1.svg" alt="Events" className="w-[60%] h-[60%] object-contain" />
                            <span className="text-[15px] font-medium text-black uppercase tracking-tight">EVENTS</span>
                        </div>
                    </div >

                    {/* Play */}
                    < div className="flex flex-col items-center" >
                        <div
                            className="w-full aspect-[106/125] rounded-[30px] border-[#D9D9D9] border flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                            style={{ background: 'linear-gradient(180deg, #FFFFFF 50%, #FFF4C1 100%)' }}
                            onClick={() => router.push('/play')}
                        >
                            <img src="/mobile_icons/Pickelball 1.svg" alt="Play" className="w-[60%] h-[60%] object-contain" />
                            <span className="text-[15px] font-medium text-black uppercase tracking-tight">PLAY</span>
                        </div>
                    </div >
                </div >
            </header >

            {/* 5. Sections Container */}
            < main className="mt-12 space-y-16 pb-12" >

                {/* Hot Right Now Section */}
                < section >
                    <h2 className="text-[20px] font-medium text-black text-center mb-8 uppercase tracking-wide mt-[-35px]">HOT RIGHT NOW</h2>
                    <div
                        ref={carouselRef}
                        onScroll={handleScroll}
                        className="flex gap-6 overflow-x-auto px-6 scrollbar-hide snap-x snap-mandatory items-center py-8"
                    >
                        {scrollEvents.map((event, idx) => {
                            // Calculate scale and opacity based on distance from center
                            const cardWidth = 280;
                            const gap = 24;
                            const totalCardWidth = cardWidth + gap;
                            const containerWidth = windowWidth;
                            const scrollCenter = scrollX + containerWidth / 2;
                            const cardCenter = (idx * totalCardWidth) + (cardWidth / 2) + 24; // 24 for px-6

                            const distance = Math.abs(scrollCenter - cardCenter);
                            const threshold = totalCardWidth;
                            const t = Math.min(distance / threshold, 1);

                            const scale = 1.1 - t * 0.10; // Active 1.1, Side 1.0
                            const opacity = 1 - t * 0; // Active 1, Side 0.7

                            return (
                                <div
                                    key={`${event.id}-${idx}`}
                                    onClick={() => router.push(`/events/${event.id}`)}
                                    className="flex-shrink-0 w-[280px] max-w-[85vw] bg-white rounded-[20px] border-[0.5px] border-[#AEAEAE] overflow-hidden snap-center snap-always transition-all duration-150 ease-out origin-center cursor-pointer active:scale-95"
                                    style={{
                                        transform: `scale(${scale})`,
                                        opacity: opacity
                                    }}
                                >
                                    {/* Top Poster Section */}
                                    <div className="w-full aspect-[280/390] relative overflow-hidden bg-[#110D2C]">
                                        {event.image ? (
                                            <img
                                                src={event.image.startsWith('.') ? event.image.substring(1) : event.image}
                                                alt={event.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full p-6 flex flex-col items-center justify-center relative">
                                                {/* Abstract Wavy Background Effect */}
                                                <div className="absolute inset-0 opacity-40">
                                                    <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_30%_30%,#DFFF00_0%,transparent_40%),radial-gradient(circle_at_70%_70%,#5331EA_0%,transparent_50%),radial-gradient(circle_at_90%_20%,#DFFF00_0%,transparent_30%)] blur-[80px]" />
                                                </div>

                                                {/* Sparkles */}
                                                <div className="absolute top-[25%] left-[20%] w-1 h-1 bg-white rounded-full blur-[1px] animate-pulse" />
                                                <div className="absolute top-[18%] right-[25%] w-0.5 h-0.5 bg-[#DFFF00] rounded-full blur-[0.5px] animate-pulse delay-700" />
                                                <div className="absolute bottom-[35%] left-[30%] w-1 h-1 bg-white rounded-full blur-[1px] animate-pulse delay-[1500ms]" />
                                                <div className="absolute top-[45%] right-[15%] w-1 h-1 bg-[#DFFF00] rounded-full blur-[1px] animate-pulse delay-300" />

                                                {/* Main Content */}
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <h1 className="text-[36px] font-black text-[#DFFF00] italic leading-[0.8] tracking-tighter uppercase text-center"
                                                        style={{
                                                            fontFamily: "var(--font-anek-tamil-condensed), sans-serif",
                                                            transform: 'skewX(-16deg) scaleY(1.3)',
                                                            textShadow: '0 0 15px rgba(223, 255, 0, 0.5)'
                                                        }}>
                                                        THE TICPIN<br />PLAY<br />FESTIVAL
                                                    </h1>

                                                    {/* Divider */}
                                                    <div className="flex items-center gap-2.5 w-full max-w-[180px] my-6 relative">
                                                        <div className="h-[0.5px] bg-gradient-to-r from-transparent via-white/50 to-white flex-1" />
                                                        <div className="w-[8px] h-[8px] bg-white rotate-45 border-[0.5px] border-white/20 shadow-[0_0_6px_white]" />
                                                        <div className="h-[0.5px] bg-gradient-to-l from-transparent via-white/50 to-white flex-1" />
                                                    </div>

                                                    {/* Offer Text */}
                                                    <div className="text-center group">
                                                        <p className="text-[20px] font-light text-white italic tracking-tight leading-tight opacity-90" style={{ fontFamily: 'serif' }}>
                                                            GET UP TO
                                                        </p>
                                                        <p className="text-[34px] font-bold text-white leading-[0.85] mt-1 group-hover:scale-105 transition-transform duration-500" style={{ fontFamily: 'serif' }}>
                                                            50% off*
                                                        </p>
                                                    </div>

                                                    {/* Logo at bottom */}
                                                    <div className="mt-8 flex flex-col items-center">
                                                        <p className="text-[9px] text-white/70 tracking-[0.4em] font-semibold mb-1.5 uppercase">ONLY ON</p>
                                                        <div className="flex items-center gap-0.5">
                                                            <span className="text-[24px] font-black text-white tracking-tighter">TIC</span>
                                                            <span className="text-[24px] font-black text-white tracking-tighter flex items-center -ml-1">
                                                                P <div className="w-1.5 h-1.5 bg-white rounded-full mx-0.5 mt-1 animate-pulse" /> IN
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Overlay Icons */}
                                        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-white">
                                            <img src="/mobile_icons/fluent_speaker-2-28-regular.svg" alt="Mute/Unmute" className="w-[20px] h-[20px]" />
                                        </div>
                                    </div>

                                    {/* Bottom Details Section */}
                                    <div className="p-5 relative bg-white">
                                        <p className="text-[12px] font-medium text-[#5331EA] mb-1.5 uppercase tracking-wide" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
                                            {event.date ? `${event.date.toUpperCase()}, ${event.time}` : "{DAY}, {DATE}, {TIME}"}
                                        </p>
                                        <h3 className="text-[20px] font-medium text-black uppercase leading-[1.1] tracking-tight line-clamp-2" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
                                            {event.name || "{EVENT NAME}"}
                                        </h3>
                                        <p className="text-[12px] font-regular text-[#8E8E8E] mt-2 uppercase tracking-wider truncate" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
                                            {event.location || "{EVENT LOCATION}"}
                                        </p>
                                        <p className="text-[12px] font-regular text-[#8E8E8E] mt-0.5 uppercase tracking-wider" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
                                            {event.ticketPrice ? `Starts at ${event.ticketPrice}` : "{EVENT STARTING PRICE}"}
                                        </p>

                                        {/* Fire/Hot Icon */}
                                        <div className="absolute top-5 right-5 w-10 h-10 rounded-[12px] bg-[#EFEFEF] flex items-center justify-center mt-[-10px]">
                                            <img src="/mobile_icons/Vector 2.svg" alt="Hot" className="w-[20px] h-[20px] object-contain" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section >

                {/* Artist Section */}
                < section >
                    <h2 className="text-[22px] font-medium text-black text-center mb-8 uppercase tracking-normal mt-[-30px]" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>ARTIST</h2>
                    <div className="flex gap-6 overflow-x-auto px-6 scrollbar-hide snap-x ml-[20px]">
                        {artists.map((artist) => (
                            <div key={artist.id} className="flex-shrink-0 w-[138px] snap-start">
                                <div className="w-[138px] h-[146px] rounded-[13px] bg-[#AC9BF7] overflow-hidden group relative">
                                    <img src={artist.image} alt={artist.name} className="w-full h-full object-cover mix-blend-multiply opacity-90" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                </div>
                                <p className="text-[14px] font-medium text-black mt-3 text-center uppercase tracking-wider" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>{artist.name}</p>
                            </div>
                        ))}
                    </div>
                </section >

                {/* In Limelight Section */}
                < section >
                    <h2 className="text-[22px] font-medium text-black text-center mb-8 uppercase tracking-wide mt-[-30px]" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>IN LIMELIGHT</h2>
                    <div
                        ref={limelightRef}
                        onScroll={handleLimelightScroll}
                        className="flex gap-6 overflow-x-auto px-6 scrollbar-hide snap-x snap-mandatory items-center py-8 mt-[-30px]"
                    >
                        {scrollLimelight.map((i, idx) => {
                            // Calculate scale and opacity based on distance from center
                            const cardWidth = 326;
                            const gap = 24;
                            const totalCardWidth = cardWidth + gap;
                            const containerWidth = windowWidth;
                            const scrollCenter = limelightScrollX + containerWidth / 2;
                            const cardCenter = (idx * totalCardWidth) + (cardWidth / 2) + 24; // 24 for px-6

                            const distance = Math.abs(scrollCenter - cardCenter);
                            const threshold = totalCardWidth;
                            const t = Math.min(distance / threshold, 1);

                            const scale = 1.05 - t * 0.05; // Active 1.05, Side 1.0
                            const opacity = 1 - t * 0; // Active 1, Side 0.7

                            return (
                                <div
                                    key={`limelight-${idx}`}
                                    onClick={() => router.push(`/dining/venue/${i}`)}
                                    className="flex-shrink-0 w-[326px] max-w-[85vw] bg-white rounded-[15px] border-[0.5px] border-[#AEAEAE] snap-center snap-always transition-all duration-150 ease-out origin-center overflow-hidden cursor-pointer active:scale-95"
                                    style={{
                                        transform: `scale(${scale})`,
                                        opacity: opacity
                                    }}
                                >
                                    <div className="w-full aspect-[326/182] bg-zinc-100 relative">
                                        <div className="absolute inset-0 flex items-center justify-center text-zinc-300 font-bold tracking-widest text-xs">DINING PREVIEW</div>
                                        <div className="absolute h-[29px] bottom-0 left-0 right-0 bg-[#AC9BF7] flex items-center px-4">
                                            <div className="flex items-center gap-1.5">
                                                <Star size={14} className="text-[#5331EA] fill-[#5331EA]" />
                                                <span className="text-white text-[14px] font-medium">Flat 40% OFF</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 flex justify-between items-end">
                                        <div>
                                            <h3 className="text-[17px] font-bold text-black uppercase line-clamp-2" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>Grand Dining Space</h3>
                                            <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>KOREGAON PARK</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-400">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section >

                {/* Offers Section */}
                < section className="px-6 mt-[-50px]" >
                    <h2 className="text-[20px] font-medium text-black text-center mb-8 uppercase tracking-wide" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>OFFERS</h2>
                    <div className="w-full h-[109px] bg-[#AC9BF7] rounded-[15px] border border-[#AC9BF7] relative overflow-hidden flex items-center px-8 mt-[-10px]">
                    </div>
                </section >

                {/* Play Near You Section */}
                < section >
                    <h2 className="text-[20px] font-medium text-black text-center mb-8 uppercase tracking-wide mt-[-20px]" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>PLAY NEAR YOU</h2>
                    <div
                        ref={playRef}
                        onScroll={handlePlayScroll}
                        className="flex gap-6 overflow-x-auto px-6 scrollbar-hide snap-x snap-mandatory items-center py-4"
                    >
                        {scrollPlay.map((item, idx) => {
                            // Calculate scale and opacity based on distance from center
                            const cardWidth = 326;
                            const gap = 24;
                            const totalCardWidth = cardWidth + gap;
                            const containerWidth = windowWidth;
                            const scrollCenter = playScrollX + containerWidth / 2;
                            const cardCenter = (idx * totalCardWidth) + (cardWidth / 2) + 24; // 24 for px-6

                            const distance = Math.abs(scrollCenter - cardCenter);
                            const threshold = totalCardWidth;
                            const t = Math.min(distance / threshold, 1);

                            const scale = 1.05 - t * 0.05; // Active 1.05, Side 1.0
                            const opacity = 1 - t * 0.2; // Active 1, Side 0.8

                            return (
                                <div
                                    key={`play-${idx}`}
                                    className="flex-shrink-0 w-[326px] max-w-[85vw] bg-white rounded-[15px] border-[0.5px] border-[#AEAEAE] snap-center snap-always transition-all duration-150 ease-out origin-center overflow-hidden p-[1px]"
                                    style={{
                                        transform: `scale(${scale})`,
                                        opacity: opacity
                                    }}
                                >
                                    {/* Top Image Section */}
                                    <div className="w-full aspect-[326/182] rounded-t-[19px] flex items-center justify-center text-zinc-400 font-bold uppercase tracking-widest text-xs relative">
                                        TURF IMAGE
                                    </div>

                                    {/* Horizontal Divider */}
                                    <div className="w-full h-[0.5px] bg-[#AEAEAE]" />

                                    {/* Bottom Details Section */}
                                    <div className="p-5 flex justify-between items-center bg-white rounded-b-[19px]">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-[19px] font-medium text-black uppercase leading-none" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
                                                {item.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 -ml-0.5">
                                                <span className="text-[14px] font-medium text-[#866BFF] tracking-tighter">--</span>
                                                <Star size={12} className="text-[#866BFF] fill-[#866BFF]" />
                                            </div>
                                            <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-tight" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
                                                {item.location}
                                            </p>
                                        </div>
                                        <button
                                            className="h-[42px] px-3 bg-black text-white text-[24px] font-medium rounded-[10px] uppercase transition-transform active:scale-95 leading-none flex items-center justify-center mb-5"
                                            style={{ fontFamily: "var(--font-anek-tamil-condensed), sans-serif" }}
                                        >
                                            BOOK SLOTS
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section >

                {/* 6. Footer Banner (Ticpin Pass) */}
                < div className="px-6 " >
                    <Link href="/ticpass" className="block rounded-[15px] overflow-hidden group relative h-[120px] mt-[-25px] cursor-pointer">
                        <img src="/ticpin banner.jpg" alt="Ticpin Pass" className="w-full h-full" />
                    </Link>
                </div >

            </main >

            {/* 7. Footer Section */}
            < footer className="bg-[#212121] px-8 py-10 flex flex-col items-center text-center" >
                <div className="mb-6">
                    <img src="/ticpin-logo-white1.svg" alt="TICPIN" className="h-[32px] w-auto" />
                </div>

                <div className="flex flex-col gap-4 mb-8 font-medium">
                    <Link href="/terms" className="text-white text-[15px] hover:opacity-70 transition-opacity">Terms & Conditions</Link>
                    <Link href="/privacy" className="text-white text-[15px] hover:opacity-70 transition-opacity">Privacy Policy</Link>
                    <Link href="/contact" className="text-white text-[15px] hover:opacity-70 transition-opacity">Contact Us</Link>
                    <Link href="/list-your-events" className="text-white text-[15px] hover:opacity-70 transition-opacity">List your events</Link>
                </div>

                <div className="w-full h-[0.5px] bg-[#686868] mb-8" />

                <p className="text-[#686868] text-[11px] leading-[1.5] mb-8 px-2 font-medium">
                    By accessing this page, you confirm that you have read, understood, and agreed to our Terms of Service, Cookie Policy, Privacy Policy, and Content Guidelines. All rights reserved.
                </p>

                <div className="flex gap-2 items-center">
                    <Link href="https://whatsapp.com/channel/0029Vb8KoCH3mFY1M9gR4412"><img src="/social icons/whatsapp.svg" alt="WhatsApp" className="w-8 h-8" /></Link>
                    <Link href="https://www.facebook.com/profile.php?id=61579518933930#"><img src="/social icons/facebook.svg" alt="Facebook" className="w-8 h-8" /></Link>
                    <Link href="https://www.instagram.com/ticpinindia/"><img src="/social icons/instagram.svg" alt="Instagram" className="w-8 h-8" /></Link>
                    <Link href="https://x.com/ticpin"><img src="/social icons/x.svg" alt="X" className="w-8 h-8" /></Link>
                    <Link href="https://www.youtube.com/channel/UCrGSN3cv3q1x3yI5q7LILtw"><img src="/social icons/youtube.svg" alt="YouTube" className="w-8 h-8" /></Link>
                </div>
            </footer >
        </div >
    );
}
