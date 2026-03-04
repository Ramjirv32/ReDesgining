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
    opening_time?: string;
    closing_time?: string;
    price_starts_from?: number;
    courts?: Court[];
}

// Fixed 1-hour slot strings returned by the backend (e.g. "09:00 - 10:00 AM|CourtName")
const TIME_SLOTS = [
    "05:00 - 06:00 AM", "06:00 - 07:00 AM", "07:00 - 08:00 AM", "08:00 - 09:00 AM",
    "09:00 - 10:00 AM", "10:00 - 11:00 AM", "11:00 AM - 12:00 PM",
    "12:00 - 01:00 PM", "01:00 - 02:00 PM", "02:00 - 03:00 PM", "03:00 - 04:00 PM",
    "04:00 - 05:00 PM", "05:00 - 06:00 PM", "06:00 - 07:00 PM",
    "07:00 - 08:00 PM", "08:00 - 09:00 PM", "09:00 - 10:00 PM", "10:00 - 11:00 PM",
];

/** Parse "09:00 AM" or "09:00 PM" → minutes since midnight */
const parseTime = (timeStr: string): number => {
    const [time, period] = timeStr.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

/**
 * Parse the start time (minutes) of a backend slot string.
 * Handles both "09:00 - 10:00 AM" and "11:00 AM - 12:00 PM" formats.
 */
const parseSlotStartMin = (slot: string): number => {
    // Format A: "11:00 AM - 12:00 PM"  — period is embedded in the first token group
    if (/\d{1,2}:\d{2}\s*(AM|PM)\s*-/i.test(slot)) {
        const firstPart = slot.split(/\s*-\s*/)[0].trim(); // "11:00 AM"
        return parseTime(firstPart);
    }
    // Format B: "09:00 - 10:00 AM"  — both times share the trailing period
    const parts = slot.split(/\s*-\s*/);
    const period = /PM/i.test(parts[1]) ? 'PM' : 'AM';
    return parseTime(`${parts[0].trim()} ${period}`);
};

// Precompute start-minute for every backend 1-hour slot string (used for overlap checks)
const SLOT_START_MIN: Readonly<Record<string, number>> = Object.fromEntries(
    TIME_SLOTS.map(s => [s, parseSlotStartMin(s)])
);

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

    /**
     * Returns true if `courtName` has NO booked 1-hour window that overlaps the
     * requested [startMin, endMin) interval.
     * Works entirely in minutes — no dependency on TIME_SLOTS string ordering.
     */
    const isWindowAvailable = (courtName: string, startMin: number, endMin: number): boolean => {
        for (const booked of bookedSlots) {
            const pipeIdx = booked.lastIndexOf('|');
            if (pipeIdx === -1) continue;
            const slotStr    = booked.substring(0, pipeIdx);
            const bCourtName = booked.substring(pipeIdx + 1);
            if (bCourtName !== courtName) continue;
            // Dynamically parse start minute so both "09:00 - 10:00 AM" and
            // "09:00 AM - 10:00 AM" backend formats are handled correctly.
            let bStart: number;
            try { bStart = parseSlotStartMin(slotStr); } catch { continue; }
            if (isNaN(bStart)) continue;
            const bEnd = bStart + 60;
            // Overlap: intervals [startMin, endMin) and [bStart, bEnd) overlap when
            //   startMin < bEnd  AND  bStart < endMin
            if (startMin < bEnd && bStart < endMin) return false;
        }
        return true;
    };

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

    const toggleCourt = (uniqueId: string) => {
        setSelectedCourtIds([uniqueId]);
        // Do NOT reset the selected slot — the user picks slot first, then court.
    };

    // When duration changes, reset both selections (availability window changes)
    useEffect(() => {
        setSelectedSlot(null);
        setSelectedCourtIds([]);
    }, [duration]);

    const formatTime = (mins: number) => {
        let h = Math.floor(mins / 60);
        const m = mins % 60;
        const period = h < 12 || h === 24 ? 'AM' : 'PM';
        let displayH = h % 12;
        if (displayH === 0) displayH = 12;
        return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    };

    // Derive opening/closing time from dedicated fields, composite time string, or
    // fall back to a sensible default (06:00 AM – 11:00 PM) so slots always render.
    const openingTimeStr =
        venue?.opening_time ||
        (venue?.time ? venue.time.split(' - ')[0].trim() : null) ||
        '06:00 AM';
    const closingTimeStr =
        venue?.closing_time ||
        (venue?.time ? venue.time.split(' - ')[1]?.trim() : null) ||
        '11:00 PM';

    const generateBlockSlots = (): { label: string; startMin: number; endMin: number }[] => {
        if (!openingTimeStr || !closingTimeStr) return [];
        const venueStart = parseTime(openingTimeStr);
        const venueEnd   = parseTime(closingTimeStr);
        const blocks: { label: string; startMin: number; endMin: number }[] = [];
        let current = venueStart;
        while (current + duration * 60 <= venueEnd) {
            const end = current + duration * 60;
            blocks.push({
                label:    `${formatTime(current)} - ${formatTime(end)}`,
                startMin: current,
                endMin:   end,
            });
            current += duration * 60;
        }
        return blocks;
    };

    const blockSlots = generateBlockSlots();

    // Does a court have ANY free block for the selected duration on this date?
    const isCourtAvailableAnytime = (courtName: string): boolean =>
        blockSlots.some(b => isWindowAvailable(courtName, b.startMin, b.endMin));

    const courts = venue?.courts ?? [];
    const selectedUniqueId = selectedCourtIds[0] ?? null;
    const selectedCourt = courts.find((c, idx) => `${c.id}-${idx}` === selectedUniqueId) ?? null;

    const doBooking = (v: RealPlay) => {
        const tickets = selectedCourtIds.map(uid => {
            const court = courts.find((c, idx) => `${c.id}-${idx}` === uid);
            const pricePerHour = court?.price ?? v.price_starts_from ?? 500;
            return {
                category: court?.name ?? 'Court', // Use category to store court name for backend validation
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
            duration: duration, // Include duration for backend models
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

                        {/* ── Step 1: Time Slot Selection ── */}
                        <section className="space-y-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                                AVAILABLE TIME BLOCKS
                            </h2>
                            {loadingSlots ? (
                                <div className="flex items-center gap-2 text-[14px] text-zinc-400">
                                    <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                                    Checking availability...
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {blockSlots.map((b, i) => {
                                        // A slot block is available if ANY court is free for the full window
                                        const isAvailable = courts.some(c => isWindowAvailable(c.name, b.startMin, b.endMin));
                                        const isSelected = selectedSlot === b.label;
                                        return (
                                            <button
                                                key={i}
                                                disabled={!isAvailable}
                                                onClick={() => {
                                                    isAvailable && setSelectedSlot(b.label);
                                                    setSelectedCourtIds([]); // Reset court when slot changes
                                                }}
                                                className={`px-5 h-[48px] rounded-[12px] text-[15px] font-medium border transition-all ${!isAvailable
                                                    ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed line-through'
                                                    : isSelected
                                                        ? 'bg-black text-white border-black shadow-lg scale-[1.02]'
                                                        : 'bg-white text-black border-zinc-300 hover:border-black'
                                                    }`}
                                            >
                                                {b.label}
                                            </button>
                                        );
                                    })}
                                    {blockSlots.length > 0 && blockSlots.every(b => !courts.some(c => isWindowAvailable(c.name, b.startMin, b.endMin))) && (
                                        <p className="text-red-500 text-[15px] font-medium w-full">
                                            No available slots for a {duration}hr window on this date.
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* ── Step 2: Court Selection (based on selected slot) ── */}
                        <section className="space-y-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                                SELECT COURT
                            </h2>
                            {!selectedSlot ? (
                                <p className="text-[14px] text-zinc-400 italic">Select a time block above to see available courts</p>
                            ) : loadingSlots ? (
                                <div className="flex items-center gap-2 text-[14px] text-zinc-400">
                                    <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                                    Checking availability...
                                </div>
                            ) : courts.length === 0 ? (
                                <p className="text-[#686868] text-[15px]">No courts configured for this venue.</p>
                            ) : (
                                <div className="space-y-4">
                                    {courts.map((court, index) => {
                                        const uniqueId = `${court.id}-${index}`;
                                        const selectedBlock = blockSlots.find(b => b.label === selectedSlot);
                                        const isAvailable = selectedBlock ? isWindowAvailable(court.name, selectedBlock.startMin, selectedBlock.endMin) : false;
                                        const isSelected = selectedCourtIds.includes(uniqueId);
                                        return (
                                            <div
                                                key={uniqueId}
                                                onClick={() => isAvailable && toggleCourt(uniqueId)}
                                                className={`flex items-center gap-4 p-3 rounded-[16px] border transition-all ${!isAvailable
                                                    ? 'border-zinc-100 bg-zinc-50 opacity-50 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'border-black bg-zinc-50 cursor-pointer shadow-md'
                                                        : 'border-zinc-200 bg-white hover:border-zinc-400 cursor-pointer'
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
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-[17px] font-semibold text-black uppercase">{court.name}</p>
                                                        {!isAvailable && (
                                                            <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full">
                                                                Unavailable for this slot
                                                            </span>
                                                        )}
                                                    </div>
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
                                {selectedCourtIds.map(uid => {
                                    const court = courts.find((c, idx) => `${c.id}-${idx}` === uid);
                                    if (!court) return null;
                                    return (
                                        <div key={uid} className="flex justify-between text-[15px]">
                                            <span className="text-black font-medium">{court.name} × {duration}hr</span>
                                            <span className="font-semibold text-black">₹{court.price * duration}</span>
                                        </div>
                                    );
                                })}
                                <div className="border-t border-zinc-300 pt-2 mt-2 flex justify-between text-[16px] font-bold">
                                    <span>Total</span>
                                    <span>₹{selectedCourtIds.reduce((s, uid) => {
                                        const court = courts.find((c, idx) => `${c.id}-${idx}` === uid);
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
                                    {!selectedSlot
                                        ? 'Select a time slot to continue'
                                        : 'Select a court to continue'}
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
