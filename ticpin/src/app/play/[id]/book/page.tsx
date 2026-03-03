'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import AuthModal from '@/components/modals/AuthModal';

interface Court {
    id: string;
    name: string;
    type: string;
    price: number;
    image_url?: string;
}

interface RealPlay {
    id: string;
    name: string;
    city?: string;
    venue_name?: string;
    sub_category?: string;
    time?: string;
    price_starts_from?: number;
    courts?: Court[];
}

const TIME_SLOTS = [
    '06:00 - 07:00 AM', '07:00 - 08:00 AM', '08:00 - 09:00 AM',
    '09:00 - 10:00 AM', '10:00 - 11:00 AM', '11:00 AM - 12:00 PM',
    '04:00 - 05:00 PM', '05:00 - 06:00 PM', '06:00 - 07:00 PM',
    '07:00 - 08:00 PM', '08:00 - 09:00 PM', '09:00 - 10:00 PM',
];

function getNextDays(count = 7) {
    const days = [];
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < count; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push({
            key: d.toISOString().split('T')[0],
            label: String(d.getDate()).padStart(2, '0'),
            day: DAYS[d.getDay()],
            month: MONTHS[d.getMonth()],
        });
    }
    return days;
}

export default function PlayBookPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const session = useUserSession();

    const [venue, setVenue] = useState<RealPlay | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const dates = getNextDays(7);
    const [selectedDate, setSelectedDate] = useState(dates[0].key);
    const [duration, setDuration] = useState(1);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedCourtIds, setSelectedCourtIds] = useState<string[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Fetch venue
    useEffect(() => {
        if (!id) return;
        fetch(`/backend/api/play/${id}`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: RealPlay) => {
                setVenue(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    // Fetch booked slots whenever venue or date changes
    useEffect(() => {
        if (!id || !selectedDate) return;
        setLoadingSlots(true);
        // Clear selected slot if it becomes unavailable
        setSelectedSlot(null);
        fetch(`/backend/api/play/${id}/booked-slots?date=${selectedDate}`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                setBookedSlots(Array.isArray(data.booked_slots) ? data.booked_slots : []);
            })
            .catch(() => setBookedSlots([]))
            .finally(() => setLoadingSlots(false));
    }, [id, selectedDate]);

    const toggleCourt = (courtId: string) => {
        setSelectedCourtIds(prev =>
            prev.includes(courtId) ? prev.filter(c => c !== courtId) : [...prev, courtId]
        );
    };

    const doBooking = (v: RealPlay) => {
        const courts = v.courts ?? [];
        const tickets = selectedCourtIds.map(cid => {
            const court = courts.find(c => c.id === cid);
            const pricePerHour = court?.price ?? v.price_starts_from ?? 500;
            return {
                name: `${court?.name ?? 'Court'} — ${court?.type ?? ''} (${duration}hr)`,
                price: pricePerHour * duration,
                quantity: 1,
            };
        });
        const totalPrice = tickets.reduce((s, t) => s + t.price, 0);
        const cartItem = {
            eventId: v.id,
            eventName: v.name,
            city: v.city ?? '',
            type: 'play',
            date: selectedDate,
            slot: selectedSlot,
            duration,
            tickets,
            totalPrice,
        };
        sessionStorage.setItem('ticpin_cart', JSON.stringify(cartItem));
        router.push(`/play/${id}/book/review`);
    };

    const handleBooking = () => {
        if (!venue) return;
        if (!session) { setShowAuthModal(true); return; }
        if (selectedCourtIds.length === 0) { alert('Please select at least one court.'); return; }
        if (!selectedSlot) { alert('Please select a time slot.'); return; }
        doBooking(venue);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-[#E7C200] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (!venue) return <div className="text-center py-20 text-zinc-500">Venue not found</div>;

    const courts = venue.courts ?? [];
    const curMonth = dates[0].month;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFFCED] via-white to-white font-[family-name:var(--font-anek-latin)]">
            <main className="max-w-[900px] mx-auto px-4 md:px-6 py-8">

                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-zinc-400 hover:text-black transition-colors"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="bg-white border border-zinc-200 rounded-[24px] overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-6 md:px-10 pt-8 pb-6 border-b border-zinc-100">
                        <h1 className="text-[28px] md:text-[32px] font-semibold text-black leading-tight uppercase tracking-tight">
                            {venue.name}
                        </h1>
                        <p className="text-[16px] text-[#686868] font-medium mt-1 uppercase tracking-wider">
                            {venue.sub_category ?? 'Multi-sports'}
                            {venue.city ? <>&nbsp; • &nbsp;{venue.city}</> : null}
                        </p>
                    </div>

                    <div className="px-6 md:px-10 py-8 space-y-10">

                        {/* Date */}
                        <section className="space-y-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                                SELECT DATE &amp; TIME
                            </h2>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="w-[52px] h-[64px] bg-[#D9D9D9] rounded-[14px] flex items-center justify-center shrink-0">
                                    <span className="text-[11px] font-semibold text-black" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.1em' }}>{curMonth}</span>
                                </div>
                                {dates.map((d) => (
                                    <button
                                        key={d.key}
                                        onClick={() => setSelectedDate(d.key)}
                                        className={`w-[52px] h-[64px] rounded-[14px] flex flex-col items-center justify-center transition-all shrink-0 ${selectedDate === d.key
                                                ? 'bg-black text-white'
                                                : 'bg-white border border-zinc-300 text-black hover:border-black'
                                            }`}
                                    >
                                        <span className="text-[26px] font-semibold leading-none">{d.label}</span>
                                        <span className={`text-[13px] font-medium mt-0.5 ${selectedDate === d.key ? 'text-white' : 'text-[#686868]'}`}>
                                            {d.day}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Duration */}
                        <section className="space-y-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                                DURATION
                            </h2>
                            <div className="flex items-center border border-zinc-300 rounded-[14px] w-fit overflow-hidden">
                                <button onClick={() => setDuration(d => Math.max(1, d - 1))}
                                    className="w-[44px] h-[52px] text-[22px] font-medium text-black hover:bg-zinc-100 transition-colors flex items-center justify-center">
                                    −
                                </button>
                                <div className="px-6 h-[52px] flex items-center justify-center border-x border-zinc-300">
                                    <span className="text-[18px] font-semibold text-black whitespace-nowrap">{duration} hr</span>
                                </div>
                                <button onClick={() => setDuration(d => d + 1)}
                                    className="w-[44px] h-[52px] text-[22px] font-medium text-black hover:bg-zinc-100 transition-colors flex items-center justify-center">
                                    +
                                </button>
                            </div>
                        </section>

                        {/* Slots */}
                        <section className="space-y-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                                AVAILABLE TIME SLOTS
                            </h2>
                            {loadingSlots ? (
                                <div className="flex items-center gap-2 text-[14px] text-zinc-400">
                                    <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                                    Checking availability...
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {TIME_SLOTS.map((slot, i) => {
                                        const isBooked = bookedSlots.includes(slot);
                                        const isSelected = selectedSlot === slot;
                                        return (
                                            <button key={i}
                                                disabled={isBooked}
                                                onClick={() => !isBooked && setSelectedSlot(slot)}
                                                title={isBooked ? 'Already booked' : ''}
                                                className={`px-5 h-[48px] rounded-[12px] text-[15px] font-medium border transition-all ${isBooked
                                                        ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed line-through'
                                                        : isSelected
                                                            ? 'bg-black text-white border-black'
                                                            : 'bg-white text-black border-zinc-300 hover:border-black'
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* Courts */}
                        <section className="space-y-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                                AVAILABLE COURTS
                            </h2>
                            {courts.length === 0 ? (
                                <p className="text-[#686868] text-[15px]">No courts configured for this venue.</p>
                            ) : (
                                <div className="space-y-4">
                                    {courts.map((court) => {
                                        const isSelected = selectedCourtIds.includes(court.id);
                                        return (
                                            <div key={court.id} onClick={() => toggleCourt(court.id)}
                                                className={`flex items-center gap-4 p-3 rounded-[16px] border cursor-pointer transition-all ${isSelected ? 'border-black bg-zinc-50' : 'border-zinc-200 bg-white hover:border-zinc-400'
                                                    }`}
                                            >
                                                <div className="relative w-[110px] md:w-[150px] h-[80px] rounded-[12px] overflow-hidden shrink-0 bg-[#D9D9D9] flex items-center justify-center">
                                                    {court.image_url ? (
                                                        <Image src={court.image_url} alt={court.name} fill className="object-cover" />
                                                    ) : (
                                                        <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
                                                            {venue.sub_category ?? 'TURF'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-0.5">
                                                    <p className="text-[17px] font-semibold text-black uppercase">{court.name}</p>
                                                    <p className="text-[14px] font-medium text-[#686868]">{court.type}</p>
                                                    <p className="text-[15px] font-bold text-black mt-1">
                                                        ₹{court.price}<span className="text-[13px] font-normal text-[#686868]"> / hr</span>
                                                        {duration > 1 && (
                                                            <span className="ml-2 text-[13px] text-[#686868] font-medium">
                                                                = ₹{court.price * duration} for {duration}hr
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className={`w-[24px] h-[24px] rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'border-black bg-black' : 'border-zinc-300 bg-white'
                                                    }`}>
                                                    {isSelected && (
                                                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                                            <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* Price summary */}
                        {selectedCourtIds.length > 0 && (
                            <section className="bg-zinc-50 rounded-[14px] p-4 border border-zinc-200 space-y-1">
                                {selectedCourtIds.map(cid => {
                                    const court = courts.find(c => c.id === cid);
                                    if (!court) return null;
                                    return (
                                        <div key={cid} className="flex justify-between text-[15px]">
                                            <span className="text-black font-medium">{court.name} × {duration}hr</span>
                                            <span className="font-semibold text-black">₹{court.price * duration}</span>
                                        </div>
                                    );
                                })}
                                <div className="border-t border-zinc-300 pt-2 mt-2 flex justify-between text-[16px] font-bold">
                                    <span>Total</span>
                                    <span>₹{selectedCourtIds.reduce((s, cid) => {
                                        const court = courts.find(c => c.id === cid);
                                        return s + (court?.price ?? 0) * duration;
                                    }, 0)}</span>
                                </div>
                            </section>
                        )}

                        {/* Book CTA */}
                        <div className="pt-2 border-t border-zinc-200">
                            <button
                                className="w-full h-[54px] bg-black text-white rounded-[12px] flex items-center justify-center active:scale-[0.98] hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={handleBooking}
                                disabled={selectedCourtIds.length === 0 || !selectedSlot}
                            >
                                <span style={{ transform: 'scaleY(2)', display: 'inline-block', fontFamily: 'var(--font-anek-tamil)', fontWeight: 600, lineHeight: 1 }}
                                    className="text-[18px] tracking-wider uppercase">
                                    BOOK SLOTS
                                </span>
                            </button>
                            {(selectedCourtIds.length === 0 || !selectedSlot) && (
                                <p className="text-center text-[13px] text-[#686868] mt-2">
                                    {!selectedSlot && selectedCourtIds.length > 0 ? 'Select a time slot to continue' :
                                        selectedCourtIds.length === 0 && selectedSlot ? 'Select a court to continue' :
                                            'Select a court and time slot to continue'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => {
                    setShowAuthModal(false);
                    if (venue) doBooking(venue);
                }}
            />
        </div>
    );
}
