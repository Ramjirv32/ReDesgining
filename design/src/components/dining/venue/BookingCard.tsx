'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BookingCard() {
    const params = useParams();
    const id = params?.id ?? '';

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
                            <option>Today, {'{'} DATE {'}'}</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-900 pointer-events-none" />
                    </div>
                </div>

                {/* Guests Input */}
                <div className="space-y-1">
                    <label className="text-[20px] font-medium text-[#666666]/80 leading-none block">Guests</label>
                    <div className="relative">
                        <select className="w-full h-[40px] px-3 bg-white rounded-[12px] border border-[#d9d9d9] text-[15px] text-zinc-900 font-medium appearance-none cursor-pointer focus:outline-none">
                            <option>{'{'} COUNT {'}'} guests</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-900 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
                <Link href={`/dining/venue/${id}/book`} className="block w-full">
                    <button
                        className="w-full h-[48px] bg-black text-white rounded-[12px] text-[18px] font-semibold flex items-center justify-center active:scale-[0.98]"
                    >
                        Book a table
                    </button>
                </Link>
            </div>
        </div>
    );
}