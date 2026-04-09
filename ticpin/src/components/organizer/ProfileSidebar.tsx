'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
    LayoutGrid, 
    IndianRupee, 
    PieChart, 
    LogOut, 
    X
} from 'lucide-react';
import { clearOrganizerSession, getOrganizerSession } from '@/lib/auth/organizer';

interface ProfileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
    const router = useRouter();
    const session = getOrganizerSession();

    const handleLogout = () => {
        clearOrganizerSession();
        router.push('/');
    };

    const menuItems = [
        { 
            label: 'All Events', 
            icon: LayoutGrid, 
            path: '/organizer/dashboard?category=events',
            onClick: () => {
                router.push('/organizer/dashboard?category=events');
                onClose();
            }
        },
        { 
            label: 'Payouts', 
            icon: IndianRupee, 
            path: '/organizer/payouts',
            onClick: () => {
                router.push('/organizer/payouts');
                onClose();
            }
        },
        { 
            label: 'Event Analytics', 
            icon: PieChart, 
            path: '/organizer/analytics',
            onClick: () => {
                router.push('/organizer/analytics');
                onClose();
            }
        },
        { 
            label: 'Log Out', 
            icon: LogOut, 
            path: '#',
            onClick: handleLogout,
            isLogout: true
        }
    ];

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99]"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div 
                className={`fixed top-[114px] right-0 w-[336px] h-[calc(100vh-114px)] bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.1)] z-[100] transition-transform duration-300 transform ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full border-l border-zinc-200">
                    {/* Close button for mobile/UI clarity */}
                    <button 
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-black transition-colors md:hidden"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex-1 pt-12">
                        {menuItems.map((item, index) => (
                            <React.Fragment key={item.label}>
                                <button
                                    onClick={item.onClick}
                                    className="w-full flex items-center justify-between px-10 py-8 group hover:bg-zinc-50 transition-all text-left"
                                >
                                    <span className="text-[25px] font-medium text-zinc-900 group-hover:translate-x-1 transition-transform" style={{ fontFamily: 'Anek Latin' }}>
                                        {item.label}
                                    </span>
                                    <item.icon size={23} className={`${item.isLogout ? 'text-zinc-900' : 'text-zinc-900'}`} />
                                </button>
                                {index < menuItems.length - 1 && (
                                    <div className="mx-10 border-b border-zinc-200" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-10 border-t border-zinc-100 bg-zinc-50/50">
                        <div className="flex flex-col gap-1">
                            <span className="text-[15px] font-medium text-zinc-500" style={{ fontFamily: 'Anek Latin' }}>
                                Signed in with
                            </span>
                            <span className="text-[15px] font-bold text-zinc-800 break-all" style={{ fontFamily: 'Anek Latin' }}>
                                {session?.email || 'Organizer Account'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
