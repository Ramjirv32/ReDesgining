'use client';

import { useParams, useRouter } from 'next/navigation';
import { User, X } from 'lucide-react';

export default function BookingPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    return (
        <div className="min-h-screen flex flex-col font-[family-name:var(--font-anek-latin)]" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)' }}>
            {/* Header */}
           <header className="w-full h-[60px] md:h-[80px] bg-white flex items-center justify-between px-6 md:px-10 border-b border-[#FFFFFF] shadow-sm relative z-10">
                <div className="flex-shrink-0 cursor-pointer" onClick={() => router.push('/')}>
                    <img src="/ticpin-logo-black.png" alt="TICPIN" className="h-[20px] md:h-[25px] w-auto" />
                </div>

                <div className="flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2">
                    <h1 className="text-[18px] font-semibold text-black leading-tight uppercase" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        {`{EVENT NAME}`}
                    </h1>
                    <p className="text-[13px] font-medium text-[#686868] leading-tight" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        {`{DAY}, {DATE} | {TIME} {VENUE}`}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-[25px] h-[25px] bg-[#E1E1E1] rounded-full flex items-center justify-center">
                        <User className="text-[#686868]" size={12} />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full max-w-[800px] mx-auto px-10 py-8 space-y-4 flex-grow">
                {/* Large Layout Box 1 */}
                <div
                    className="w-full h-[165px] bg-[#D9D9D9] rounded-[10px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => router.push(`/events/${id}/book/tickets`)}
                >
                    <span className="text-[25px] font-medium text-black text-center" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        {`{SAMPLE LAYOUT IMAGE}`}
                    </span>
                </div>

                {/* Grid for 3 Boxes heloo*/}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                        className="h-[165px] bg-[#D9D9D9] rounded-[10px] flex items-center justify-center px-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.push(`/events/${id}/book/tickets`)}
                    >
                        <span className="text-[12px] font-medium text-black text-center" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {`{SAMPLE LAYOUT IMAGE}`}
                        </span>
                    </div>
                    <div
                        className="h-[165px] bg-[#D9D9D9] rounded-[10px] flex items-center justify-center px-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.push(`/events/${id}/book/tickets`)}
                    >
                        <span className="text-[12px] font-medium text-black text-center" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {`{SAMPLE LAYOUT IMAGE}`}
                        </span>
                    </div>
                    <div
                        className="h-[165px] bg-[#D9D9D9] rounded-[10px] flex items-center justify-center px-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.push(`/events/${id}/book/tickets`)}
                    >
                        <span className="text-[12px] font-medium text-black text-center" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {`{SAMPLE LAYOUT IMAGE}`}
                        </span>
                    </div>
                </div>

                {/* Large Layout Box 2 */}
                <div
                    className="w-full h-[224px] bg-[#D9D9D9] rounded-[10px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => router.push(`/events/${id}/book/tickets`)}
                >
                    <span className="text-[15px] font-medium text-black text-center" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        {`{SAMPLE LAYOUT IMAGE}`}
                    </span>
                </div>
            </main>

            {/* Footer Navigation */}
            <footer className="w-full h-[90px] bg-[#2A2A2A] flex items-center justify-center gap-6 px-10">
                <span className="text-[15px] font-medium text-white" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                    {`{EVENT CATEGORY NAME:}`}
                </span>
                <div className="flex items-center gap-3">
                    <button className="h-[27px] px-4 bg-white rounded-[8px] flex items-center justify-center active:scale-[0.98] transition-all">
                        <span className="text-[12px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {`{NAME 1}`}
                        </span>
                    </button>
                    <button className="h-[27px] px-4 bg-white rounded-[8px] flex items-center justify-center active:scale-[0.98] transition-all">
                        <span className="text-[12px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {`{NAME 2}`}
                        </span>
                    </button>
                    <button className="h-[27px] px-4 bg-white rounded-[8px] flex items-center justify-center active:scale-[0.98] transition-all">
                        <span className="text-[12px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {`{NAME 3}`}
                        </span>
                    </button>
                </div>
            </footer>
        </div>
    );
}
