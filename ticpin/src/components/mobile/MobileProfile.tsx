'use client';

import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserSession } from '@/lib/auth/user';
import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/modals/AuthModal'), { ssr: false });

interface Booking {
    id: string;
    type: 'dining' | 'event' | 'play';
    title: string;
    date: string;
    status: string;
}

interface MobileProfileProps {
    bookings?: Booking[];
}

export default function MobileProfile({ bookings = [] }: MobileProfileProps) {
    const router = useRouter();
    const session = useUserSession();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const name = session?.displayName || session?.email?.split('@')[0] || 'Guest';
    const number = session?.phoneNumber || 'Not provided';

    const diningBookings = bookings.filter(b => b.type === 'dining');
    const eventBookings = bookings.filter(b => b.type === 'event');
    const playBookings = bookings.filter(b => b.type === 'play');

    const menuGroups = [
        {
            items: [
                { icon: <List size={22} className="text-[#686868]" />, label: "Ticlists", onClick: () => {} },
                { icon: <Utensils size={22} className="text-[#686868]" />, label: "Dining reminders", count: diningBookings.length, onClick: () => router.push('/profile/bookings/dining') },
                { icon: <Music size={22} className="text-[#686868]" />, label: "Event reminders", count: eventBookings.length, onClick: () => router.push('/profile/bookings/events') },
                { icon: <PlayCircle size={22} className="text-[#686868]" />, label: "Play reminders", count: playBookings.length, onClick: () => router.push('/profile/bookings/play') },
            ]
        },
        {
            items: [
                { icon: <HelpCircle size={22} className="text-[#686868]" />, label: "Frequently asked questions", onClick: () => router.push('/faq') },
                { icon: <MessageCircle size={22} className="text-[#686868]" />, label: "Chat with us", onClick: () => {} },
            ]
        },
        {
            items: [
                { icon: <User size={22} className="text-[#686868]" />, label: "Account settings", onClick: () => router.push('/profile/settings') },
                { icon: <Info size={22} className="text-[#686868]" />, label: "About us", onClick: () => router.push('/about') },
            ]
        },
        {
            items: [
                { icon: <LogOut size={22} className="text-[#686868]" />, label: "Logout", onClick: () => {} },
            ]
        }
    ];

    if (!session) {
        return (
            <div className="md:hidden min-h-screen w-full bg-[#F1F1F1] font-sans px-[15px] py-6 overflow-y-auto" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
                <header className="flex items-center gap-[10px] mb-[45px]">
                    <button
                        onClick={() => router.back()}
                        className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center"
                    >
                        <ChevronLeft size={20} className="text-black" />
                    </button>
                    <h1 className="text-[18px] font-medium text-black">Profile</h1>
                </header>

                <div className="flex flex-col items-center justify-center py-20">
                    <User size={64} className="text-zinc-300 mb-4" />
                    <p className="text-[16px] text-zinc-500 mb-6 text-center">Sign in to view your profile and bookings</p>
                    <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="px-8 h-[48px] bg-black text-white rounded-full text-[16px] font-medium"
                    >
                        Sign In
                    </button>
                </div>

                <AuthModal
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    onSuccess={() => window.location.reload()}
                />
            </div>
        );
    }

    return (
        <div className="md:hidden min-h-screen w-full bg-[#F1F1F1] font-sans px-[15px] py-6 overflow-y-auto" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
            {/* Header Section */}
            <header className="flex items-center gap-[10px] mb-[45px]">
                <button
                    onClick={() => router.back()}
                    className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center"
                >
                    <ChevronLeft size={20} className="text-black" />
                </button>
                <h1 className="text-[18px] font-medium text-black">
                    Profile
                </h1>
            </header>

            {/* User Info Section */}
            <div className="flex items-center justify-between mb-[26px]">
                <div className="flex items-center gap-[14px]">
                    <div className="w-[70px] h-[70px] bg-[#D9D9D9] rounded-full flex-shrink-0 overflow-hidden relative">
                        {session?.photoURL ? (
                            <Image src={session.photoURL} alt={name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#866BFF] text-white text-[24px] font-bold">
                                {name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-[18px] font-medium text-black leading-none mb-1">
                            {name}
                        </h2>
                        <p className="text-[15px] font-normal text-black leading-none">
                            {number}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => router.push('/profile/edit')}
                    className="p-2"
                >
                    <Pencil size={18} className="text-[#212121]" />
                </button>
            </div>

            {/* Ticpin Pass Banner */}
            <div className="w-full h-[57px] bg-white bg-opacity-60 rounded-[15px] flex items-center justify-center mb-[20px] border border-[#D0D0D0]">
                <span className="text-[18px] font-medium text-black">
                    Ticpin Pass Banner
                </span>
            </div>

            {/* Your Bookings Section */}
            <div className="mb-[35px]">
                <h3 className="text-[18px] font-medium text-black mb-[15px]">
                    Your bookings
                </h3>
                <div className="flex gap-[15px] overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { icon: <Utensils size={32} className="text-black" />, label: "Dining bookings", count: diningBookings.length, href: '/profile/bookings/dining' },
                        { icon: <Music size={32} className="text-black" />, label: "Event tickets", count: eventBookings.length, href: '/profile/bookings/events' },
                        { icon: <PlayCircle size={32} className="text-black" />, label: "Play bookings", count: playBookings.length, href: '/profile/bookings/play' }
                    ].map((item, i) => (
                        <div 
                            key={i} 
                            onClick={() => router.push(item.href)}
                            className="flex-shrink-0 w-[134px] h-[92px] bg-white border border-[#D0D0D0] rounded-[25px] flex flex-col items-center justify-center gap-[6px] cursor-pointer active:scale-95 transition-transform"
                        >
                            {item.icon}
                            <span className="text-[15px] font-medium text-black text-center leading-none">
                                {item.label}
                            </span>
                            {item.count > 0 && (
                                <span className="text-[12px] bg-[#866BFF] text-white px-2 py-0.5 rounded-full">
                                    {item.count}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Menu Groups */}
            <div className="space-y-[15px]">
                {menuGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="bg-white rounded-[22px] border border-[#D0D0D0] overflow-hidden">
                        {group.items.map((item, itemIdx) => (
                            <div key={itemIdx}>
                                <button 
                                    onClick={item.onClick}
                                    className="w-full flex items-center justify-between px-5 h-[57px] active:bg-zinc-50 transition-colors"
                                >
                                    <div className="flex items-center gap-[21px]">
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            {item.icon}
                                        </div>
                                        <span className="text-[15px] font-medium text-black">
                                            {item.label}
                                        </span>
                                        {'count' in item && item.count > 0 && (
                                            <span className="text-[12px] bg-[#866BFF] text-white px-2 py-0.5 rounded-full">
                                                {item.count}
                                            </span>
                                        )}
                                    </div>
                                    <ChevronRight size={18} className="text-black" />
                                </button>
                                {itemIdx < group.items.length - 1 && (
                                    <div className="mx-5 border-b border-[#686868] opacity-50" />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Footer Spacing */}
            <div className="h-20" />
        </div>
    );
}

// Import missing icons
import { List, Utensils, Music, PlayCircle, HelpCircle, MessageCircle, User, Info, LogOut } from 'lucide-react';
