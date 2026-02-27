'use client';

import React from 'react';
import Image from 'next/image';
import { User, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const UserCard = () => (
    <Link href="/admin/user-details-view">
        <div className="w-[750px] h-[110px] bg-white rounded-[31px] relative flex items-center px-[34px] shadow-sm mb-[30px] cursor-pointer">
            {/* Profile Circle */}
            <div className="w-[73px] h-[73px] bg-[rgba(189,177,243,0.3)] rounded-full shrink-0"></div>

            {/* Details Container */}
            <div className="ml-[52px] flex flex-col gap-1">
                <h3 className="text-[17px] leading-[22px] font-medium text-black ml-[+25px]">{`{NAME}`}</h3>

                <div className="flex items-center gap-[7px]">
                    <Image src="/admin panel/userdetials icons/email-icon.svg" alt="Email" width={18} height={18} />
                    <span className="text-[17px] leading-[22px] font-medium text-[#6B7280]">{`{MAIL}`}</span>
                </div>

                <div className="flex items-center gap-[7px]">
                    <Image src="/admin panel/userdetials icons/phone-icon.svg" alt="Phone" width={15} height={15} />
                    <span className="text-[17px] leading-[22px] font-medium text-[#6B7280]">{`{PHONE NO}`}</span>
                </div>
            </div>

            {/* Arrow Icon */}
            <div className="absolute right-[44px]">
                <ChevronRight className="w-6 h-6 text-[#686868]" />
            </div>
        </div>
    </Link>
);

export default function UserDetails() {
    return (
        <div
            className="w-full min-h-screen font-sans"
            style={{
                background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)'
            }}
        >
            <div className="px-[37px] pt-[60px] pb-[80px] ml-[70px]">
                {/* Page Title */}
                <div className="mb-[32px] ">
                    <h1 className="text-[40px] font-semibold leading-[44px] text-black">Admin Panel</h1>
                    <div className="w-[101px] h-[1.5px] bg-[#686868] mt-2"></div>
                </div>

                {/* User Details Subtitle */}
                <div className="mb-[40px]">
                    <h2 className="text-[25px] font-medium leading-[28px] text-black">User Details</h2>
                </div>

                {/* Users List Container */}
                <div className="pl-[31px]">
                    <UserCard />
                    <UserCard />
                    <UserCard />
                </div>
            </div>
        </div>
    );
}
