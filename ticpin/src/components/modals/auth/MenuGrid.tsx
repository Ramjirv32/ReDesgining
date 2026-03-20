import React from 'react';
import { ChevronLeft, Ticket, Utensils, Gamepad2, HelpCircle, MessageCircle, Info, LogOut, Edit, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getOrganizerSession } from '@/lib/auth/organizer';

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
    onViewDiningBookings,
    onViewEventTickets,
    onViewPlayBookings,
    onEditProfile,
    onLogout, 
    onClose 
}) => {
    const router = useRouter();

    let menuItems = [];

    if (isAdmin) {
        // 3) Admin Menu
        menuItems = [
            { 
                label: 'Admin Panel', 
                icon: Settings,
                action: () => { router.push('/admin'); onClose(); }
            },
            { 
                label: 'About us', 
                icon: Info,
                action: () => { router.push('/about'); onClose(); }
            },
            { 
                label: 'Logout', 
                icon: LogOut,
                action: onLogout
            }
        ];
    } else if (isOrganizer) {
        // 2) Organizer Menu
        menuItems = [
            { 
                label: 'Dashboard', 
                icon: Settings,
                action: () => { 
                    const path = `/organizer/dashboard?category=${getOrganizerSession()?.vertical}`;
                    router.push(path); 
                    onClose(); 
                }
            },
            { 
                label: 'Frequently asked questions', 
                icon: HelpCircle,
                action: () => { router.push('/faq'); onClose(); }
            },
            { 
                label: 'Chat with us', 
                icon: MessageCircle,
                action: () => { router.push('/chat-support'); onClose(); }
            },
            { 
                label: 'About us', 
                icon: Info,
                action: () => { router.push('/about'); onClose(); }
            },
            { 
                label: 'Edit profile', 
                icon: Edit,
                action: onEditProfile
            },

            { 
                label: 'Logout', 
                icon: LogOut,
                action: onLogout
            }
        ];
    } else {
        // 1) User Menu
        menuItems = [
            { 
                label: 'Dining bookings', 
                icon: Utensils,
                action: () => { router.push('/profile/bookings/dining'); onClose(); }
            },
            { 
                label: 'Event tickets', 
                icon: Ticket,
                action: () => { router.push('/profile/bookings/events'); onClose(); }
            },
            { 
                label: 'Play bookings', 
                icon: Gamepad2,
                action: () => { router.push('/profile/bookings/play'); onClose(); }
            },
            { 
                label: 'Frequently asked questions', 
                icon: HelpCircle,
                action: () => { router.push('/faq'); onClose(); }
            },
            { 
                label: 'Chat with us', 
                icon: MessageCircle,
                action: () => { router.push('/chat-support'); onClose(); }
            },
            { 
                label: 'About us', 
                icon: Info,
                action: () => { router.push('/about'); onClose(); }
            },
            { 
                label: 'Edit profile', 
                icon: Edit,
                action: onEditProfile
            },

            { 
                label: 'Logout', 
                icon: LogOut,
                action: onLogout
            }
        ];
    }

    return (
        <div className="space-y-3">
            {menuItems.map((item, idx) => (
                <button
                    key={idx}
                    onClick={item.action}
                    className="w-full flex items-center gap-4 h-[60px] px-6 bg-white rounded-[15px] hover:shadow-sm transition-all active:scale-[0.99] border border-zinc-100/50 group"
                >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-50 group-hover:bg-[#866BFF]/10 transition-colors">
                        {item.icon && <item.icon size={18} className="text-zinc-600 group-hover:text-[#866BFF]" />}
                    </div>
                    <span
                        style={{ fontSize: '18px', fontWeight: 500, fontFamily: 'var(--font-anek-latin)' }}
                        className="text-zinc-700 text-left flex-1"
                    >
                        {item.label}
                    </span>
                    <ChevronLeft size={18} className="ml-auto rotate-180 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            ))}
        </div>
    );
};

export default MenuGrid;
