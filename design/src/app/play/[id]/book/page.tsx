'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const courts = [
    { id: 1, name: '{COURT NAME}', type: '{COURT TYPE}', price: '{PRICE PER HOUR}', image: '/play/1.png' },
    { id: 2, name: '{COURT NAME}', type: '{COURT TYPE}', price: '{PRICE PER HOUR}', image: '/play/1.png' },
    { id: 3, name: '{COURT NAME}', type: '{COURT TYPE}', price: '{PRICE PER HOUR}', image: '/play/1.png' },
];

const dates = [
    { key: 'MONTH', label: 'MONTH', day: '', isMonth: true },
    { key: '14', label: '14', day: 'Sat', isMonth: false },
    { key: '15', label: '14', day: 'Sat', isMonth: false },
];

const timeSlots = [
    '12 - 1 PM',
    '12 - 1 PM',
    '12 - 1 PM',
    '12 - 1 PM',
    '12 - 1 PM',
];

export default function PlayBookPage() {
    const router = useRouter();
    const params = useParams();
    const [selectedDate, setSelectedDate] = useState('14');
    const [duration, setDuration] = useState(1);
    const [selectedSlot, setSelectedSlot] = useState<string | null>('12 - 1 PM');
    const [selectedCourts, setSelectedCourts] = useState<number[]>([]);

    const toggleCourt = (id: number) => {
        setSelectedCourts(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFFCED] via-white to-white font-[family-name:var(--font-anek-latin)]">
            <main className="max-w-[900px] mx-auto px-4 md:px-6 py-8">

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-zinc-400 hover:text-black transition-colors"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                {/* Main Card */}
                <div className="bg-white border border-zinc-200 rounded-[24px] overflow-hidden shadow-sm">

                    {/* Card Header */}
                    <div className="px-6 md:px-10 pt-8 pb-6 border-b border-zinc-100">
                        <h1 className="text-[28px] md:text-[32px] font-semibold text-black leading-tight">Turf Name</h1>
                        <p className="text-[16px] text-[#686868] font-medium mt-1">Play options &nbsp; Location</p>
                    </div>

                    <div className="px-6 md:px-10 py-8 space-y-10">

                        {/* SELECT DATE & TIME */}
                        <section className="space-y-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                                SELECT DATE &amp; TIME
                            </h2>
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Month Box */}
                                <div className="w-[52px] h-[64px] bg-[#D9D9D9] rounded-[14px] flex items-center justify-center shrink-0">
                                    <span className="text-[11px] font-semibold text-black rotate-[-90deg] tracking-wider uppercase">MONTH</span>
                                </div>
                                {/* Date Boxes */}
                                {[
                                    { key: '14', label: '14', day: 'Sat' },
                                    { key: '15', label: '14', day: 'Sat' },
                                ].map((d) => (
                                    <button
                                        key={d.key}
                                        onClick={() => setSelectedDate(d.key)}
                                        className={`w-[52px] h-[64px] rounded-[14px] flex flex-col items-center justify-center transition-all shrink-0 ${selectedDate === d.key
                                                ? 'bg-black text-white'
                                                : 'bg-white border border-zinc-300 text-black hover:border-black'
                                            }`}
                                    >
                                        <span className="text-[26px] font-semibold leading-none">{d.label}</span>
                                        <span className={`text-[13px] font-medium mt-0.5 ${selectedDate === d.key ? 'text-white' : 'text-[#686868]'}`}>{d.day}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* DURATION */}
                        <section className="space-y-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                                DURATION
                            </h2>
                            <div className="flex items-center gap-0 border border-zinc-300 rounded-[14px] w-fit overflow-hidden">
                                <button
                                    onClick={() => setDuration(d => Math.max(1, d - 1))}
                                    className="w-[44px] h-[52px] text-[22px] font-medium text-black hover:bg-zinc-100 transition-colors flex items-center justify-center"
                                >
                                    −
                                </button>
                                <div className="px-6 h-[52px] flex items-center justify-center border-x border-zinc-300">
                                    <span className="text-[18px] font-semibold text-black whitespace-nowrap">{duration} hr</span>
                                </div>
                                <button
                                    onClick={() => setDuration(d => d + 1)}
                                    className="w-[44px] h-[52px] text-[22px] font-medium text-black hover:bg-zinc-100 transition-colors flex items-center justify-center"
                                >
                                    +
                                </button>
                            </div>
                        </section>

                        {/* AVAILABLE TIME SLOTS */}
                        <section className="space-y-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                                AVAILABLE TIME SLOTS
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {timeSlots.map((slot, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedSlot(slot + i)}
                                        className={`px-5 h-[48px] rounded-[12px] text-[15px] font-medium border transition-all ${selectedSlot === slot + i
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-black border-zinc-300 hover:border-black'
                                            }`}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* AVAILABLE COURTS */}
                        <section className="space-y-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                                AVAILABLE COURTS
                            </h2>
                            <div className="space-y-4">
                                {courts.map((court) => (
                                    <div
                                        key={court.id}
                                        onClick={() => toggleCourt(court.id)}
                                        className={`flex items-center gap-4 p-3 rounded-[16px] border cursor-pointer transition-all ${selectedCourts.includes(court.id)
                                                ? 'border-black bg-zinc-50'
                                                : 'border-zinc-200 bg-white hover:border-zinc-400'
                                            }`}
                                    >
                                        {/* Court Image */}
                                        <div className="w-[180px] md:w-[190px] h-[100px] rounded-[12px] overflow-hidden shrink-0 bg-[#5331EA] flex items-center justify-center">
                                            <img
                                                src="/play/1.png"
                                                alt={court.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>

                                        {/* Court Details */}
                                        <div className="flex-1 space-y-1">
                                            <p className="text-[17px] font-semibold text-black">{court.name}</p>
                                            <p className="text-[15px] font-medium text-[#686868]">{court.type}</p>
                                            <p className="text-[15px] font-medium text-[#686868] mt-2">{court.price}</p>
                                        </div>

                                        {/* Checkbox */}
                                        <div className={`w-[28px] h-[28px] rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-all ${selectedCourts.includes(court.id)
                                                ? 'border-black bg-black'
                                                : 'border-zinc-300 bg-white'
                                            }`}>
                                            {selectedCourts.includes(court.id) && (
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                    <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* BOOK SLOTS Button */}
                        <div className="pt-2 border-t border-zinc-200">
                            <button
                                className="w-full h-[54px] bg-black text-white rounded-[12px] flex items-center justify-center active:scale-[0.98] hover:opacity-90 transition-all"
                                onClick={() => alert('Booking confirmed!')}
                            >
                                <span
                                    style={{
                                        transform: 'scaleY(2)',
                                        display: 'inline-block',
                                        fontFamily: 'var(--font-anek-tamil)',
                                        fontWeight: 600,
                                        lineHeight: 1,
                                    }}
                                    className="text-[18px] tracking-wider uppercase"
                                >
                                    BOOK SLOTS
                                </span>
                            </button>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
