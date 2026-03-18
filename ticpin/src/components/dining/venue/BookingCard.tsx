'use client';

import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUserSession } from '@/lib/auth/user';
import AuthModal from '@/components/modals/AuthModal';

export default function BookingCard({ venueName }: { venueName: string }) {
    const router = useRouter();
    const session = useUserSession();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const handleBook = () => {
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }
        router.push(`/dining/venue/${encodeURIComponent(venueName)}/book`);
    };

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = (date: Date) => {
        const isToday = date.toDateString() === today.toDateString();
        return `${isToday ? 'Today' : 'Tomorrow'}, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}`;
    };

    return (
        <div className="w-full md:w-[392px] h-auto bg-white border border-[#d9d9d9] rounded-[24px] shadow-sm p-[24px] flex flex-col overflow-visible">
            {/* Title */}
            <h3 className="text-[32px] font-medium text-black leading-normal tracking-tight mb-6 uppercase">Book a table</h3>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-x-4 mb-4">
                {/* Date Input */}
                <div className="space-y-1">
                    <label className="text-[20px] font-medium text-[#666666]/80 leading-none block uppercase">Date</label>
                    <div className="relative">
                        <select className="w-full h-[40px] px-3 bg-white rounded-[12px] border border-[#d9d9d9] text-[15px] text-zinc-900 font-medium appearance-none cursor-pointer focus:outline-none">
                            <option>{formatDate(today)}</option>
                            <option>{formatDate(tomorrow)}</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-900 pointer-events-none" />
                    </div>
                </div>

                {/* Guests Input */}
                <div className="space-y-1">
                    <label className="text-[20px] font-medium text-[#666666]/80 leading-none block uppercase">Guests</label>
                    <div className="relative">
                        <select className="w-full h-[40px] px-3 bg-white rounded-[12px] border border-[#d9d9d9] text-[15px] text-zinc-900 font-medium appearance-none cursor-pointer focus:outline-none">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                <option key={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
                            ))}
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
                onSuccess={() => router.push(`/dining/venue/${encodeURIComponent(venueName)}/book`)}
            />
        </div>
    );
}