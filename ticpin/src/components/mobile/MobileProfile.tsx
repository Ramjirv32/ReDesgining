'use client';

import { ChevronLeft, ChevronRight, Pencil, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIdentityStore } from '@/store/useIdentityStore';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/modals/AuthModal'), { ssr: false });

interface MobileProfileProps {
}

export default function MobileProfile() {
    const router = useRouter();
    const { userSession, organizerSession, sync, logoutUser } = useIdentityStore();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [organizerProfile, setOrganizerProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [pass, setPass] = useState<any>(null);
    const [passLoading, setPassLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        sync();
    }, [sync]);

    const fetchPass = async () => {
        if (!organizerSession?.id) return;
        setPassLoading(true);
        try {
            const res = await fetch(`/backend/api/pass/user/${organizerSession.id}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setPass(data);
            }
        } catch (error) {
            console.error('Failed to fetch pass:', error);
        } finally {
            setPassLoading(false);
        }
    };

    useEffect(() => {
        if (organizerSession?.id) {
            fetchPass();
        }
    }, [organizerSession?.id]);

    useEffect(() => {
        let isMounted = true;
        
        if (organizerSession?.id) {
            const fetchProfile = async () => {
                try {
                    const res = await fetch(`/backend/api/organizer/profile`, { credentials: 'include' });
                    if (res.ok && isMounted) {
                        const data = await res.json();
                        setOrganizerProfile(data);
                    }
                } catch (error) {
                    console.error('Failed to fetch organizer profile:', error);
                } finally {
                    if (isMounted) {
                        setLoading(false);
                    }
                }
            };
            fetchProfile();
        } else {
            setLoading(false);
        }
        
        return () => {
            isMounted = false;
        };
    }, [organizerSession?.id]);

    const title = organizerSession?.isAdmin ? 'Admin Panel' : 
               (organizerProfile?.name || userSession?.name || userSession?.phone || 'Guest');
    const subtitle = organizerSession?.isAdmin ? '' : 
                     (organizerSession ? (organizerSession.email || organizerSession.vertical + ' Organizer') : (userSession?.phone || 'Not provided'));

    if (!userSession && !organizerSession) {
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
                    onSuccess={() => sync()}
                />
            </div>
        );
    }

    const menuItems = organizerSession?.isAdmin ? [
        // 3) Admin Menu
        { 
            icon: <img src="/mobile_icons/profile_page/dashboard.svg" className="w-[20px] h-[20px]" alt="Dashboard" />, 
            label: "Admin Panel", 
            onClick: () => router.push('/admin') 
        },
        { icon: <img src="/mobile_icons/profile_page/logout.svg" className="w-[20px] h-[20px]" alt="Logout" />, label: "Logout", onClick: () => { logoutUser(); router.push('/'); } },
    ] : organizerSession ? [
        // 2) Organizer Menu
        { 
            icon: <img src="/mobile_icons/profile_page/dashboard.svg" className="w-[20px] h-[20px]" alt="Dashboard" />, 
            label: "Dashboard", 
            onClick: () => router.push(`/organizer/dashboard?category=${organizerSession.vertical}`) 
        },
        { icon: <img src="/mobile_icons/profile_page/support.svg" className="w-[20px] h-[20px]" alt="FAQ" />, label: "Frequently asked questions", onClick: () => router.push('/faq') },
        { icon: <img src="/mobile_icons/profile_page/chat.svg" className="w-[20px] h-[20px]" alt="Chat" />, label: "Chat with us", onClick: () => router.push('/chat-support') },
        { icon: <img src="/mobile_icons/profile_page/profile.svg" className="w-[20px] h-[20px]" alt="Account" />, label: "Edit profile", onClick: () => router.push(organizerSession ? '/organizer/profile/edit' : '/profile/edit') },

        { icon: <img src="/mobile_icons/profile_page/logout.svg" className="w-[20px] h-[20px]" alt="Logout" />, label: "Logout", onClick: () => { logoutUser(); router.push('/'); } },
    ] : [
        // 1) User Menu
        { icon: <img src="/mobile_icons/profile_page/dining-table.svg" className="w-[20px] h-[20px]" alt="Dining" />, label: "Dining bookings", onClick: () => router.push('/profile/bookings/dining') },
        { icon: <img src="/mobile_icons/profile_page/guitar.svg" className="w-[20px] h-[20px]" alt="Event" />, label: "Event tickets", onClick: () => router.push('/profile/bookings/events') },
        { icon: <img src="/mobile_icons/Pickelball 1.svg" className="w-[20px] h-[20px]" alt="Play" />, label: "Play bookings", onClick: () => router.push('/profile/bookings/play') },
        { icon: <img src="/mobile_icons/profile_page/support.svg" className="w-[20px] h-[20px]" alt="FAQ" />, label: "Frequently asked questions", onClick: () => router.push('/faq') },
        { icon: <img src="/mobile_icons/profile_page/chat.svg" className="w-[20px] h-[20px]" alt="Chat" />, label: "Chat with us", onClick: () => router.push('/chat-support') },
        { icon: <img src="/mobile_icons/profile_page/profile.svg" className="w-[20px] h-[20px]" alt="Account" />, label: "Edit profile", onClick: () => router.push(organizerSession ? '/organizer/profile/edit' : '/profile/edit') },

        { icon: <img src="/mobile_icons/profile_page/logout.svg" className="w-[20px] h-[20px]" alt="Logout" />, label: "Logout", onClick: () => { logoutUser(); router.push('/'); } },
    ];

    return (
        <div className="md:hidden min-h-screen w-full bg-[#F1F1F1] font-sans px-[15px] pt-6 pb-20 overflow-y-auto" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
            <header className="flex items-center gap-[10px] mb-[45px]">
                <button
                    onClick={() => router.back()}
                    className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center border border-[#D0D0D0]"
                >
                    <ChevronLeft size={20} className="text-black" />
                </button>
                <h1 className="text-[18px] font-medium text-black">Profile</h1>
            </header>

            <div className="flex items-center justify-between mb-[26px] px-1">
                <div className="flex items-center gap-[14px]">
                    <div className="w-[70px] h-[70px] bg-[#D9D9D9] rounded-full flex-shrink-0 overflow-hidden relative border border-white shadow-sm">
                        {userSession?.profilePhoto ? (
                            <Image src={userSession.profilePhoto} alt={title || 'Profile'} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#866BFF] text-white text-[24px] font-bold">
                                {(title || 'G').charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-[18px] font-medium text-black leading-tight mb-0.5">{title}</h2>
                        {subtitle && <p className="text-[14px] font-normal text-zinc-500 leading-none">{subtitle}</p>}
                    </div>
                </div>

            </div>

            {passLoading ? (
                <div className="w-full h-[57px] bg-white rounded-[15px] flex items-center justify-center mb-5 border border-[#D0D0D0]">
                    <div className="w-5 h-5 border-2 border-[#866BFF] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : pass ? (
                <div onClick={() => router.push('/my-pass')} className="w-full h-[57px] bg-gradient-to-r from-[#7B2FF7] to-[#3A1A8C] rounded-[15px] flex items-center justify-between px-4 mb-5 cursor-pointer shadow-md">
                    <div className="flex items-center gap-2">
                        {pass.status === 'active' ? <CheckCircle size={20} className="text-green-300" /> : <XCircle size={20} className="text-red-300" />}
                        <span className="text-[15px] font-medium text-white">Ticpin Pass {pass.status === 'active' ? 'Active' : 'Expired'}</span>
                    </div>
                    <ChevronRight size={18} className="text-white/70" />
                </div>
            ) : (
                <div onClick={() => router.push('/pass')} className="w-full h-[57px] bg-white rounded-[15px] flex items-center justify-between px-4 mb-5 border border-[#D0D0D0] cursor-pointer">
                    <span className="text-[15px] font-medium text-black">Get Ticpin Pass</span>
                    <div className="flex items-center gap-1 font-medium text-[#866BFF]">
                        <span className="text-[13px]">₹999</span>
                        <ChevronRight size={18} />
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-[#D0D0D0] overflow-hidden">
                {menuItems.map((item, i, arr) => (
                    <div key={i}>
                        <button onClick={item.onClick} className="w-full flex items-center justify-between px-5 h-[60px] active:bg-zinc-50 transition-colors">
                            <div className="flex items-center gap-[18px]">
                                <div className="w-8 h-8 flex items-center justify-center">{item.icon}</div>
                                <span className="text-[16px] font-medium text-black">{item.label}</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-400" />
                        </button>
                        {i < arr.length - 1 && <div className="mx-5 border-b border-[#F1F1F1]" />}
                    </div>
                ))}
            </div>
        </div>
    );
}
