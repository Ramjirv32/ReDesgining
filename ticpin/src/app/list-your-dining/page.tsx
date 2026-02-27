'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreatorSteps from '@/app/list-your-dining/list-your-Setups/CreatorSteps';
import { ChevronRight } from 'lucide-react';
import { getOrganizerSession } from '@/lib/auth/organizer';

export default function ListYourDiningPage() {
    const router = useRouter();

    useEffect(() => {
        const session = getOrganizerSession();
        if (session) {
            if (session.categoryStatus?.dining) {
                router.replace('/organizer/dashboard?category=dining');
            } else {
                router.replace('/list-your-dining/setup');
            }
        }
    }, [router]);

    const handleStart = () => {
        const session = getOrganizerSession();
        if (session) {
            if (session.categoryStatus?.dining) {
                router.push('/organizer/dashboard?category=dining');
            } else {
                router.push('/list-your-dining/setup');
            }
        } else {
            router.push('/list-your-dining/Login');
        }
    };

    return (
        <div
            className="overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)] h-[calc(100vh-80px)]"
            style={{ background: 'rgba(211, 203, 245, 0.1)' }}
        >
            <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-14 py-5 overflow-hidden">
                <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24 items-center">
                    <div className="w-full">
                        <h1 className="text-[36px] md:text-[40px] font-medium text-black leading-[44px]" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            Earn more as you grow with <br />
                            the right audience
                        </h1>
                    </div>
                    <div>
                        <CreatorSteps />
                    </div>
                </div>
                <div className="mt-10 md:mt-12">
                    <button
                        onClick={handleStart}
                        className="bg-black text-white px-8 h-[56px] rounded-[15px] flex items-center justify-center gap-2 text-[20px] font-medium transition-all group active:scale-95"
                        style={{ fontFamily: 'var(--font-anek-latin)' }}
                    >
                        Start your journey <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center ml-2 border border-black"><ChevronRight size={14} className="text-black transition-transform" /></div>
                    </button>
                </div>
            </main>
        </div>
    );
}
