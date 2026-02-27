'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import AuthModal from '@/components/modals/AuthModal';
import LocationModal from '@/components/modals/LocationModal';
import { getOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import type { OrganizerSession } from '@/lib/auth/organizer';
import { useUserSession, clearUserSession } from '@/lib/auth/user';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [currentLocation, setCurrentLocation] = useState('Location Name');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [authView, setAuthView] = useState<'number' | 'otp' | 'profile' | 'location'>('number');
    const [session, setSession] = useState<OrganizerSession | null>(null);
    const userSession = useUserSession();
    const profileRef = useRef<HTMLDivElement>(null);

    const isPlayPage = pathname.startsWith('/play');
    const isListingPage =
        pathname.startsWith('/list-your-dining') ||
        pathname.startsWith('/list-your-events') ||
        pathname.startsWith('/list-your-play');
    const isOrganizerDashboard = pathname === '/organizer/dashboard';

    const hideNavbar =
        pathname === '/contact' ||
        pathname === '/terms' ||
        pathname === '/privacy' ||
        pathname === '/refund' ||
        pathname.endsWith('/book') ||
        pathname.endsWith('/book/tickets') ||
        pathname.endsWith('/book/review') ||
        pathname.endsWith('/admin/ChatSupportPage') ||
        pathname.endsWith('/admin/ChatSupportPage/reply');

    useEffect(() => {
        if (hideNavbar) return;
        const load = () => setSession(getOrganizerSession());
        load();
        window.addEventListener('organizer-auth-change', load);
        return () => window.removeEventListener('organizer-auth-change', load);
    }, [hideNavbar]);

    useEffect(() => {
        if (hideNavbar) return;
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [hideNavbar]);

    if (hideNavbar) return null;

    const handleLogout = () => {
        clearOrganizerSession();
        setSession(null);
        setIsProfileMenuOpen(false);
        router.push('/');
    };

    const handleUserLogout = () => {
        clearUserSession();
        setIsProfileMenuOpen(false);
        router.push('/');
    };

    const handleProfileClick = () => {
        if (session) {
            setIsProfileMenuOpen(prev => !prev);
        } else if (userSession) {
            setIsProfileMenuOpen(prev => !prev);
        } else {
            setAuthView('number');
            setIsAuthOpen(true);
        }
    };

    const navItems = [
        { name: 'Dining', href: '/dining' },
        { name: 'Events', href: '/events' },
        { name: 'Play', href: '/play' },
    ];

    const dashboardHref = session
        ? `/organizer/dashboard?category=${session.vertical}`
        : '/organizer/dashboard';

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white h-16 md:h-20 flex items-center">
            <div className="w-full h-full flex items-center justify-between px-3 md:px-4 lg:px-6">
                {/* Left: Logo, Explore and Tabs */}
                <div className="flex items-center gap-3 md:gap-8 min-w-max">
                    <div className="flex items-center gap-3 md:gap-6 relative">
                        <Link href="/dining" className={isListingPage ? "flex items-center" : "border-r border-zinc-200 pr-3 md:pr-6 flex items-center"}>
                            <img
                                src="/ticpin-logo-black.png"
                                alt="TicPin Logo"
                                className="h-4 md:h-7 w-auto object-contain"
                            />
                        </Link>
                    </div>

                    {/* Tabs - Hidden for listing pages or organizer-dashboard */}
                    {!isListingPage && !isOrganizerDashboard && (
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
                                        } : { fontFamily: 'Anek Latin', color: 'black' }}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </div>

                {/* Right: Location, Search & Profile */}
                <div className="flex items-center gap-3 md:gap-6 justify-end">
                    {!isListingPage && !isOrganizerDashboard && !isSearchVisible ? (
                        <>
                            <div
                                onClick={() => setIsLocationOpen(true)}
                                className="hidden lg:flex items-center gap-2 cursor-pointer hover:text-primary transition-colors min-w-max"
                            >
                                <img src="/loc icon.svg" alt="Location" className="w-4.5 h-4.5 object-contain" />
                                <span className="text-[16px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>
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

                    {!isListingPage && isSearchVisible && (
                        <div className="relative flex-1 max-w-md animate-in slide-in-from-right-4 duration-300">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5" style={{
                                    backgroundColor: isPlayPage ? '#E7C200' : '#5331EA',
                                    maskImage: 'url(/search.svg)', WebkitMaskImage: 'url(/search.svg)',
                                    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                    maskPosition: 'center', WebkitMaskPosition: 'center',
                                    maskSize: 'contain', WebkitMaskSize: 'contain'
                                }} />
                            </div>
                            <input autoFocus type="text" placeholder="Search for events, plays and restaurants"
                                onBlur={() => setIsSearchVisible(false)}
                                className="w-full h-10 pl-12 pr-10 border border-[#686868] rounded-[9px] text-sm font-medium focus:outline-none focus:border-[#5331EA] transition-all font-[family-name:var(--font-anek-latin)]" />
                            <button onClick={() => setIsSearchVisible(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#686868] hover:text-black">
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {/* Profile / Organizer icon */}
                    <div ref={profileRef} className="relative">
                        <div
                            onClick={handleProfileClick}
                            className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center cursor-pointer min-w-max transition-all hover:ring-2 hover:ring-offset-2"
                            style={{
                                backgroundColor: session ? '#5331EA' : (userSession ? '#7b2ff7' : '#E1E1E1'),
                            }}
                        >
                            {session ? (
                                <span className="text-white text-[14px] font-bold uppercase">
                                    {session.email.charAt(0)}
                                </span>
                            ) : userSession ? (
                                <span className="text-white text-[14px] font-bold uppercase">
                                    {userSession.name?.charAt(0) || 'U'}
                                </span>
                            ) : (
                                <img src="/profile icon.svg" alt="Profile" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
                            )}
                        </div>

                        {/* User dropdown */}
                        {!session && userSession && isProfileMenuOpen && (
                            <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white border border-zinc-200 rounded-[16px] shadow-xl z-50 py-2 font-[family-name:var(--font-anek-latin)]">
                                <div className="px-4 py-2 border-b border-zinc-100">
                                    <p className="text-[13px] font-semibold text-black truncate">{userSession.name || 'Member'}</p>
                                    <p className="text-[12px] text-[#686868] truncate">{userSession.phone}</p>
                                </div>
                                <Link
                                    href="/my-pass"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                    className="flex items-center gap-2 px-4 py-3 text-[15px] font-medium text-black hover:bg-zinc-50 transition-colors"
                                >
                                    🎫 My Pass
                                </Link>
                                <button
                                    onClick={handleUserLogout}
                                    className="w-full text-left px-4 py-3 text-[15px] font-medium text-red-500 hover:bg-zinc-50 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        )}

                        {/* Organizer dropdown */}
                        {session && isProfileMenuOpen && (
                            <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white border border-zinc-200 rounded-[16px] shadow-xl z-50 py-2 font-[family-name:var(--font-anek-latin)]">
                                <div className="px-4 py-2 border-b border-zinc-100">
                                    <p className="text-[13px] text-[#686868] truncate">{session.email}</p>
                                    <p className="text-[13px] font-semibold text-black capitalize">{session.vertical} organizer</p>
                                </div>

                                <Link
                                    href={dashboardHref}
                                    onClick={() => setIsProfileMenuOpen(false)}
                                    className="flex items-center gap-2 px-4 py-3 text-[15px] font-medium text-black hover:bg-zinc-50 transition-colors"
                                >
                                    Dashboard
                                </Link>

                                <Link
                                    href="/organizer/profile"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                    className="flex items-center gap-2 px-4 py-3 text-[15px] font-medium text-black hover:bg-zinc-50 transition-colors"
                                >
                                    Edit Profile
                                </Link>

                                {/* Admin Panel — only for admin */}
                                {session.isAdmin && (
                                    <Link
                                        href="/admin"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                        className="flex items-center gap-2 px-4 py-3 text-[15px] font-medium text-black hover:bg-zinc-50 transition-colors"
                                    >
                                        Admin Panel
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 text-[15px] font-medium text-red-500 hover:bg-zinc-50 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                initialView={authView}
            />
            <LocationModal isOpen={isLocationOpen} onClose={() => setIsLocationOpen(false)} />
        </header>
    );
}
