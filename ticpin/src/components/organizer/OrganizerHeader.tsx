'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Utensils, Ticket, Gamepad2, X } from 'lucide-react';
import ProfileSidebar from './ProfileSidebar';
import UserSidebar from './UserSidebar';

interface OrganizerHeaderProps {
    activeTab?: 'events' | 'play' | 'dining';
    firstItemLabel?: string;
}

export default function OrganizerHeader({ activeTab, firstItemLabel }: OrganizerHeaderProps) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);

    const switcherItems = [
        { id: 'dining', label: 'Dining' },
        { id: 'events', label: 'Events' },
        { id: 'play', label: 'Play' },
    ];

    return (
        <>
            <header className="w-full h-[114px] bg-white flex items-center justify-between px-10 shadow-[0px_0.5px_5px_rgba(0,0,0,0.15)] z-[10] relative">
                <div className="flex items-center gap-8">
                    <button onClick={() => router.push('/')} className="transition-opacity hover:opacity-80">
                        <img 
                            src="/ticpin-logo-black.png" 
                            alt="TICPIN" 
                            className="h-4 md:h-7 w-auto object-contain"
                        />
                    </button>
                    {activeTab && (
                        <>
                            <div className="w-[1px] h-8 bg-zinc-300 hidden md:block" />
                            <div className="flex gap-4 items-center">
                                {switcherItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => router.push(`/organizer/dashboard?category=${item.id}`)}
                                        className={`px-6 py-2 rounded-full font-medium transition-all ${
                                            activeTab === item.id 
                                                ? 'bg-black text-white shadow-md' 
                                                : 'text-[#686868] hover:bg-black/5 active:scale-95'
                                        }`}
                                        style={{ fontSize: '18px' }}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Profile Avatar/Cross button -> Opens User Settings Sidebar */}
                    <button
                        onClick={() => {
                            if (isUserOpen) setIsUserOpen(false);
                            else {
                                setIsUserOpen(true);
                                setIsMenuOpen(false);
                            }
                        }}
                        className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center transition-all ${isUserOpen ? 'bg-zinc-100' : 'bg-zinc-200 border-2 border-white shadow-sm hover:scale-110'}`}
                    >
                        {isUserOpen ? (
                            <X className="text-black" size={24} />
                        ) : (
                            <img 
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nala" 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        )}
                    </button>

                    {/* Hamburger/Cross Menu -> Opens Main Navigation Sidebar */}
                    <button 
                        onClick={() => {
                            if (isMenuOpen) setIsMenuOpen(false);
                            else {
                                setIsMenuOpen(true);
                                setIsUserOpen(false);
                            }
                        }}
                        className="p-2 text-black hover:bg-zinc-100 rounded-lg transition-colors flex items-center justify-center"
                    >
                        {isMenuOpen ? (
                            <X size={28} />
                        ) : (
                            <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="8" y="14" width="24" height="3" rx="1.5" fill="black"/>
                                <rect x="8" y="23" width="24" height="3" rx="1.5" fill="black"/>
                            </svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Navigation Sidebar (All Events, Payouts, etc.) */}
            <ProfileSidebar 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                firstItemLabel={firstItemLabel}
            />

            {/* User Account Sidebar (Profile, Settings) */}
            <UserSidebar 
                isOpen={isUserOpen}
                onClose={() => setIsUserOpen(false)}
            />
        </>
    );
}
