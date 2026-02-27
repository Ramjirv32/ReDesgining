'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Utensils, Ticket, Gamepad2, Clock, ChevronRight, XCircle, RefreshCw } from 'lucide-react';
import { getOrganizerSession, saveOrganizerSession } from '@/lib/auth/organizer';
import { organizerApi } from '@/lib/api/organizer';
import ListingsGrid from '@/components/organizer/ListingsGrid';

function DashboardContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('category') || 'events';
    const [activeTab, setActiveTab] = useState(initialCategory as 'events' | 'play' | 'dining');
    const router = useRouter();
    // hasMounted prevents SSR/client HTML mismatch — session is only readable client-side
    const [hasMounted, setHasMounted] = useState(false);
    const [session, setSession] = useState<ReturnType<typeof getOrganizerSession>>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setHasMounted(true);
        const s = getOrganizerSession();
        if (!s) {
            router.replace('/');
            return;
        }
        setSession(s);

        const syncStatus = async () => {
            try {
                const me = await organizerApi.getMe();
                const updatedSession = { ...s, categoryStatus: me.categoryStatus };
                setSession(updatedSession);
                saveOrganizerSession(updatedSession);
            } catch {
                try {
                    const { categoryStatus } = await organizerApi.getStatus(s.id);
                    const updatedSession = { ...s, categoryStatus };
                    setSession(updatedSession);
                    saveOrganizerSession(updatedSession);
                } catch { }
            } finally {
                setLoading(false);
            }
        };

        syncStatus();
    }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

    // Before mount: server and client render the same pulse (fixes hydration mismatch)
    if (!hasMounted || (loading && !session?.categoryStatus)) {
        return <div className="h-[calc(100vh-80px)] w-full bg-zinc-50 animate-pulse" />;
    }

    const themes = {
        events: {
            bg: 'rgba(211, 203, 245, 0.1)',
            title: 'Your events',
            subtitle: 'An overview of your events',
            buttonLabel: 'Create event',
            createPath: '/events/create',
            listPath: '/list-your-events',
            icon: Ticket,
            accent: '#AC9BF7',
        },
        play: {
            bg: 'rgba(255, 241, 168, 0.1)',
            title: 'Your Turfs / Courts',
            subtitle: 'An overview of your play venues',
            buttonLabel: 'List venue',
            createPath: '/play/create',
            listPath: '/list-your-play',
            icon: Gamepad2,
            accent: '#E7C200',
        },
        dining: {
            bg: 'rgba(255, 241, 168, 0.05)',
            title: 'Your dining',
            subtitle: 'An overview of your dining listings',
            buttonLabel: 'Create listing',
            createPath: '/dining/create',
            listPath: '/list-your-dining',
            icon: Utensils,
            accent: '#E7C200',
        }
    };

    const currentTheme = themes[activeTab];

    const switcherItems = [
        { id: 'dining', label: 'Dining', icon: Utensils },
        { id: 'events', label: 'Events', icon: Ticket },
        { id: 'play', label: 'Play', icon: Gamepad2 },
    ];

    const currentStatus = session?.categoryStatus?.[activeTab];

    return (
        <div
            className="flex flex-col font-[family-name:var(--font-anek-latin)] transition-colors duration-500 overflow-y-auto"
            style={{ background: currentTheme.bg, minHeight: 'calc(100vh - 80px)' }}
        >
            {/* Top Switcher */}
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
            <main className="flex-1 px-8 md:px-14 lg:px-20 pb-16 flex flex-col justify-start">
                <div className="max-w-[1228px] mx-auto w-full">

                    <div className="flex flex-col md:flex-row md:items-end justify-between items-start mb-8">
                        <div className="space-y-1">
                            <h1 className="text-[36px] font-medium text-black leading-tight" style={{ fontFamily: 'Anek Latin' }}>
                                {activeTab === 'play' ? 'Your Turfs / Courts' : currentTheme.title}
                            </h1>
                            <p className="text-[24px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                {activeTab === 'play' ? 'An overview of your Turf / Court' : currentTheme.subtitle}
                            </p>
                        </div>

                        {/* Create Button — shown only when category is approved */}
                        {currentStatus === 'approved' && (
                            <button
                                onClick={() => router.push(currentTheme.createPath)}
                                className="mt-6 md:mt-0 bg-black text-white px-8 h-[56px] rounded-[15px] flex items-center gap-3 text-[18px] font-medium transition-all active:scale-95"
                            >
                                <Plus size={20} className="text-white" />
                                <span style={{ fontFamily: 'Anek Latin' }}>{activeTab === 'play' ? 'List Play' : currentTheme.buttonLabel}</span>
                            </button>
                        )}
                    </div>

                    {/* Horizontal Line Divider */}
                    <div className="w-full h-[1px] bg-black/10 mb-8" />

                    {/* Content States */}
                    <div className="pt-4">
                        {!currentStatus ? (
                            /* State 1: Not Onboarded */
                            <div className="flex flex-col items-center gap-8 text-center max-w-lg">
                                <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center">
                                    <currentTheme.icon size={40} className="text-black/40" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-[28px] font-bold text-black capitalize">Become a {activeTab} organizer</h2>
                                    <p className="text-[#686868] text-[16px]">
                                        Start your journey as a {activeTab} partner. Onboard within minutes and reach thousands of customers.
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push(currentTheme.listPath)}
                                    className="bg-black text-white px-10 h-[56px] rounded-[15px] flex items-center gap-3 text-[18px] font-medium transition-all active:scale-95 shadow-xl shadow-black/10"
                                >
                                    Get Started as {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Partner
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        ) : currentStatus === 'pending' ? (
                            /* State 2: Under Review */
                            <div className="flex flex-col items-center gap-6 text-center max-w-md">
                                <div className="bg-[#F9C9A9] rounded-[15px] shadow-sm flex items-center justify-center gap-3 px-8 py-4">
                                    <Clock size={22} className="text-black" />
                                    <span className="text-[18px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>
                                        Account under review
                                    </span>
                                </div>
                                <p className="text-[#686868] text-[15px]">
                                    Your {activeTab} organizer account is being reviewed by our team. We'll notify you once it's approved.
                                </p>
                                <button
                                    onClick={async () => {
                                        try {
                                            const me = await organizerApi.getMe();
                                            const updatedSession = { ...session!, categoryStatus: me.categoryStatus };
                                            setSession(updatedSession);
                                            saveOrganizerSession(updatedSession);
                                        } catch { }
                                    }}
                                    className="flex items-center gap-2 text-[#686868] text-[14px] hover:text-black transition-colors"
                                >
                                    <RefreshCw size={15} /> Refresh status
                                </button>
                            </div>
                        ) : currentStatus === 'approved' ? (
                            /* State 3: Approved — show listings grid */
                            <ListingsGrid
                                vertical={activeTab}
                                createPath={currentTheme.createPath}
                                createLabel={currentTheme.buttonLabel}
                                accentColor={currentTheme.accent}
                                Icon={currentTheme.icon}
                            />
                        ) : currentStatus === 'rejected' ? (
                            /* State 4: Rejected */
                            <div className="flex flex-col items-center gap-6 text-center max-w-md">
                                <div className="bg-red-50 border border-red-200 rounded-[15px] flex items-start gap-3 px-8 py-5 text-left">
                                    <XCircle size={22} className="text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[18px] font-medium text-red-700">Application Rejected</p>
                                        <p className="text-[14px] text-red-500 mt-1">
                                            Your {activeTab} organizer application was not approved. Please review and resubmit.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(currentTheme.listPath + '/setup')}
                                    className="bg-black text-white px-10 h-[56px] rounded-[15px] flex items-center gap-3 text-[18px] font-medium transition-all active:scale-95"
                                >
                                    Resubmit Application
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        ) : null}
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
