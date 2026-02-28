'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { bookingApi } from '@/lib/api/booking';
import { TicketSkeleton } from '@/components/ui/Skeleton';

interface TicketCategory {
    name: string;
    price?: number;
    capacity?: number;
    image_url?: string;
    has_image?: boolean;
}

interface EventData {
    id: string;
    name: string;
    date?: string;
    time?: string;
    venue_name?: string;
    city?: string;
    ticket_categories?: TicketCategory[];
    price_starts_from?: number;
}

export default function TicketSelectionPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState<Record<number, number>>({});
    const [bookedMap, setBookedMap] = useState<Record<string, number>>({});
    const [coupons, setCoupons] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            fetch(`/backend/api/events/${id}`, { credentials: 'include' }).then(r => r.json()),
            bookingApi.getEventAvailability(id),
        ]).then(([eventData, availability]) => {
            setEvent(eventData);
            setBookedMap(availability.booked ?? {});
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        fetch(`/backend/api/coupons/event`)
            .then(r => r.json())
            .then(data => setCoupons(Array.isArray(data) ? data : []))
            .catch(() => setCoupons([]));
    }, []);

    const categories: TicketCategory[] = useMemo(() => {
        if (!event) return [];
        return event.ticket_categories && event.ticket_categories.length > 0
            ? event.ticket_categories
            : [{ name: 'General Admission', price: event.price_starts_from ?? 0 }];
    }, [event]);

    const getAvailable = (cat: TicketCategory) => {
        if (!cat.capacity || cat.capacity <= 0) return Infinity;
        const booked = bookedMap[cat.name] ?? 0;
        return Math.max(0, cat.capacity - booked);
    };

    const add = (i: number) => {
        const cat = categories[i];
        const avail = getAvailable(cat);
        const current = counts[i] ?? 0;
        if (current >= avail) return;
        setCounts(c => ({ ...c, [i]: current + 1 }));
    };
    const remove = (i: number) => setCounts(c => ({ ...c, [i]: Math.max(0, (c[i] ?? 0) - 1) }));

    const totalTickets = useMemo(() => Object.values(counts).reduce((s, v) => s + v, 0), [counts]);
    const totalPrice = useMemo(() => categories.reduce((s, cat, i) => s + (counts[i] ?? 0) * (cat.price ?? 0), 0), [categories, counts]);

    const formattedDateVenue = useMemo(() => {
        return [
            event?.date ? new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : null,
            event?.time ?? null,
            event?.venue_name ?? event?.city ?? null,
        ].filter(Boolean).join(' | ');
    }, [event]);

    if (loading) return (
        <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)' }}>
            <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12 py-20 space-y-6">
                <TicketSkeleton />
                <TicketSkeleton />
                <TicketSkeleton />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col font-[family-name:var(--font-anek-latin)]" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)' }}>

            {/* Header — no global navbar */}
            <header className="w-full h-[60px] md:h-[80px] bg-white flex items-center justify-between px-6 md:px-10 border-b border-[#FFFFFF] shadow-sm relative z-10">
                <div className="flex-shrink-0 cursor-pointer relative w-[100px] h-[25px]" onClick={() => router.push('/')}>
                    <Image src="/ticpin-logo-black.png" alt="TICPIN" fill className="object-contain" />
                </div>

                <div className="flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2">
                    <h1 className="text-[18px] font-semibold text-black leading-tight uppercase line-clamp-1" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        {event?.name ?? '—'}
                    </h1>
                    <p className="text-[13px] font-medium text-[#686868] leading-tight" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        {formattedDateVenue}
                    </p>
                </div>

                <div className="w-6 h-6" /> {/* spacer */}
            </header>

            <main className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-8 space-y-6 flex-grow">
                <h2 className="text-black" style={{ fontSize: '32px', fontFamily: "'Anek Tamil Condensed', sans-serif", fontWeight: 400, lineHeight: '50px' }}>
                    CHOOSE TICKETS
                </h2>

                {categories.map((cat, i) => {
                    const available = getAvailable(cat);
                    const isSoldOut = available === 0;
                    const current = counts[i] ?? 0;

                    return (
                        <div key={i} className={`w-full bg-white border-[0.5px] rounded-[15px] p-5 md:p-6 flex flex-col md:flex-row justify-between gap-5 relative transition-all hover:shadow-md ${isSoldOut ? 'border-red-200 opacity-70' : 'border-[#AEAEAE]'}`}>
                            {/* Category image */}
                            {cat.has_image && cat.image_url && (
                                <div className="relative w-[90px] h-[90px] rounded-[10px] overflow-hidden flex-shrink-0">
                                    <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                                </div>
                            )}

                            <div className="flex flex-col gap-2 flex-grow">
                                <span className="text-[22px] md:text-[24px] font-semibold text-black uppercase" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    {cat.name}
                                </span>
                                {isSoldOut && (
                                    <span className="inline-block bg-red-100 text-red-600 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit">
                                        SOLD OUT
                                    </span>
                                )}
                                <div className="text-[28px] md:text-[32px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    ₹{cat.price ?? 0}
                                </div>
                                <div className="w-full h-[1px] bg-[#686868]/30" />
                                <p className="text-[12px] md:text-[13px] font-medium text-[#686868]">
                                    • This ticket grants entry to one individual only.
                                </p>
                                {cat.capacity && (
                                    <p className={`text-[12px] md:text-[13px] font-semibold ${available <= 10 && !isSoldOut ? 'text-orange-500 font-bold' : 'text-[#686868]'}`}>
                                        {isSoldOut
                                            ? '• No seats available'
                                            : available === Infinity
                                                ? null
                                                : `• ${available} seat${available === 1 ? '' : 's'} available`}
                                    </p>
                                )}
                            </div>

                            {/* Counter */}
                            <div className="flex flex-col items-center justify-start gap-3 min-w-[100px]">
                                {isSoldOut ? (
                                    <div className="w-[86px] h-[38px] bg-red-100 rounded-[7px] flex items-center justify-center">
                                        <span className="text-[14px] text-red-600 font-semibold uppercase">Full</span>
                                    </div>
                                ) : (
                                    <>
                                        {current === 0 ? (
                                            <button
                                                onClick={() => add(i)}
                                                className="w-[86px] h-[38px] bg-[#D9D9D9] rounded-[7px] hover:bg-zinc-300 transition-colors active:scale-95"
                                            >
                                                <span className="text-[20px] md:text-[28px] text-black" style={{ fontFamily: "'Anek Tamil Condensed', sans-serif" }}>ADD</span>
                                            </button>
                                        ) : (
                                            <div className="w-[86px] h-[38px] bg-black rounded-[7px] flex items-center justify-between px-2 text-white shadow-lg">
                                                <button onClick={() => remove(i)} className="w-6 h-6 flex items-center justify-center text-[24px] leading-none hover:text-[#D9D9D9] cursor-pointer transition-colors">-</button>
                                                <span className="text-[18px] md:text-[20px] font-medium" style={{ fontFamily: "'Anek Tamil Condensed', sans-serif" }}>{current}</span>
                                                <button
                                                    onClick={() => add(i)}
                                                    disabled={current >= available}
                                                    className="w-6 h-6 flex items-center justify-center text-[20px] leading-none hover:text-[#D9D9D9] cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                >+</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* Sticky Footer */}
            <footer className="w-full h-[70px] md:h-[110px] bg-[#2A2A2A] sticky bottom-0 z-50 flex items-center justify-between px-6 md:px-10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col justify-center">
                    <span className="text-[20px] md:text-[28px] font-medium text-white" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        ₹{totalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[12px] md:text-[16px] font-medium text-white opacity-80 uppercase" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        {totalTickets} {totalTickets === 1 ? 'TICKET' : 'TICKETS'}
                    </span>
                </div>

                <button
                    disabled={totalTickets === 0}
                    onClick={() => {
                        const cart = {
                            eventId: id,
                            eventName: event?.name,
                            city: event?.city,
                            tickets: categories.map((cat, i) => ({
                                name: cat.name,
                                price: cat.price ?? 0,
                                quantity: counts[i] ?? 0
                            })).filter(t => t.quantity > 0),
                            totalPrice
                        };
                        localStorage.setItem('ticpin_cart', JSON.stringify(cart));
                        router.push(`/events/${id}/book/review`);
                    }}
                    className={`group relative w-[130px] md:w-[220px] h-[40px] md:h-[54px] bg-white rounded-[7px] flex items-center justify-center transition-all overflow-hidden ${totalTickets === 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-[0.98] hover:bg-[#7B2FF7] hover:text-white'}`}
                >
                    <span className="relative z-10 text-[16px] md:text-[22px] font-medium text-black group-hover:text-white uppercase tracking-wider" style={{ fontFamily: "'Anek Tamil Condensed', sans-serif" }}>
                        CONTINUE
                    </span>
                </button>
            </footer>
        </div>
    );
}
