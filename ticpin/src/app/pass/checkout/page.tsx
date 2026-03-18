'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import { bookingApi } from '@/lib/api/booking';

const PASS_AMOUNT = 999;

/** Dynamically load a third-party payment SDK script (idempotent). */
function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(s);
    });
}

export default function PassCheckoutPage() {
    const router = useRouter();
    const session = useUserSession();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [state, setState] = useState('');
    const [district, setDistrict] = useState('');
    const [country, setCountry] = useState('India');

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [hasCheckedSession, setHasCheckedSession] = useState(false);

    useEffect(() => {
        // Wait for session to load first
        const timer = setTimeout(() => {
            setHasCheckedSession(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!hasCheckedSession) return;
        
        if (!session) {
            router.push('/pass');
            return;
        }
        
        setName(session.name || '');
        setPhone(session.phone || '');
    }, [session, hasCheckedSession, router]);

    // Handle Cashfree redirect return
    useEffect(() => {
        if (!hasCheckedSession) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const cfOrderId = urlParams.get('order_id');
        if (cfOrderId && cfOrderId.startsWith('TICPIN_')) {
            const pending = sessionStorage.getItem('ticpin_pending_pass');
            if (pending) {
                try {
                    const p = JSON.parse(pending);
                    window.history.replaceState(null, '', window.location.pathname);
                    setLoading(true);
                    setName(p.name || '');
                    setPhone(p.phone || '');
                    confirmPassPurchase(cfOrderId, p);
                } catch (e) {
                    console.error('Cashfree pass return parse error', e);
                }
            }
        }
    }, [session, hasCheckedSession]);

    const confirmPassPurchase = async (paymentId: string, data: any) => {
        try {
            const res = await fetch('/backend/api/pass/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    user_id: data.userId,
                    payment_id: paymentId,
                    name: data.name,
                    phone: data.phone,
                    address: data.address,
                    state: data.state,
                    district: data.district,
                    country: data.country,
                }),
            });
            const resData = await res.json();
            if (!res.ok) throw new Error(resData.error || 'Purchase failed');
            sessionStorage.removeItem('ticpin_pending_pass');
            setSuccess(true);
            setTimeout(() => router.push('/my-pass'), 2000);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!session) return;
        if (!name.trim()) { setError('Please enter your name.'); return; }
        setError('');
        setLoading(true);

        try {
            // Step 1: Create a real payment order
            const orderRes = await bookingApi.createPaymentOrder({
                amount: PASS_AMOUNT,
                customer_phone: phone || session.phone,
                customer_email: `user_${session.phone}@ticpin.in`,
                customer_id: session.id,
                return_url: `${window.location.origin}${window.location.pathname}`,
            });

            // Step 2: Store pending pass data for after redirect (Cashfree)
            sessionStorage.setItem('ticpin_pending_pass', JSON.stringify({
                userId: session.id,
                name,
                phone,
                address,
                state,
                district,
                country,
            }));

            if (orderRes.gateway === 'cashfree') {
                await loadScript('https://sdk.cashfree.com/js/v3/cashfree.js');
                const cashfree = (window as any).Cashfree({
                    mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
                });
                cashfree.checkout({
                    paymentSessionId: orderRes.payment_session_id,
                    redirectTarget: '_self',
                });
                // Page will redirect — don't set loading false here
            } else {
                // Razorpay inline modal
                await loadScript('https://checkout.razorpay.com/v1/checkout.js');
                const options = {
                    key: orderRes.razorpay_key,
                    amount: PASS_AMOUNT * 100,
                    currency: 'INR',
                    order_id: orderRes.order_id,
                    name: 'Ticpin',
                    description: 'Ticpin Pass (3 months)',
                    prefill: {
                        name,
                        contact: phone,
                    },
                    theme: { color: '#7B2FF7' },
                    handler: async (response: { razorpay_payment_id: string }) => {
                        await confirmPassPurchase(response.razorpay_payment_id, {
                            userId: session.id,
                            name,
                            phone,
                            address,
                            state,
                            district,
                            country,
                        });
                    },
                    modal: {
                        ondismiss: () => {
                            sessionStorage.removeItem('ticpin_pending_pass');
                            setLoading(false);
                            setError('Payment was cancelled. Please try again.');
                        },
                    },
                };
                new (window as any).Razorpay(options).open();
            }
        } catch (e: unknown) {
            setLoading(false);
            setError(e instanceof Error ? e.message : 'Payment initiation failed. Please try again.');
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#ECE8FD] to-white">
                <CheckCircle className="text-[#7B2FF7]" size={64} />
                <h2 className="text-2xl font-black text-zinc-900">Pass Activated!</h2>
                <p className="text-zinc-500">Redirecting to your pass...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 50%)' }}>

            <main className="flex-1 px-4 py-10 max-w-[900px] mx-auto w-full">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 text-sm mb-8 transition"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <h1 className="text-3xl font-black text-zinc-900 mb-2">Checkout</h1>
                <p className="text-zinc-500 mb-10">Complete your Ticpin Pass purchase</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        <h2 className="text-lg font-bold text-zinc-800 mb-2">Your Details</h2>

                        {[
                            { label: 'Full Name *', value: name, set: setName, placeholder: 'Enter your name' },
                            { label: 'Phone', value: phone, set: setPhone, placeholder: 'Enter phone number' },
                            { label: 'Address', value: address, set: setAddress, placeholder: 'Street address' },
                            { label: 'District', value: district, set: setDistrict, placeholder: 'District' },
                            { label: 'State', value: state, set: setState, placeholder: 'State' },
                            { label: 'Country', value: country, set: setCountry, placeholder: 'Country' },
                        ].map(({ label, value, set, placeholder }) => (
                            <div key={label} className="flex flex-col gap-1">
                                <label className="text-sm text-zinc-600 font-medium">{label}</label>
                                <input
                                    value={value}
                                    onChange={e => set(e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm outline-none focus:border-[#7B2FF7] transition"
                                />
                            </div>
                        ))}

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>

                    {/* Summary */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm sticky top-6">
                            <h2 className="text-lg font-bold text-zinc-900 mb-4">Order Summary</h2>

                            <div className="flex flex-col gap-3 mb-6 text-sm">
                                <div className="flex justify-between text-zinc-600">
                                    <span>Ticpin Pass (3 months)</span>
                                    <span className="font-semibold text-zinc-900">₹999</span>
                                </div>
                                <div className="flex justify-between text-zinc-500">
                                    <span>2 Turf Bookings</span>
                                    <span className="text-green-600 font-medium">Included</span>
                                </div>
                                <div className="flex justify-between text-zinc-500">
                                    <span>2 × ₹250 Dining Vouchers</span>
                                    <span className="text-green-600 font-medium">Included</span>
                                </div>
                                <div className="flex justify-between text-zinc-500">
                                    <span>Events Discount</span>
                                    <span className="text-green-600 font-medium">Included</span>
                                </div>
                                <div className="border-t border-zinc-100 pt-3 flex justify-between text-base font-bold text-zinc-900">
                                    <span>Total</span>
                                    <span>₹999</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePurchase}
                                disabled={loading}
                                className="w-full py-4 rounded-full text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 transition"
                                style={{ background: 'linear-gradient(135deg, #7B2FF7 0%, #5B1FD4 100%)' }}
                            >
                                {loading ? (
                                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                                ) : (
                                    'Complete Purchase'
                                )}
                            </button>
                            <p className="text-[11px] text-zinc-400 text-center mt-3">Secure checkout. No auto-renewal.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
