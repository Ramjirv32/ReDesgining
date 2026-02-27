'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle, Utensils, MapPin, Ticket } from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import AuthModal from '@/components/modals/AuthModal';

const benefits = [
    {
        icon: <MapPin size={28} className="text-[#7B2FF7]" />,
        title: '2 Turf Bookings',
        desc: 'Book any turf venue through Ticpin — completely free, 2 times per quarter.',
    },
    {
        icon: <Utensils size={28} className="text-[#7B2FF7]" />,
        title: '2 × ₹250 Dining Vouchers',
        desc: 'Get ₹250 off on two dining reservations made through Ticpin.',
    },
    {
        icon: <Ticket size={28} className="text-[#7B2FF7]" />,
        title: 'Events Discount',
        desc: 'Exclusive discount on event tickets for all pass holders — all season.',
    },
    {
        icon: <CheckCircle size={28} className="text-[#7B2FF7]" />,
        title: 'Priority Support',
        desc: 'Skip the queue — pass holders get priority customer support.',
    },
];

export default function PassPage() {
    const router = useRouter();
    const session = useUserSession();
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleBuy = () => {
        if (!session) {
            setIsAuthOpen(true);
            return;
        }
        router.push('/pass/checkout');
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 40%)' }}>

            {/* Hero */}
            <section className="flex flex-col items-center justify-center px-4 pt-16 pb-10 text-center">
                <div className="inline-flex items-center gap-2 bg-[#7B2FF7]/10 text-[#7B2FF7] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                    ✦ Exclusive Member Pass
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-zinc-900 mb-4 leading-tight">
                    Ticpin <span className="text-[#7B2FF7]">Pass</span>
                </h1>
                <p className="text-zinc-500 text-lg md:text-xl max-w-xl mb-8">
                    One pass. Turf bookings, dining vouchers, event discounts — all in one place, for 3 months.
                </p>

                <div className="flex items-end gap-2 mb-8">
                    <span className="text-5xl font-black text-zinc-900">₹999</span>
                    <span className="text-zinc-400 text-lg mb-2">/ 3 months</span>
                </div>

                <button
                    onClick={handleBuy}
                    className="px-10 py-4 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                    style={{ background: 'linear-gradient(135deg, #7B2FF7 0%, #5B1FD4 100%)' }}
                >
                    Get Ticpin Pass
                </button>
                <p className="text-xs text-zinc-400 mt-3">No auto-renewal. Cancel-free. One-time purchase.</p>
            </section>

            {/* Banner */}
            <section className="px-4 md:px-10 lg:px-16 pb-10 max-w-[1100px] mx-auto w-full">
                <Image
                    src="/ticpin banner.jpg"
                    alt="Ticpin Pass"
                    width={1100}
                    height={370}
                    className="w-full h-auto rounded-[24px]"
                />
            </section>

            {/* Benefits */}
            <section className="px-4 md:px-10 lg:px-16 pb-16 max-w-[1100px] mx-auto w-full">
                <h2 className="text-2xl md:text-3xl font-black text-zinc-900 mb-8 text-center">What's Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {benefits.map((b, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-sm border border-zinc-100"
                        >
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#7B2FF7]/10 flex items-center justify-center">
                                {b.icon}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-zinc-900 mb-1">{b.title}</h3>
                                <p className="text-sm text-zinc-500">{b.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Bottom */}
            <section className="px-4 pb-20 text-center">
                <div className="max-w-md mx-auto bg-[#7B2FF7] rounded-3xl p-10 text-white shadow-xl">
                    <h2 className="text-2xl font-black mb-2">Ready to join?</h2>
                    <p className="text-white/70 text-sm mb-6">Valid for 3 months. Covers turf, dining & events.</p>
                    <button
                        onClick={handleBuy}
                        className="w-full py-4 rounded-full bg-white text-[#7B2FF7] font-bold text-base hover:bg-zinc-100 transition"
                    >
                        Buy for ₹999
                    </button>
                </div>
            </section>

            <Footer />

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onSuccess={() => {
                    setIsAuthOpen(false);
                    router.push('/pass/checkout');
                }}
            />
        </div>
    );
}
