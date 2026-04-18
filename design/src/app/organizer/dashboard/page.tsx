'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Utensils, Ticket, Gamepad2 } from 'lucide-react';

function DashboardContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('category') || 'events';
    const [activeTab, setActiveTab] = useState(initialCategory as 'events' | 'play' | 'dining');

    const themes = {
        events: {
            bg: 'rgba(211, 203, 245, 0.1)',
            title: 'Your events',
            subtitle: 'An overview of your events',
            buttonLabel: 'Create event'
        },
        play: {
            bg: 'rgba(255, 241, 168, 0.1)',
            title: 'Your play',
            subtitle: 'An overview of your play listings',
            buttonLabel: 'List Play'
        },
        dining: {
            bg: 'rgba(211, 203, 245, 0.1)',
            title: 'Your dining',
            subtitle: 'An overview of your dining listings',
            buttonLabel: 'Create listing'
        }
    };

    const currentTheme = themes[activeTab];

    const switcherItems = [
        { id: 'dining', label: 'Dining', icon: Utensils },
        { id: 'events', label: 'Events', icon: Ticket },
        { id: 'play', label: 'Play', icon: Gamepad2 },
    ];

    return (
        <div
            className="flex flex-col font-[family-name:var(--font-anek-latin)] transition-colors duration-500 overflow-hidden"
            style={{ background: currentTheme.bg, height: 'calc(100vh - 80px)' }}
        >

            {/* Top Switcher - Just icons, positioned near navbar area */}
            <div className="w-full flex justify-start px-10 py-6">
                <div className="flex gap-4 items-center">
                    {switcherItems.map((item) => (
                        <button
                            key={item.id}
                            title={item.label}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-12 h-12 flex items-center justify-center rounded-[12px] transition-all group ${activeTab === item.id ? 'bg-black text-white shadow-md' : 'text-[#686868] hover:bg-black/5'}`}
                        >
                            <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'text-[#686868] group-hover:text-black'} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden px-8 md:px-14 lg:px-20 pb-16 flex flex-col justify-start">
                <div className="max-w-[1228px] mx-auto w-full">

                    {/* Page Headers */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between items-start mb-8">
                        <div className="space-y-1">
                            <h1 className="text-[36px] font-medium text-black leading-tight" style={{ fontFamily: 'Anek Latin' }}>
                                {activeTab === 'play' ? 'Your Turfs / Courts' : currentTheme.title}
                            </h1>
                            <p className="text-[24px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                {activeTab === 'play' ? 'An overview of your Turf / Court' : currentTheme.subtitle}
                            </p>
                        </div>

                        {/* Create Button */}
                        <button className="mt-6 md:mt-0 bg-[#D9D9D9] text-white px-8 h-[56px] rounded-[15px] flex items-center gap-3 text-[18px] font-medium transition-all active:scale-95">
                            <Plus size={20} className="text-white" />
                            <span style={{ fontFamily: 'Anek Latin' }}>{activeTab === 'play' ? 'List Play' : currentTheme.buttonLabel}</span>
                        </button>
                    </div>

                    {/* Horizontal Line Divider */}
                    <div className="w-full h-[1px] bg-white/30 mb-20" />

                    {/* Account Under Review Design */}
                    <div className="flex items-center justify-center pt-10">
                        <div
                            className="bg-[#F9C9A9] rounded-[15px] shadow-sm flex items-center justify-center px-8 py-3 cursor-default"
                        >
                            <span className="text-[18px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>
                                Account under review
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function OrganizerDashboard() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <DashboardContent />
        </Suspense>
    );
}
