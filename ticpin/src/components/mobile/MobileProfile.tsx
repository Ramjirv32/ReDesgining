'use client';

import { ChevronLeft, ChevronRight, Pencil, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserSession } from '@/lib/auth/user';
import { useState, useEffect } from 'react';
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

interface TicpinPass {
    id: string;
    name: string;
    status: 'active' | 'expired';
    end_date: string;
}

export default function MobileProfile({ bookings = [] }: MobileProfileProps) {
    const router = useRouter();
    const session = useUserSession();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [pass, setPass] = useState<TicpinPass | null>(null);
    const [passLoading, setPassLoading] = useState(false);

    useEffect(() => {
        if (session?.id) {
            fetchPass();
        }
    }, [session?.id]);

    const fetchPass = async () => {
        if (!session?.id) return;
        setPassLoading(true);
        try {
            const res = await fetch(`/backend/api/pass/user/${session.id}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setPass(data);
            }
        } catch (e) {
            console.error('Failed to fetch pass:', e);
        } finally {
            setPassLoading(false);
        }
    };

    const name = session?.name || 'Guest';
    const number = session?.phone || 'Not provided';

    const diningBookings = bookings.filter(b => b.type === 'dining');
    const eventBookings = bookings.filter(b => b.type === 'event');
    const playBookings = bookings.filter(b => b.type === 'play');

    const menuGroups = [
        {
            items: [
                { icon: <img src="/mobile_icons/profile_page/Vector 1.svg" className="w-[18px] h-[18px]" alt="Lists" />, label: "Ticlists", onClick: () => {} },
                { icon: <img src="/mobile_icons/profile_page/dining-table.svg" className="w-[22px] h-[22px]" alt="Dining" />, label: "Dining reminders", count: diningBookings.length, onClick: () => router.push('/profile/bookings/dining') },
                { icon: <img src="/mobile_icons/profile_page/guitar.svg" className="w-[20px] h-[20px]" alt="Event" />, label: "Event reminders", count: eventBookings.length, onClick: () => router.push('/profile/bookings/events') },
                { icon: <img src="/mobile_icons/Pickelball 1.svg" className="w-[24px] h-[24px]" alt="Play" />, label: "Play reminders", count: playBookings.length, onClick: () => router.push('/profile/bookings/play') },
            ]
        },
        {
            items: [
                { icon: <img src="/mobile_icons/profile_page/support.svg" className="w-[22px] h-[22px]" alt="FAQ" />, label: "Frequently asked questions", onClick: () => router.push('/faq') },
                { icon: <img src="/mobile_icons/profile_page/chat.svg" className="w-[20px] h-[20px]" alt="Chat" />, label: "Chat with us", onClick: () => {} },
            ]
        },
        {
            items: [
                { icon: <img src="/mobile_icons/profile_page/profile.svg" className="w-[20px] h-[20px]" alt="Account" />, label: "Account settings", onClick: () => router.push('/profile/settings') },
                { icon: <img src="/mobile_icons/profile_page/info.svg" className="w-[18px] h-[18px]" alt="About" />, label: "About us", onClick: () => router.push('/about') },
            ]
        },
        {
            items: [
                { icon: <img src="/mobile_icons/profile_page/logout.svg" className="w-[18px] h-[18px]" alt="Logout" />, label: "Logout", onClick: () => router.push('/logout') },
            ]
        }
    ];

    if (!session) {
        return (
            <div className="md:hidden min-h-screen w-full bg-[#F1F1F1] font-sans px-[15px] py-6 overflow-y-auto" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
                <header className="flex items-center gap-[10px] mb-[45px]">
                    <button
                        onClick={() => router.back()}
                        className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center border border-[#D0D0D0]"
                    >
                        <ChevronLeft size={20} className="text-black" />
                    </button>
                    <h1 className="text-[18px] font-medium text-black">Profile</h1>
                </header>

                <div className="flex flex-col items-center justify-center py-20 px-6">
                    <div className="w-20 h-20 bg-zinc-200 rounded-full flex items-center justify-center mb-6">
                        <img src="/profile icon.svg" className="w-10 h-10 opacity-30" alt="Profile" />
                    </div>
                    <p className="text-[16px] text-zinc-500 mb-6 text-center">Sign in to view your profile and bookings</p>
                    <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="w-full max-w-[200px] h-[48px] bg-black text-white rounded-full text-[16px] font-medium active:scale-95 transition-all"
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
        <div className="md:hidden min-h-screen w-full bg-[#F1F1F1] font-sans px-[15px] pt-6 pb-20 overflow-y-auto" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
            {/* Header Section */}
            <header className="flex items-center gap-[10px] mb-[45px]">
                <button
                    onClick={() => router.back()}
                    className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center border border-[#D0D0D0]"
                >
                    <ChevronLeft size={20} className="text-black" />
                </button>
                <h1 className="text-[18px] font-medium text-black">
                    Profile
                </h1>
            </header>

            {/* User Info Section */}
            <div className="flex items-center justify-between mb-[26px] px-1">
                <div className="flex items-center gap-[14px]">
                    <div className="w-[70px] h-[70px] bg-[#D9D9D9] rounded-full flex-shrink-0 overflow-hidden relative border border-white shadow-sm">
                        {session?.profilePhoto ? (
                            <Image src={session.profilePhoto} alt={name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#866BFF] text-white text-[24px] font-bold">
                                {name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-[18px] font-medium text-black leading-tight mb-0.5">
                            {name}
                        </h2>
                        <p className="text-[14px] font-normal text-zinc-500 leading-none">
                            {number}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => router.push('/profile/edit')}
                    className="p-2 w-10 h-10 bg-white rounded-full border border-[#D0D0D0] flex items-center justify-center active:scale-90 transition-all"
                >
                    <Pencil size={18} className="text-[#212121]" />
                </button>
            </div>

            {/* Ticpin Pass Banner */}
            {passLoading ? (
                <div className="w-full h-[57px] bg-white rounded-[15px] flex items-center justify-center mb-[20px] border border-[#D0D0D0]">
                    <div className="w-5 h-5 border-2 border-[#866BFF] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : pass ? (
                <div 
                    onClick={() => router.push('/my-pass')}
                    className="w-full h-[57px] bg-gradient-to-r from-[#7B2FF7] to-[#3A1A8C] rounded-[15px] flex items-center justify-between px-4 mb-[20px] cursor-pointer active:scale-95 transition-transform shadow-md"
                >
                    <div className="flex items-center gap-2">
                        {pass.status === 'active' ? (
                            <CheckCircle size={20} className="text-green-300" />
                        ) : (
                            <XCircle size={20} className="text-red-300" />
                        )}
                        <span className="text-[15px] font-medium text-white">
                            Ticpin Pass {pass.status === 'active' ? 'Active' : 'Expired'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] text-white/70">
                            {pass.status === 'active' ? `Valid till ${new Date(pass.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'View Details'}
                        </span>
                        <ChevronRight size={18} className="text-white/70 rotate-0" />
                    </div>
                </div>
            ) : (
                <div 
                    onClick={() => router.push('/pass')}
                    className="w-full h-[57px] bg-white rounded-[15px] flex items-center justify-between px-4 mb-[20px] border border-[#D0D0D0] cursor-pointer active:scale-95 transition-transform"
                >
                    <span className="text-[15px] font-medium text-black">
                        Get Ticpin Pass
                    </span>
                    <div className="flex items-center gap-1">
                        <span className="text-[13px] text-[#866BFF] font-medium">₹999</span>
                        <ChevronRight size={18} className="text-[#866BFF]" />
                    </div>
                </div>
            )}

            {/* Your Bookings Section */}
            <div className="mb-[35px]">
                <h3 className="text-[18px] font-medium text-black mb-[15px] px-1">
                    Your bookings
                </h3>
                <div className="flex gap-[15px] overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { icon: <img src="/mobile_icons/profile_page/dining-table.svg" className="w-[32px] h-[32px]" alt="Dining" />, label: "Dining bookings", count: diningBookings.length, href: '/profile/bookings/dining' },
                        { icon: <img src="/mobile_icons/profile_page/guitar.svg" className="w-[32px] h-[32px]" alt="Event" />, label: "Event tickets", count: eventBookings.length, href: '/profile/bookings/events' },
                        { icon: <img src="/mobile_icons/Pickelball 1.svg" className="w-[32px] h-[32px]" alt="Play" />, label: "Play bookings", count: playBookings.length, href: '/profile/bookings/play' }
                    ].map((item, i) => (
                        <div 
                            key={i} 
                            onClick={() => router.push(item.href)}
                            className="flex-shrink-0 w-[134px] h-[92px] bg-white border border-[#D0D0D0] rounded-[25px] flex flex-col items-center justify-center gap-[6px] cursor-pointer active:scale-95 transition-transform"
                        >
                            {item.icon}
                            <span className="text-[14px] font-medium text-black text-center leading-tight px-2">
                                {item.label}
                            </span>
                            {item.count > 0 && (
                                <div className="absolute top-2 right-4 w-5 h-5 bg-[#866BFF] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                    {item.count}
                                </div>
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
                                    <div className="flex items-center gap-[18px]">
                                        <div className="w-8 h-8 flex items-center justify-center">
                                            {item.icon}
                                        </div>
                                        <span className="text-[15px] font-medium text-black">
                                            {item.label}
                                        </span>
                                        {item.count !== undefined && item.count > 0 && (
                                            <span className="text-[12px] bg-[#866BFF] text-white px-2 py-0.5 rounded-full font-bold ml-1">
                                                {item.count}
                                            </span>
                                        )}
                                    </div>
                                    <ChevronRight size={18} className="text-zinc-400 rotate-0" />
                                </button>
                                {itemIdx < group.items.length - 1 && (
                                    <div className="mx-5 border-b border-[#F1F1F1]" />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
