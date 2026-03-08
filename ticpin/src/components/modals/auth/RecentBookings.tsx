'use client';

import React from 'react';
import { Ticket, Utensils, Gamepad2, Loader2, Mail, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RecentBookingsProps {
    bookings: any[];
    loading: boolean;
    activeTab: 'events' | 'dining' | 'play';
    setActiveTab: (tab: 'events' | 'dining' | 'play') => void;
    hasProfileDetails: boolean;
    handleCancel: (id: string, category: string) => void;
    onClose: () => void;
}

const RecentBookings: React.FC<RecentBookingsProps> = ({
    bookings,
    loading,
    activeTab,
    setActiveTab,
    hasProfileDetails,
    handleCancel,
    onClose
}) => {
    const router = useRouter();

    const tabs = [
        { id: 'events', label: 'Events', icon: <Ticket size={18} /> },
        { id: 'dining', label: 'Dining', icon: <Utensils size={18} /> },
        { id: 'play', label: 'Play', icon: <Gamepad2 size={18} /> }
    ];

    const filtered = bookings.filter(b => b.category === activeTab);

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-full">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-[15px] ${activeTab === tab.id
                            ? 'bg-white text-zinc-900 shadow-md'
                            : 'text-zinc-500 hover:text-zinc-700'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[300px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 size={40} className="animate-spin text-[#7c00e6]" />
                        <p className="text-zinc-500 font-medium">Fetching your bookings...</p>
                    </div>
                ) : !hasProfileDetails ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-400">
                            <Mail size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-zinc-900">Identification Missing</p>
                            <p className="text-sm text-zinc-500 max-w-[240px]"> Please update your profile with an email or phone number to view bookings.</p>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-300">
                            {activeTab === 'events' ? <Ticket size={32} /> : activeTab === 'dining' ? <Utensils size={32} /> : <Gamepad2 size={32} />}
                        </div>
                        <p className="text-zinc-500 font-medium">No {activeTab} bookings found</p>
                        <button
                            onClick={() => { router.push(`/${activeTab}`); onClose(); }}
                            className="px-6 py-3 bg-[#7c00e6] text-white rounded-full font-bold text-sm shadow-lg shadow-[#7c00e6]/20 active:scale-95"
                        >
                            Explore {activeTab}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((booking, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-[24px] border border-zinc-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[12px] font-bold text-[#7c00e6] uppercase tracking-wider">{activeTab}</p>
                                        <h4 className="text-xl font-bold text-zinc-900">{booking.venue_name || booking.event_name}</h4>
                                        <p className="text-sm text-zinc-500 font-medium">{booking.date} • {booking.time_slot || booking.slot || 'All Day'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-zinc-900">₹{booking.grand_total || booking.order_amount}</p>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {booking.status === 'booked' || booking.status === 'confirmed' ? 'Confirmed' : booking.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-zinc-50 flex justify-between items-center">
                                    <p className="text-[12px] text-zinc-400 font-medium tracking-tight">Booking ID: {booking.id.slice(-8).toUpperCase()}</p>
                                    <div className="flex gap-4">
                                        {booking.status !== 'cancelled' && (
                                            <button
                                                onClick={() => handleCancel(booking.id, booking.category)}
                                                className="text-red-500 text-sm font-bold hover:underline"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button className="text-[#7c00e6] text-sm font-bold flex items-center gap-1 group">
                                            View Details <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentBookings;
