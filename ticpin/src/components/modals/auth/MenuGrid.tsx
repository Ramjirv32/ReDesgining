import React from 'react';
import { ChevronLeft, Ticket, Utensils, Gamepad2, Calendar, Bell, HelpCircle, MessageCircle, User, Settings, Info, LogOut, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MenuGridProps {
    isAdmin: boolean;
    isOrganizer: boolean;
    onViewBookings: () => void;
    onViewDiningBookings: () => void;
    onViewEventTickets: () => void;
    onViewPlayBookings: () => void;
    onEditProfile: () => void;
    onLogout: () => void;
    onClose: () => void;
}

const MenuGrid: React.FC<MenuGridProps> = ({ 
    isAdmin, 
    isOrganizer,
    onViewBookings, 
    onViewDiningBookings,
    onViewEventTickets,
    onViewPlayBookings,
    onEditProfile,
    onLogout, 
    onClose 
}) => {
    const router = useRouter();

    const menuItems = [
        // Bookings Section
        { 
            label: 'Bookings', 
            icon: Calendar,
            action: onViewBookings,
            section: 'main'
        },
        { 
            label: 'Dining bookings', 
            icon: Utensils,
            action: onViewDiningBookings,
            section: 'bookings'
        },
        { 
            label: 'Event tickets', 
            icon: Ticket,
            action: onViewEventTickets,
            section: 'bookings'
        },
        { 
            label: 'Play bookings', 
            icon: Gamepad2,
            action: onViewPlayBookings,
            section: 'bookings'
        },
        // Menu Section
        { 
            label: 'Menu', 
            icon: Utensils,
            action: () => { router.push('/dining'); onClose(); },
            section: 'main'
        },
        // Ticlists
        { 
            label: 'Ticlists', 
            icon: Ticket,
            action: () => { },
            section: 'main'
        },
        // Reminders Section
        { 
            label: 'Dining reminders', 
            icon: Bell,
            action: () => { },
            section: 'reminders'
        },
        { 
            label: 'Event reminders', 
            icon: Bell,
            action: () => { },
            section: 'reminders'
        },
        { 
            label: 'Play reminders', 
            icon: Bell,
            action: () => { },
            section: 'reminders'
        },
        // Help Section
        { 
            label: 'Help', 
            icon: HelpCircle,
            action: () => { },
            section: 'help'
        },
        { 
            label: 'Frequently asked questions', 
            icon: HelpCircle,
            action: () => { },
            section: 'help'
        },
        { 
            label: 'Chat with us', 
            icon: MessageCircle,
            action: () => { },
            section: 'help'
        },
        // Account Section
        { 
            label: 'Account', 
            icon: User,
            action: () => { },
            section: 'account'
        },
        { 
            label: 'Account settings', 
            icon: Settings,
            action: () => { },
            section: 'account'
        },
        { 
            label: 'About us', 
            icon: Info,
            action: () => { router.push('/about'); onClose(); },
            section: 'account'
        },
        { 
            label: 'Edit profile', 
            icon: Edit,
            action: onEditProfile,
            section: 'account'
        },
        // Admin/Organizer Section
        ...(isAdmin || isOrganizer ? [{
            label: isAdmin ? 'Admin Panel' : 'Organizer Dashboard',
            icon: Settings,
            action: () => { router.push('/organizer'); onClose(); },
            section: 'organizer'
        }] : []),
        // Logout
        { 
            label: 'Logout', 
            icon: LogOut,
            action: onLogout,
            section: 'other'
        },
    ];

    return (
        <div className="space-y-2 pt-4">
            {menuItems.map((item, idx) => (
                <button
                    key={idx}
                    onClick={item.action}
                    className="w-full flex items-center gap-4 h-[60px] px-6 bg-white rounded-[12px] hover:bg-zinc-50 transition-all active:scale-[0.99] group border border-zinc-100"
                >
                    {item.icon && <item.icon size={20} className="text-zinc-400 group-hover:text-zinc-900 transition-colors" />}
                    <span
                        style={{ fontSize: '18px', fontWeight: 500, fontFamily: 'var(--font-anek-latin)' }}
                        className="text-zinc-600 group-hover:text-zinc-900 transition-colors text-left"
                    >
                        {item.label}
                    </span>
                    <ChevronLeft size={18} className="ml-auto rotate-180 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                </button>
            ))}
        </div>
    );
};

export default MenuGrid;
