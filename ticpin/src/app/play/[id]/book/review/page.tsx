'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, Tag, Trash2, ChevronDown } from 'lucide-react';
import { bookingApi, OfferItem, PaymentOrderResponse } from '@/lib/api/booking';
import { useUserSession } from '@/lib/auth/user';
import Link from 'next/link';

interface CartData {
    eventId: string;
    eventName: string;
    city: string;
    type: 'play';
    date: string;
    slot: string;
    duration: number;
    tickets: { name: string; price: number; quantity: number }[];
    totalPrice: number;
}

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load: ${src}`));
        document.head.appendChild(s);
    });
}

/** Format ISO date string (YYYY-MM-DD) to nice display */
function fmtDate(iso: string) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PlayReviewPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const session = useUserSession();

    const [cart, setCart] = useState<CartData | null>(null);
    const [step, setStep] = useState<'review' | 'billing' | 'success'>('review');

    // Offers
    const [offers, setOffers] = useState<OfferItem[]>([]);
    const [appliedOffer, setAppliedOffer] = useState<OfferItem | null>(null);
    const [offerDiscount, setOfferDiscount] = useState(0);

    // Coupons
    const [couponInput, setCouponInput] = useState('');
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponLoading, setCouponLoading] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<{ id: string; code: string; discount_value: number; valid_until: string }[]>([]);

    const [expandedSection, setExpandedSection] = useState<'none' | 'offers' | 'coupons'>('none');
    const [showGstDetails, setShowGstDetails] = useState(false);

    // Billing
    const [email, setEmail] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [billing, setBilling] = useState({
        name: '',
        phone: '',
        nationality: 'Indian',
        address: '',
        city: '',
        pincode: '',
    });

    // Flow
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingId, setBookingId] = useState('');

    // ── Load cart & handle Cashfree return ───────────────────────────
    useEffect(() => {
        const saved = sessionStorage.getItem('ticpin_cart');
        if (saved) {
            try { setCart(JSON.parse(saved)); } catch { /* ignore */ }
        }
        const savedEmail = sessionStorage.getItem('ticpin_billing_email');
        if (savedEmail) setEmail(savedEmail);
        const savedBilling = sessionStorage.getItem('ticpin_billing_data');
        if (savedBilling) {
            try { setBilling(JSON.parse(savedBilling)); } catch { /* ignore */ }
        }
        const savedStep = sessionStorage.getItem('ticpin_play_step');
        if (savedStep === 'billing') setStep('billing');

        // Cashfree return: URL has ?order_id=TICPIN_xxx
        const urlParams = new URLSearchParams(window.location.search);
        const cfOrderId = urlParams.get('order_id');
        if (cfOrderId && cfOrderId.startsWith('TICPIN_')) {
            const pending = sessionStorage.getItem('ticpin_pending_play');
            if (pending) {
                try {
                    const p = JSON.parse(pending);
                    if (p.cart) {
                        setCart(p.cart);
                        setStep('billing');
                        setBookingLoading(true);
                        window.history.replaceState(null, '', window.location.pathname);
                        setTimeout(() => {
                            completeBooking(p.orderID, 'cashfree', p.cart, p.email, p.sessionId,
                                p.orderAmount, p.bookingFee, p.appliedCoupon || '', p.offerId);
                        }, 200);
                    }
                } catch { /* ignore */ }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Pre-fill from session
    useEffect(() => {
        if (session) {
            setBilling(prev => ({
                ...prev,
                name: prev.name || session.name || '',
                phone: prev.phone || session.phone || '',
            }));
        }
    }, [session]);

    // Persist
    useEffect(() => { if (email) sessionStorage.setItem('ticpin_billing_email', email); }, [email]);
    useEffect(() => {
        if (billing.name || billing.phone) sessionStorage.setItem('ticpin_billing_data', JSON.stringify(billing));
    }, [billing]);
    useEffect(() => { sessionStorage.setItem('ticpin_play_step', step); }, [step]);

    // Fetch offers + coupons
    useEffect(() => {
        if (!id) return;
        bookingApi.getPlayOffers(id).then(setOffers).catch(() => setOffers([]));
        bookingApi.getCouponsByCategory('play', session?.id).then(res => {
            setAvailableCoupons(Array.isArray(res) ? res : []);
        }).catch(() => setAvailableCoupons([]));
    }, [id, session?.id]);

    const orderAmount = cart?.totalPrice ?? 0;
    const bookingFee = Math.round(orderAmount * 0.1);
    const totalDiscount = offerDiscount + couponDiscount;
    const grandTotal = Math.max(0, orderAmount + bookingFee - totalDiscount);

    const removeTicket = (i: number) => {
        if (!cart) return;
        const newTickets = cart.tickets.filter((_, idx) => idx !== i);
        const newTotal = newTickets.reduce((s, t) => s + t.price * t.quantity, 0);
        const updated = { ...cart, tickets: newTickets, totalPrice: newTotal };
        setCart(updated);
        sessionStorage.setItem('ticpin_cart', JSON.stringify(updated));
    };

    const applyOffer = (offer: OfferItem) => {
        const disc = offer.discount_type === 'percent'
            ? Math.round(orderAmount * offer.discount_value / 100)
            : Math.min(offer.discount_value, orderAmount);
        setOfferDiscount(disc);
        setAppliedOffer(offer);
        setExpandedSection('none');
    };

    const validateCoupon = async (code?: string) => {
        const c = (code ?? couponInput).trim();
        if (!c) return;
        setCouponLoading(true);
        setCouponError('');
        setCouponSuccess('');
        try {
            const result = await bookingApi.validateCoupon(c, id, orderAmount, session?.id);
            setCouponDiscount(Math.round(result.discount_amount));
            setAppliedCoupon(c.toUpperCase());
            setCouponSuccess(`✓ Coupon applied! You save ₹${Math.round(result.discount_amount)}`);
            setExpandedSection('none');
        } catch (err: unknown) {
            setCouponError(err instanceof Error ? err.message : 'Invalid coupon');
            setCouponDiscount(0);
            setAppliedCoupon('');
        } finally {
            setCouponLoading(false);
        }
    };

    const billingComplete =
        billing.name.trim() !== '' &&
        billing.phone.trim().length >= 10 &&
        billing.address.trim() !== '' &&
        billing.city.trim() !== '' &&
        billing.pincode.trim().length >= 6 &&
        acceptedTerms;

    /** Core: after payment succeeds, record the booking */
    const completeBooking = async (
        paymentId: string,
        paymentGateway: string,
        cartData: CartData,
        emailData: string,
        sessionId: string | undefined,
        oAmt: number,
        bFee: number,
        coupon: string,
        offerId: string | undefined,
    ) => {
        setBookingLoading(true);
        setBookingError('');
        try {
            const result = await bookingApi.createPlayBooking({
                user_email: emailData,
                play_id: cartData.eventId,
                venue_name: cartData.eventName,
                date: cartData.date,
                slot: cartData.slot,
                tickets: cartData.tickets.map(t => ({
                    category: t.name,
                    price: t.price,
                    quantity: t.quantity,
                })),
                order_amount: oAmt,
                booking_fee: bFee,
                coupon_code: coupon || undefined,
                offer_id: offerId,
                user_id: sessionId,
                payment_id: paymentId,
                payment_gateway: paymentGateway,
            });
            setBookingId(result.booking_id);
            ['ticpin_cart', 'ticpin_billing_email', 'ticpin_billing_data',
                'ticpin_play_step', 'ticpin_pending_play'].forEach(k => sessionStorage.removeItem(k));
            setStep('success');
        } catch (err: unknown) {
            setBookingError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handlePayNow = async () => {
        if (!billing.name.trim()) { setBookingError('Please enter your full name'); return; }
        if (!email.trim() || !email.includes('@')) { setBookingError('Please enter a valid email'); return; }
        if (!billing.address.trim()) { setBookingError('Please enter your address'); return; }
        if (!billing.city.trim()) { setBookingError('Please enter your city'); return; }
        if (!billing.pincode.trim() || billing.pincode.length < 6) { setBookingError('Please enter a valid PIN code'); return; }
        if (!acceptedTerms) { setBookingError('Please accept the terms and conditions'); return; }
        if (!cart) return;
        setBookingLoading(true);
        setBookingError('');

        try {
            const orderRes: PaymentOrderResponse = await bookingApi.createPaymentOrder({
                amount: grandTotal,
                customer_phone: billing.phone,
                customer_email: email || `user_${billing.phone}@ticpin.in`,
                customer_id: session?.id || `phone_${billing.phone}`,
                return_url: `${window.location.origin}${window.location.pathname}`,
            });

            // Persist pending data for Cashfree redirect return
            sessionStorage.setItem('ticpin_pending_play', JSON.stringify({
                gateway: orderRes.gateway,
                orderID: orderRes.order_id,
                cart,
                email,
                sessionId: session?.id,
                orderAmount,
                bookingFee,
                grandTotal,
                appliedCoupon,
                offerId: appliedOffer?.id,
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
                // Will redirect — don't clear loading
            } else {
                await loadScript('https://checkout.razorpay.com/v1/checkout.js');
                const options = {
                    key: orderRes.razorpay_key,
                    amount: grandTotal * 100,
                    currency: 'INR',
                    order_id: orderRes.order_id,
                    name: 'Ticpin',
                    description: `${cart.eventName} — ${cart.slot}`,
                    prefill: { name: billing.name, email, contact: billing.phone },
                    theme: { color: '#000000' },
                    handler: async (response: { razorpay_payment_id: string }) => {
                        await completeBooking(
                            response.razorpay_payment_id, 'razorpay',
                            cart, email, session?.id,
                            orderAmount, bookingFee,
                            appliedCoupon, appliedOffer?.id,
                        );
                    },
                    modal: {
                        ondismiss: () => {
                            sessionStorage.removeItem('ticpin_pending_play');
                            setBookingLoading(false);
                            setBookingError('Payment was cancelled. Please try again.');
                        },
                    },
                };
                new (window as any).Razorpay(options).open();
            }
        } catch (err: unknown) {
            setBookingLoading(false);
            setBookingError(err instanceof Error ? err.message : 'Payment initiation failed. Please try again.');
        }
    };

    // ── Success Screen ────────────────────────────────────────────────
    if (step === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#FFFCED] via-white to-white font-[family-name:var(--font-anek-latin)]">
                <div className="w-full max-w-[520px] bg-white rounded-[24px] p-10 mx-6 text-center shadow-sm border border-zinc-100">
                    <CheckCircle2 size={56} className="text-green-500 mx-auto mb-4" />
                    <h1 className="text-[28px] font-semibold text-black mb-2">Booking Confirmed!</h1>
                    <p className="text-[15px] text-[#686868] mb-1">Booking ID</p>
                    <p className="text-[18px] font-bold text-black mb-4 bg-zinc-50 rounded-[10px] py-3 px-4 font-mono">
                        #{bookingId.slice(-10).toUpperCase()}
                    </p>
                    <p className="text-[14px] text-[#686868] mb-6">
                        Confirmation recorded for <span className="font-semibold text-black">{email}</span>
                    </p>
                    {cart && (
                        <div className="bg-zinc-50 rounded-[14px] p-4 text-left space-y-1 mb-6">
                            <p className="font-semibold text-black text-[16px]">{cart.eventName}</p>
                            <p className="text-[14px] text-[#686868]">{fmtDate(cart.date)} • {cart.slot}</p>
                            {cart.tickets.map((t, i) => (
                                <p key={i} className="text-[13px] text-[#686868]">{t.name}</p>
                            ))}
                        </div>
                    )}
                    <p className="text-[22px] font-bold text-black mb-6">₹{grandTotal.toLocaleString('en-IN')} paid</p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full h-[50px] bg-black text-white rounded-[12px] font-semibold text-[16px] hover:opacity-90 transition-all"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFFCED] via-white to-white font-[family-name:var(--font-anek-latin)]">
            {/* Header */}
            <header className="w-full h-[64px] bg-white border-b border-zinc-100 flex items-center justify-between px-6 md:px-10 shadow-sm">
                <div className="cursor-pointer" onClick={() => router.push('/')}>
                    <Image src="/ticpin-logo-black.png" alt="TICPIN" width={115} height={22} className="h-[22px] w-auto object-contain" />
                </div>
                <h1 className="text-[18px] font-semibold text-black">Review your booking</h1>
                <div className="w-6" />
            </header>

            <main className="max-w-[700px] mx-auto px-4 py-8 space-y-5">

                {/* Order Summary Card */}
                <div className="bg-white rounded-[20px] border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-zinc-100">
                        <h2 className="text-[22px] font-semibold text-black">Order Summary</h2>
                    </div>

                    {/* Slots */}
                    <div className="px-6 py-5 border-b border-zinc-100">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-black mb-3">SLOTS</p>
                        {cart ? (
                            <div className="border border-zinc-200 rounded-[12px] p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[18px] font-bold text-black">{cart.eventName}</span>
                                        <span className="w-px h-5 bg-zinc-300" />
                                        <span className="text-[16px] text-[#686868] font-medium">{cart.city}</span>
                                    </div>
                                    <Trash2 size={14} className="text-zinc-400 cursor-pointer hover:text-red-500"
                                        onClick={() => { sessionStorage.removeItem('ticpin_cart'); router.back(); }} />
                                </div>
                                <p className="text-[14px] font-medium text-[#686868] uppercase tracking-wide">
                                    {fmtDate(cart.date)} &nbsp;•&nbsp; {cart.slot}
                                </p>
                                <p className="text-[13px] text-[#686868]">
                                    {cart.tickets.map(t => t.name).join(', ')}
                                </p>
                                <div className="flex justify-end pt-1">
                                    <span className="text-[16px] font-bold text-black">₹{cart.totalPrice.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[14px] text-zinc-400">No booking in cart. <Link href="/" className="underline">Go back</Link></p>
                        )}
                    </div>

                    {/* Offers */}
                    <div className="px-6 py-4 border-b border-zinc-100">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-black mb-3">OFFERS</p>
                        <div className="space-y-2">
                            {appliedOffer ? (
                                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-[10px] px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Tag size={14} className="text-green-600" />
                                        <span className="text-[14px] font-semibold text-green-700">{appliedOffer.title} — −₹{offerDiscount}</span>
                                    </div>
                                    <button onClick={() => { setAppliedOffer(null); setOfferDiscount(0); }}
                                        className="text-[12px] text-zinc-500 hover:text-red-500">Remove</button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setExpandedSection(s => s === 'offers' ? 'none' : 'offers')}
                                    className="w-full flex items-center justify-between px-4 py-3 border border-zinc-200 rounded-[10px] hover:border-zinc-400 transition-all"
                                >
                                    <div className="flex items-center gap-2 text-[14px] font-medium text-black">
                                        <Tag size={16} className="text-[#686868]" />
                                        View all play offers
                                    </div>
                                    <ChevronRight size={16} className="text-zinc-400" />
                                </button>
                            )}
                            {expandedSection === 'offers' && offers.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    {offers.map(offer => (
                                        <div key={offer.id} className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-[10px] px-4 py-3">
                                            <div>
                                                <p className="text-[14px] font-semibold text-black">{offer.title}</p>
                                                <p className="text-[12px] text-[#686868]">{offer.description}</p>
                                            </div>
                                            <button onClick={() => applyOffer(offer)}
                                                className="px-3 py-1.5 bg-black text-white text-[12px] font-semibold rounded-[6px] ml-3 whitespace-nowrap">
                                                APPLY
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {appliedCoupon ? (
                                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-[10px] px-4 py-3 mt-2">
                                    <span className="text-[14px] font-semibold text-green-700">{couponSuccess}</span>
                                    <button onClick={() => { setAppliedCoupon(''); setCouponDiscount(0); setCouponInput(''); setCouponSuccess(''); }}
                                        className="text-[12px] text-zinc-500 hover:text-red-500">Remove</button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setExpandedSection(s => s === 'coupons' ? 'none' : 'coupons')}
                                    className="w-full flex items-center justify-between px-4 py-3 border border-zinc-200 rounded-[10px] hover:border-zinc-400 transition-all mt-2"
                                >
                                    <div className="flex items-center gap-2 text-[14px] font-medium text-black">
                                        <Tag size={16} className="text-[#686868]" />
                                        View all coupon codes
                                    </div>
                                    <ChevronRight size={16} className="text-zinc-400" />
                                </button>
                            )}
                            {expandedSection === 'coupons' && (
                                <div className="space-y-3 mt-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter coupon code"
                                            value={couponInput}
                                            onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                                            onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                                            className="flex-1 border border-zinc-300 rounded-[10px] px-4 h-[44px] text-[14px] outline-none focus:border-black"
                                        />
                                        <button onClick={() => validateCoupon()}
                                            disabled={couponLoading || !couponInput.trim()}
                                            className="px-4 h-[44px] bg-black text-white text-[13px] font-semibold rounded-[10px] disabled:opacity-50">
                                            {couponLoading ? '...' : 'APPLY'}
                                        </button>
                                    </div>
                                    {couponError && <p className="text-red-500 text-[13px]">{couponError}</p>}
                                    {availableCoupons.length > 0 && (
                                        <div className="space-y-2">
                                            {availableCoupons.map(c => (
                                                <div key={c.id} className="flex items-center justify-between bg-[#FFFBEA] border border-[#E7C200] rounded-[10px] px-4 py-3">
                                                    <div>
                                                        <p className="text-[13px] font-bold text-black">{c.code}</p>
                                                        <p className="text-[11px] text-[#686868]">{c.discount_value}% OFF • Till {new Date(c.valid_until).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                                                    </div>
                                                    <button onClick={() => { setCouponInput(c.code); validateCoupon(c.code); }}
                                                        className="px-3 py-1 bg-black text-white text-[11px] font-semibold rounded-[6px]">
                                                        APPLY
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="px-6 py-5">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-black mb-4">PAYMENT DETAILS</p>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[15px]">
                                <span className="text-black font-medium">Order amount</span>
                                <span className="font-semibold text-black">₹{orderAmount.toLocaleString('en-IN')}</span>
                            </div>
                            {totalDiscount > 0 && (
                                <div className="flex justify-between text-[15px]">
                                    <span className="text-green-600 font-medium">Discount</span>
                                    <span className="font-semibold text-green-600">−₹{totalDiscount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-[15px] items-center">
                                <button onClick={() => setShowGstDetails(s => !s)}
                                    className="flex items-center gap-1 text-black font-medium">
                                    Booking fee (inc. of GST)
                                    <ChevronDown size={14} className={`transition-transform text-[#686868] ${showGstDetails ? 'rotate-180' : ''}`} />
                                </button>
                                <span className="font-semibold text-black">₹{bookingFee.toLocaleString('en-IN')}</span>
                            </div>
                            {showGstDetails && (
                                <div className="bg-zinc-50 rounded-[10px] p-3 text-[13px] text-[#686868] space-y-1 ml-2">
                                    <div className="flex justify-between">
                                        <span>Platform fee</span>
                                        <span>₹{Math.round(bookingFee * 0.85).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>GST (18%)</span>
                                        <span>₹{Math.round(bookingFee * 0.15).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            )}
                            <div className="border-t border-zinc-200 pt-3 flex justify-between text-[18px] font-bold">
                                <span>Grand total</span>
                                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Billing Details */}
                <div className="bg-white rounded-[20px] border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-zinc-100">
                        <h2 className="text-[20px] font-semibold text-black">Contact Details</h2>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div>
                            <label className="text-[13px] font-medium text-[#686868] uppercase tracking-wide block mb-1">Email *</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full border border-zinc-300 rounded-[10px] h-[48px] px-4 text-[15px] outline-none focus:border-black" />
                        </div>
                        <div>
                            <label className="text-[13px] font-medium text-[#686868] uppercase tracking-wide block mb-1">Full Name *</label>
                            <input type="text" value={billing.name} onChange={e => setBilling({ ...billing, name: e.target.value })}
                                placeholder="As on ID"
                                className="w-full border border-zinc-300 rounded-[10px] h-[48px] px-4 text-[15px] outline-none focus:border-black" />
                        </div>
                        <div>
                            <label className="text-[13px] font-medium text-[#686868] uppercase tracking-wide block mb-1">Mobile *</label>
                            <input type="tel" value={billing.phone} onChange={e => setBilling({ ...billing, phone: e.target.value })}
                                placeholder="10-digit mobile number" maxLength={10}
                                className="w-full border border-zinc-300 rounded-[10px] h-[48px] px-4 text-[15px] outline-none focus:border-black" />
                        </div>
                        <div>
                            <label className="text-[13px] font-medium text-[#686868] uppercase tracking-wide block mb-1">Address *</label>
                            <input type="text" value={billing.address} onChange={e => setBilling({ ...billing, address: e.target.value })}
                                placeholder="Street address"
                                className="w-full border border-zinc-300 rounded-[10px] h-[48px] px-4 text-[15px] outline-none focus:border-black" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[13px] font-medium text-[#686868] uppercase tracking-wide block mb-1">City *</label>
                                <input type="text" value={billing.city} onChange={e => setBilling({ ...billing, city: e.target.value })}
                                    placeholder="City"
                                    className="w-full border border-zinc-300 rounded-[10px] h-[48px] px-4 text-[15px] outline-none focus:border-black" />
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-[#686868] uppercase tracking-wide block mb-1">PIN Code *</label>
                                <input type="text" value={billing.pincode} onChange={e => setBilling({ ...billing, pincode: e.target.value })}
                                    placeholder="6-digit PIN" maxLength={6}
                                    className="w-full border border-zinc-300 rounded-[10px] h-[48px] px-4 text-[15px] outline-none focus:border-black" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms + Pay */}
                <div className="bg-white rounded-[20px] border border-zinc-200 shadow-sm px-6 py-5 space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <div
                            onClick={() => setAcceptedTerms(t => !t)}
                            className={`w-5 h-5 mt-0.5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${acceptedTerms ? 'bg-black border-black' : 'border-zinc-400 bg-white'
                                }`}
                        >
                            {acceptedTerms && (
                                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                                    <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                        <span className="text-[14px] text-black leading-relaxed">
                            I have read and accepted the{' '}
                            <Link href="/terms" className="text-[#E7C200] font-semibold hover:underline" target="_blank">
                                terms and conditions
                            </Link>
                        </span>
                    </label>

                    {bookingError && (
                        <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
                            <p className="text-red-600 text-[14px] font-medium">{bookingError}</p>
                        </div>
                    )}

                    <button
                        onClick={handlePayNow}
                        disabled={bookingLoading || !cart || cart.tickets.length === 0}
                        className="w-full h-[54px] bg-black text-white rounded-[12px] font-semibold text-[16px] tracking-wide uppercase hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {bookingLoading ? (
                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                        ) : (
                            `CONTINUE  ₹${grandTotal.toLocaleString('en-IN')}`
                        )}
                    </button>
                    <p className="text-center text-[12px] text-[#686868]">
                        Secured by Cashfree / Razorpay · 256-bit SSL encryption
                    </p>
                </div>

            </main>
        </div>
    );
}
