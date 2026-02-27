'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { bookingApi } from '@/lib/api/booking';

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

    useEffect(() => {
        if (!id) return;
        Promise.all([
            fetch(`/backend/api/events/${id}`, { credentials: 'include' }).then(r => r.json()),
            bookingApi.getEventAvailability(id),
        ]).then(([eventData, availability]) => {
            setEvent(eventData);
            setBookedMap(availability.booked ?? {});
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    const categories: TicketCategory[] = event?.ticket_categories && event.ticket_categories.length > 0
        ? event.ticket_categories
        : event ? [{ name: 'General Admission', price: event.price_starts_from ?? 0 }] : [];

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

    const totalTickets = Object.values(counts).reduce((s, v) => s + v, 0);
    const totalPrice = categories.reduce((s, cat, i) => s + (counts[i] ?? 0) * (cat.price ?? 0), 0);

    const formattedDateVenue = [
        event?.date ? new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : null,
        event?.time ?? null,
        event?.venue_name ?? event?.city ?? null,
    ].filter(Boolean).join(' | ');

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)' }}>
            <div className="w-10 h-10 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col font-[family-name:var(--font-anek-latin)]" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)' }}>

            {/* Header — no global navbar */}
            <header className="w-full h-[60px] md:h-[80px] bg-white flex items-center justify-between px-6 md:px-10 border-b border-[#FFFFFF] shadow-sm relative z-10">
                <div className="flex-shrink-0 cursor-pointer" onClick={() => router.push('/')}>
                    <img src="/ticpin-logo-black.png" alt="TICPIN" className="h-[20px] md:h-[25px] w-auto" />
                </div>

                <div className="flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2">
                    <h1 className="text-[18px] font-semibold text-black leading-tight uppercase" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        {event?.name ?? '—'}
                    </h1>
                    <p className="text-[13px] font-medium text-[#686868] leading-tight" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        {formattedDateVenue}
                    </p>
                </div>

                <div className="w-6 h-6" /> {/* spacer */}
            </header>

            {/* Main Content */}
            <main className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-8 space-y-6 flex-grow">
                <h2 className="text-black" style={{ fontSize: '32px', fontFamily: "'Anek Tamil Condensed', sans-serif", fontWeight: 400, lineHeight: '50px' }}>
                    CHOOSE TICKETS
                </h2>

                {categories.map((cat, i) => {
                    const available = getAvailable(cat);
                    const isSoldOut = available === 0;
                    const current = counts[i] ?? 0;

                    return (
                        <div key={i} className={`w-full bg-white border-[0.5px] rounded-[15px] p-5 md:p-6 flex flex-col md:flex-row justify-between gap-5 relative ${isSoldOut ? 'border-red-200 opacity-70' : 'border-[#AEAEAE]'}`}>
                            {/* Category image */}
                            {cat.has_image && cat.image_url && (
                                <div className="w-[90px] h-[90px] rounded-[10px] overflow-hidden flex-shrink-0">
                                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
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
                                {cat.capacity && cat.capacity > 0 && (
                                    <p className={`text-[12px] md:text-[13px] font-semibold ${available <= 10 && !isSoldOut ? 'text-orange-500' : 'text-[#686868]'}`}>
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
                                        <button
                                            onClick={() => current === 0 && add(i)}
                                            className="w-[86px] h-[38px] bg-[#D9D9D9] rounded-[7px]"
                                        >
                                            <span className="text-[20px] md:text-[28px] text-black" style={{ fontFamily: "'Anek Tamil Condensed', sans-serif" }}>ADD</span>
                                        </button>
                                        <div className={`w-[86px] h-[38px] bg-black rounded-[7px] flex items-center justify-between px-2 text-white transition-opacity ${current === 0 ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                                            <button onClick={() => remove(i)} className="text-[24px] leading-none hover:text-[#D9D9D9] cursor-pointer active:scale-90 transition-transform">-</button>
                                            <span className="text-[18px] md:text-[20px] font-medium" style={{ fontFamily: "'Anek Tamil Condensed', sans-serif" }}>{current}</span>
                                            <button
                                                onClick={() => add(i)}
                                                disabled={current >= available}
                                                className="text-[20px] leading-none hover:text-[#D9D9D9] cursor-pointer active:scale-90 transition-transform disabled:opacity-40"
                                            >+</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* Sticky Footer */}
            <footer className="w-full h-[70px] md:h-[110px] bg-[#2A2A2A] sticky bottom-0 z-50 flex items-center justify-between px-6 md:px-10">
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
                    className={`w-[130px] md:w-[200px] h-[40px] md:h-[48px] bg-white rounded-[7px] flex items-center justify-center transition-all ${totalTickets === 0 ? 'opacity-50 grayscale' : 'active:scale-[0.98] hover:bg-[#f0f0f0]'}`}
                >
                    <span className="text-[16px] md:text-[22px] font-medium text-black uppercase" style={{ fontFamily: "'Anek Tamil Condensed', sans-serif" }}>
                        ADD TO CART
                    </span>
                </button>
            </footer>
        </div>
    );
}
