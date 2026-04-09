'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import OrganizerHeader from '@/components/organizer/OrganizerHeader';
import { getOrganizerSession } from '@/lib/auth/organizer';
import { PieChart, BarChart2, TrendingUp, Users, ArrowLeft } from 'lucide-react';

function AnalyticsContent() {
    const router = useRouter();
    const [hasMounted, setHasMounted] = useState(false);
    const [session, setSession] = useState<ReturnType<typeof getOrganizerSession>>(null);

    useEffect(() => {
        setHasMounted(true);
        const s = getOrganizerSession();
        if (!s) {
            router.replace('/organizer/login');
            return;
        }
        setSession(s);
    }, [router]);

    if (!hasMounted) {
        return <div className="min-h-screen bg-zinc-50 animate-pulse" />;
    }

    return (
        <div className="flex flex-col min-h-screen font-[family-name:var(--font-anek-latin)] bg-[#F8F9FA]">
            <OrganizerHeader />

            <main className="flex-1 px-8 md:px-14 lg:px-20 py-16">
                <div className="max-w-[1228px] mx-auto w-full space-y-12">
                    {/* Back Button */}
                    <button
                        onClick={() => router.push('/organizer/dashboard?category=play')}
                        className="flex items-center gap-2 text-[#686868] hover:text-black transition-colors group mb-6"
                    >
                        <div className="w-10 h-10 rounded-full bg-white border border-[#AEAEAE] flex items-center justify-center group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="text-[18px] font-medium">Back to Dashboard</span>
                    </button>

                    {/* Page Title Section */}
                    <div className="space-y-2">
                        <h1 className="text-[40px] font-bold text-black leading-tight">
                            Event Analytics
                        </h1>
                        <p className="text-[30px] font-medium text-[#686868]">
                            Insights into your performance
                        </p>
                    </div>

                    {/* Horizontal Divider */}
                    <div className="w-full h-[1px] bg-[#AEAEAE]" />

                    {/* Placeholder Content */}
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="w-24 h-24 bg-[#5331EA]/5 rounded-full flex items-center justify-center">
                            <PieChart size={48} className="text-[#5331EA]" />
                        </div>
                        <div className="space-y-2 max-w-md">
                            <h2 className="text-[28px] font-bold text-black">Analytics coming soon</h2>
                            <p className="text-[#686868] text-[18px]">
                                We're building a powerful dashboard to help you track ticket sales, customer demographics, and venue performance.
                            </p>
                        </div>
                        
                        {/* Empty State Cards Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm flex flex-col items-center gap-4 opacity-50 grayscale">
                                    <div className="w-12 h-12 bg-zinc-100 rounded-2xl" />
                                    <div className="w-24 h-4 bg-zinc-100 rounded-full" />
                                    <div className="w-16 h-8 bg-zinc-100 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="w-full py-8 text-center text-[#AEAEAE] text-[20px]">
                {/* Velrona Technologies Pvt Ltd. */}
            </footer>
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <AnalyticsContent />
        </Suspense>
    );
}
