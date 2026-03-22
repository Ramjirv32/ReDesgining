'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, Tag, Trash2, ChevronDown, ArrowLeft, TriangleAlert, User, Percent } from 'lucide-react';
import { bookingApi, OfferItem, PaymentOrderResponse } from '@/lib/api/booking';
import { profileApi } from '@/lib/api/profile';
import { useUserSession } from '@/lib/auth/user';
import { useOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import AuthModal from '@/components/modals/AuthModal';
import OrganizerLogoutModal from '@/components/modals/OrganizerLogoutModal';
import Link from 'next/link';
import { CITIES } from '@/app/events/create/data';

const STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", 
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", 
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", 
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
    "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
    "Ladakh", "Lakshadweep", "Puducherry"
];

interface CartData {
    eventId: string;
    eventName: string;
    city: string;
    type: 'play';
    date: string;
    slot: string;
    display_slot?: string;
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

    const [email, setEmail] = useState('');
    useEffect(() => {
        if (session?.email) {
            setEmail(session.email);
        } else if (organizerSession?.email) {
            setEmail(organizerSession.email);
        }
    }, [session, organizerSession]);

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

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingId, setBookingId] = useState('');

    const billingRef = useRef<HTMLDivElement>(null);

    // Load cart & Cashfree logic
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

    useEffect(() => {
        const loadUserData = async () => {
            if (session?.id) {
                try {
                    const [profile, history] = await Promise.all([
                        profileApi.getProfile(session.id).catch(() => null),
                        bookingApi.getUserBookings({ userId: session.id }).catch(() => [])
                    ]);

                    const latestBooking = (Array.isArray(history) ? [...history] : [])
                        ?.filter((b: any) => b.status === 'booked' || b.status === 'confirmed')
                        ?.sort((a: any, b: any) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime())[0];

                    setBilling(prev => ({
                        ...prev,
                        name: prev.name || latestBooking?.user_name || profile?.name || session?.name || '',
                        phone: prev.phone || latestBooking?.user_phone || profile?.phone || session?.phone || '',
                        address: prev.address || latestBooking?.address || profile?.address || '',
                        city: prev.city || latestBooking?.city || profile?.district || '',
                        state: prev.state || latestBooking?.state || profile?.state || '',
                        pincode: prev.pincode || latestBooking?.pincode || '',
                        nationality: prev.nationality !== 'Indian' ? prev.nationality : (latestBooking?.nationality || 'Indian'),
                    }));

                    if (!email) {
                        setEmail(latestBooking?.user_email || profile?.email || session?.email || '');
                    }
                } catch (err) {
                    console.error('Failed to load user data', err);
                }
            }
        };
        loadUserData();
    }, [session]);

    useEffect(() => { if (email) sessionStorage.setItem('ticpin_billing_email', email); }, [email]);
    useEffect(() => {
        if (billing.name || billing.phone) sessionStorage.setItem('ticpin_billing_data', JSON.stringify(billing));
    }, [billing]);
    useEffect(() => { sessionStorage.setItem('ticpin_play_step', step); }, [step]);

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
            billing.pincode.trim().length >= 6
        );
    }, [billing]);

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
                user_phone: billing.phone,
                address: billing.address,
                city: billing.city,
                state: billing.state,
                pincode: billing.pincode,
                nationality: billing.nationality,
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
        if (!acceptedTerms) {
            setBookingError('Please accept the terms and conditions to proceed.');
            return;
        }
        
        if (!session && !organizerSession) {
            setShowAuthModal(true);
            return;
        }

        setStep('billing');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePayNow = async () => {
        if (!billing.name.trim()) { setBookingError('Please enter your full name'); return; }
        if (!email.trim() || !email.includes('@')) { setBookingError('Please enter a valid email'); return; }
        if (!billing.phone || billing.phone.length < 10) { setBookingError('Please enter a valid phone number'); return; }
        if (!billing.address.trim()) { setBookingError('Please enter your address'); return; }
        if (!billing.city.trim()) { setBookingError('Please enter your city'); return; }
        if (!billing.pincode.trim() || billing.pincode.length < 6) { setBookingError('Please enter a valid PIN code'); return; }
        if (!cart) return;

        if (grandTotal === 0) {
            await completeBooking(
                'FREE_BOOKING_' + Date.now(),
                'FREE',
                cart,
                email,
                session?.id || organizerSession?.id,
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
                sessionId: session?.id || organizerSession?.id,
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
                            cart, email, session?.id || organizerSession?.id,
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

    // Components for the redesigned structure
    const SectionHeader = ({ title }: { title: string }) => (
        <div className="flex items-center gap-4 mt-8 mb-4">
            <span className="text-[13px] font-semibold text-zinc-800 tracking-wider uppercase">{title}</span>
            <div className="h-[1px] bg-zinc-200 flex-1"></div>
        </div>
    );

    if (step === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] font-sans">
                <div className="w-full max-w-[500px] bg-white rounded-2xl p-10 mx-6 text-center shadow-sm border border-zinc-200">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={44} className="text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-black mb-2">Booking Confirmed!</h1>
                    <p className="text-sm font-medium text-zinc-500 mb-1">Booking ID</p>
                    <p className="text-lg font-bold text-black mb-6 bg-zinc-50 rounded-lg py-3 px-4 font-mono uppercase border border-zinc-200">
                        #{bookingId.slice(-10).toUpperCase()}
                    </p>
                    <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                        Confirmation has been sent to your email <br/><span className="font-semibold text-black">{email}</span>
                    </p>
                    {cart && (
                        <div className="bg-zinc-50 rounded-xl p-6 text-left space-y-2 mb-8 border border-zinc-200">
                            <p className="font-bold text-black text-lg">{cart.eventName}</p>
                            <p className="text-sm text-zinc-600">{fmtDate(cart.date)} &nbsp;•&nbsp; {cart.display_slot ?? cart.slot}</p>
                            <div className="pt-2">
                                {cart.tickets.map((t, i) => (
                                    <p key={i} className="text-sm text-zinc-600 font-medium">{t.name}</p>
                                ))}
                            </div>
                        </div>
                    )}
                    <p className="text-2xl font-bold text-black mb-8">
                        {(lockedGrandTotal ?? grandTotal) === 0 ? 'FREE' : `₹${(lockedGrandTotal ?? grandTotal).toLocaleString('en-IN')}`} PAID
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full h-14 bg-black text-white rounded-lg font-semibold text-base transition-colors hover:bg-zinc-800"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans pb-16">
            {/* Header matches the screenshot */}
            <header className="sticky top-0 z-50 w-full h-[70px] bg-white border-b border-zinc-200 flex items-center justify-between px-6 lg:px-12">
                <div className="cursor-pointer" onClick={() => (step === 'review' ? router.push('/') : setStep('review'))}>
                    <Image src="/ticpin-logo-black.png" alt="TICPIN" width={110} height={24} className="h-6 w-auto object-contain" />
                </div>
                
                <h1 className="hidden md:block absolute left-1/2 -translate-x-1/2 font-bold text-[17px]">
                    {step === 'billing' ? 'Billing Details' : 'Review your booking'}
                </h1>

                <div className="flex items-center gap-4">
                    <button className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-colors">
                        <User size={18} />
                    </button>
                </div>
            </header>

            <main className="max-w-[760px] mx-auto px-4 pt-8">
                {step === 'review' && (
                    <div className="bg-white rounded-[16px] border border-zinc-200 shadow-sm overflow-hidden p-6 md:p-8">
                        <h2 className="text-[20px] font-bold text-black mb-2">Order Summary</h2>

                        {/* SLOTS */}
                        <SectionHeader title="SLOTS" />
                        {cart ? (
                            <div className="border border-zinc-200 rounded-[12px] p-5 mb-4 relative flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-[16px] text-black">
                                        {cart.eventName} <span className="font-normal text-zinc-400 ml-1">| {cart.city}</span>
                                    </h3>
                                    <p className="text-[14px] text-zinc-500 mt-1">{fmtDate(cart.date)} &nbsp;•&nbsp; {cart.display_slot ?? cart.slot}</p>
                                    <div className="pt-1">
                                        {cart.tickets.map((t, i) => (
                                            <p key={i} className="text-[14px] text-zinc-600">{t.name}</p>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <button 
                                        onClick={() => { sessionStorage.removeItem('ticpin_cart'); router.back(); }} 
                                        className="text-zinc-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <p className="font-bold text-[16px] text-black">₹{cart.totalPrice}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 border border-zinc-200 rounded-[12px]">
                                <p className="text-zinc-500 text-sm">Your cart is empty.</p>
                                <button onClick={() => router.push('/')} className="text-black font-semibold mt-2 text-sm underline underline-offset-4">Explore venues</button>
                            </div>
                        )}

                        {/* OFFERS */}
                        <SectionHeader title="OFFERS" />
                        <div className="border border-zinc-200 rounded-[12px] overflow-hidden mb-4">
                            {/* Play Offers Toggle */}
                            <button 
                                onClick={() => setExpandedSection(s => s === 'offers' ? 'none' : 'offers')}
                                className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-600">
                                        <Percent size={12} strokeWidth={3} />
                                    </div>
                                    <span className="text-[15px] font-medium text-black">View all play offers</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {appliedOffer && <span className="text-[12px] text-green-600 font-semibold uppercase">{appliedOffer.title}</span>}
                                    <ChevronRight size={18} className={`text-zinc-400 transition-transform ${expandedSection === 'offers' ? 'rotate-90' : ''}`} />
                                </div>
                            </button>
                            
                            {expandedSection === 'offers' && (
                                <div className="p-4 bg-zinc-50 border-t border-zinc-100 space-y-3">
                                    {offers.length > 0 ? offers.map(o => (
                                        <div key={o.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-zinc-200 shadow-sm">
                                            <div>
                                                <p className="text-[14px] font-semibold text-black">{o.title}</p>
                                                <p className="text-[13px] text-zinc-500">{o.description}</p>
                                            </div>
                                            <button onClick={() => applyOffer(o)} className="px-4 py-1.5 bg-black text-white text-[12px] font-semibold rounded-md">Apply</button>
                                        </div>
                                    )) : <p className="text-[13px] text-zinc-500 text-center py-2">No offers available</p>}
                                    {appliedOffer && (
                                        <button onClick={() => { setAppliedOffer(null); setOfferDiscount(0); }} className="text-[12px] text-red-500 font-semibold pt-2 w-full text-right">Remove offer</button>
                                    )}
                                </div>
                            )}

                            <div className="h-[1px] bg-zinc-200"></div>

                            {/* Coupon Codes Toggle */}
                            <button 
                                onClick={() => setExpandedSection(s => s === 'coupons' ? 'none' : 'coupons')}
                                className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Tag size={18} className="text-zinc-600 ml-1" />
                                    <span className="text-[15px] font-medium text-black ml-1">View all coupon codes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {appliedCoupon && <span className="text-[12px] text-green-600 font-semibold uppercase">{appliedCoupon}</span>}
                                    <ChevronRight size={18} className={`text-zinc-400 transition-transform ${expandedSection === 'coupons' ? 'rotate-90' : ''}`} />
                                </div>
                            </button>

                            {expandedSection === 'coupons' && (
                                <div className="p-4 bg-zinc-50 border-t border-zinc-100 space-y-4">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Enter coupon code" 
                                            value={couponInput}
                                            onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                                            onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                                            className="flex-1 h-11 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[14px] bg-white"
                                        />
                                        <button 
                                            onClick={() => validateCoupon()}
                                            disabled={couponLoading || !couponInput}
                                            className="px-6 h-11 bg-black text-white rounded-lg text-[13px] font-semibold disabled:opacity-40"
                                        >
                                            {couponLoading ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                    {couponError && <p className="text-red-500 text-[13px]">{couponError}</p>}
                                    {couponSuccess && <p className="text-green-600 text-[13px] font-medium">{couponSuccess}</p>}

                                    {availableCoupons.length > 0 && (
                                        <div className="space-y-2 pt-2">
                                            {availableCoupons.map(c => (
                                                <div key={c.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-zinc-200 border-dashed">
                                                    <div>
                                                        <p className="text-[14px] font-semibold text-black">{c.code}</p>
                                                        <p className="text-[12px] text-zinc-500">{c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`} OFF</p>
                                                    </div>
                                                    <button onClick={() => { setCouponInput(c.code); validateCoupon(c.code); }} className="px-4 py-1.5 bg-zinc-100 text-black text-[12px] font-semibold rounded-md hover:bg-zinc-200">Apply</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {appliedCoupon && (
                                        <button onClick={() => { setAppliedCoupon(''); setCouponDiscount(0); setCouponInput(''); setCouponSuccess(''); }} className="text-[12px] text-red-500 font-semibold w-full text-right">Remove coupon</button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* PAYMENT DETAILS */}
                        <SectionHeader title="PAYMENT DETAILS" />
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center text-[15px] font-medium text-black">
                                <span>Order amount</span>
                                <span>₹{orderAmount}</span>
                            </div>

                            <div className="space-y-2">
                                <div 
                                    className="flex justify-between items-center cursor-pointer text-[15px] text-zinc-600 hover:text-black transition-colors"
                                    onClick={() => setShowGstDetails(!showGstDetails)}
                                >
                                    <div className="flex items-center gap-1">
                                        <span>Booking fee (inc. of GST)</span>
                                        <ChevronDown size={14} className={`transition-transform ${showGstDetails ? 'rotate-180' : ''}`} />
                                    </div>
                                    <span>₹{bookingFee}</span>
                                </div>
                                {showGstDetails && (
                                    <div className="pl-2 space-y-2 text-[13px] text-zinc-500">
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
                                <div className="flex justify-between items-center text-[15px] text-green-600 font-semibold">
                                    <span>Total Discount</span>
                                    <span>-₹{totalDiscount}</span>
                                </div>
                            )}

                            <div className="h-[1px] bg-zinc-200 my-4" />

                            <div className="flex justify-between items-center">
                                <span className="text-[16px] font-bold text-black">Grand total</span>
                                <span className="text-[20px] font-bold text-black">₹{grandTotal}</span>
                            </div>
                        </div>

                        {bookingError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg mb-6 text-sm">
                                <TriangleAlert size={16} />
                                <span>{bookingError}</span>
                            </div>
                        )}

                        <div className="h-[1px] bg-zinc-200 my-6" />

                        {/* BOTTOM ACTION */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-colors ${acceptedTerms ? 'bg-black border-black' : 'border-zinc-300 group-hover:border-zinc-400'}`}>
                                    {acceptedTerms && <CheckCircle2 size={14} className="text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={acceptedTerms} onChange={() => { setAcceptedTerms(!acceptedTerms); setBookingError(''); }} />
                                <span className="text-[14px] text-zinc-600 font-medium">
                                    I have read and accepted the <span className="text-[#D4AF37]">terms and conditions</span>
                                </span>
                            </label>

                            <button 
                                onClick={handleContinue}
                                className="bg-black text-white px-8 py-3.5 rounded-lg text-[14px] font-bold tracking-wide hover:bg-zinc-800 transition-colors w-full sm:w-auto text-center"
                            >
                                CONTINUE
                            </button>
                        </div>
                    </div>
                )}

                {/* BILLING STEP - Kept functionally the same but styled cleaner to match */}
                {step === 'billing' && (
                    <div ref={billingRef} className="bg-white rounded-[16px] border border-zinc-200 shadow-sm overflow-hidden p-6 md:p-10">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-[22px] font-bold text-black">Billing Details</h2>
                                <p className="text-[14px] text-zinc-500 mt-1">Complete your information to finish booking.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">Full Name <span className="text-red-500">*</span></label>
                                <input type="text" value={billing.name} onChange={e => {setBilling({...billing, name: e.target.value}); setBookingError('');}} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px]" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">Email Address <span className="text-red-500">*</span></label>
                                <input type="email" value={email} onChange={e => {setEmail(e.target.value); setBookingError('');}} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px]" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">Mobile Number <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-[15px]">+91</span>
                                    <input type="tel" maxLength={10} value={billing.phone} onChange={e => {setBilling({...billing, phone: e.target.value.replace(/\D/g, '')}); setBookingError('');}} className="w-full h-12 border border-zinc-200 rounded-lg pl-12 pr-4 focus:outline-none focus:border-black text-[15px]" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">Nationality <span className="text-red-500">*</span></label>
                                <select value={billing.nationality} onChange={e => {setBilling({...billing, nationality: e.target.value}); setBookingError('');}} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px] appearance-none bg-white">
                                    <option value="Indian">Indian</option>
                                    <option value="International">International</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5 mt-6">
                            <label className="text-[13px] font-semibold text-zinc-600">Address <span className="text-red-500">*</span></label>
                            <input type="text" value={billing.address} onChange={e => {setBilling({...billing, address: e.target.value}); setBookingError('');}} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px]" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">City <span className="text-red-500">*</span></label>
                                <select value={billing.city} onChange={e => {setBilling({...billing, city: e.target.value}); setBookingError('');}} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px] appearance-none bg-white">
                                    <option value="">Select City</option>
                                    {CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">State <span className="text-red-500">*</span></label>
                                <select value={billing.state} onChange={e => {setBilling({...billing, state: e.target.value}); setBookingError('');}} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px] appearance-none bg-white">
                                    <option value="">Select State</option>
                                    {STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">PIN Code <span className="text-red-500">*</span></label>
                                <input type="tel" maxLength={6} value={billing.pincode} onChange={e => {setBilling({...billing, pincode: e.target.value.replace(/\D/g,'')}); setBookingError('');}} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px]" />
                            </div>
                        </div>

                        {bookingError && (
                            <div className="mt-8 flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                <TriangleAlert size={16} />
                                <span>{bookingError}</span>
                            </div>
                        )}

                        <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-zinc-200 pt-8">
                            <button onClick={() => setStep('review')} className="text-zinc-500 font-semibold text-[14px] hover:text-black">
                                &larr; Back to review
                            </button>
                            <button 
                                onClick={handlePayNow}
                                disabled={bookingLoading}
                                className="w-full sm:w-auto bg-black text-white px-10 py-3.5 rounded-lg text-[15px] font-bold tracking-wide hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                {bookingLoading ? 'Processing...' : `Pay ₹${grandTotal}`}
                            </button>
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
        </div>
    );
}