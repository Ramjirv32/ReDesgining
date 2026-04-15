'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
    User, 
    Settings,
    LogOut, 
    X
} from 'lucide-react';
import { clearOrganizerSession, getOrganizerSession } from '@/lib/auth/organizer';
import Link from 'next/link';

interface UserSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
    const router = useRouter();
    const session = getOrganizerSession();

    const handleLogout = () => {
        clearOrganizerSession();
        router.push('/');
    };

    const userItems = [
        { 
            label: 'Profile', 
            icon: User, 
            path: '/organizer/profile',
            onClick: () => {
                router.push('/organizer/profile');
                onClose();
            }
        },
        { 
            label: 'Settings', 
            icon: Settings, 
            path: '/organizer/profile/edit',
            onClick: () => {
                router.push('/organizer/profile/edit');
                onClose();
            }
        }
    ];

    return (
        <>

            {/* Sidebar */}
            <div 
                className={`fixed top-[114px] w-[280px] h-[calc(100vh-114px)] bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.1)] z-[112] transition-all duration-300 ${
                    isOpen ? 'right-0' : 'right-[-280px]'
                }`}
            >
                <div className="flex flex-col h-full border-l border-zinc-200">
                    <div className="flex-1 pt-8">
                        {userItems.map((item, index) => (
                            <React.Fragment key={item.label}>
                                <button
                                    onClick={item.onClick}
                                    className="w-full flex items-center justify-between px-8 py-6 group hover:bg-zinc-50 transition-all text-left"
                                >
                                    <span className="text-[20px] font-medium text-zinc-900 group-hover:translate-x-1 transition-transform" style={{ fontFamily: 'Anek Latin' }}>
                                        {item.label}
                                    </span>
                                    <item.icon size={20} className="text-zinc-500" />
                                </button>
                                {index < userItems.length - 1 && (
                                    <div className="mx-8 border-b border-zinc-100" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Quick Logout for convenient access */}
                    <div className="p-8 border-t border-zinc-100 bg-zinc-50/30">
                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between text-zinc-400 hover:text-red-500 transition-colors"
                        >
                            <span className="text-[16px] font-medium">Log Out</span>
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
