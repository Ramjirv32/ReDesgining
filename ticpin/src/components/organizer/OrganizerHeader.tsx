'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Utensils, Ticket, Gamepad2 } from 'lucide-react';
import ProfileSidebar from './ProfileSidebar';
import UserSidebar from './UserSidebar';

interface OrganizerHeaderProps {
    activeTab?: 'events' | 'play' | 'dining';
}

export default function OrganizerHeader({ activeTab }: OrganizerHeaderProps) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);

    const switcherItems = [
        { id: 'dining', label: 'Dining', icon: Utensils },
        { id: 'events', label: 'Events', icon: Ticket },
        { id: 'play', label: 'Play', icon: Gamepad2 },
    ];

    return (
        <>
            <header className="w-full h-[114px] bg-white flex items-center justify-between px-10 shadow-[0px_0.5px_5px_rgba(0,0,0,0.15)] z-[10] relative">
                <div className="flex items-center gap-8">
                    <button onClick={() => router.push('/')} className="transition-opacity hover:opacity-80">
                        <img 
                            src="https://res.cloudinary.com/dt9vkv9as/image/upload/v1741270000/WORDMARK_PNG_1.png" 
                            alt="TICPIN" 
                            className="h-[40px] w-auto object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<span class="font-black text-2xl tracking-tighter">TICPIN</span>';
                            }}
                        />
                    </button>
                    {activeTab && (
                        <>
                            <div className="w-[1px] h-8 bg-zinc-300 hidden md:block" />
                            <div className="flex gap-4 items-center">
                                {switcherItems.map((item) => (
                                    <button
                                        key={item.id}
                                        title={item.label}
                                        onClick={() => router.push(`/organizer/dashboard?category=${item.id}`)}
                                        className={`w-12 h-12 flex items-center justify-center rounded-[12px] transition-all group ${activeTab === item.id ? 'bg-black text-white shadow-md' : 'text-[#686868] hover:bg-black/5'}`}
                                    >
                                        <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'text-[#686868] group-hover:text-black'} />
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Profile Avatar -> Opens User Settings Sidebar */}
                    <button
                        onClick={() => {
                            console.log('OPENING USER SIDEBAR');
                            setIsUserOpen(true);
                            setIsMenuOpen(false); // Ensure only one is open
                        }}
                        className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 border-2 border-white shadow-sm hover:scale-110 transition-transform"
                    >
                        <img 
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nala" 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                        />
                    </button>

                    {/* Hamburger Menu -> Opens Main Navigation Sidebar */}
                    <button 
                        onClick={() => {
                            console.log('OPENING NAVIGATION SIDEBAR');
                            setIsMenuOpen(true);
                            setIsUserOpen(false); // Ensure only one is open
                        }}
                        className="p-2 text-black hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                        <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="8" y="14" width="24" height="3" rx="1.5" fill="black"/>
                            <rect x="8" y="23" width="24" height="3" rx="1.5" fill="black"/>
                        </svg>
                    </button>
                </div>
            </header>

            {/* Main Navigation Sidebar (All Events, Payouts, etc.) */}
            <ProfileSidebar 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
            />

            {/* User Account Sidebar (Profile, Settings) */}
            <UserSidebar 
                isOpen={isUserOpen}
                onClose={() => setIsUserOpen(false)}
            />
        </>
    );
}
