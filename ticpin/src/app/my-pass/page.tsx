'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Utensils, Ticket, RefreshCw, CheckCircle2, XCircle, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import Footer from '@/components/layout/Footer';

interface PassBenefits {
    turf_bookings: { total: number; used: number; remaining: number };
    dining_vouchers: { total: number; used: number; remaining: number; value_each: number };
    events_discount_active: boolean;
}

interface TicpinPass {
    id: string;
    user_id: string;
    name: string;
    phone: string;
    status: 'active' | 'expired';
    price: number;
    start_date: string;
    end_date: string;
    benefits: PassBenefits;
    payment_id: string;
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysLeft(endDate: string) {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function MyPassPage() {
    const router = useRouter();
    const session = useUserSession();

    const [pass, setPass] = useState<TicpinPass | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [renewLoading, setRenewLoading] = useState(false);
    const [renewSuccess, setRenewSuccess] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!session) { router.push('/pass'); return; }
        fetch(`/backend/api/pass/user/${session.id}`, { credentials: 'include' })
            .then(r => {
                if (!r.ok) { setError('no_pass'); setLoading(false); return null; }
                return r.json();
            })
            .then(d => { if (d) { setPass(d); setLoading(false); } })
            .catch(() => { setError('no_pass'); setLoading(false); });
    }, [session]);

    const handleRenew = async () => {
        if (!pass || !session) return;
        setRenewLoading(true);
        const mockPaymentId = `REN_${Date.now()}`;
        try {
            const res = await fetch(`/backend/api/pass/${pass.id}/renew`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ payment_id: mockPaymentId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setPass(data);
            setRenewSuccess(true);
            setTimeout(() => setRenewSuccess(false), 3000);
        } catch {
            alert('Renewal failed. Please try again.');
        } finally {
            setRenewLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#ECE8FD] to-white">
                <div className="w-10 h-10 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error === 'no_pass' || !pass) {
        return (
            <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 50%)' }}>
                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
                    <XCircle size={64} className="text-zinc-300" />
                    <h2 className="text-2xl font-black text-zinc-800">No Active Pass</h2>
                    <p className="text-zinc-500 max-w-sm">You don't have an active Ticpin Pass. Get one to enjoy turf bookings, dining vouchers, and event discounts.</p>
                    <button
                        onClick={() => router.push('/pass')}
                        className="px-8 py-3 rounded-full text-white font-bold"
                        style={{ background: 'linear-gradient(135deg, #7B2FF7 0%, #5B1FD4 100%)' }}
                    >
                        Get Ticpin Pass — ₹999
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    const days = daysLeft(pass.end_date);
    const isExpired = pass.status === 'expired';
    const isExpiringSoon = !isExpired && days <= 15;

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 40%)' }}>

            <main className="flex-1 px-4 py-10 max-w-[900px] mx-auto w-full">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 text-sm mb-8 transition">
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-black text-zinc-900">My Pass</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${isExpired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                        {isExpired ? 'Expired' : 'Active'}
                    </span>
                </div>
                <p className="text-zinc-500 text-sm mb-10">Ticpin Pass — ₹{pass.price} / 3 months</p>

                {/* Pass Card */}
                <div
                    className="rounded-3xl p-6 md:p-8 text-white mb-8 shadow-xl"
                    style={{ background: 'linear-gradient(135deg, #7B2FF7 0%, #3A1A8C 100%)' }}
                >
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Pass Holder</p>
                            <p className="text-xl font-black">{pass.name || 'Member'}</p>
                            {pass.phone && <p className="text-white/60 text-sm">{pass.phone}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Valid Until</p>
                            <p className="font-bold">{formatDate(pass.end_date)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-white/80 text-sm">
                        {isExpired ? (
                            <><XCircle size={16} className="text-red-300" /> Expired on {formatDate(pass.end_date)}</>
                        ) : isExpiringSoon ? (
                            <><Clock size={16} className="text-yellow-300" /> Expiring in {days} day{days !== 1 ? 's' : ''}</>
                        ) : (
                            <><CheckCircle2 size={16} className="text-green-300" /> {days} days remaining</>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/20 text-xs text-white/50">
                        Active from {formatDate(pass.start_date)} — Valid until {formatDate(pass.end_date)}
                    </div>
                </div>

                {/* Benefits */}
                <h2 className="text-xl font-black text-zinc-900 mb-4">Your Benefits</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                    {/* Turf */}
                    <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-[#7B2FF7]/10 flex items-center justify-center mb-3">
                            <MapPin size={20} className="text-[#7B2FF7]" />
                        </div>
                        <p className="text-sm font-bold text-zinc-800 mb-1">Turf Bookings</p>
                        <div className="flex items-end gap-1">
                            <span className="text-3xl font-black text-zinc-900">{pass.benefits.turf_bookings.remaining}</span>
                            <span className="text-zinc-400 text-sm mb-1">/ {pass.benefits.turf_bookings.total} left</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-zinc-100">
                            <div
                                className="h-2 rounded-full bg-[#7B2FF7]"
                                style={{ width: `${(pass.benefits.turf_bookings.remaining / pass.benefits.turf_bookings.total) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Dining */}
                    <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-[#7B2FF7]/10 flex items-center justify-center mb-3">
                            <Utensils size={20} className="text-[#7B2FF7]" />
                        </div>
                        <p className="text-sm font-bold text-zinc-800 mb-1">Dining Vouchers</p>
                        <div className="flex items-end gap-1">
                            <span className="text-3xl font-black text-zinc-900">{pass.benefits.dining_vouchers.remaining}</span>
                            <span className="text-zinc-400 text-sm mb-1">/ {pass.benefits.dining_vouchers.total} left</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">₹{pass.benefits.dining_vouchers.value_each} each</p>
                        <div className="mt-2 h-2 rounded-full bg-zinc-100">
                            <div
                                className="h-2 rounded-full bg-[#7B2FF7]"
                                style={{ width: `${(pass.benefits.dining_vouchers.remaining / pass.benefits.dining_vouchers.total) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Events */}
                    <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-[#7B2FF7]/10 flex items-center justify-center mb-3">
                            <Ticket size={20} className="text-[#7B2FF7]" />
                        </div>
                        <p className="text-sm font-bold text-zinc-800 mb-1">Events Discount</p>
                        <div className="flex items-center gap-2 mt-2">
                            {pass.benefits.events_discount_active ? (
                                <span className="flex items-center gap-1 text-green-600 font-bold text-sm">
                                    <CheckCircle2 size={16} /> Active
                                </span>
                            ) : (
                                <span className="text-zinc-400 text-sm">Inactive</span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-2">Applied automatically at checkout</p>
                    </div>
                </div>

                {/* Renew Section */}
                {(isExpired || isExpiringSoon) && (
                    <div className="bg-[#7B2FF7]/5 border border-[#7B2FF7]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="font-bold text-zinc-900">
                                {isExpired ? 'Your pass has expired' : 'Your pass is expiring soon'}
                            </p>
                            <p className="text-zinc-500 text-sm mt-1">Renew now to keep your benefits active — ₹999 for another 3 months.</p>
                        </div>
                        <button
                            onClick={handleRenew}
                            disabled={renewLoading}
                            className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm disabled:opacity-60 whitespace-nowrap"
                            style={{ background: 'linear-gradient(135deg, #7B2FF7 0%, #5B1FD4 100%)' }}
                        >
                            {renewLoading ? (
                                <><Loader2 size={16} className="animate-spin" /> Renewing...</>
                            ) : (
                                <><RefreshCw size={16} /> Renew Pass — ₹999</>
                            )}
                        </button>
                    </div>
                )}

                {renewSuccess && (
                    <div className="mt-4 flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle2 size={18} /> Pass renewed successfully!
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
