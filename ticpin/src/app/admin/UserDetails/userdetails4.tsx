'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

interface User { id: string; name: string; phone: string; createdAt: string; }

export default function UserDetails4() {
    const params = useSearchParams();
    const userId = params.get('id') ?? '';
    const [user, setUser] = useState<User | null>(null);
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
                <div className="bg-white rounded-[30px] shadow-sm p-[40px] w-[1440px] h-[522px] relative overflow-hidden mx-auto">
                    <div className="absolute flex gap-[40px] left-[658px] top-[40px]">
                        {tabs.map((tab) => (
                            <button key={tab} onClick={() => nav(tab)}
                                className={`px-[20px] py-[8px] text-[25px] font-medium leading-[28px] ${tab === 'Ticlists' ? 'bg-[rgba(83,49,234,0.15)] rounded-[38px]' : ''}`}
                                style={{ color: '#000000' }}>
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="absolute left-[119px] top-[75px] flex flex-col items-center">
                        <div className="w-[152px] h-[152px] bg-[rgba(189,177,243,0.3)] rounded-full mb-[26px]"></div>
                        <div className="text-center mb-[50px] w-[153px]">
                            <h3 className="text-[30px] font-medium leading-[33px] text-black">{user?.name ?? '\u2014'}</h3>
                            <p className="text-[30px] font-medium leading-[33px] text-[#6B7280]">{user?.phone ?? '\u2014'}</p>
                        </div>
                        <div className="w-[250px] h-[54px] bg-[rgba(189,177,243,0.3)] rounded-[20px] flex items-center justify-center">
                            <span className="text-[20px] font-medium leading-[22px] text-black">Member Since {memberSince}</span>
                        </div>
                    </div>
                    <div className="absolute left-[460px] top-[165px] w-[1.5px] h-[200px] bg-[#686868]"></div>
                    <div className="absolute left-[515px] top-[150px]">
                        <h3 className="text-[25px] font-medium leading-[28px] text-black mb-[45px]">Ticlist Information</h3>
                        <div className="flex gap-[32px]">
                            <div className="w-[170px] h-[164px] bg-[rgba(189,177,243,0.3)] rounded-[19px] relative flex flex-col items-center justify-center">
                                <div className="absolute -top-[10px] -right-[10px] w-[45px] h-[45px] bg-white rounded-full flex items-center justify-center">
                                    <Image src="/admin panel/userdetials icons/ticlist-iocn.svg" alt="Ticlist" width={18} height={18} />
                                </div>
                                <div className="mb-2">
                                    <Image src="/admin panel/userdetials icons/dining-icon.svg" alt="Dining" width={41} height={41} />
                                </div>
                                <span className="text-[20px] font-medium text-black">{user?.name ?? '\u2014'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute right-[157px] bottom-[50px]">
                        <button onClick={() => window.location.href = `/admin/user-details-view${userId ? `?id=${userId}` : ''}`}
                            className="w-[77px] h-[52px] bg-black rounded-[16px] flex items-center justify-center cursor-pointer">
                            <span className="text-[20px] font-medium leading-[22px] text-white">Back</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
