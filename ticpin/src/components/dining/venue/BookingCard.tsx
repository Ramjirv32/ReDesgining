'use client';

import { ChevronDown } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUserSession } from '@/lib/auth/user';
import AuthModal from '@/components/modals/AuthModal';

export default function BookingCard() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id ?? '';
    const session = useUserSession();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const handleBook = () => {
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }
        router.push(`/dining/venue/${id}/book`);
    };

    return (
        <div className="w-full md:w-[392px] h-auto bg-white border border-[#d9d9d9] rounded-[24px] shadow-sm p-[24px] flex flex-col overflow-visible">
            {/* Title */}
            <h3 className="text-[32px] font-medium text-black leading-normal tracking-tight mb-6">Book a table</h3>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-x-4 mb-4">
                {/* Date Input */}
                <div className="space-y-1">
                    <label className="text-[20px] font-medium text-[#666666]/80 leading-none block">Date</label>
                    <div className="relative">
                        <select className="w-full h-[40px] px-3 bg-white rounded-[12px] border border-[#d9d9d9] text-[15px] text-zinc-900 font-medium appearance-none cursor-pointer focus:outline-none">
                            <option>Today, FEB 27</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-900 pointer-events-none" />
                    </div>
                </div>

                {/* Guests Input */}
                <div className="space-y-1">
                    <label className="text-[20px] font-medium text-[#666666]/80 leading-none block">Guests</label>
                    <div className="relative">
                        <select className="w-full h-[40px] px-3 bg-white rounded-[12px] border border-[#d9d9d9] text-[15px] text-zinc-900 font-medium appearance-none cursor-pointer focus:outline-none">
                            <option>2 guests</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-900 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
                <button
                    onClick={handleBook}
                    className="w-full h-[48px] bg-black text-white rounded-[12px] text-[18px] font-semibold flex items-center justify-center active:scale-[0.98]"
                >
                    Book a table
                </button>
            </div>

            <AuthModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSuccess={() => router.push(`/dining/venue/${id}/book`)}
            />
        </div>
    );
}