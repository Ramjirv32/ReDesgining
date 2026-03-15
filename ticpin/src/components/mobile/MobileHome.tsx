'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronRight, Star, Bell } from 'lucide-react';
import { useLocation } from '@/lib/useLocation';
import { useUserSession } from '@/lib/auth/user';
import Image from 'next/image';

interface Event {
    id: string;
    name: string;
    date?: string;
    time?: string;
    location?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    ticket_starts_from?: number;
}

interface Dining {
    id: string;
    name: string;
    city?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    rating?: number;
}

interface Play {
    id: string;
    name: string;
    city?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    rating?: number;
}

interface MobileHomeProps {
    events: Event[];
    dinings: Dining[];
    plays: Play[];
}

export default function MobileHome({ events, dinings, plays }: MobileHomeProps) {
    const router = useRouter();
    const { city } = useLocation();
    const session = useUserSession();
    const [windowWidth, setWindowWidth] = useState(390);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const placeholders = ["events", "dining", "play"];
    
    const carouselRef = useRef<HTMLDivElement>(null);
    const limelightRef = useRef<HTMLDivElement>(null);
    const playRef = useRef<HTMLDivElement>(null);
    const [scrollX, setScrollX] = useState(0);
    const [limelightScrollX, setLimelightScrollX] = useState(0);
    const [playScrollX, setPlayScrollX] = useState(0);
    
    const scrollEvents = events.length > 0 
        ? [...events.slice(0, 5), ...events.slice(0, 5), ...events.slice(0, 5)]
        : [];
    const limelightItems = dinings.slice(0, 5);
    const scrollLimelight = [...limelightItems, ...limelightItems, ...limelightItems];
    const playItems = plays.slice(0, 5);
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
        if (carouselRef.current && events.length > 0) {
            const container = carouselRef.current;
            const cardWidth = 280 + 24;
            const itemCount = Math.min(events.length, 5);
            const initialScroll = cardWidth * itemCount;
            container.scrollLeft = initialScroll;
            setScrollX(initialScroll);
        }
        if (limelightRef.current && dinings.length > 0) {
            const container = limelightRef.current;
            const cardWidth = 326 + 24;
            const itemCount = limelightItems.length;
            const initialScroll = cardWidth * itemCount;
            container.scrollLeft = initialScroll;
            setLimelightScrollX(initialScroll);
        }
        if (playRef.current && plays.length > 0) {
            const container = playRef.current;
            const cardWidth = 326 + 24;
            const itemCount = playItems.length;
            const initialScroll = cardWidth * itemCount;
            container.scrollLeft = initialScroll;
            setPlayScrollX(initialScroll);
        }
    }, [events.length, dinings.length, plays.length]);

    const handleScroll = () => {
        if (!carouselRef.current || events.length === 0) return;
        const container = carouselRef.current;
        const cardWidth = 280 + 24;
        const itemCount = Math.min(events.length, 5);
        const thirdWidth = cardWidth * itemCount;

        setScrollX(container.scrollLeft);

        if (container.scrollLeft <= 0) {
            container.scrollLeft = thirdWidth;
        } else if (container.scrollLeft >= thirdWidth * 2) {
            container.scrollLeft = thirdWidth;
        }
    };

    const handleLimelightScroll = () => {
        if (!limelightRef.current || dinings.length === 0) return;
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
        if (!playRef.current || plays.length === 0) return;
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

    return (
        <div
            className="md:hidden min-h-screen w-full overflow-x-hidden font-sans selection:bg-[#866BFF]/20"
            style={{ background: 'white' }}
        >
            {/* Header Section */}
            <header className="px-6 pt-7 pb-4">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-2">
                        <MapPin size={17} className="text-zinc-800" />
                        <span className="text-[15px] font-medium text-black leading-none">{city || 'Select Location'}</span>
                    </div>
                    <div
                        className="w-[35px] h-[35px] rounded-full bg-[#D9D9D9] flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={() => router.push('/profile')}
                    >
                        {session?.photoURL ? (
                            <Image src={session.photoURL} alt="Profile" width={35} height={35} className="object-cover" />
                        ) : (
                            <span className="text-[14px] font-bold text-zinc-600">
                                {session?.displayName?.charAt(0) || session?.email?.charAt(0) || '?'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full h-[48px] bg-white rounded-[28px] border border-[#AEAEAE] flex items-center px-5 mb-14">
                    <Search size={22} className="text-[#AEAEAE] flex-shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ml-3 w-full bg-transparent border-none outline-none text-[15px] font-medium text-black placeholder:text-[#AEAEAE]"
                        placeholder=""
                    />
                    {!searchQuery && (
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
                    )}
                </div>

                {/* Horizontal Divider */}
                <div className="w-full h-[1px] bg-[#AEAEAE] opacity-100 mb-6 mt-[-20px]" />

                {/* Categories Section */}
                <div className="grid grid-cols-3 gap-4 px-1">
                    {/* Dining */}
                    <div className="flex flex-col items-center" onClick={() => router.push('/dining')}>
                        <div
                            className="w-full aspect-[106/125] rounded-[25px] border-[#D9D9D9] border flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                            style={{ background: 'linear-gradient(180deg, #FFFFFF 50%, #E2D9FF 100%)' }}
                        >
                            <Utensils size={40} className="text-[#866BFF]" />
                            <span className="text-[15px] font-medium text-black uppercase tracking-tight">DINING</span>
                        </div>
                    </div>

                    {/* Events */}
                    <div className="flex flex-col items-center" onClick={() => router.push('/events')}>
                        <div
                            className="w-full aspect-[106/125] rounded-[30px] border-[#D9D9D9] border flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                            style={{ background: 'linear-gradient(180deg, #FFFFFF 50%, #E2D9FF 100%)' }}
                        >
                            <Music size={40} className="text-[#866BFF]" />
                            <span className="text-[15px] font-medium text-black uppercase tracking-tight">EVENTS</span>
                        </div>
                    </div>

                    {/* Play */}
                    <div className="flex flex-col items-center" onClick={() => router.push('/play')}>
                        <div
                            className="w-full aspect-[106/125] rounded-[30px] border-[#D9D9D9] border flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                            style={{ background: 'linear-gradient(180deg, #FFFFFF 50%, #FFF4C1 100%)' }}
                        >
                            <Trophy size={40} className="text-[#DFFF00]" />
                            <span className="text-[15px] font-medium text-black uppercase tracking-tight">PLAY</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Sections Container */}
            <main className="mt-12 space-y-16 pb-12">
                {/* Hot Right Now Section */}
                <section>
                    <h2 className="text-[20px] font-medium text-black text-center mb-8 uppercase tracking-wide mt-[-35px]">HOT RIGHT NOW</h2>
                    <div
                        ref={carouselRef}
                        onScroll={handleScroll}
                        className="flex gap-6 overflow-x-auto px-6 scrollbar-hide snap-x snap-mandatory items-center py-8"
                    >
                        {scrollEvents.length > 0 ? scrollEvents.map((event, idx) => {
                            const cardWidth = 280;
                            const gap = 24;
                            const totalCardWidth = cardWidth + gap;
                            const containerWidth = windowWidth;
                            const scrollCenter = scrollX + containerWidth / 2;
                            const cardCenter = (idx * totalCardWidth) + (cardWidth / 2) + 24;

                            const distance = Math.abs(scrollCenter - cardCenter);
                            const threshold = totalCardWidth;
                            const t = Math.min(distance / threshold, 1);

                            const scale = 1.1 - t * 0.10;
                            const opacity = 1 - t * 0;

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
                                        {event.portrait_image_url ? (
                                            <Image
                                                src={event.portrait_image_url}
                                                alt={event.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full p-6 flex flex-col items-center justify-center relative">
                                                <div className="absolute inset-0 opacity-40">
                                                    <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_30%_30%,#DFFF00_0%,transparent_40%),radial-gradient(circle_at_70%_70%,#5331EA_0%,transparent_50%),radial-gradient(circle_at_90%_20%,#DFFF00_0%,transparent_30%)] blur-[80px]" />
                                                </div>
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <h1 className="text-[36px] font-black text-[#DFFF00] italic leading-[0.8] tracking-tighter uppercase text-center"
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

                                        {/* Overlay Icons */}
                                        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-white">
                                            <Bell size={16} className="text-black" />
                                        </div>
                                    </div>

                                    {/* Bottom Details Section */}
                                    <div className="p-5 relative bg-white">
                                        <p className="text-[12px] font-medium text-[#5331EA] mb-1.5 uppercase tracking-wide">
                                            {event.date ? `${event.date.toUpperCase()}, ${event.time}` : "Date TBA"}
                                        </p>
                                        <h3 className="text-[20px] font-medium text-black uppercase leading-[1.1] tracking-tight line-clamp-2">
                                            {event.name || "Event Name"}
                                        </h3>
                                        <p className="text-[12px] font-regular text-[#8E8E8E] mt-2 uppercase tracking-wider truncate">
                                            {event.location || "Location TBA"}
                                        </p>
                                        <p className="text-[12px] font-regular text-[#8E8E8E] mt-0.5 uppercase tracking-wider">
                                            {event.ticket_starts_from ? `Starts at ₹${event.ticket_starts_from}` : "Price TBA"}
                                        </p>

                                        {/* Fire/Hot Icon */}
                                        <div className="absolute top-5 right-5 w-10 h-10 rounded-[12px] bg-[#EFEFEF] flex items-center justify-center mt-[-10px]">
                                            <span className="text-[16px]">🔥</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="w-full flex items-center justify-center py-10">
                                <p className="text-zinc-400 text-[14px]">No events available</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* In Limelight Section */}
                <section>
                    <h2 className="text-[22px] font-medium text-black text-center mb-8 uppercase tracking-wide mt-[-30px]">IN LIMELIGHT</h2>
                    <div
                        ref={limelightRef}
                        onScroll={handleLimelightScroll}
                        className="flex gap-6 overflow-x-auto px-6 scrollbar-hide snap-x snap-mandatory items-center py-8 mt-[-30px]"
                    >
                        {scrollLimelight.length > 0 ? scrollLimelight.map((item, idx) => {
                            const cardWidth = 326;
                            const gap = 24;
                            const totalCardWidth = cardWidth + gap;
                            const containerWidth = windowWidth;
                            const scrollCenter = limelightScrollX + containerWidth / 2;
                            const cardCenter = (idx * totalCardWidth) + (cardWidth / 2) + 24;

                            const distance = Math.abs(scrollCenter - cardCenter);
                            const threshold = totalCardWidth;
                            const t = Math.min(distance / threshold, 1);

                            const scale = 1.05 - t * 0.05;
                            const opacity = 1 - t * 0;

                            return (
                                <div
                                    key={`limelight-${idx}`}
                                    onClick={() => router.push(`/dining/venue/${item.id}`)}
                                    className="flex-shrink-0 w-[326px] max-w-[85vw] bg-white rounded-[15px] border-[0.5px] border-[#AEAEAE] snap-center snap-always transition-all duration-150 ease-out origin-center overflow-hidden cursor-pointer active:scale-95"
                                    style={{
                                        transform: `scale(${scale})`,
                                        opacity: opacity
                                    }}
                                >
                                    <div className="w-full aspect-[326/182] bg-zinc-100 relative">
                                        {item.landscape_image_url ? (
                                            <Image src={item.landscape_image_url} alt={item.name} fill className="object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-zinc-300 font-bold tracking-widest text-xs">DINING PREVIEW</div>
                                        )}
                                        <div className="absolute h-[29px] bottom-0 left-0 right-0 bg-[#AC9BF7] flex items-center px-4">
                                            <div className="flex items-center gap-1.5">
                                                <Star size={14} className="text-[#5331EA] fill-[#5331EA]" />
                                                <span className="text-white text-[14px] font-medium">Flat 40% OFF</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 flex justify-between items-end">
                                        <div>
                                            <h3 className="text-[17px] font-bold text-black uppercase line-clamp-2">{item.name}</h3>
                                            <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest">{item.city || 'CITY NAME'}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-400">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="w-full flex items-center justify-center py-10">
                                <p className="text-zinc-400 text-[14px]">No dining spots available</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Offers Section */}
                <section className="px-6 mt-[-50px]">
                    <h2 className="text-[20px] font-medium text-black text-center mb-8 uppercase tracking-wide">OFFERS</h2>
                    <div className="w-full h-[109px] bg-gradient-to-r from-[#AC9BF7] to-[#866BFF] rounded-[15px] border border-[#AC9BF7] relative overflow-hidden flex items-center justify-center px-8 mt-[-10px]">
                        <p className="text-white text-[20px] font-bold uppercase">Exclusive Deals</p>
                    </div>
                </section>

                {/* Play Near You Section */}
                <section>
                    <h2 className="text-[20px] font-medium text-black text-center mb-8 uppercase tracking-wide mt-[-20px]">PLAY NEAR YOU</h2>
                    <div
                        ref={playRef}
                        onScroll={handlePlayScroll}
                        className="flex gap-6 overflow-x-auto px-6 scrollbar-hide snap-x snap-mandatory items-center py-4"
                    >
                        {scrollPlay.length > 0 ? scrollPlay.map((item, idx) => {
                            const cardWidth = 326;
                            const gap = 24;
                            const totalCardWidth = cardWidth + gap;
                            const containerWidth = windowWidth;
                            const scrollCenter = playScrollX + containerWidth / 2;
                            const cardCenter = (idx * totalCardWidth) + (cardWidth / 2) + 24;

                            const distance = Math.abs(scrollCenter - cardCenter);
                            const threshold = totalCardWidth;
                            const t = Math.min(distance / threshold, 1);

                            const scale = 1.05 - t * 0.05;
                            const opacity = 1 - t * 0.2;

                            return (
                                <div
                                    key={`play-${idx}`}
                                    onClick={() => router.push(`/play/${encodeURIComponent(item.name)}`)}
                                    className="flex-shrink-0 w-[326px] max-w-[85vw] bg-white rounded-[15px] border-[0.5px] border-[#AEAEAE] snap-center snap-always transition-all duration-150 ease-out origin-center overflow-hidden p-[1px] cursor-pointer active:scale-95"
                                    style={{
                                        transform: `scale(${scale})`,
                                        opacity: opacity
                                    }}
                                >
                                    {/* Top Image Section */}
                                    <div className="w-full aspect-[326/182] rounded-t-[19px] relative bg-zinc-100">
                                        {item.landscape_image_url ? (
                                            <Image src={item.landscape_image_url} alt={item.name} fill className="object-cover rounded-t-[19px]" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-bold uppercase tracking-widest text-xs">TURF IMAGE</div>
                                        )}
                                    </div>

                                    {/* Horizontal Divider */}
                                    <div className="w-full h-[0.5px] bg-[#AEAEAE]" />

                                    {/* Bottom Details Section */}
                                    <div className="p-5 flex justify-between items-center bg-white rounded-b-[19px]">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-[19px] font-medium text-black uppercase leading-none">
                                                {item.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 -ml-0.5">
                                                <span className="text-[14px] font-medium text-[#866BFF] tracking-tighter">{item.rating || '--'}</span>
                                                <Star size={12} className="text-[#866BFF] fill-[#866BFF]" />
                                            </div>
                                            <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-tight">
                                                {item.city || 'LOCATION'}
                                            </p>
                                        </div>
                                        <button
                                            className="h-[42px] px-3 bg-black text-white text-[24px] font-medium rounded-[10px] uppercase transition-transform active:scale-95 leading-none flex items-center justify-center mb-5"
                                            style={{ fontFamily: "var(--font-anek-tamil-condensed), sans-serif" }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/play/${encodeURIComponent(item.name)}/book`);
                                            }}
                                        >
                                            BOOK SLOTS
                                        </button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="w-full flex items-center justify-center py-10">
                                <p className="text-zinc-400 text-[14px]">No play venues available</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Footer Banner (Ticpin Pass) */}
                <div className="px-6">
                    <div className="rounded-[15px] overflow-hidden group relative h-[120px] mt-[-25px] bg-gradient-to-r from-[#866BFF] to-[#5331EA] flex items-center justify-center">
                        <p className="text-white text-[24px] font-bold">TICPIN PASS</p>
                    </div>
                </div>
            </main>

            {/* Footer Section */}
            <footer className="bg-[#212121] px-8 py-10 flex flex-col items-center text-center">
                <div className="mb-6">
                    <span className="text-white text-[24px] font-black tracking-tighter">TICPIN</span>
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
                    <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white">WA</span>
                    <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white">FB</span>
                    <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white">IG</span>
                    <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white">X</span>
                    <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white">YT</span>
                </div>
            </footer>
        </div>
    );
}

// Import missing icons
import { Utensils, Music, Trophy } from 'lucide-react';
