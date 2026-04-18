'use client';

import { useParams, useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { useState } from 'react';

export default function TicketSelectionPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    const [ticketCount, setTicketCount] = useState(0);
    const [pricePerTicket] = useState(1000); // Sample price

    const handleAdd = () => {
        setTicketCount(prev => prev + 1);
    };

    const handleRemove = () => {
        if (ticketCount > 0) {
            setTicketCount(prev => prev - 1);
        }
    };

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
            <main className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-8 space-y-8 flex-grow">
                <h2 className="text-black" style={{ fontSize: '32px', fontFamily: "'Anek Tamil Condensed', sans-serif", fontWeight: 400, lineHeight: '50px' }}>
                    CHOOSE TICKETS
                </h2>

                {/* Ticket Category Box 1 */}
                <div className="w-full bg-white border-[0.5px] border-[#AEAEAE] rounded-[15px] p-5 md:p-6 flex flex-col md:flex-row justify-between relative gap-5 h-[200px] mt-[-10px]">
                    <div className="flex flex-col gap-2 flex-grow">
                        <div className="flex flex-wrap items-center gap-x-3">
                            <span className="text-[22px] md:text-[24px] font-semibold text-black uppercase" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                {`{EARLY BIRD / PHASE NAME}`}
                            </span>
                            <div className="h-[24px] w-[2px] bg-black hidden md:block"></div>
                            <span className="text-[22px] md:text-[24px] font-semibold text-black uppercase" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                {`{EVENT TICKET CATEGORY NAME}`}
                            </span>
                        </div>

                        <div className="text-[28px] md:text-[32px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            ₹{pricePerTicket}
                        </div>

                        <div className="w-[1245px] h-[1px] bg-[#686868] solid"></div>

                        <p className="text-[10px] md:text-[13px] font-medium text-[#686868] max-w-md" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            • This ticket grants entry to one individual only.
                        </p>

                        <p className="text-[10px] md:text-[13px] font-medium text-[#686868] max-w-md mt-[-10px]" style={{ fontFamily: 'var(--font-anek-latin)' }}>

                            • This is a standing section.
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-start gap-3 min-w-[100px] mt-[-10px] ml-[-200px]">
                        {/* ADD Button Box */}
                        <button
                            onClick={() => ticketCount === 0 && handleAdd()}
                            className="w-[86px] h-[38px] bg-[#D9D9D9] rounded-[7px] "
                        >
                            <span className="text-[20px] md:text-[28px] text-black" style={{ fontFamily: "'Anek Tamil Condensed', sans-serif"}}>ADD</span>
                        </button>

                        {/* Quantity Selector Box */}
                        <div className={`w-[86px] h-[38px] bg-black rounded-[7px] flex items-center justify-between px-2 text-white transition-opacity ${ticketCount === 0 ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                            <button onClick={handleRemove} className="text-[24px] leading-none hover:text-[#D9D9D9] cursor-pointer active:scale-90 transition-transform">-</button>
                            <span className="text-[18px] md:text-[20px] font-medium" style={{ fontFamily: "'Anek Tamil Condensed', sans-serif" }}>{ticketCount}</span>
                            <button onClick={handleAdd} className="text-[20px] leading-none hover:text-[#D9D9D9] cursor-pointer active:scale-90 transition-transform">+</button>
                        </div>
                    </div>
                </div>

                {/* Sample empty space to match design height feel */}
                <div className="h-[200px] md:h-[400px]"></div>
            </main>

            {/* Sticky Footer */}
            <footer className="w-full h-[70px] md:h-[110px] bg-[#2A2A2A] sticky bottom-0 z-50 flex items-center justify-between px-6 md:px-10">
                <div className="flex flex-col justify-center">
                    <span className="text-[20px] md:text-[28px] font-medium text-white" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        ₹{ticketCount * pricePerTicket}
                    </span>
                    <span className="text-[12px] md:text-[16px] font-medium text-white opacity-80 uppercase" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        {ticketCount} {ticketCount === 1 ? 'TICKET' : 'TICKETS'}
                    </span>
                </div>

                <button
                    disabled={ticketCount === 0}
                    onClick={() => router.push(`/events/${id}/book/review`)}
                    className={`w-[110px] md:w-[180px] h-[45px] md:h-[56px] bg-white rounded-[7px] flex items-center justify-center transition-all ${ticketCount === 0 ? 'opacity-50 grayscale' : 'active:scale-[0.98] hover:bg-[#f0f0f0]'}`}
                >
                    <span className="text-[18px] md:text-[28px] font-medium text-black uppercase" style={{ fontFamily: "'Anek Tamil Condensed', sans-serif" }}>
                        ADD TO CART
                    </span>
                </button>
            </footer>
        </div>
    );
}
