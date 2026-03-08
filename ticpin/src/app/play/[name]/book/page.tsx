'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
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

// Slots are generated dynamically from venue opening/closing time — no static list needed.

/** Parse "09:00 AM" / "9:00 PM" / "09:00" (24-hr) → minutes since midnight.
 *  Returns NaN on any failure so callers can fall back safely. */
const parseTime = (timeStr: string): number => {
    if (!timeStr) return NaN;
    const s = timeStr.trim();
    // "09:00 AM" / "9:00 pm"
    const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampm) {
        let h = parseInt(ampm[1], 10);
        const m = parseInt(ampm[2], 10);
        const p = ampm[3].toUpperCase();
        if (p === 'PM' && h !== 12) h += 12;
        if (p === 'AM' && h === 12) h = 0;
        return h * 60 + m;
    }
    // "09:00" (24-hr)
    const h24 = s.match(/^(\d{1,2}):(\d{2})$/);
    if (h24) return parseInt(h24[1], 10) * 60 + parseInt(h24[2], 10);
    return NaN;
};

/**
 * Parse the start time (minutes) of a backend slot string.
 * Handles "09:00 AM - 09:30 AM" format (both halves have AM/PM).
 */
const parseSlotStartMin = (slot: string): number => {
    const firstPart = slot.split(/\s*-\s*/)[0].trim();
    return parseTime(firstPart);
};



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

// ─── Time-period definitions ─────────────────────────────────────────────────
const PERIODS = [
    { id: 'morning', label: 'Morning', min: 6 * 60, max: 12 * 60 },
    { id: 'noon', label: 'Noon', min: 12 * 60, max: 17 * 60 },
    { id: 'evening', label: 'Evening', min: 17 * 60, max: 21 * 60 },
    { id: 'twilight', label: 'Twilight', min: 21 * 60, max: 25 * 60 },
] as const;

const PERIOD_ICONS: Record<string, React.FC<{ size?: number; strokeWidth?: number }>> = {
    morning: Sunrise,
    noon: Sun,
    evening: Sunset,
    twilight: Moon,
};

