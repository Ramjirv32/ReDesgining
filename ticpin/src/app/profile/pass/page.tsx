'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserSession } from '@/lib/auth/user';
import { passApi, TicpinPass } from '@/lib/api/pass';
import { 
    Ticket, Utensils, Zap, Calendar, 
    ArrowLeft, CheckCircle2, Info, Star,
    ChevronRight, Trophy, Sparkles, Clock
} from 'lucide-react';
import Link from 'next/link';

export default function PassUsagePage() {
    const router = useRouter();
    const session = useUserSession();
    const [pass, setPass] = useState<TicpinPass | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.id) {
            passApi.getActivePass(session.id)
                .then(setPass)
                .finally(() => setLoading(false));
        } else if (session === null) {
            router.push('/');
        }
    }, [session, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFCFE]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7C3AED]"></div>
            </div>
        );
    }

    if (!pass) {
        return (
            <div className="min-h-screen bg-[#FDFCFE] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mb-6">
                    <Ticket size={40} />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 mb-2">No Active Pass</h1>
                <p className="text-zinc-500 max-w-sm mb-8">You don't have an active Ticpin Pass. Subscribe now to unlock premium benefits and discounts.</p>
                <Link 
                    href="/pass"
                    className="bg-black text-white px-8 h-14 rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-zinc-200"
                >
                    Get Ticpin Pass
                </Link>
            </div>
        );
    }

    const b = pass.benefits;

    return (
        <div className="min-h-screen bg-[#FDFCFE] font-[family-name:var(--font-anek-latin)] pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-6 h-16 flex items-center gap-4">
                <button 
                    onClick={() => router.back()}
                    className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-zinc-600" />
                </button>
                <h1 className="text-lg font-bold text-zinc-900">Ticpin Pass Usage</h1>
            </header>

            <main className="max-w-xl mx-auto p-6 space-y-8">
                {/* Premium Banner */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-[32px] p-8 text-white shadow-2xl shadow-purple-200">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/20 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Star size={14} fill="white" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Premium Membership</span>
                            </div>
                            <h2 className="text-3xl font-black">TICPIN PASS</h2>
                        </div>
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center rotate-12">
                            <Zap size={32} fill="white" className="text-white" />
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-white/20 pt-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase opacity-60">Status</p>
                            <p className="font-bold flex items-center gap-2 text-green-300">
                                <CheckCircle2 size={16} /> Active
                            </p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[10px] font-bold uppercase opacity-60">Valid Until</p>
                            <p className="font-bold">
                                {pass.end_date ? new Date(pass.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Usage Stats */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-zinc-900 px-2 flex items-center gap-3">
                        <Sparkles size={20} className="text-amber-500" />
                        Your Benefits
                    </h3>

                    <div className="grid gap-4">
                        {/* Play Benefit */}
                        <BenefitCard 
                            icon={<Ticket className="text-blue-600" />}
                            title="Free Turf Bookings"
                            total={b.turf_bookings.total}
                            used={b.turf_bookings.used}
                            remaining={b.turf_bookings.total - b.turf_bookings.used}
                            color="blue"
                            description="Valid on all partner turf venues"
                        />

                        {/* Dining Benefit */}
                        <BenefitCard 
                            icon={<Utensils className="text-orange-600" />}
                            title="Dining Vouchers"
                            total={b.dining_vouchers.total}
                            used={b.dining_vouchers.used}
                            remaining={b.dining_vouchers.total - b.dining_vouchers.used}
                            color="orange"
                            subtitle={`₹${b.dining_vouchers.value_each} voucher each`}
                            description="Apply at check-out in premium restaurants"
                        />

                        {/* Events Benefit */}
                        <div className="bg-white border border-zinc-100 rounded-[24px] p-6 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-zinc-900">Event Discounts</h4>
                                    <p className="text-sm text-zinc-500">10% Off on all premium events</p>
                                </div>
                            </div>
                            <div className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                {b.events_discount_active ? 'ENABLED' : 'DISABLED'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Mock (or real if available) */}
                <div className="bg-zinc-50 rounded-[32px] p-8 border border-zinc-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-zinc-900">Smart Usage</h4>
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                            <Trophy size={16} className="text-amber-500" />
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        You've saved roughly <span className="font-bold text-zinc-900">₹{(b.turf_bookings.used * 800) + (b.dining_vouchers.used * b.dining_vouchers.value_each)}</span> so far with your Ticpin Pass! Keep exploring to maximize your membership value.
                    </p>
                </div>
            </main>
        </div>
    );
}

function BenefitCard({ icon, title, used, total, remaining, color, description, subtitle }: any) {
    const colors: any = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', progress: 'bg-blue-600' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', progress: 'bg-orange-600' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', progress: 'bg-purple-600' }
    };

    const percentage = (used / total) * 100;
    const c = colors[color] || colors.blue;

    return (
        <div className="bg-white border border-zinc-100 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${c.bg} rounded-3xl flex items-center justify-center ${c.text} transform group-hover:rotate-6 transition-transform`}>
                        {React.cloneElement(icon, { size: 28 })}
                    </div>
                    <div>
                        <h4 className="font-black text-zinc-900 text-lg">{title}</h4>
                        {subtitle && <p className={`text-[11px] font-bold ${c.text} uppercase tracking-wider`}>{subtitle}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-zinc-900">{remaining}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Remaining</p>
                </div>
            </div>

            <div className="space-y-3">
                <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${c.progress} transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                    <span className="text-zinc-400">{used} consumed</span>
                    <span className="text-zinc-900">{total} total</span>
                </div>
            </div>

            <div className="mt-6 pt-5 border-t border-zinc-50 flex items-center gap-2 text-zinc-400">
                <Info size={14} />
                <p className="text-[11px] font-medium">{description}</p>
            </div>
        </div>
    );
}
