'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import OrganizerHeader from '@/components/organizer/OrganizerHeader';
import { getOrganizerSession } from '@/lib/auth/organizer';
import { ArrowLeft } from 'lucide-react';

function PayoutsContent() {
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
                            Payouts
                        </h1>
                        <p className="text-[30px] font-medium text-[#686868]">
                            Manage your payouts
                        </p>
                    </div>

                    {/* Horizontal Divider */}
                    <div className="w-full h-[1px] bg-[#AEAEAE]" />

                    {/* Bank Details Section */}
                    <div className="space-y-8">
                        <h2 className="text-[25px] font-medium text-[#686868]">
                            Bank details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Company Name */}
                            <div className="space-y-2">
                                <label className="block text-[20px] font-medium text-[#AEAEAE] ml-2">
                                    Company Name
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="text"
                                        placeholder="Velrona Technologies Pvt Ltd."
                                        className="w-full h-[65px] bg-white rounded-[20px] border-[1.5px] border-[#AEAEAE] px-6 text-[20px] outline-none focus:border-black transition-all"
                                    />
                                </div>
                            </div>

                            {/* Account Number */}
                            <div className="space-y-2">
                                <label className="block text-[20px] font-medium text-[#AEAEAE] ml-2">
                                    Account Number
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="text"
                                        placeholder="eg. 012345678910"
                                        className="w-full h-[65px] bg-white rounded-[20px] border-[1.5px] border-[#AEAEAE] px-6 text-[20px] outline-none focus:border-black transition-all"
                                    />
                                </div>
                            </div>

                            {/* IFSC Code */}
                            <div className="space-y-2">
                                <label className="block text-[20px] font-medium text-[#AEAEAE] ml-2">
                                    IFSC Code
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="text"
                                        placeholder="eg. IDFB0000001"
                                        className="w-full h-[65px] bg-white rounded-[20px] border-[1.5px] border-[#AEAEAE] px-6 text-[20px] outline-none focus:border-black transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button (Optional Addition for UX) */}
                    <div className="flex justify-end pt-8">
                        <button className="bg-black text-white px-12 h-[56px] rounded-[15px] text-[18px] font-bold transition-all active:scale-95 shadow-lg">
                            Save Bank Details
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer Reference from Design */}
            <footer className="w-full py-8 text-center text-[#AEAEAE] text-[20px]">
                {/* Velrona Technologies Pvt Ltd. */}
            </footer>
        </div>
    );
}

export default function PayoutsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <PayoutsContent />
        </Suspense>
    );
}
