'use client';

import React from 'react';
import Link from 'next/link';
import SetupSidebar from '@/app/list-your-play/list-your-Setups/SetupSidebar';
import { ChevronRight } from 'lucide-react';

export default function GstSelectionPage() {
    return (
        <div className="overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)] h-[calc(100vh-80px)]" style={{ background: 'rgba(255, 241, 168, 0.1)' }}>
            {/* Content Area */}
            <main className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-14 lg:px-32 py-10 md:py-16">
                <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">

                    {/* Sidebar Column */}
                    <aside className="w-fit pt-32 hidden lg:block">
                        <SetupSidebar currentStep="02" completedSteps={['01']} category="play" />
                    </aside>

                    {/* Content Column */}
                    <div className="flex-1 flex flex-col pt-4 mt-[-75px]">
                        {/* Header Info */}
                        <div className="mb-12">
                            <p className="text-[14px] font-medium text-black opacity-80" style={{ fontFamily: 'Anek Latin' }}>
                                PAN confirmed as a &#123; TYPE OF ACCOUNT &#125;
                            </p>
                            <div className="w-[120px] h-[1px] bg-zinc-300 mt-6" />
                        </div>

                        {/* Mobile Sidebar */}
                        <div className="lg:hidden mb-12">
                            <SetupSidebar currentStep="02" completedSteps={['01']} category="play" />
                        </div>

                        {/* Form Section */}
                        <div className="space-y-10 mt-[-15px]">
                            <h1 className="text-[32px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>
                                GST selection
                            </h1>

                            <p className="text-[14px] text-[#686868] font-medium leading-relaxed max-w-2xl" style={{ fontFamily: 'Anek Latin' }}>
                                Select one or more GST accounts to onboard on Ticpin, you can configure these while creating events later. Please note, we only support Regular and Active GSTs to onboard as partners.
                            </p>

                            {/* GST Account Card */}
                            <div className="bg-transparent border-[1.5px] border-[#AEAEAE] rounded-[20px] p-6 flex items-center gap-6">
                                <input
                                    type="checkbox"
                                    className="w-6 h-6 rounded-[8px] border border-zinc-300 bg-white accent-black focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                />

                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 flex-1">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Brand name</p>
                                        <p className="text-[14px] text-black font-medium" style={{ fontFamily: 'Anek Latin' }}>&#123; NAME &#125;</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Address</p>
                                        <p className="text-[14px] text-black font-medium" style={{ fontFamily: 'Anek Latin' }}>&#123; ADDRESS &#125;</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">GSTIN</p>
                                        <p className="text-[14px] text-black font-medium" style={{ fontFamily: 'Anek Latin' }}>&#123; GST NUM &#125;</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Taxpayer type</p>
                                        <p className="text-[14px] text-black font-medium" style={{ fontFamily: 'Anek Latin' }}>&#123; Type &#125;</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">GST status</p>
                                        <p className="text-[14px] text-black font-medium" style={{ fontFamily: 'Anek Latin' }}>&#123; STATUS &#125;</p>
                                    </div>
                                </div>
                            </div>

                            {/* Continue Button */}
                            <div className="pt-2 flex justify-center md:justify-start">
                                <Link href="/list-your-play/setup/bank" className="block w-full max-w-[110px]">
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
