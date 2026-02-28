'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface User {
    id: string;
    name: string;
    phone: string;
    createdAt: string;
}

export default function UserDetails2() {
    const params = useSearchParams();
    const userId = params.get('id') ?? '';
    const [user, setUser] = useState<User | null>(null);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');

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
        fetch(`/backend/api/admin/users/${userId}`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => { setUser(data); setEditName(data.name); setEditPhone(data.phone); })
            .catch(() => {});
    }, [userId]);

    async function saveEdit() {
        if (!userId) return;
        await fetch(`/backend/api/admin/users/${userId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editName, phone: editPhone }),
        });
        setUser(prev => prev ? { ...prev, name: editName, phone: editPhone } : prev);
        setEditing(false);
    }

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
                <div className="bg-white rounded-[30px] shadow-sm p-[40px] w-[1440px] h-[522px] relative">
                    <div className="absolute flex gap-[40px] left-[670px] top-[40px]">
                        {tabs.map((tab) => (
                            <button key={tab} onClick={() => nav(tab)}
                                className={`px-[20px] py-[8px] text-[25px] font-medium leading-[28px] ${tab === 'Overview' ? 'bg-[rgba(83,49,234,0.15)] rounded-[38px]' : ''}`}
                                style={{ color: '#000000' }}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="absolute left-[119px] top-[75px] flex flex-col items-center">
                        <div className="w-[152px] h-[152px] bg-[rgba(189,177,243,0.3)] rounded-full mb-[26px]"></div>
                        <div className="text-center mb-[50px] w-[153px]">
                            <h3 className="text-[30px] font-medium leading-[33px] text-black">{user?.name ?? '—'}</h3>
                            <p className="text-[30px] font-medium leading-[33px] text-[#6B7280]">{user?.phone ?? '—'}</p>
                        </div>
                        <div className="w-[250px] h-[54px] bg-[rgba(189,177,243,0.3)] rounded-[20px] flex items-center justify-center">
                            <span className="text-[20px] font-medium leading-[22px] text-black">Member Since {memberSince}</span>
                        </div>
                    </div>

                    <div className="absolute left-[460px] top-[165px] w-[1.5px] h-[200px] bg-[#686868]"></div>

                    <div className="absolute left-[515px] top-[150px]">
                        <div className="flex items-center gap-[20px] mb-[45px]">
                            <h3 className="text-[25px] font-medium leading-[28px] text-black">User Information</h3>
                            <button onClick={() => setEditing(true)} className="text-[13px] text-[#5331EA] underline">Edit</button>
                        </div>

                        {!editing ? (
                            <div className="space-y-[14px]">
                                <div className="flex items-center gap-[60px]">
                                    <span className="text-[14px] font-medium text-[#686868] w-[70px]">User ID</span>
                                    <span className="text-[14px] font-medium text-black">{user?.id ?? '—'}</span>
                                </div>
                                <div className="w-[200px] h-[0.5px] bg-[#686868]"></div>
                                <div className="flex items-center gap-[60px]">
                                    <span className="text-[14px] font-medium text-[#686868] w-[70px]">Name</span>
                                    <span className="text-[14px] font-medium text-black">{user?.name ?? '—'}</span>
                                </div>
                                <div className="w-[200px] h-[0.5px] bg-[#686868]"></div>
                                <div className="flex items-center gap-[60px]">
                                    <span className="text-[14px] font-medium text-[#686868] w-[70px]">Phone</span>
                                    <span className="text-[14px] font-medium text-black">{user?.phone ?? '—'}</span>
                                </div>
                                <div className="w-[200px] h-[0.5px] bg-[#686868]"></div>
                                <div className="flex items-center gap-[60px]">
                                    <span className="text-[14px] font-medium text-[#686868] w-[70px]">Joined</span>
                                    <span className="text-[14px] font-medium text-black">{user ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-[16px]">
                                <div className="flex items-center gap-[20px]">
                                    <span className="text-[14px] font-medium text-[#686868] w-[70px]">Name</span>
                                    <input value={editName} onChange={e => setEditName(e.target.value)}
                                        className="border border-[#D9D9D9] rounded-[8px] px-[10px] py-[6px] text-[14px] outline-none focus:border-[#5331EA] w-[220px]" />
                                </div>
                                <div className="flex items-center gap-[20px]">
                                    <span className="text-[14px] font-medium text-[#686868] w-[70px]">Phone</span>
                                    <input value={editPhone} onChange={e => setEditPhone(e.target.value)}
                                        className="border border-[#D9D9D9] rounded-[8px] px-[10px] py-[6px] text-[14px] outline-none focus:border-[#5331EA] w-[220px]" />
                                </div>
                                <div className="flex gap-[10px] mt-[10px]">
                                    <button onClick={saveEdit} className="px-[18px] py-[8px] bg-black text-white rounded-[8px] text-[14px]">Save</button>
                                    <button onClick={() => setEditing(false)} className="px-[18px] py-[8px] border border-[#D9D9D9] rounded-[8px] text-[14px]">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="absolute left-[845px] bottom-[70px] flex gap-[10px]">
                        <div className="w-[8px] h-[8px] rounded-full bg-[#686868]"></div>
                        <div onClick={() => nav('_next')} className="w-[8px] h-[8px] rounded-full bg-[#D9D9D9] cursor-pointer"
                            style={{ display: 'block' }}
                            onClickCapture={e => { e.stopPropagation(); window.location.href = `/admin/user-details-view-next${userId ? `?id=${userId}` : ''}`; }}></div>
                        <div className="w-[8px] h-[8px] rounded-full bg-[#D9D9D9] cursor-pointer"
                            onClick={() => window.location.href = `/admin/user-details-offers${userId ? `?id=${userId}` : ''}`}></div>
                    </div>

                    <div className="absolute right-[76px] bottom-[70px]">
                        <button onClick={() => window.location.href = `/admin/user-details-view-next${userId ? `?id=${userId}` : ''}`}
                            className="w-[77px] h-[52px] bg-black rounded-[16px] flex items-center justify-center cursor-pointer">
                            <span className="text-[20px] font-medium leading-[22px] text-white">Next</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
