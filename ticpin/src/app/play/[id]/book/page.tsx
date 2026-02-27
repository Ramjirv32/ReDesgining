import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface RealPlay {
    id: string;
    name: string;
    city?: string;
    venue_name?: string;
    price_starts_from?: number;
    sub_category?: string;
}

const courts = [
    { id: 1, name: 'Main Court 1', type: 'Indoor Synthetic', price: 0 }, // Price will be updated from venue data
    { id: 2, name: 'Pro Court 2', type: 'Indoor Synthetic', price: 0 },
    { id: 3, name: 'Practice Area', type: 'Synthetic', price: 0 },
];

const timeSlots = [
    '06 - 07 AM', '07 - 08 AM', '08 - 09 AM', '09 - 10 AM',
    '10 - 11 AM', '04 - 05 PM', '05 - 06 PM', '06 - 07 PM',
    '07 - 08 PM', '08 - 09 PM', '09 - 10 PM'
];

export default function PlayBookPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id ?? '';
    const [venue, setVenue] = useState<RealPlay | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('14');
    const [duration, setDuration] = useState(1);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedCourts, setSelectedCourts] = useState<number[]>([]);

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

    const toggleCourt = (id: number) => {
        setSelectedCourts(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleBooking = () => {
        if (!venue || selectedCourts.length === 0 || !selectedSlot) {
            alert('Please select a slot and at least one court');
            return;
        }

        const pricePerCourt = venue.price_starts_from ?? 500;
        const total = pricePerCourt * duration * selectedCourts.length;

        const cartItem = {
            eventId: venue.id,
            eventName: venue.name,
            city: venue.city || 'Bangalore',
            type: 'play',
            date: selectedDate,
            slot: selectedSlot,
            tickets: selectedCourts.map(cid => {
                const court = courts.find(c => c.id === cid);
                return {
                    name: `${court?.name} (${duration}hr)`,
                    price: pricePerCourt * duration,
                    quantity: 1
                };
            }),
            totalPrice: total
        };

        localStorage.setItem('ticpin_cart', JSON.stringify(cartItem));
        router.push(`/events/${venue.id}/book/review`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!venue) return <div className="text-center py-20">Venue not found</div>;

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
                    <div className="px-6 md:px-10 pt-8 pb-6 border-b border-zinc-100">
                        <h1 className="text-[28px] md:text-[32px] font-semibold text-black leading-tight uppercase tracking-tight">{venue.name}</h1>
                        <p className="text-[16px] text-[#686868] font-medium mt-1 uppercase tracking-wider">{venue.sub_category || 'Multi-sports'} &nbsp; • &nbsp; {venue.city}</p>
                    </div>

                    <div className="px-6 md:px-10 py-8 space-y-10">
                        <section className="space-y-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                                SELECT DATE &amp; TIME
                            </h2>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="w-[52px] h-[64px] bg-[#D9D9D9] rounded-[14px] flex items-center justify-center shrink-0">
                                    <span className="text-[11px] font-semibold text-black rotate-[-90deg] tracking-wider uppercase">FEB</span>
                                </div>
                                {[
                                    { key: '27', label: '27', day: 'Fri' },
                                    { key: '28', label: '28', day: 'Sat' },
                                    { key: '01', label: '01', day: 'Sun' },
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

                        <section className="space-y-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                                AVAILABLE TIME SLOTS
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {timeSlots.map((slot, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`px-5 h-[48px] rounded-[12px] text-[15px] font-medium border transition-all ${selectedSlot === slot
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-black border-zinc-300 hover:border-black'
                                            }`}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </section>

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
                                        <div className="w-[180px] md:w-[190px] h-[100px] rounded-[12px] overflow-hidden shrink-0 bg-[#D9D9D9] flex items-center justify-center">
                                            <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">{venue.sub_category || 'TURF'}</span>
                                        </div>

                                        <div className="flex-1 space-y-1">
                                            <p className="text-[17px] font-semibold text-black uppercase">{court.name}</p>
                                            <p className="text-[15px] font-medium text-[#686868]">{court.type}</p>
                                            <p className="text-[16px] font-bold text-black mt-2">₹{venue.price_starts_from ?? 500} / hr</p>
                                        </div>

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

                        <div className="pt-2 border-t border-zinc-200">
                            <button
                                className="w-full h-[54px] bg-black text-white rounded-[12px] flex items-center justify-center active:scale-[0.98] hover:opacity-90 transition-all"
                                onClick={handleBooking}
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
