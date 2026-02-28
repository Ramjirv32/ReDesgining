'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

interface User { id: string; name: string; phone: string; createdAt: string; }
interface Stats { events: number; dining: number; play: number; }

export default function UserDetails2_1() {
    const params = useSearchParams();
    const userId = params.get('id') ?? '';
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<Stats>({ events: 0, dining: 0, play: 0 });

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
            .then(r => r.json()).then(setUser).catch(() => {});
        fetch(`/backend/api/admin/users/${userId}/stats`, { credentials: 'include' })
            .then(r => r.json()).then(setStats).catch(() => {});
    }, [userId]);

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
                        <h3 className="text-[25px] font-medium leading-[28px] text-black mb-[45px]">Activity Summary</h3>
                        <div className="flex gap-[60px]">
                            <div className="w-[170px] h-[164px] bg-[rgba(189,177,243,0.3)] rounded-[19px] flex flex-col items-center relative overflow-hidden">
                                <div className="mt-[19px] mb-[11px]">
                                    <Image src="/admin panel/event-icon.svg" alt="Events" width={41} height={41} />
                                </div>
                                <h4 className="text-[20px] font-medium leading-[22px] text-black mb-[11px]">Events</h4>
                                <div className="flex w-full mt-auto">
                                    <div className="flex-1 flex flex-col items-center py-[7px]">
                                        <span className="text-[20px] font-medium text-black">{stats.events}</span>
                                        <span className="text-[10px] text-black">Booked</span>
                                    </div>
                                    <div className="w-[0.5px] bg-[#686868] h-[30px] self-center"></div>
                                    <div className="flex-1 flex flex-col items-center py-[7px]">
                                        <span className="text-[20px] font-medium text-black">0</span>
                                        <span className="text-[10px] text-black">Ticlisted</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-[170px] h-[164px] bg-[rgba(189,177,243,0.3)] rounded-[19px] flex flex-col items-center relative overflow-hidden">
                                <div className="mt-[20px] mb-[10px]">
                                    <Image src="/admin panel/dining-icon.svg" alt="Dining" width={41} height={41} />
                                </div>
                                <h4 className="text-[20px] font-medium leading-[22px] text-black mb-[11px]">Dining</h4>
                                <div className="flex w-full mt-auto">
                                    <div className="flex-1 flex flex-col items-center py-[7px]">
                                        <span className="text-[20px] font-medium text-black">{stats.dining}</span>
                                        <span className="text-[10px] text-black">Booked</span>
                                    </div>
                                    <div className="w-[0.5px] bg-[#686868] h-[30px] self-center"></div>
                                    <div className="flex-1 flex flex-col items-center py-[7px]">
                                        <span className="text-[20px] font-medium text-black">0</span>
                                        <span className="text-[10px] text-black">Ticlisted</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-[170px] h-[164px] bg-[rgba(189,177,243,0.3)] rounded-[19px] flex flex-col items-center relative overflow-hidden">
                                <div className="mt-[20px] mb-[10px]">
                                    <Image src="/admin panel/cricket-icon.svg" alt="Play" width={41} height={41} />
                                </div>
                                <h4 className="text-[20px] font-medium leading-[22px] text-black mb-[11px]">Play</h4>
                                <div className="flex w-full mt-auto">
                                    <div className="flex-1 flex flex-col items-center py-[7px]">
                                        <span className="text-[20px] font-medium text-black">{stats.play}</span>
                                        <span className="text-[10px] text-black">Booked</span>
                                    </div>
                                    <div className="w-[0.5px] bg-[#686868] h-[30px] self-center"></div>
                                    <div className="flex-1 flex flex-col items-center py-[7px]">
                                        <span className="text-[20px] font-medium text-black">0</span>
                                        <span className="text-[10px] text-black">Ticlisted</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute left-[845px] bottom-[70px] flex gap-[10px]">
                        <div onClick={() => window.location.href = `/admin/user-details-view${userId ? `?id=${userId}` : ''}`}
                            className="w-[8px] h-[8px] rounded-full bg-[#D9D9D9] cursor-pointer"></div>
                        <div className="w-[8px] h-[8px] rounded-full bg-[#686868]"></div>
                        <div onClick={() => window.location.href = `/admin/user-details-offers${userId ? `?id=${userId}` : ''}`}
                            className="w-[8px] h-[8px] rounded-full bg-[#D9D9D9] cursor-pointer"></div>
                    </div>

                    <div className="absolute right-[76px] bottom-[70px]">
                        <button onClick={() => window.location.href = `/admin/user-details-offers${userId ? `?id=${userId}` : ''}`}
                            className="w-[77px] h-[52px] bg-black rounded-[16px] flex items-center justify-center cursor-pointer">
                            <span className="text-[20px] font-medium leading-[22px] text-white">Next</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
