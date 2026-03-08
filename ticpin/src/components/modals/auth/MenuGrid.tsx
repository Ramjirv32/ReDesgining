import React from 'react';
import { ChevronLeft } from 'lucide-react';
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
            action: () => { router.push('/admin'); onClose(); }
        }] : []),
        {
            label: 'View all bookings',
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
                    className="w-full flex items-center justify-between h-[80px] px-8 bg-white rounded-[15px] shadow-sm hover:shadow-md transition-all active:scale-[0.99] group border border-zinc-100/50"
                >
                    <span
                        style={{ fontSize: '20px', fontWeight: 500, lineHeight: '100%', fontFamily: 'var(--font-anek-latin)' }}
                        className="text-zinc-500 group-hover:text-zinc-900 transition-colors"
                    >
                        {item.label}
                    </span>
                    <ChevronLeft size={20} className="rotate-180 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                </button>
            ))}
        </div>
    );
};

export default MenuGrid;
