'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronRight, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MenuGridProps {
    isAdmin: boolean;
    onViewBookings: () => void;
    onLogout: () => void;
    onClose: () => void;
}

const MenuGrid: React.FC<MenuGridProps> = ({ isAdmin, onViewBookings, onLogout, onClose }) => {
    const router = useRouter();

    const menuItems = [
        ...(isAdmin ? [{
            label: 'Admin Panel',
            icon: <Image src="/ticpin-icon.png" width={24} height={24} alt="Admin" className="w-6 h-6 object-contain" />,
            action: () => { router.push('/admin'); onClose(); }
        }] : []),
        {
            label: 'View all bookings',
            icon: <Calendar className="text-[#34C759]" size={24} />,
            action: onViewBookings
        },
        { label: 'Chat with us', action: () => { } },
        { label: 'Terms & Conditions', action: () => { router.push('/terms'); onClose(); } },
        { label: 'Privacy Policy', action: () => { router.push('/privacy'); onClose(); } },
        { label: 'Logout', action: onLogout },
    ];

    return (
        <div className="space-y-4 pt-4">
            {menuItems.map((item, idx) => (
                <button
                    key={idx}
                    onClick={item.action}
                    className="w-full flex items-center justify-between h-[80px] px-8 bg-white rounded-[20px] shadow-sm hover:shadow-md transition-all active:scale-[0.99] group border border-zinc-100"
                >
                    <div className="flex items-center gap-4">
                        {item.icon}
                        <span className="text-[20px] font-semibold text-zinc-600 group-hover:text-zinc-900 transition-colors">
                            {item.label}
                        </span>
                    </div>
                    <ChevronRight size={20} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                </button>
            ))}
        </div>
    );
};

export default MenuGrid;
