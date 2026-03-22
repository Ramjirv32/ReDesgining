'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

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
};

export default function UserDetails3() {
    const params = useSearchParams();
    const userId = params.get('id') ?? '';
    const [user, setUser] = useState<User | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingFilter, setBookingFilter] = useState<'all' | 'dining' | 'event' | 'play'>('all');
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
                                    <div className="w-[160px]">Date</div>
                                </div>
                                <div className="w-full h-[0.5px] bg-[#686868] mb-[8px]"></div>
                                {filteredBookings.map((b, i) => (
                                    <div key={i}>
                                        <div className="flex text-[13px] font-medium text-black">
                                            <div className="w-[220px] truncate">{b.entityName}</div>
                                            <div className="w-[100px]">{b.amount ? `₹${b.amount}` : '—'}</div>
                                            <div className="w-[100px] capitalize">{b.status}</div>
                                            <div className="w-[160px]">{new Date(b.bookingDate).toLocaleDateString()}</div>
                                        </div>
                                        <div className="w-full h-[0.5px] bg-[rgba(104,104,104,0.3)] mt-[10px]"></div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
