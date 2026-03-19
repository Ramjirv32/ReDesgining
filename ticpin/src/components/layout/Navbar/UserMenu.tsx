'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
                className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center cursor-pointer min-w-max transition-all hover:ring-2 hover:ring-offset-2 ring-[#5331EA]/50"
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
        </div>
    );
};

export default UserMenu;
