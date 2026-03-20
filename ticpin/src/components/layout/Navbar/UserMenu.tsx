'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Ticket, Utensils, Gamepad2 } from 'lucide-react';
import type { OrganizerSession } from '@/lib/auth/organizer';
import type { UserSession } from '@/lib/auth/user';

interface UserMenuProps {
    session: OrganizerSession | null;
    userSession: UserSession | null;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onUserLogout: () => void;
    onOrganizerLogout: () => void;
    onOpenProfile: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
    session,
    userSession,
    isMenuOpen,
    onToggleMenu,
    onUserLogout,
    onOrganizerLogout,
    onOpenProfile,
}) => {
    const router = useRouter();

    const dashboardHref = session
        ? `/organizer/dashboard?category=${session.vertical}`
        : '/organizer/dashboard';

    return (
        <div className="relative">
            <div
                onClick={onToggleMenu}
                className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-offset-2 ring-[#5331EA]/50 overflow-hidden aspect-square shrink-0"
                style={{
                    backgroundColor: session ? '#5331EA' : (userSession ? '#7b2ff7' : '#E1E1E1'),
                }}
            >
                {session ? (
                    <span className="text-white text-[14px] font-bold uppercase">
                        {session.email.charAt(0)}
                    </span>
                ) : userSession ? (
                    userSession.profilePhoto ? (
                        <Image
                            src={userSession.profilePhoto}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-white text-[14px] font-bold uppercase">
                            {userSession.name?.charAt(0) || 'U'}
                        </span>
                    )
                ) : (
                    <Image src="/profile icon.svg" alt="Profile" width={24} height={24} className="w-5 h-5 md:w-6 md:h-6 object-contain" />
                )}
            </div>

            {/* Dropdown Menu */}
            {isMenuOpen && (session || userSession) && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-zinc-100 py-2 z-50">
                    {userSession && (
                        <>
                            {/* User Info */}
                            <div className="px-4 py-3 border-b border-zinc-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#7b2ff7] rounded-full flex items-center justify-center">
                                        {userSession.profilePhoto ? (
                                            <Image
                                                src={userSession.profilePhoto}
                                                alt="Profile"
                                                width={32}
                                                height={32}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-white text-[12px] font-bold uppercase">
                                                {userSession.name?.charAt(0) || 'U'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-zinc-900 truncate">
                                            {userSession.name || 'User'}
                                        </div>
                                        <div className="text-sm text-zinc-500 truncate">
                                            {userSession.email || 'No email'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Navigation */}
                            <div className="py-2">
                                <div className="px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                    My Bookings
                                </div>
                                <Link
                                    href="/bookings/event-tickets"
                                    className="flex items-center gap-3 px-4 py-2 text-zinc-700 hover:bg-zinc-50 transition-colors"
                                    onClick={() => {
                                        onToggleMenu();
                                    }}
                                >
                                    <Ticket size={16} />
                                    <span>Event Tickets</span>
                                </Link>
                                <Link
                                    href="/bookings/play-tickets"
                                    className="flex items-center gap-3 px-4 py-2 text-zinc-700 hover:bg-zinc-50 transition-colors"
                                    onClick={() => {
                                        onToggleMenu();
                                    }}
                                >
                                    <Gamepad2 size={16} />
                                    <span>Play Bookings</span>
                                </Link>
                                <Link
                                    href="/bookings/dining-tickets"
                                    className="flex items-center gap-3 px-4 py-2 text-zinc-700 hover:bg-zinc-50 transition-colors"
                                    onClick={() => {
                                        onToggleMenu();
                                    }}
                                >
                                    <Utensils size={16} />
                                    <span>Dining Reservations</span>
                                </Link>
                            </div>
                        </>
                    )}

                    {/* Organizer Dashboard */}
                    {session && (
                        <Link
                            href={dashboardHref}
                            className="flex items-center gap-3 px-4 py-2 text-zinc-700 hover:bg-zinc-50 transition-colors"
                            onClick={() => {
                                onToggleMenu();
                            }}
                        >
                            <span>Dashboard</span>
                        </Link>
                    )}

                    {/* Logout */}
                    <div className="border-t border-zinc-100 pt-2">
                        <button
                            onClick={() => {
                                if (session) {
                                    onOrganizerLogout();
                                } else {
                                    onUserLogout();
                                }
                                onToggleMenu();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
