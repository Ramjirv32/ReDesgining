'use client';

import React from 'react';
import Image from 'next/image';

export default function PushNotification() {
    return (
        <div className="w-full min-h-screen font-['Anek_Latin'] relative overflow-x-hidden flex flex-col items-center shadow-inner"
            style={{
                background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)',
                zoom: '90%'
            }}>

            {/* Inner Content Area (1440px restricted) */}
            <div className="w-[1440px] h-[1328px] relative mt-[-120px]">

                {/* Page Title (Admin Panel) */}
                <div className="absolute left-[37px] top-[180px] ">
                    <h1 className="text-[40px] font-semibold leading-[44px] text-black">Admin Panel</h1>
                    <div className="absolute w-[101px] h-[0px] left-0 top-[68px] border-[1.5px] border-[#686868]"></div>
                </div>

                {/* Subtitle (Push Notification) */}
                <h2 className="absolute left-[37px] top-[272px] text-[25px] font-medium leading-[28px] text-black">
                    Push Notification
                </h2>

                {/* Main Content Card (Rectangle 125) */}
                <div className="absolute left-[50%] translate-x-[-50%] top-[333px] w-[1363px] h-[522px] bg-white rounded-[30px] ">

                    {/* Title Section */}
                    <div className="absolute left-[116px] top-[64px]">
                        <label className="text-[20px] font-medium text-[#686868] mb-[13px] block">Title</label>
                        {/* Rectangle 42 */}
                        <div className="w-[458px] h-[65px] border-[1.5px] border-[#AEAEAE] rounded-[20px] flex items-center px-[18px]">
                            <input
                                type="text"
                                placeholder="Enter notification title"
                                className="bg-transparent text-[20px] font-medium text-black placeholder:text-[#AEAEAE] outline-none w-full"
                            />
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="absolute left-[694px] top-[64px]">
                        <label className="text-[20px] font-medium text-[#686868] mb-[13px] block">Description</label>
                        {/* Rectangle 126 */}
                        <div className="w-[458px] h-[65px] border-[1.5px] border-[#AEAEAE] rounded-[20px] flex items-center px-[18px]">
                            <input
                                type="text"
                                placeholder="Enter description here"
                                className="bg-transparent text-[20px] font-medium text-black placeholder:text-[#AEAEAE] outline-none w-full"
                            />
                        </div>
                    </div>

                    {/* Users Section */}
                    <div className="absolute left-[116px] top-[199px]">
                        <label className="text-[20px] font-medium text-[#686868] mb-[13px] block">Users</label>
                        {/* Rectangle 40 */}
                        <div className="w-[458px] h-[65px] border-[1.5px] border-[#AEAEAE] rounded-[20px] flex items-center px-[18px] justify-between cursor-pointer group">
                            <span className="text-[20px] font-medium text-[#AEAEAE]">Choose Users</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 9L12 15L18 9" stroke="#686868" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    {/* Image Section */}
                    <div className="absolute left-[694px] top-[199px]">
                        <label className="text-[20px] font-medium text-[#686868] mb-[13px] block">Image</label>
                        {/* Rectangle 44 */}
                        <div className="w-[458px] h-[105px] border-[1.5px] border-[#AEAEAE] rounded-[20px] flex items-center px-[22px] gap-[18px] cursor-pointer">
                            <div className="w-[25px] h-[25px] flex items-center justify-center relative">
                                <Image src="/list your events/doc icon.svg" alt="Upload" width={34} height={34} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[20px] font-medium text-black">Upload Image</span>
                                <div className="flex items-center gap-[6px] text-[15px] font-medium text-[#686868]">
                                    <span>Max 50MB</span>
                                    <span className="w-[4px] h-[4px] bg-[#686868] rounded-full"></span>
                                    <span>JPEG, JPG, PNG</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Send Button (Rectangle 128) */}
                    <div className="absolute right-[116px] bottom-[50px]">
                        <button className="w-[87px] h-[52px] bg-black rounded-[16px] flex items-center justify-center">
                            <span className="text-[20px] font-medium text-white">Send</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}