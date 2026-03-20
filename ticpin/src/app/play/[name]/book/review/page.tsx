'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, Tag, Trash2, ChevronDown, ArrowLeft, TriangleAlert } from 'lucide-react';
import { bookingApi, OfferItem, PaymentOrderResponse } from '@/lib/api/booking';
import { profileApi } from '@/lib/api/profile';
import { useUserSession } from '@/lib/auth/user';
import { useOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import AuthModal from '@/components/modals/AuthModal';
import OrganizerLogoutModal from '@/components/modals/OrganizerLogoutModal';
import Link from 'next/link';

interface CartData {
    eventId: string;
    eventName: string;
    city: string;
    type: 'play';
    date: string;
    slot: string;         // 30-min backend slot e.g. "09:00 AM - 09:30 AM"
    display_slot?: string; // full user-facing span e.g. "09:00 AM - 10:00 AM"
    duration: number;
    tickets: { category?: string; name: string; price: number; quantity: number }[];
    totalPrice: number;
}

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') return resolve();
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
    const venueName = params?.name as string;
    const session = useUserSession();
    const organizerSession = useOrganizerSession();

    const [cart, setCart] = useState<CartData | null>(null);
    const [step, setStep] = useState<'review' | 'billing' | 'success'>('review');

    // Locked grand total: set from persisted pending data after a Cashfree redirect
    const [lockedGrandTotal, setLockedGrandTotal] = useState<number | null>(null);

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
    const [availableCoupons, setAvailableCoupons] = useState<{ id: string; code: string; discount_value: number; valid_until: string; discount_type?: string; max_uses: number; used_count: number }[]>([]);

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
        state: '',
        pincode: '',
    });

    // Modals
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Flow
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingId, setBookingId] = useState('');

    const billingRef = useRef<HTMLDivElement>(null);

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
                        if (typeof p.grandTotal === 'number') setLockedGrandTotal(p.grandTotal);
                        window.history.replaceState(null, '', window.location.pathname);
                        setTimeout(() => {
                            completeBooking(p.orderID, 'cashfree', p.cart, p.email, p.sessionId,
                                p.orderAmount, p.bookingFee, p.appliedCoupon || '', p.offerId);
                        }, 200);
                    }
                } catch { /* ignore */ }
            }
        }
    }, []);

    // Pre-fill from session and profile
    useEffect(() => {
        const loadProfileData = async () => {
            if (session?.id) {
                const profile = await profileApi.getProfile(session.id).catch(() => null);
                if (profile) {
                    setBilling(prev => ({
                        ...prev,
                        name: prev.name || profile.name || '',
                        phone: prev.phone || profile.phone || '',
                        address: prev.address || profile.address || '',
                        city: prev.city || profile.district || '',
                        state: prev.state || profile.state || '',
                        nationality: prev.nationality || profile.country || 'Indian',
                    }));
                    if (profile.email && !email) {
                        setEmail(profile.email);
                    }
                } else {
                    setBilling(prev => ({
                        ...prev,
                        name: prev.name || session.name || '',
                        phone: prev.phone || session.phone || '',
                    }));
                }
            }
        };
        loadProfileData();
    }, [session]);

    // Persist
    useEffect(() => { if (email) sessionStorage.setItem('ticpin_billing_email', email); }, [email]);
    useEffect(() => {
        if (billing.name || billing.phone) sessionStorage.setItem('ticpin_billing_data', JSON.stringify(billing));
    }, [billing]);
    useEffect(() => { sessionStorage.setItem('ticpin_play_step', step); }, [step]);

    // Fetch offers + coupons
    useEffect(() => {
        if (!venueName) return;
        bookingApi.getPlayOffers(venueName).then(setOffers).catch(() => setOffers([]));
        bookingApi.getCouponsByCategory('play', session?.id).then(res => {
            setAvailableCoupons(Array.isArray(res) ? res : []);
        }).catch(() => setAvailableCoupons([]));
    }, [venueName, session?.id]);

    const orderAmount = cart?.totalPrice ?? 0;
    const bookingFee = Math.round(orderAmount * 0.1);
    const totalDiscount = offerDiscount + couponDiscount;
    const grandTotal = Math.max(0, orderAmount + bookingFee - totalDiscount);

    const applyOffer = (offer: OfferItem) => {
        if (grandTotal === 0 && offer.id !== appliedOffer?.id) {
            alert("The total is already ₹0. No more offers can be applied.");
            return;
        }
        const disc = offer.discount_type === 'percent'
            ? Math.round(orderAmount * offer.discount_value / 100)
            : Math.min(offer.discount_value, orderAmount);
        setOfferDiscount(disc);
        setAppliedOffer(offer);
        setExpandedSection('none');
    };

    const validateCoupon = async (code?: string) => {
        if (grandTotal === 0 && !appliedCoupon) {
            alert("The total is already ₹0. No coupon needed.");
            return;
        }
        const c = (code ?? couponInput).trim();
        if (!c) return;
        setCouponLoading(true);
        setCouponError('');
        setCouponSuccess('');
        try {
            const result = await bookingApi.validateCoupon(c, venueName, orderAmount, session?.id);
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

    const billingComplete = useMemo(() => {
        return (
            billing.name.trim() !== '' &&
            billing.phone.trim().length >= 10 &&
            billing.address.trim() !== '' &&
            billing.city.trim() !== '' &&
            billing.state.trim() !== '' &&
            billing.pincode.trim().length >= 6 &&
            acceptedTerms
        );
    }, [billing, acceptedTerms]);

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
                user_name: billing.name,
                play_id: cartData.eventId,
                venue_name: cartData.eventName,
                date: cartData.date,
                slot: cartData.slot,
                duration: cartData.duration,
                tickets: cartData.tickets.map(t => ({
                    category: t.category ?? t.name,
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

    const handleContinue = () => {
        if (!billing.phone || billing.phone.length < 10) {
            setBookingError('Please enter a valid 10-digit mobile number');
            return;
        }
        
        // INTERCEPT: Organizer cannot book
        if (organizerSession) {
            setShowLogoutModal(true);
            return;
        }

        if (!session) {
            setShowAuthModal(true);
            return;
        }

        setStep('billing');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePayNow = async () => {
        if (!billing.name.trim()) { setBookingError('Please enter your full name'); return; }
        if (!email.trim() || !email.includes('@')) { setBookingError('Please enter a valid email'); return; }
        if (!billing.address.trim()) { setBookingError('Please enter your address'); return; }
        if (!billing.city.trim()) { setBookingError('Please enter your city'); return; }
        if (!billing.pincode.trim() || billing.pincode.length < 6) { setBookingError('Please enter a valid PIN code'); return; }
        if (!acceptedTerms) { setBookingError('Please accept the terms and conditions'); return; }
        if (!cart) return;

        // Skip payment flow if grand total is 0
        if (grandTotal === 0) {
            await completeBooking(
                'FREE_BOOKING_' + Date.now(),
                'FREE',
                cart,
                email,
                session?.id,
                orderAmount,
                0,
                appliedCoupon || '',
                appliedOffer?.id
            );
            return;
        }

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

    const handleOrganizerLogout = () => {
        clearOrganizerSession();
        setShowAuthModal(true);
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#ECE8FD] via-white to-white font-[family-name:var(--font-anek-latin)]">
                <div className="w-full max-w-[500px] bg-white rounded-[32px] p-10 mx-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={44} className="text-green-500" />
                    </div>
                    <h1 className="text-[32px] font-bold text-black mb-2 uppercase tracking-tight">Booking Confirmed!</h1>
                    <p className="text-[15px] font-medium text-[#686868] mb-1">Booking ID</p>
                    <p className="text-[20px] font-black text-black mb-6 bg-zinc-50 rounded-[12px] py-4 px-4 font-mono uppercase tracking-widest border border-zinc-100">
                        #{bookingId.slice(-10).toUpperCase()}
                    </p>
                    <p className="text-[15px] text-[#686868] mb-8 leading-relaxed">
                        Confirmation has been sent to your email <br/><span className="font-bold text-black">{email}</span>
                    </p>
                    {cart && (
                        <div className="bg-zinc-50 rounded-[20px] p-6 text-left space-y-2 mb-8 border border-zinc-100">
                            <p className="font-black text-black text-[20px] uppercase">{cart.eventName}</p>
                            <p className="text-[16px] text-[#686868] font-semibold">{fmtDate(cart.date)} &nbsp;•&nbsp; {cart.display_slot ?? cart.slot}</p>
                            <div className="pt-2">
                                {cart.tickets.map((t, i) => (
                                    <p key={i} className="text-[14px] text-[#686868] font-medium">{t.name}</p>
                                ))}
                            </div>
                        </div>
                    )}
                    <p className="text-[26px] font-black text-black mb-8">
                        {(lockedGrandTotal ?? grandTotal) === 0 ? 'FREE' : `₹${(lockedGrandTotal ?? grandTotal).toLocaleString('en-IN')}`} PAID
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full h-[56px] bg-black text-white rounded-[14px] font-bold text-[18px] uppercase tracking-wider hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-anek-latin" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)' }}>
            <header className="sticky top-0 z-50 w-full h-[70px] bg-white/80 backdrop-blur-md border-b border-zinc-200/50 flex items-center justify-between px-4 md:px-10 lg:px-20">
                <div className="cursor-pointer transition-opacity hover:opacity-80" onClick={() => (step === 'review' ? router.push('/') : setStep('review'))}>
                    <Image src="/ticpin-logo-black.png" alt="TICPIN" width={120} height={25} className="h-6 w-auto object-contain" />
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${step === 'review' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'}`}>1</div>
                    <div className="w-10 h-px bg-zinc-200"></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${step === 'billing' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'}`}>2</div>
                </div>
                <button className="flex items-center gap-2 text-[14px] font-bold text-black uppercase tracking-wider hover:opacity-60 transition-opacity" onClick={() => router.back()}>
                    <ArrowLeft size={16} /> Back
                </button>
            </header>

            <main className="max-w-[1200px] mx-auto px-4 py-8 md:py-12">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* LEFT COLUMN */}
                    <div className="flex-1 w-full space-y-6">
                        
                        {/* 1. ORDER SUMMARY */}
                        <div className="bg-white rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <h2 style={{ color: 'black', fontSize: '25px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 100, lineHeight: '60px' }} className="uppercase tracking-tight">Booking Summary</h2>
                                    <div className="flex-grow h-[0.5px] bg-[#AEAEAE]" />
                                </div>

                                {cart ? (
                                    <div className="space-y-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-zinc-50 rounded-[18px] border border-zinc-100">
                                            <div className="space-y-1">
                                                <h3 className="text-[20px] font-black text-black uppercase">{cart.eventName}</h3>
                                                <p className="text-[15px] text-[#686868] font-bold uppercase tracking-wider">{cart.city} &nbsp;•&nbsp; {fmtDate(cart.date)}</p>
                                                <div className="flex items-center gap-2 text-[#5331EA] font-black text-[14px] uppercase mt-1">
                                                    <CheckCircle2 size={14} /> {cart.display_slot ?? cart.slot}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[22px] font-black text-black">₹{cart.totalPrice.toLocaleString('en-IN')}</p>
                                                <button onClick={() => { sessionStorage.removeItem('ticpin_cart'); router.back(); }} className="text-[12px] font-bold text-red-500 uppercase tracking-widest hover:underline mt-1">Change</button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em]">Tickets Selected</p>
                                            {cart.tickets.map((t, i) => (
                                                <div key={i} className="flex justify-between items-center py-1">
                                                    <span className="text-[16px] font-bold text-black uppercase">{t.name}</span>
                                                    <span className="text-[16px] font-medium text-black">₹{t.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-zinc-400 font-medium">Your cart is empty.</p>
                                        <Link href="/" className="text-[#5331EA] font-bold uppercase text-[13px] mt-4 block hover:underline">Explore venues</Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. OFFERS & COUPONS */}
                        <div className="bg-white rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 style={{ color: 'black', fontSize: '25px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 100, lineHeight: '60px' }} className="uppercase tracking-tight">Offers & Benefits</h2>
                                    <div className="flex-grow h-[0.5px] bg-[#AEAEAE]" />
                                </div>

                                <div className="space-y-4">
                                    {/* Offer Selection */}
                                    <div className="rounded-[18px] border border-zinc-200 overflow-hidden">
                                        <button 
                                            onClick={() => setExpandedSection(s => s === 'offers' ? 'none' : 'offers')}
                                            className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-black">
                                                    <Tag size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[15px] font-black text-black uppercase">Play Offers</p>
                                                    <p className="text-[13px] text-[#686868] font-medium uppercase">{appliedOffer ? `Applied: ${appliedOffer.title}` : 'Select available offer'}</p>
                                                </div>
                                            </div>
                                            <ChevronDown size={20} className={`text-zinc-400 transition-transform ${expandedSection === 'offers' ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {expandedSection === 'offers' && (
                                            <div className="p-5 bg-zinc-50/50 border-t border-zinc-100 space-y-3">
                                                {offers.length > 0 ? offers.map(o => (
                                                    <div key={o.id} className="flex justify-between items-center p-4 bg-white rounded-[14px] border border-zinc-200">
                                                        <div>
                                                            <p className="text-[14px] font-black text-black uppercase">{o.title}</p>
                                                            <p className="text-[12px] text-[#686868] font-medium lowercase first-letter:uppercase">{o.description}</p>
                                                        </div>
                                                        <button onClick={() => applyOffer(o)} className="px-4 py-2 bg-black text-white text-[11px] font-black rounded-[10px] uppercase transition-all active:scale-95">Apply</button>
                                                    </div>
                                                )) : <p className="text-center text-[13px] text-zinc-400 py-4 uppercase font-bold tracking-widest">No offers available</p>}
                                                {appliedOffer && (
                                                    <button onClick={() => { setAppliedOffer(null); setOfferDiscount(0); }} className="w-full py-2 text-[11px] font-black text-red-500 uppercase tracking-widest">Remove Applied Offer</button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Coupon Selection */}
                                    <div className="rounded-[18px] border border-zinc-200 overflow-hidden">
                                        <button 
                                            onClick={() => setExpandedSection(s => s === 'coupons' ? 'none' : 'coupons')}
                                            className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-black">
                                                    <Tag size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[15px] font-black text-black uppercase">Coupons</p>
                                                    <p className="text-[13px] text-[#686868] font-medium uppercase">{appliedCoupon ? `Applied: ${appliedCoupon}` : 'Apply coupon code'}</p>
                                                </div>
                                            </div>
                                            <ChevronDown size={20} className={`text-zinc-400 transition-transform ${expandedSection === 'coupons' ? 'rotate-180' : ''}`} />
                                        </button>

                                        {expandedSection === 'coupons' && (
                                            <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 space-y-5">
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="COUPON CODE" 
                                                        value={couponInput}
                                                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                                                        onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                                                        className="flex-1 h-[50px] border border-zinc-200 rounded-[12px] px-5 focus:outline-none focus:border-black text-[14px] font-black tracking-widest bg-white"
                                                    />
                                                    <button 
                                                        onClick={() => validateCoupon()}
                                                        disabled={couponLoading || !couponInput}
                                                        className="px-6 h-[50px] bg-[#AC9BF7] text-white rounded-[12px] text-[13px] font-black uppercase tracking-widest disabled:opacity-40"
                                                    >
                                                        {couponLoading ? '...' : 'Apply'}
                                                    </button>
                                                </div>
                                                {couponError && <p className="text-red-500 text-[12px] font-bold uppercase tracking-tight ml-1">{couponError}</p>}
                                                {couponSuccess && <p className="text-green-600 text-[12px] font-black uppercase tracking-tight ml-1">{couponSuccess}</p>}

                                                {availableCoupons.length > 0 && (
                                                    <div className="space-y-3 pt-2">
                                                        <p className="text-[11px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">Coupons for you</p>
                                                        {availableCoupons.map(c => (
                                                            <div key={c.id} className="flex justify-between items-center p-4 bg-white rounded-[14px] border border-zinc-200 border-dashed">
                                                                <div>
                                                                    <p className="text-[14px] font-black text-black tracking-widest">{c.code}</p>
                                                                    <p className="text-[12px] text-[#686868] font-bold uppercase">{c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`} OFF</p>
                                                                </div>
                                                                <button onClick={() => { setCouponInput(c.code); validateCoupon(c.code); }} className="px-4 py-2 bg-black text-white text-[11px] font-black rounded-[10px] uppercase transition-all">Apply</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {appliedCoupon && (
                                                    <button onClick={() => { setAppliedCoupon(''); setCouponDiscount(0); setCouponInput(''); setCouponSuccess(''); }} className="w-full py-2 text-[11px] font-black text-red-500 uppercase tracking-widest">Remove Applied Coupon</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - PAYMENT DETAILS */}
                    <div className="w-full lg:w-[420px] lg:sticky lg:top-[100px]">
                        <div className="bg-white rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 style={{ color: 'black', fontSize: '25px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 100, lineHeight: '60px' }} className="uppercase tracking-tight">Payment Detail</h2>
                                    <div className="flex-grow h-[0.5px] bg-[#AEAEAE]" />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center" style={{ fontSize: '20px', fontWeight: 500, fontFamily: 'var(--font-anek-latin)' }}>
                                        <span className="text-black uppercase">Subtotal</span>
                                        <span className="text-black">₹{orderAmount.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="space-y-2">
                                        <div 
                                            className="flex justify-between items-center cursor-pointer group"
                                            onClick={() => setShowGstDetails(!showGstDetails)}
                                            style={{ color: '#686868', fontSize: '20px', fontWeight: 500, fontFamily: 'var(--font-anek-latin)' }}
                                        >
                                            <div className="flex items-center gap-1 group-hover:text-black transition-colors">
                                                <span className="uppercase">Booking fee</span>
                                                <ChevronRight size={18} className={`transition-transform ${showGstDetails ? 'rotate-90' : ''}`} />
                                            </div>
                                            <span>₹{bookingFee.toLocaleString('en-IN')}</span>
                                        </div>
                                        {showGstDetails && (
                                            <div className="pl-4 space-y-2 text-[15px] font-bold text-[#686868] uppercase animate-in slide-in-from-top-2">
                                                <div className="flex justify-between">
                                                    <span>Base platform fee</span>
                                                    <span>₹{Math.round(bookingFee / 1.18)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Integrated GST (18%)</span>
                                                    <span>₹{(bookingFee - Math.round(bookingFee / 1.18))}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {totalDiscount > 0 && (
                                        <div className="flex justify-between items-center" style={{ color: '#16a34a', fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-anek-latin)' }}>
                                            <span className="uppercase">Total Discount</span>
                                            <span>-₹{totalDiscount.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}

                                    <div className="h-[0.5px] bg-[#AEAEAE] my-2" />

                                    <div className="flex justify-between items-center mt-4">
                                        <span style={{ fontSize: '22px', fontWeight: 600, fontFamily: 'var(--font-anek-latin)' }} className="text-black uppercase">Grand Total</span>
                                        <span style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-anek-latin)' }} className={grandTotal === 0 ? "text-[#5331EA]" : "text-black"}>
                                            {grandTotal === 0 ? 'FREE' : `₹${grandTotal.toLocaleString('en-IN')}`}
                                        </span>
                                    </div>

                                    {/* ACTION SECTION */}
                                    <div className="pt-6 space-y-4">
                                        {step === 'review' ? (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">Confirmation Mobile</label>
                                                    <div className="relative">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-black text-black">+91</div>
                                                        <input 
                                                            type="tel" 
                                                            placeholder="MOBILE NUMBER"
                                                            value={billing.phone}
                                                            onChange={e => { setBilling(b => ({ ...b, phone: e.target.value.replace(/\D/g, '') })); setBookingError(''); }}
                                                            maxLength={10}
                                                            className="w-full h-[55px] border border-zinc-200 rounded-[14px] pl-14 pr-5 focus:outline-none focus:border-black text-[16px] font-black tracking-widest text-black"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                {bookingError && (
                                                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-[12px] text-red-500">
                                                        <TriangleAlert size={16} />
                                                        <span className="text-[12px] font-bold uppercase">{bookingError}</span>
                                                    </div>
                                                )}

                                                <button 
                                                    onClick={handleContinue}
                                                    className="w-full h-[55px] bg-black text-white rounded-[16px] font-bold text-[24px] uppercase tracking-wider shadow-lg hover:shadow-black/10 active:scale-[0.98] transition-all"
                                                    style={{ fontFamily: 'Anek Tamil Condensed' }}
                                                >
                                                    Continue
                                                </button>
                                            </div>
                                        ) : (
                                            /* Mini Confirmation in Billing Step */
                                            <div className="p-4 bg-[#F8FEF9] border border-[#DEF7E0] rounded-[18px] flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[#0AC655]">
                                                    <CheckCircle2 size={16} />
                                                    <span className="text-[13px] font-black uppercase tracking-wider">Order Verified</span>
                                                </div>
                                                <button onClick={() => setStep('review')} className="text-[11px] font-black text-zinc-400 uppercase tracking-widest hover:text-black">Edit</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BILLING FORM - STEP 2 */}
                {step === 'billing' && (
                    <div ref={billingRef} className="mt-12 w-full max-w-[800px] animate-in slide-in-from-bottom-6 duration-500">
                         <div className="bg-white rounded-[32px] border border-white shadow-[0_12px_40px_rgb(0,0,0,0.06)] overflow-hidden">
                            <div className="p-8 md:p-12">
                                <div className="flex justify-between items-center mb-10">
                                    <div className="space-y-1">
                                        <h2 style={{ color: 'black', fontSize: '32px', fontFamily: 'var(--font-anek-latin)', fontWeight: 800 }} className="uppercase tracking-tight">Billing Detail</h2>
                                        <p className="text-[15px] text-[#686868] font-bold uppercase tracking-widest opacity-60">{cart?.eventName} &nbsp;·&nbsp; ₹{grandTotal.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: billingComplete ? '#0AC655' : 'transparent', border: billingComplete ? 'none' : '4px solid #5331EA', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} className="flex items-center justify-center">
                                        {billingComplete ? (
                                            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        ) : (
                                            <div className="w-4 h-4 bg-[#5331EA] rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">Full Name <span className="text-red-500">*</span></label>
                                        <input type="text" value={billing.name} onChange={e => {setBilling({...billing, name: e.target.value}); setBookingError('');}} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black tracking-wide bg-zinc-50/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">Personal Email <span className="text-red-500">*</span></label>
                                        <input type="email" value={email} onChange={e => {setEmail(e.target.value); setBookingError('');}} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black tracking-wide bg-zinc-50/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">Contact Phone</label>
                                        <div className="w-full h-[60px] border border-zinc-100 rounded-[16px] px-6 flex items-center bg-[#F9F9F9] text-black font-black text-[17px] tracking-widest">+91 {billing.phone}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">Nationality <span className="text-red-500">*</span></label>
                                        <select value={billing.nationality} onChange={e => {setBilling({...billing, nationality: e.target.value}); setBookingError('');}} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black bg-zinc-50/30 appearance-none">
                                            <option value="Indian">Indian</option>
                                            <option value="International">International</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2 mt-8">
                                    <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">Residential Address <span className="text-red-500">*</span></label>
                                    <input type="text" placeholder="STREET, AREA, HOUSE NO." value={billing.address} onChange={e => {setBilling({...billing, address: e.target.value}); setBookingError('');}} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black tracking-wide bg-zinc-50/30 uppercase placeholder:text-zinc-200" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">City <span className="text-red-500">*</span></label>
                                        <input type="text" value={billing.city} onChange={e => {setBilling({...billing, city: e.target.value}); setBookingError('');}} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black bg-zinc-50/30 uppercase" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">State <span className="text-red-500">*</span></label>
                                        <input type="text" value={billing.state} onChange={e => {setBilling({...billing, state: e.target.value}); setBookingError('');}} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black bg-zinc-50/30 uppercase" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">PIN Code <span className="text-red-500">*</span></label>
                                        <input type="tel" maxLength={6} value={billing.pincode} onChange={e => {setBilling({...billing, pincode: e.target.value.replace(/\D/g,'')}); setBookingError('');}} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black tracking-widest bg-zinc-50/30" />
                                    </div>
                                </div>

                                <div className="mt-12 p-6 bg-zinc-50 rounded-[20px] border border-zinc-100 flex items-start gap-4">
                                     <div 
                                        onClick={() => setAcceptedTerms(!acceptedTerms)}
                                        className={`mt-1 flex-shrink-0 w-6 h-6 rounded-[6px] border-2 flex items-center justify-center cursor-pointer transition-all ${acceptedTerms ? 'bg-black border-black shadow-[0_4px_10px_rgba(0,0,0,0.1)]' : 'border-zinc-300'}`}
                                    >
                                        {acceptedTerms && <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                    </div>
                                    <div className="text-[14px] font-bold text-[#686868] uppercase tracking-wide leading-relaxed">
                                        I have read and accepted the <Link href="/terms" target="_blank" className="text-[#5331EA] hover:underline underline-offset-4">Terms & Conditions</Link> & <Link href="/refund" target="_blank" className="text-[#5331EA] hover:underline underline-offset-4">Refund Policy</Link>
                                    </div>
                                </div>

                                {bookingError && (
                                    <div className="mt-6 flex items-center gap-2 p-4 bg-red-50 rounded-[14px] text-red-500">
                                        <TriangleAlert size={18} />
                                        <span className="text-[13px] font-black uppercase tracking-wider">{bookingError}</span>
                                    </div>
                                )}

                                <button 
                                    onClick={handlePayNow}
                                    disabled={bookingLoading}
                                    className="w-full h-[70px] bg-black text-white rounded-[20px] mt-8 font-black text-[28px] uppercase tracking-widest shadow-[0_15px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 disabled:pointer-events-none"
                                    style={{ fontFamily: 'Anek Tamil Condensed' }}
                                >
                                    {bookingLoading ? 'Processing...' : (grandTotal === 0 ? 'Confirm Booking' : `Pay ₹${grandTotal.toLocaleString('en-IN')}`)}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            <OrganizerLogoutModal 
                isOpen={showLogoutModal} 
                onClose={() => setShowLogoutModal(false)} 
                onConfirm={handleOrganizerLogout}
                organizerName={organizerSession?.email}
            />

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Anek+Tamil+Condensed:wght@100;200;300;400;500;600;700;800&display=swap');
                .font-anek-condensed {
                    font-family: 'Anek Tamil Condensed', sans-serif;
                }
            `}</style>
        </div>
    );
}
