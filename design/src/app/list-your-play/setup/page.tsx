'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SetupSidebar from '@/app/list-your-play/list-your-Setups/SetupSidebar';
import { ChevronDown, ChevronRight } from 'lucide-react';

const categories = [
    { id: 'individual', label: 'Individual' },
    { id: 'creator', label: 'Creator' },
    { id: 'company', label: 'Company' },
    { id: 'non-profit', label: 'Non-profit Organization' },
];

export default function AccountSetupPage() {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    return (
        <div className="overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)] h-[calc(100vh-80px)]" style={{ background: 'rgba(255, 241, 168, 0.1)' }}>
            {/* Content Area */}
            <main className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-14 lg:px-32 py-10 md:py-16">
                <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">

                    {/* Sidebar Column */}
                    <aside className="w-fit pt-36 hidden lg:block">
                        <SetupSidebar currentStep="01" category="play" />
                    </aside>

                    {/* Content Column */}
                    <div className="flex-1 flex flex-col pt-4">
                        {/* Global Header */}
                        <div className="mb-12 mt-[-75px]">
                            <h1 className="text-[32px] md:text-[36px] font-medium text-black mb-2" style={{ fontFamily: 'Anek Latin' }}>
                                Set up your Ticpin account
                            </h1>
                            <div className="w-[180px] h-[1px] bg-zinc-300 mt-8" />
                        </div>
                        {/* Mobile Sidebar - visible only on small screens */}
                        <div className="lg:hidden mb-12">
                            <SetupSidebar currentStep="01" category="play" />
                        </div>

                        {/* Form Section */}
                        <div className="space-y-5 mt-[-15px]">
                            <h2 className="text-[26px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>
                                Organization details
                            </h2>

                            <div className="space-y-8">
                                {/* Category Dropdown */}
                                <div className="flex flex-col gap-4 md:gap-3">
                                    <label className="text-[16px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                        Category
                                    </label>
                                    <div className="relative w-[348px] ml-[-3px]">
                                        <div
                                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                            className="w-full h-12 px-4 border border-zinc-200 rounded-[15px] flex items-center justify-between cursor-pointer hover:border-zinc-500 transition-colors"
                                        >
                                            <span className={`text-[15px] font-medium ${selectedCategory ? 'text-zinc-800' : 'text-zinc-400'}`}>
                                                {selectedCategory ? categories.find(c => c.id === selectedCategory)?.label : 'Choose Category'}
                                            </span>
                                            <ChevronDown size={18} className={`text-zinc-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                        </div>

                                        {isCategoryOpen && (
                                            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#D9D9D9] border border-zinc-200 rounded-[15px] shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                                {categories.map((cat) => (
                                                    <div
                                                        key={cat.id}
                                                        onClick={() => {
                                                            setSelectedCategory(cat.id);
                                                            setIsCategoryOpen(false);
                                                        }}
                                                        className="px-4 py-3 text-[15px] font-medium text hover:bg-black/10 cursor-pointer transition-colors"
                                                    >
                                                        {cat.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* PAN Inputs Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 mt">
                                    <div className="flex flex-col gap-4 md:gap-3">
                                        <label className="text-[16px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                            Enter your PAN
                                        </label>
                                        <div className="ml-[-3px]">
                                            <input
                                                type="text"
                                                placeholder="ABCDE1234F"
                                                className="w-full max-w-sm h-12 px-4 bg-[] border border-[#AEAEAE] rounded-[14px] text-[15px] text-zinc-800 font-medium focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400 mt-3"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 md:gap-3 pl-10">
                                        <label className="text-[16px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                            Enter your PAN name / your company's name
                                        </label>
                                        <div className="ml-[-3px]">
                                            <input
                                                type="text"
                                                placeholder="Velrona Technologies Pvt Ltd."
                                                className="w-full max-w-sm h-12 px-4 bg-[] border border-[#AEAEAE] rounded-[14px] text-[15px] text-zinc-800 font-medium focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400 mt-3"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Upload PAN Card */}
                                <div className="flex flex-col gap-4 md:gap-3">
                                    <label className="text-[16px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                        Upload your PAN card
                                    </label>
                                    <div className="ml-[-3px]">
                                        <button className="w-full max-w-sm h-23 border border-zinc-200 rounded-[20px] flex items-center px-6 gap-4 transition-colors group">
                                            <div className="w-10 h-10 flex items-center justify-center">
                                                <img src="/list your events/doc icon.svg" alt="doc" className="w-6 h-6 object-contain" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[16px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>Upload document</p>
                                                <p className="text-[12px] text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>Max 5MB • JPEG, JPG, PNG, PDF</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Continue Button */}
                            <div className="pt-2 flex justify-center md:justify-start">
                                <Link href="/list-your-play/setup/gst" className="block w-full max-w-[110px]">
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
