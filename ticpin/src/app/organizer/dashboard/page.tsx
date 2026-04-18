'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Utensils, Ticket, Gamepad2, Clock, ChevronRight, XCircle, RefreshCw } from 'lucide-react';
import { getOrganizerSession, saveOrganizerSession } from '@/lib/auth/organizer';
import { organizerApi } from '@/lib/api/organizer';
import ListingsGrid from '@/components/organizer/ListingsGrid';
import OrganizerHeader from '@/components/organizer/OrganizerHeader';

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'events' | 'play' | 'dining'>('events');
    const [searchQuery, setSearchQuery] = useState('');
    // hasMounted prevents SSR/client HTML mismatch — session is only readable client-side
    const [hasMounted, setHasMounted] = useState(false);
    const [session, setSession] = useState<ReturnType<typeof getOrganizerSession>>(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dataCount, setDataCount] = useState<Record<string, number>>({});

    const handleDataCountChange = React.useCallback((count: number) => {
        setDataCount(prev => {
            if (prev[activeTab] === count) return prev;
            return { ...prev, [activeTab]: count };
        });
    }, [activeTab]);

    // Set activeTab from URL parameter
    useEffect(() => {
        const category = searchParams.get('category');
        if (category === 'play' || category === 'dining' || category === 'events') {
            setActiveTab(category);
        }
    }, [searchParams]);

    useEffect(() => {
        setHasMounted(true);
        const s = getOrganizerSession();
        if (!s) {
         
            setLoading(false);
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
                    const { categoryStatus } = await organizerApi.getStatus();
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
    if (!hasMounted || loading) {
        return <div className="h-[calc(100vh-80px)] w-full bg-zinc-50 animate-pulse" />;
    }

    // If no session after loading complete, show error instead of redirecting
    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-xl text-red-600">No organizer session found</p>
                <p className="text-gray-500">Please log in as an organizer first</p>
                <button 
                    onClick={() => router.push('/list-your-dining/Login')}
                    className="px-6 py-3 bg-[#5331EA] text-white rounded-xl"
                >
                    Go to Organizer Login
                </button>
            </div>
        );
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
            bg: 'linear-gradient(180deg, #FFFCED 0%, #FFFFFF 100%)',
            title: 'Your Turfs / Courts',
            subtitle: 'An overview of your play venues',
            buttonLabel: 'List venue',
            createPath: '/play/create',
            listPath: '/list-your-play',
            icon: Gamepad2,
            accent: '#E7C200',
        },
        dining: {
            bg: 'rgba(211, 203, 245, 0.1)',
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
            <OrganizerHeader activeTab={activeTab} />

            {/* Main Content Area */}
            <main className="flex-1 px-8 md:px-14 lg:px-20 pb-16 pt-10 flex flex-col justify-start">
                <div className="max-w-[1228px] mx-auto w-full">

                    <div className="flex flex-col md:flex-row md:items-end justify-between items-start mb-8">
                        <div className="space-y-1">
                            <h1 className="text-[40px] font-bold text-black leading-tight" style={{ fontFamily: 'Anek Latin' }}>
                                {activeTab === 'play' ? 'Your plays' : activeTab === 'dining' ? 'Your dinings' : 'Your events'}
                            </h1>
                            <p className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                {activeTab === 'play' ? 'An overview of your play' : activeTab === 'dining' ? 'An overview of your dining' : 'An overview of your events'}
                            </p>
                        </div>

                        {/* Create Button */}
                        {currentStatus === 'approved' && (
                            <button
                                onClick={() => router.push(currentTheme.createPath)}
                                className="mt-6 md:mt-0 bg-black text-white px-6 h-[48px] rounded-[10px] flex items-center gap-2 text-[16px] font-bold transition-all active:scale-95 shadow-sm"
                            >
                                <Plus size={18} className="text-white" />
                                <span style={{ fontFamily: 'Anek Latin' }}>
                                    {activeTab === 'play' ? 'List Play' : activeTab === 'dining' ? 'List Dining' : 'List Event'}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Horizontal Line Divider */}
                    <div className="w-full h-[1px] bg-black/10 mb-8" />

                    {/* Search Bar - Controlled by data count and status */}
                    {(currentStatus === 'approved' && (dataCount[activeTab] || 0) > 0) && (
                        <div className="mb-8 relative group">
                            <input
                                type="text"
                                placeholder={`Search for an ${activeTab === 'dining' ? 'dining' : activeTab === 'play' ? 'play' : 'event'}`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-[64px] bg-white rounded-[15px] border-2 border-transparent focus:border-[#5331EA] px-8 text-[20px] text-[#5331EA] placeholder:text-[#5331EA]/50 outline-none transition-all shadow-sm group-hover:shadow-md"
                                style={{ fontFamily: 'Anek Latin' }}
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                <svg className="w-7 h-7 text-[#5331EA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Content States */}
                    <div className="pt-4">
                        {!currentStatus ? (
                            /* State 1: Not Onboarded */
                            <div className="flex flex-col items-center gap-8 text-center max-w-lg mx-auto py-20">
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
                            <div className="flex flex-col items-center gap-6 text-center max-w-md mx-auto py-20">
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
                                searchQuery={searchQuery}
                                onDataCountChange={handleDataCountChange}
                            />
                        ) : currentStatus === 'rejected' ? (
                            /* State 4: Rejected */
                            <div className="flex flex-col items-center gap-6 text-center max-w-md mx-auto py-20">
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
