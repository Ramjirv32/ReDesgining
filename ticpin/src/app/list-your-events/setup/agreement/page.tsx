'use client';

import React, { useState } from 'react';
import SetupSidebar from '@/app/list-your-events/list-your-Setups/SetupSidebar';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api/events';
import { getOrganizerSession, updateSessionCategoryStatus } from '@/lib/auth/organizer';

export default function AgreementPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSign = async () => {
        setLoading(true);
        setError('');
        try {
            const session = getOrganizerSession();
            const data = JSON.parse(sessionStorage.getItem('setup_events') ?? '{}');
            await eventsApi.setup({
                organizerId: session?.id ?? '',
                orgType: data.orgType ?? 'individual',
                phone: data.phone ?? '',
                pan: data.pan,
                panName: data.panName,
                panDOB: data.panDOB,
                panCardUrl: data.panCardUrl,
                bankAccountNo: data.bankAccountNo,
                bankIfsc: data.bankIfsc,
                bankName: data.bankName,
                accountHolder: data.accountHolder,
                backupEmail: data.backupEmail,
                backupPhone: data.backupPhone,
            });
            updateSessionCategoryStatus('events', 'pending');
            sessionStorage.removeItem('setup_events');
            router.push('/organizer/dashboard?category=events');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Something went wrong';
            if (msg === 'pan_already_used') {
                setError('This PAN card is already registered by another account.');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)] h-[calc(100vh-80px)]" style={{ background: 'rgba(211, 203, 245, 0.1)' }}>
            {/* Content Area */}
            <main className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-14 lg:px-32 py-10 md:py-16">
                <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">

                    {/* Sidebar Column */}
                    <aside className="w-fit pt-32 hidden lg:block">
                        <SetupSidebar currentStep="05" completedSteps={['01', '02', '03', '04']} />
                    </aside>

                    {/* Content Column */}
                    <div className="flex-1 flex flex-col pt-4 mt-[-75px]">
                        {/* Header Info */}
                        <div className="mb-12">
                            <p className="text-[14px] font-medium text-black opacity-80" style={{ fontFamily: 'Anek Latin' }}>
                                &#123; AGREEMENT &#125;
                            </p>
                            <div className="w-[120px] h-[1px] bg-zinc-300 mt-6" />
                        </div>

                        {/* Mobile Sidebar */}
                        <div className="lg:hidden mb-12">
                            <SetupSidebar currentStep="05" completedSteps={['01', '02', '03', '04']} />
                        </div>

                        {/* Form Area */}
                        <div className="space-y-10 mt-[-15px]">
                            <h1 className="text-[32px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>
                                Agreement
                            </h1>

                            <p className="text-[16px] text-[#686868] font-medium leading-relaxed max-w-2xl" style={{ fontFamily: 'Anek Latin' }}>
                                <span className="text-[#5331EA]"> Almost there!</span> Complete your onboarding by signing your digital agreement with Ticpin.
                            </p>

                            {error && (
                                <p className="text-red-500 text-[14px] font-medium">{error}</p>
                            )}

                            <div className="pt-2 flex justify-center md:justify-start">
                                <button
                                    onClick={handleSign}
                                    disabled={loading}
                                    className="bg-black text-white w-full max-w-[160px] h-[48px] rounded-[15px] flex items-center justify-center gap-2 text-[15px] font-medium transition-all group active:scale-95 disabled:opacity-60"
                                >
                                    {loading ? 'Submitting...' : 'Sign agreement'}<ChevronRight size={18} className="transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
