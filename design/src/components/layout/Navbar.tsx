'use client';

import Link from 'next/link';
import { ChevronDown, UserCircle, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import AuthModal from '@/components/modals/AuthModal';
import LocationModal from '@/components/modals/LocationModal';

export default function Navbar() {
    const pathname = usePathname();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(true); // Mocking logged in for now to show the new profile sidebar
    const [isExploreOpen, setIsExploreOpen] = useState(false);
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [currentLocation, setCurrentLocation] = useState('Location Name');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const isPlayPage = pathname.startsWith('/play');
    const isListYourDining = pathname.startsWith('/list-your-dining');
    const isOrganizerDashboard = pathname === '/organizer/dashboard';
    const isHome = pathname === '/';
    const isEventDetail = pathname.match(/^\/events\/[^/]+$/);
    const isDiningDetail = pathname.match(/^\/dining\/venue\/[^/]+$/);
    const isEvents = pathname === '/events';

    if (pathname === '/play') return null;
    if (pathname === '/contact') return null;
    if (pathname === '/terms') return null;
    if (pathname === '/privacy') return null;
    if (pathname === '/refund') return null;
    if (pathname === '/ticpass') return null;
    if (pathname.endsWith('/book')) return null;
    if (pathname.endsWith('/book/tickets')) return null;
    if (pathname.endsWith('/admin/ChatSupportPage')) return null;
    if (pathname.endsWith('/admin/ChatSupportPage/reply')) return null;
    if (pathname.startsWith('/bookings')) return null;

    const navItems = [
        { name: 'Dining', href: '/dining' },
        { name: 'Events', href: '/events' },
        { name: 'Play', href: '/play' },
    ];



    return (
        <header className={`${(isHome || isEventDetail || isDiningDetail || isEvents) ? 'hidden md:flex' : 'flex'} sticky top-0 z-50 w-full border-b border-zinc-200 bg-white h-16 md:h-20 items-center`}>
            <div className="w-full h-full flex items-center justify-between px-3 md:px-4 lg:px-6">
                {/* Left: Logo, Explore and Tabs */}
                <div className="flex items-center gap-3 md:gap-8 min-w-max">
                    <div className="flex items-center gap-3 md:gap-6 relative">
                        <Link href="/dining" className={isListYourDining ? "flex items-center" : "border-r border-zinc-200 pr-3 md:pr-6 flex items-center"}>
                            <img
                                src="/ticpin-logo-black.png"
                                alt="TicPin Logo"
                                className="h-4 md:h-7 w-auto object-contain"
                            />
                        </Link>

                        {/* Explore Dropdown - Hidden for list-your-dining */}



                    </div>

                    {/* Tabs - Hidden for list-your-dining or organizer-dashboard */}
                    {!isListYourDining && !isOrganizerDashboard && (
                        <nav className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide">
                            {navItems.map((item) => {
                                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="px-4 py-1 text-[18px] font-medium transition-all duration-300 whitespace-nowrap"
                                        style={isActive ? {
                                            fontFamily: 'Anek Latin',
                                            background: item.name === 'Play' ? 'rgba(231, 194, 0, 0.15)' : 'rgba(83, 49, 234, 0.15)',
                                            color: 'black',
                                            borderRadius: '30px'
                                        } : {
                                            fontFamily: 'Anek Latin',
                                            color: 'black'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.color = 'black';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.color = 'black';
                                            }
                                        }}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </div>

                {/* Right: Location & User (Now moved closer to tabs) */}
                <div className="flex items-center gap-3 md:gap-6 justify-end">
                    {!isListYourDining && !isOrganizerDashboard && !isSearchVisible ? (
                        <>
                            <div
                                onClick={() => setIsLocationOpen(true)}
                                className="hidden lg:flex items-center gap-2 cursor-pointer hover:text-primary transition-colors min-w-max"
                            >
                                <img
                                    src="/loc icon.svg"
                                    alt="Location"
                                    className="w-4.5 h-4.5 object-contain"
                                />
                                <span className="text-[16px] font-medium text-black break-words" style={{ fontFamily: 'Anek Latin' }}>
                                    {currentLocation}
                                </span>
                            </div>
                            <div
                                onClick={() => setIsSearchVisible(true)}
                                className="hidden lg:block w-5 h-5 cursor-pointer"
                                style={{
                                    backgroundColor: isPlayPage ? '#E7C200' : '#5331EA',
                                    maskImage: 'url(/search.svg)',
                                    WebkitMaskImage: 'url(/search.svg)',
                                    maskRepeat: 'no-repeat',
                                    WebkitMaskRepeat: 'no-repeat',
                                    maskPosition: 'center',
                                    WebkitMaskPosition: 'center',
                                    maskSize: 'contain',
                                    WebkitMaskSize: 'contain'
                                }}
                            />
                        </>
                    ) : null}
                    {!isListYourDining && isSearchVisible && (
                        <div className="relative flex-1 max-w-md animate-in slide-in-from-right-4 duration-300">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <div
                                    className="w-5 h-5"
                                    style={{
                                        backgroundColor: isPlayPage ? '#E7C200' : '#5331EA',
                                        maskImage: 'url(/search.svg)',
                                        WebkitMaskImage: 'url(/search.svg)',
                                        maskRepeat: 'no-repeat',
                                        WebkitMaskRepeat: 'no-repeat',
                                        maskPosition: 'center',
                                        WebkitMaskPosition: 'center',
                                        maskSize: 'contain',
                                        WebkitMaskSize: 'contain'
                                    }}
                                />
                            </div>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search for events, plays and restaurants"
                                onBlur={() => setIsSearchVisible(false)}
                                className="w-full h-10 pl-12 pr-10 border border-[#686868] rounded-[9px] text-sm font-medium focus:outline-none focus:border-[#5331EA] transition-all font-[family-name:var(--font-anek-latin)]"
                            />
                            <button
                                onClick={() => setIsSearchVisible(false)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#686868] hover:text-black"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                    <div
                        onClick={() => setIsAuthOpen(true)}
                        className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center cursor-pointer min-w-max"
                        style={{ backgroundColor: isPlayPage ? '#E1E1E1' : '#E1E1E1' }}
                    >
                        {/* Profile Icon */}
                        <img
                            src="/profile icon.svg"
                            alt="Profile"
                            className="w-5 h-5 md:w-6 md:h-6 object-contain"
                        />
                    </div>
                </div>
            </div>

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                initialView={isLoggedIn ? 'profile' : 'number'}
            />
            <LocationModal isOpen={isLocationOpen} onClose={() => setIsLocationOpen(false)} />
        </header>
    );
}