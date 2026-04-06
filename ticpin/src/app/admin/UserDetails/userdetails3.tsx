'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getBookingStatus, getBookingStatusStyles } from '@/lib/utils/booking-status';
import { Eye, X } from 'lucide-react';

interface User { 
    id: string; 
    name: string; 
    phone: string; 
    email?: string;
    profilePhoto?: string;
    createdAt: string; 
    bookings?: Array<{
        id: string;
        type: 'dining' | 'event' | 'play';
        entityName: string;
        status: string;
        bookingDate: string;
        amount?: number;
        createdAt: string;
    }>;
}
type Booking = {
    id: string;
    type: 'dining' | 'event' | 'play';
    entityName: string;
    status: string;
    bookingDate: string;
    amount?: number;
    createdAt: string;
    metadata?: Record<string, any>;
};

export default function UserDetails3() {
    const params = useSearchParams();
    const userId = params.get('id') ?? '';
    const [user, setUser] = useState<User | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingFilter, setBookingFilter] = useState<'all' | 'dining' | 'event' | 'play'>('all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showModal, setShowModal] = useState(false);
    const tabs = ['Overview', 'Bookings', 'Ticlists', 'Activity'];

    function nav(tab: string) {
        const q = userId ? `?id=${userId}` : '';
        if (tab === 'Overview') window.location.href = `/admin/user-details-view${q}`;
        else if (tab === 'Bookings') window.location.href = `/admin/user-details-bookings${q}`;
        else if (tab === 'Ticlists') window.location.href = `/admin/user-details-ticlists${q}`;
        else if (tab === 'Activity') window.location.href = `/admin/user-details-activity${q}`;
    }

    useEffect(() => {
        if (!userId) return;
        fetch(`/backend/api/admin/users/${userId}/details`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                setUser(data);
                setBookings(data.bookings || []);
            })
            .catch(() => {});
    }, [userId]);

    const filteredBookings = bookings.filter(booking => 
        bookingFilter === 'all' || booking.type === bookingFilter
    );

    const memberSince = user ? new Date(user.createdAt).getFullYear() : '';

    return (
        <div className="bg-[#ECE8FD] rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex items-center justify-center gap-12" style={{ zoom: '90%' }}>
            <div className="px-[37px] pt-[6px] pb-[80px]">
                <div className="mb-[32px]">
                    <h1 className="text-[40px] font-semibold leading-[44px] text-black">Admin Panel</h1>
                    <div className="w-[101px] h-[1.5px] bg-[#686868] mt-2"></div>
                </div>
                <div className="mb-[40px]">
                    <h2 className="text-[25px] font-medium leading-[28px] text-black">User Details</h2>
                </div>
                <div className="bg-white rounded-[30px] shadow-sm p-[40px] w-[1440px] h-[522px] relative overflow-hidden mx-auto">
                    <div className="absolute flex gap-[40px] left-[670px] top-[40px]">
                        {tabs.map((tab) => (
                            <button key={tab} onClick={() => nav(tab)}
                                className={`px-[20px] py-[8px] text-[25px] font-medium leading-[28px] ${tab === 'Bookings' ? 'bg-[rgba(83,49,234,0.15)] rounded-[38px]' : ''}`}
                                style={{ color: '#000000' }}>
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="absolute left-[119px] top-[75px] flex flex-col items-center">
                        <div className="w-[152px] h-[152px] bg-[rgba(189,177,243,0.3)] rounded-full mb-[26px] overflow-hidden relative">
                            {user?.profilePhoto ? (
                                <img 
                                    src={user.profilePhoto} 
                                    alt={user.name} 
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#5331EA] text-[48px] font-semibold">
                                    {user?.name?.[0] || user?.phone?.[0] || '?'}
                                </div>
                            )}
                        </div>
                        <div className="text-center mb-[50px] w-[153px]">
                            <h3 className="text-[30px] font-medium leading-[33px] text-black">{user?.name ?? '—'}</h3>
                            <p className="text-[30px] font-medium leading-[33px] text-[#6B7280]">{user?.phone ?? '—'}</p>
                            {user?.email && (
                                <p className="text-[16px] font-medium leading-[18px] text-[#6B7280] mt-2">{user.email}</p>
                            )}
                        </div>
                        <div className="w-[250px] h-[54px] bg-[rgba(189,177,243,0.3)] rounded-[20px] flex items-center justify-center">
                            <span className="text-[20px] font-medium leading-[22px] text-black">Member Since {memberSince}</span>
                        </div>
                    </div>
                    <div className="absolute left-[460px] top-[165px] w-[1.5px] h-[200px] bg-[#686868]"></div>
                    <div className="absolute left-[515px] top-[150px] w-[800px] overflow-y-auto" style={{ maxHeight: '320px' }}>
                        <h3 className="text-[25px] font-medium leading-[28px] text-black mb-[16px]">Booking Information</h3>
                        
                        {/* Filter Buttons */}
                        <div className="flex gap-2 mb-[20px]">
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'dining', label: 'Dining' },
                                { value: 'event', label: 'Events' },
                                { value: 'play', label: 'Play' }
                            ].map((filter) => (
                                <button
                                    key={filter.value}
                                    onClick={() => setBookingFilter(filter.value as any)}
                                    className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-colors ${
                                        bookingFilter === filter.value
                                            ? 'bg-[#5331EA] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {filteredBookings.length === 0 ? (
                            <p className="text-[16px] text-[#686868]">No bookings found.</p>
                        ) : (
                            <>
                                <div className="flex text-[13px] font-medium text-[#686868] mb-[8px]">
                                    <div className="w-[220px]">Event</div>
                                    <div className="w-[100px]">Amount</div>
                                    <div className="w-[100px]">Status</div>
                                    <div className="w-[120px]">Date</div>
                                    <div className="w-[60px]">Action</div>
                                </div>
                                <div className="w-full h-[0.5px] bg-[#686868] mb-[8px]"></div>
                                {filteredBookings.map((b, i) => (
                                    <div key={i}>
                                        <div className="flex text-[13px] font-medium text-black">
                                            <div className="w-[220px] truncate">{b.entityName}</div>
                                            <div className="w-[100px]">{b.amount ? `₹${b.amount}` : '—'}</div>
                                            <div className="w-[100px]">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getBookingStatusStyles(getBookingStatus({ ...b, date: b.bookingDate }))}`}>
                                                    {getBookingStatus({ ...b, date: b.bookingDate })}
                                                </span>
                                            </div>
                                            <div className="w-[120px]">{new Date(b.bookingDate).toLocaleDateString()}</div>
                                            <div className="w-[60px]">
                                                <button 
                                                    onClick={() => { setSelectedBooking(b); setShowModal(true); }}
                                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors group"
                                                >
                                                    <Eye className="w-4 h-4 text-gray-400 group-hover:text-[#5331EA]" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="w-full h-[0.5px] bg-[rgba(104,104,104,0.3)] mt-[10px]"></div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Booking Details Modal */}
            {showModal && selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-8 bg-gray-50 border-b">
                            <div>
                                <h2 className="text-2xl font-bold text-black">{selectedBooking.entityName}</h2>
                                <p className="text-gray-500 font-medium capitalize">{selectedBooking.type} Booking</p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="p-8 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${getBookingStatusStyles(getBookingStatus({ ...selectedBooking, date: selectedBooking.bookingDate }))}`}>
                                        {getBookingStatus({ ...selectedBooking, date: selectedBooking.bookingDate })}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</p>
                                    <p className="text-xl font-bold text-black">{selectedBooking.amount ? `₹${selectedBooking.amount}` : '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Booking Date</p>
                                    <p className="text-lg font-medium text-black">{new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Created At</p>
                                    <p className="text-lg font-medium text-black">{new Date(selectedBooking.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-black border-b pb-2">Full Metadata</h4>
                                <div className="bg-gray-50 rounded-2xl p-6 font-mono text-[13px] text-gray-600 leading-relaxed overflow-x-auto">
                                    {selectedBooking.metadata ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {Object.entries(selectedBooking.metadata).map(([key, value]) => {
                                                if (key === '_id' || key === 'user_id') return null; // Skip redundant IDs
                                                return (
                                                    <div key={key} className="flex border-b border-gray-100 last:border-0 pb-1">
                                                        <span className="w-40 shrink-0 text-gray-400 font-bold">{key}:</span>
                                                        <span className="text-black break-all">{JSON.stringify(value)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p>No extra metadata available.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 border-t flex justify-end">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-8 py-3 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
