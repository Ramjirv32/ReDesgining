'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function UserDetails5() {
    const [activeTab, setActiveTab] = useState('Activity');

    const tabs = ['Overview', 'Bookings', 'Ticlists', 'Activity'];

    const activities = [
        { sno: '1', activity: '{RECENT ACTIVITY}' },
        { sno: '2', activity: '{RECENT ACTIVITY}' },
        { sno: '3', activity: '{RECENT ACTIVITY}' },
        { sno: '4', activity: '{RECENT ACTIVITY}' },
        { sno: '5', activity: '{RECENT ACTIVITY}' },
        { sno: '6', activity: '{RECENT ACTIVITY}' },
        { sno: '7', activity: '{RECENT ACTIVITY}' },
    ];

    return (
        <div className="bg-[#ECE8FD] rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex items-center justify-center gap-12" style={{ zoom: '90%' }}>

            <div className="px-[37px] pt-[6px] pb-[80px]">
                {/* Page Title - Structure from userdetail1.tsx */}
                <div className="mb-[32px]">
                    <h1 className="text-[40px] font-semibold leading-[44px] text-black">Admin Panel</h1>
                    <div className="w-[101px] h-[1.5px] bg-[#686868] mt-2"></div>
                </div>

                {/* User Details Subtitle - Structure from userdetail1.tsx */}
                <div className="mb-[40px]">
                    <h2 className="text-[25px] font-medium leading-[28px] text-black">User Details</h2>
                </div>

                {/* Main Content Card (Rectangle 125) */}
                <div className="bg-white rounded-[30px] shadow-sm p-[40px] w-[1440px] h-[522px] relative overflow-hidden mx-auto">
                    {/* Tabs */}
                    <div className="absolute flex gap-[40px] left-[658px] top-[40px]">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (tab === 'Overview') {
                                        window.location.href = '/admin/user-details-view';
                                    } else if (tab === 'Bookings') {
                                        window.location.href = '/admin/user-details-bookings';
                                    } else if (tab === 'Ticlists') {
                                        window.location.href = '/admin/user-details-ticlists';
                                    } else if (tab === 'Activity') {
                                        window.location.href = '/admin/user-details-activity';
                                    } else {
                                        setActiveTab(tab);
                                    }
                                }}
                                className={`px-[20px] py-[8px] text-[25px] font-medium leading-[28px] ${activeTab === tab
                                    ? 'bg-[rgba(83,49,234,0.15)] rounded-[38px]'
                                    : ''
                                    }`}
                                style={{
                                    color: '#000000'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Left Side - Profile Section */}
                    <div className="absolute left-[119px] top-[75px] flex flex-col items-center">
                        {/* Profile Circle (Ellipse 16) */}
                        <div className="w-[152px] h-[152px] bg-[rgba(189,177,243,0.3)] rounded-full mb-[26px]"></div>

                        {/* Name, Mail, Phone */}
                        <div className="text-center mb-[50px] w-[153px]">
                            <h3 className="text-[30px] font-medium leading-[33px] text-black">{`{NAME}`}</h3>
                            <p className="text-[30px] font-medium leading-[33px] text-[#6B7280]">{`{MAIL}`}</p>
                            <p className="text-[30px] font-medium leading-[33px] text-[#6B7280]">{`{PHONE NO}`}</p>
                        </div>

                        {/* Member Since Badge (Rectangle 124) */}
                        <div className="w-[250px] h-[54px] bg-[rgba(189,177,243,0.3)] rounded-[20px] flex items-center justify-center">
                            <span className="text-[20px] font-medium leading-[22px] text-black">{`{MEMBER SINCE}`}</span>
                        </div>
                    </div>

                    {/* Vertical Divider (Line 17) */}
                    <div className="absolute left-[460px] top-[165px] w-[1.5px] h-[200px] bg-[#686868]"></div>

                    {/* Right Side - Recent Activity Content */}
                    <div className="absolute left-[515px] top-[135px] w-[700px]">
                        <h3 className="text-[25px] font-medium leading-[28px] text-black mb-[20px]">Recent Activity</h3>

                        <div className="w-full">
                            {activities.map((item, index) => (
                                <div key={index} className="flex flex-col mb-[12px]">
                                    <div className="flex text-[15px] font-medium text-black mb-[8px]">
                                        <div className="w-[80px]">{item.sno}</div>
                                        <div>{item.activity}</div>
                                    </div>
                                    <div className="w-[305px] h-[1px] bg-[rgba(104,104,104,0.3)]"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Next Button */}
                    <div className="absolute right-[76px] bottom-[70px]">
                        <button
                            onClick={() => window.location.href = '/admin/user-details-view'}
                            className="w-[77px] h-[52px] bg-black rounded-[16px] flex items-center justify-center cursor-pointer"
                        >
                            <span className="text-[20px] font-medium leading-[22px] text-white">Next</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