export default function PlayBookPage() {
    const router = useRouter();
    const params = useParams();
    const venueName = params?.name as string;
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
    const [activePeriod, setActivePeriod] = useState<string>('morning');



    const isWindowAvailable = (courtName: string, startMin: number, endMin: number): boolean => {
        for (const booked of bookedSlots) {
            const pipeIdx = booked.lastIndexOf('|');
            if (pipeIdx === -1) continue;
            const slotStr = booked.substring(0, pipeIdx);
            const bCourtName = booked.substring(pipeIdx + 1);
            if (bCourtName !== courtName) continue;
            // Parse start minute of the booked 30-min backend slot
            const bStart = parseSlotStartMin(slotStr);
            if (isNaN(bStart)) continue;
            const bEnd = bStart + 30; // each backend slot is exactly 30 min wide
            // Overlap: [startMin, endMin) overlaps [bStart, bEnd) when startMin < bEnd AND bStart < endMin
            if (startMin < bEnd && bStart < endMin) return false;
        }
        return true;
    };

    // Fetch venue
    useEffect(() => {
        if (!venueName) return;
        fetch(`/backend/api/play/${encodeURIComponent(venueName)}`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: RealPlay) => {
                setVenue(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [venueName]);

    // Fetch booked slots whenever venue or date changes
    useEffect(() => {
        if (!venueName || !selectedDate) return;
        setLoadingSlots(true);
        // Clear slot, court, and period tab when date changes
        setSelectedSlot(null);
        setSelectedCourtIds([]);
        setActivePeriod('morning');
        fetch(`/backend/api/play/${encodeURIComponent(venueName)}/booked-slots?date=${selectedDate}`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                setBookedSlots(Array.isArray(data.booked_slots) ? data.booked_slots : []);
            })
            .catch(() => setBookedSlots([]))
            .finally(() => setLoadingSlots(false));
    }, [venueName, selectedDate]);

    const toggleCourt = (uniqueId: string) => {
        setSelectedCourtIds([uniqueId]);
        // Do NOT reset the selected slot — the user picks slot first, then court.
    };

    // When duration changes, reset both selections (availability window changes)
    useEffect(() => {
        setSelectedSlot(null);
        setSelectedCourtIds([]);
    }, [duration]);

    // Converts minutes-since-midnight → "HH:MM AM/PM" — identical rule to backend formatTimeMins.
    // h >= 12 → PM  (so 12:00 noon = PM, 00:00 midnight = AM)
    const formatTime = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        let displayH = h % 12;
        if (displayH === 0) displayH = 12;
        return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    };

    // Derive opening/closing minutes robustly — try every possible source,
    // fall back to 06:00 AM – 11:00 PM so slots ALWAYS render.
    const resolveVenueTimes = (): { start: number; end: number } => {
        const FALLBACK = { start: 6 * 60, end: 22 * 60 }; // 06:00 AM – 10:00 PM (matches backend venueHours fallback)
        // 1. Dedicated fields
        const s1 = parseTime(venue?.opening_time ?? '');
        const e1 = parseTime(venue?.closing_time ?? '');
        if (!isNaN(s1) && !isNaN(e1) && e1 > s1) return { start: s1, end: e1 };
        // 2. Composite `time` field — try " - " then "-"
        const t = venue?.time ?? '';
        if (t) {
            const sep = t.includes(' - ') ? ' - ' : '-';
            const parts = t.split(sep);
            if (parts.length >= 2) {
                const s2 = parseTime(parts[0].trim());
                const e2 = parseTime(parts[parts.length - 1].trim());
                if (!isNaN(s2) && !isNaN(e2) && e2 > s2) return { start: s2, end: e2 };
            }
        }
        return FALLBACK;
    };

    // duration is in 30-min units: 1=30min, 2=1hr, 3=1.5hr, etc.
    const durationMins = duration * 30;
    const durationLabel = (() => {
        const total = durationMins;
        const hrs = Math.floor(total / 60);
        const mins = total % 60;
        if (hrs === 0) return `${mins} min`;
        if (mins === 0) return `${hrs} hr`;
        return `${hrs} hr ${mins} min`;
    })();

    const generateBlockSlots = (): { label: string; startMin: number; endMin: number }[] => {
        const { start: venueStart, end: venueEnd } = resolveVenueTimes();
        const blocks: { label: string; startMin: number; endMin: number }[] = [];
        let current = venueStart;
        while (current + durationMins <= venueEnd) {
            const end = current + durationMins;
            blocks.push({
                label: `${formatTime(current)} - ${formatTime(end)}`,
                startMin: current,
                endMin: end,
            });
            current += 30; // step every 30 min
        }
        return blocks;
    };

    const blockSlots = generateBlockSlots();

    // ── Hour label helper (e.g. "9 AM", "12 PM") — same h >= 12 → PM rule as formatTime ──
    const hourLabel = (h: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const display = h % 12 || 12;
        return `${display} ${period}`;
    };

    // ── Period filtering + hourly grouping ───────────────────────────────────
    const activePeriodDef = PERIODS.find(p => p.id === activePeriod) ?? PERIODS[0];
    const periodSlots = blockSlots.filter(
        b => b.startMin >= activePeriodDef.min && b.startMin < activePeriodDef.max
    );
    // Map hour → slots[]
    const hourGroupMap = new Map<number, typeof blockSlots>();
    periodSlots.forEach(b => {
        const h = Math.floor(b.startMin / 60);
        if (!hourGroupMap.has(h)) hourGroupMap.set(h, []);
        hourGroupMap.get(h)!.push(b);
    });
    const hourGroups = [...hourGroupMap.entries()].sort((a, b) => a[0] - b[0]);

    const courts = venue?.courts ?? [];

    const doBooking = (v: RealPlay) => {
        const tickets = selectedCourtIds.map(uid => {
            const court = courts.find((c, idx) => `${c.id}-${idx}` === uid);
            const pricePerHour = court?.price ?? v.price_starts_from ?? 500;
            // price is stored per-hour; duration is in 30-min units → actual cost = price × (duration/2)
            const actualPrice = Math.round(pricePerHour * duration / 2);
            return {
                category: court?.name ?? 'Court',
                name: `${court?.name ?? 'Court'} — ${court?.type ?? ''} (${durationLabel})`,
                price: actualPrice,
                quantity: 1,
            };
        });
        const totalPrice = tickets.reduce((s, t) => s + t.price, 0);
        // backendSlot = the 30-min start slot sent to and stored by the backend
        // displaySlot = the full user-selected duration span shown in the review page
        const selectedBlock = blockSlots.find(b => b.label === selectedSlot);
        const backendSlot = selectedBlock
            ? `${formatTime(selectedBlock.startMin)} - ${formatTime(selectedBlock.startMin + 30)}`
            : selectedSlot;
        const displaySlot = selectedSlot ?? backendSlot; // full span e.g. "09:00 AM - 10:00 AM"
        const cartItem = {
            eventId: v.id,
            eventName: v.name,
            city: v.city ?? '',
            type: 'play',
            date: selectedDate,
            slot: backendSlot,       // used by backend for booking & overlap check
            display_slot: displaySlot, // shown to user in review / confirmation
            duration: duration,       // in 30-min units; used by backend for index expansion
            tickets,
            totalPrice,
        };
        sessionStorage.setItem('ticpin_cart', JSON.stringify(cartItem));
        router.push(`/play/${encodeURIComponent(venueName)}/book/review`);
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
                                    <span className="text-[18px] font-semibold text-black whitespace-nowrap">{durationLabel}</span>
                                </div>
                                <button onClick={() => setDuration(d => Math.min(16, d + 1))}
                                    className="w-[44px] h-[52px] text-[22px] font-medium text-black hover:bg-zinc-100 transition-colors flex items-center justify-center">
                                    +
                                </button>
                            </div>
                        </section>

                        {/* ── Step 1: Time Slot Selection ── */}
                        <section className="space-y-4">

                            {/* Header + total count */}
                            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                                <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black">
                                    SELECT TIME SLOT
                                </h2>
                                {!loadingSlots && courts.length > 0 && (() => {
                                    const total = blockSlots.length;
                                    const free = blockSlots.filter(b =>
                                        courts.some(c => isWindowAvailable(c.name, b.startMin, b.endMin))
                                    ).length;
                                    return (
                                        <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${free === 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                                            }`}>
                                            {free === 0 ? 'Fully Booked' : `${free} / ${total} free`}
                                        </span>
                                    );
                                })()}
                            </div>

                            {/* ── Period filter tabs ───────────────────────── */}
                            <div className="flex gap-2 flex-wrap">
                                {PERIODS.filter(p =>
                                    blockSlots.some(b => b.startMin >= p.min && b.startMin < p.max)
                                ).map(p => {
                                    const Icon = PERIOD_ICONS[p.id];
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => setActivePeriod(p.id)}
                                            className={`inline-flex items-center gap-1.5 px-4 h-[34px] rounded-full text-[13px] font-semibold border transition-all ${activePeriod === p.id
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-black border-zinc-300 hover:border-zinc-500'
                                                }`}
                                        >
                                            <Icon size={13} strokeWidth={2} />
                                            {p.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ── Hourly timeline grid ─────────────────────── */}
                            {loadingSlots ? (
                                <div className="flex items-center gap-2 text-[14px] text-zinc-400 py-2">
                                    <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                                    Checking availability...
                                </div>
                            ) : periodSlots.length === 0 ? (
                                <p className="text-zinc-400 text-[13px] italic py-2">No time slots in this period.</p>
                            ) : (
                                <div
                                    className="overflow-x-auto pb-2 -mx-1 px-1"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
                                >
                                    <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                                    <div className="inline-flex gap-3 min-w-max">
                                        {hourGroups.map(([hour, slots]) => (
                                            <div key={hour} className="flex flex-col gap-1.5">

                                                {/* Hour label */}
                                                <span
                                                    className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-center"
                                                    style={{ minWidth: slots.length * 70 + (slots.length - 1) * 6 }}
                                                >
                                                    {hourLabel(hour)}
                                                </span>

                                                {/* 30-min slot buttons for this hour */}
                                                <div className="flex gap-1.5">
                                                    {slots.map((b, si) => {
                                                        const isSelected = selectedSlot === b.label;
                                                        const hasFreeCourt =
                                                            courts.length > 0 &&
                                                            courts.some(c => isWindowAvailable(c.name, b.startMin, b.endMin));
                                                        const minutePart = String(b.startMin % 60).padStart(2, '0');
                                                        return (
                                                            <div key={si} className="flex flex-col items-center gap-0.5">
                                                                <button
                                                                    disabled={!hasFreeCourt}
                                                                    onClick={() => {
                                                                        setSelectedSlot(b.label);
                                                                        setSelectedCourtIds([]);
                                                                    }}
                                                                    className={`relative w-[68px] h-[52px] rounded-[14px] border-2 text-[13px] font-semibold transition-all overflow-hidden ${!hasFreeCourt
                                                                        ? 'border-zinc-200 bg-zinc-50 cursor-not-allowed text-zinc-300'
                                                                        : isSelected
                                                                            ? 'border-[#E7C200] scale-[1.02] shadow-md'
                                                                            : 'bg-white text-black border-zinc-300 hover:border-zinc-500 hover:shadow-sm'
                                                                        }`}
                                                                    style={isSelected && hasFreeCourt ? { background: '#E7C200', color: '#000' } : {}}
                                                                >
                                                                    {/* Diagonal hatch for booked slots */}
                                                                    {!hasFreeCourt && (
                                                                        <span
                                                                            className="absolute inset-0 pointer-events-none"
                                                                            style={{
                                                                                backgroundImage:
                                                                                    'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.07) 5px, rgba(0,0,0,0.07) 10px)',
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <span className="relative z-10 flex flex-col items-center leading-none">
                                                                        <span className="text-[15px] font-bold">{`:${minutePart}`}</span>
                                                                    </span>
                                                                </button>

                                                                {/* State indicator beneath button */}
                                                                {!hasFreeCourt ? (
                                                                    <span className="text-[9px] font-bold text-red-400 uppercase tracking-wide">Booked</span>
                                                                ) : isSelected ? (
                                                                    <span className="w-[6px] h-[6px] rounded-full bg-[#E7C200] border border-zinc-300 inline-block" />
                                                                ) : null}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Selected slot display strip */}
                            {selectedSlot && (
                                <div className="flex items-center gap-2 text-[13px] pt-1">
                                    <span className="font-medium text-zinc-500">Selected:</span>
                                    <span className="font-semibold text-black bg-zinc-100 px-3 py-1 rounded-full">{selectedSlot}</span>
                                    <button
                                        onClick={() => { setSelectedSlot(null); setSelectedCourtIds([]); }}
                                        className="text-zinc-400 hover:text-red-500 text-[11px] font-semibold uppercase tracking-wide transition-colors"
                                    >
                                        Clear
                                    </button>
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
                                                    {(() => {
                                                        const remainingCount = blockSlots.filter(b => isWindowAvailable(court.name, b.startMin, b.endMin)).length;
                                                        return remainingCount > 0 ? (
                                                            <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                                                                {remainingCount} slot{remainingCount !== 1 ? 's' : ''} available
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full inline-block">
                                                                Fully booked today
                                                            </span>
                                                        );
                                                    })()}
                                                    <p className="text-[15px] font-bold text-black mt-1">
                                                        ₹{court.price}<span className="text-[13px] font-normal text-[#686868]"> / hr</span>
                                                        <span className="ml-2 text-[13px] text-[#686868] font-medium">
                                                            = ₹{Math.round(court.price * duration / 2)} for {durationLabel}
                                                        </span>
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
                                    const linePrice = Math.round(court.price * duration / 2);
                                    return (
                                        <div key={uid} className="flex justify-between text-[15px]">
                                            <span className="text-black font-medium">{court.name} × {durationLabel}</span>
                                            <span className="font-semibold text-black">₹{linePrice}</span>
                                        </div>
                                    );
                                })}
                                <div className="border-t border-zinc-300 pt-2 mt-2 flex justify-between text-[16px] font-bold">
                                    <span>Total</span>
                                    <span>₹{selectedCourtIds.reduce((s, uid) => {
                                        const court = courts.find((c, idx) => `${c.id}-${idx}` === uid);
                                        return s + Math.round((court?.price ?? 0) * duration / 2);
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
