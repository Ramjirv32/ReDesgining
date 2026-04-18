'use client';

import React from 'react';
import SetupSidebar from '@/app/list-your-events/list-your-Setups/SetupSidebar';
import { ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function BankDetailsPage() {
    return (
        <div className="overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)] h-[calc(100vh-80px)]" style={{ background: 'rgba(211, 203, 245, 0.1)' }}>
            {/* Content Area */}
            <main className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-14 lg:px-32 py-10 md:py-16">
                <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">

                    {/* Sidebar Column */}
                    <aside className="w-fit pt-32 hidden lg:block">
                        <SetupSidebar currentStep="03" completedSteps={['01', '02']} />
                    </aside>

                    {/* Content Column */}
                    <div className="flex-1 flex flex-col pt-4 mt-[-75px]">
                        {/* Header Info */}
                        <div className="mb-12">
                            <p className="text-[14px] font-medium text-black opacity-80" style={{ fontFamily: 'Anek Latin' }}>
                                &#123; NUMBER OF GST ADDED &#125;
                            </p>
                            <div className="w-[120px] h-[1px] bg-zinc-300 mt-6" />
                        </div>

                        {/* Mobile Sidebar */}
                        <div className="lg:hidden mb-12">
                            <SetupSidebar currentStep="03" completedSteps={['01', '02']} />
                        </div>

                        {/* Form Area */}
                        <div className="space-y-10 mt-[-15px]">
                            <h1 className="text-[32px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>
                                Bank details
                            </h1>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 max-w-4xl">
                                {/* Bank Account Name */}
                                <div className="space-y-3 mt-[-15px]">
                                    <label className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                        Enter name on bank account
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Velrona Technologies Pvt Ltd."
                                        className="w-full h-12 px-4 bg-[] border border-[#AEAEAE] rounded-[14px] text-[15px] text-zinc-800 font-medium focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400 mt-3"
                                    />
                                </div>

                                {/* Account Number */}
                                <div className="space-y-3 mt-[-15px]">
                                    <label className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                        Enter bank account number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="eg. 012345678910"
                                        className="w-full h-12 px-4 bg-[] border border-[#AEAEAE] rounded-[14px] text-[15px] text-zinc-800 font-medium focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400 mt-3"
                                    />
                                </div>

                                {/* IFSC Code */}
                                <div className="space-y-3">
                                    <label className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                        Enter bank IFSC code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="eg. IDFB0000001"
                                        className="w-full h-12 px-4 bg-[] border border-[#AEAEAE] rounded-[14px] text-[15px] text-zinc-800 font-medium focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400 mt-3"
                                    />
                                </div>

                                <div className="hidden md:block" />

                                {/* Finance POC Name */}
                                <div className="space-y-3">
                                    <label className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                        Enter finance POC contact name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="eg. Aravinth Rajan"
                                        className="w-full h-12 px-4 bg-[] border border-[#AEAEAE] rounded-[14px] text-[15px] text-zinc-800 font-medium focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400 mt-3"
                                    />
                                </div>

                                {/* Finance POC Number */}
                                <div className="space-y-3">
                                    <label className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                        Enter finance POC contact number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="eg. 9922992299"
                                        className="w-full h-12 px-4 bg-[] border border-[#AEAEAE] rounded-[14px] text-[15px] text-zinc-800 font-medium focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400 mt-3"
                                    />
                                </div>

                                {/* City Dropdown */}
                                <div className="space-y-3">
                                    <label className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                        Select City
                                    </label>
                                    <div className="relative">
                                        <select className="w-full h-12 px-4 bg-[] border border-[#AEAEAE] rounded-[14px] text-[15px] text-zinc-400 font-medium appearance-none cursor-pointer focus:outline-none focus:border-zinc-500 transition-colors mt-3">
                                            <option>Select city</option>
                                        </select>
                                        <ChevronDown size={18} className="absolute right-4 top-9 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Certification Checkbox */}
                            <div className="flex gap-4 items-start pt-4 max-w-2xl">
                                <input
                                    type="checkbox"
                                    className="w-6 h-6 mt-1 rounded-[8px] border border-zinc-300 accent-black focus:ring-0 cursor-pointer flex-shrink-0"
                                />
                                <p className="text-[13px] text-[#686868] font-medium leading-normal" style={{ fontFamily: 'Anek Latin' }}>
                                    I hereby certify that the above details are accurate, the bank account mentioned above is maintained by me or my organisation, and I take full responsibility if any information is found false under applicable laws.
                                </p>
                            </div>

                            {/* Continue Button */}
                            <div className="pt-2 flex justify-center md:justify-start">
                                <Link href="/list-your-events/setup/backup" className="block w-full max-w-[110px]">
                                    <button className="bg-black text-white w-full h-[48px] rounded-[15px] flex items-center justify-center gap-2 text-[15px] font-medium transition-all group active:scale-95">
                                        Continue<ChevronRight size={18} className="transition-transform" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
