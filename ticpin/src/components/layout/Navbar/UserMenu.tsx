'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
    const dashboardHref = session
        ? `/organizer/dashboard?category=${session.vertical}`
        : '/organizer/dashboard';

    return (
        <div className="relative">
            <div
                onClick={onToggleMenu}
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

            {/* User dropdown */}
            {!session && userSession && isMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white border border-zinc-200 rounded-[16px] shadow-xl z-50 py-2">
                    <div className="px-4 py-2 border-b border-zinc-100">
                        <p className="text-[13px] font-semibold text-black truncate">{userSession.name || 'Member'}</p>
                        <p className="text-[12px] text-[#686868] truncate">{userSession.phone}</p>
                    </div>
                    {userSession.phone === '6383667872' && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-3 text-[15px] font-medium text-black hover:bg-zinc-50 transition-colors"
                        >
                            👑 Admin Panel
                        </Link>
                    )}
                    <button
                        onClick={onOpenProfile}
                        className="w-full text-left flex items-center gap-2 px-4 py-3 text-[15px] font-medium text-black hover:bg-zinc-50 transition-colors"
                    >
                        ⚙️ Profile Settings
                    </button>
                    <Link
                        href="/my-pass"
                        className="flex items-center gap-2 px-4 py-3 text-[15px] font-medium text-black hover:bg-zinc-50 transition-colors"
                    >
                        🎫 My Pass
                    </Link>
                    <button
                        onClick={onUserLogout}
                        className="w-full text-left px-4 py-3 text-[15px] font-medium text-red-500 hover:bg-zinc-50 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            )}

            {/* Organizer dropdown */}
            {session && isMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white border border-zinc-200 rounded-[16px] shadow-xl z-50 py-2 font-[family-name:var(--font-anek-latin)]">
                    <div className="px-4 py-2 border-b border-zinc-100">
                        <p className="text-[13px] text-[#686868] truncate">{session.email}</p>
                        <p className="text-[13px] font-semibold text-black capitalize">{session.vertical} organizer</p>
                    </div>

                    <Link
                        href={dashboardHref}
                        className="flex items-center gap-2 px-4 py-3 text-[15px] font-medium text-black hover:bg-zinc-50 transition-colors"
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/organizer/profile"
                        className="flex items-center gap-2 px-4 py-3 text-[15px] font-medium text-black hover:bg-zinc-50 transition-colors"
                    >
                        Edit Profile
                    </Link>

                    {session.isAdmin && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-3 text-[15px] font-medium text-black hover:bg-zinc-50 transition-colors"
                        >
                            Admin Panel
                        </Link>
                    )}

                    <button
                        onClick={onOrganizerLogout}
                        className="w-full text-left px-4 py-3 text-[15px] font-medium text-red-500 hover:bg-zinc-50 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default React.memo(UserMenu);
