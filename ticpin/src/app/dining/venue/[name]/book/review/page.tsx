'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronRight, Trash2, X, Tag, CheckCircle2, ChevronDown, ArrowLeft, TriangleAlert } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { bookingApi, OfferItem, PaymentOrderResponse } from '@/lib/api/booking';
import { profileApi } from '@/lib/api/profile';
import Link from 'next/link';
import { useUserSession } from '@/lib/auth/user';
import { useOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import { getBookingStatus } from '@/lib/utils/booking-status';
import AuthModal from '@/components/modals/AuthModal';
import OrganizerLogoutModal from '@/components/modals/OrganizerLogoutModal';

interface CartData {
    eventId: string;
    eventName: string;
    city: string;
    type: 'dining';
    date: string;
    timeSlot: string;
    guests: number;
    totalPrice: number;
    offerId?: string | null;
    offerType?: string | null;
    use_pass?: boolean;
    pass_id?: string;
}

interface BillingInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
    nationality: string;
    city: string;
    state: string;
    pincode: string;
}

/** Dynamically load a third-party payment SDK script (idempotent). */
function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') return resolve();
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(s);
    });
}

/** Format ISO date string (YYYY-MM-DD) to nice display */
function fmtDate(iso: string) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DiningReviewPage() {
    const router = useRouter();
    const params = useParams();
    const venueName = params?.name as string;
    const session = useUserSession();
    const organizerSession = useOrganizerSession();

    const [cart, setCart] = useState<CartData | null>(null);
    const [venueData, setVenueData] = useState<{ id: string; name: string; portrait_image_url: string; landscape_image_url: string; city?: string } | null>(null);
    const [billing, setBilling] = useState<BillingInfo>({
        name: '', email: '', phone: '', address: '', nationality: 'Indian', city: '', state: '', pincode: ''
    });
    const [step, setStep] = useState<'review' | 'billing' | 'success'>('review');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
    const [showGstDetails, setShowGstDetails] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [pass, setPass] = useState<any>(null);

    // Modals
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const billingRef = useRef<HTMLDivElement>(null);

    // Load cart and billing data from sessionStorage
    useEffect(() => {
        const savedCart = sessionStorage.getItem('dining_cart');
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                setCart(parsed);
                // Load venue data
                fetch(`/backend/api/dining/${venueName}`).then(r => r.json()).then(data => {
                    setVenueData({ id: data._id, name: data.name, portrait_image_url: data.portrait_image_url, landscape_image_url: data.landscape_image_url });
                    setCart(prev => prev ? { ...prev, city: data.city || '' } : null);
                }).catch(console.error);
            } catch (e) {
                router.push(`/dining/venue/${venueName}/book`);
            }
        } else {
            router.push(`/dining/venue/${venueName}/book`);
        }

        const savedBilling = sessionStorage.getItem('ticpin_billing_data');
        if (savedBilling) {
            try { setBilling(JSON.parse(savedBilling)); } catch { /* ignore */ }
        }

        const savedStep = sessionStorage.getItem('ticpin_dining_step');
        if (savedStep === 'billing') setStep('billing');

        if (session?.id) {
            import('@/lib/api/pass').then(({ passApi }) => {
                passApi.getActivePass(session.id).then(setPass);
            });
        }
    }, [venueName, router, session?.id]);

    // Load user profile and history for billing info
    useEffect(() => {
        const loadUserData = async () => {
            if (session?.id) {
                try {
                    const [profile, history] = await Promise.all([
                        profileApi.getProfile(session.id).catch(() => null),
                        bookingApi.getUserBookings({ userId: session.id }).catch(() => [])
                    ]);

                    const latestBooking = (Array.isArray(history) ? [...history] : [])
                        ?.filter((b: any) => getBookingStatus(b) === 'booked' || getBookingStatus(b) === 'confirmed')
                        ?.sort((a: any, b: any) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime())[0];

                    setBilling(prev => ({
                        ...prev,
                        name: prev.name || latestBooking?.user_name || profile?.name || session?.name || '',
                        email: prev.email || latestBooking?.user_email || profile?.email || session?.email || '',
                        phone: prev.phone || latestBooking?.user_phone || profile?.phone || session?.phone || '',
                        address: prev.address || latestBooking?.address || profile?.address || '',
                        city: prev.city || latestBooking?.city || profile?.district || '',
                        state: prev.state || latestBooking?.state || profile?.state || '',
                        pincode: prev.pincode || latestBooking?.pincode || '',
                        nationality: prev.nationality !== 'Indian' ? prev.nationality : (latestBooking?.nationality || 'Indian'),
                    }));
                } catch (err) {
                    console.error('Failed to load user data', err);
                }
            }
        };
        loadUserData();
    }, [session]);

    // Load offers
    useEffect(() => {
        if (venueData) {
            fetch(`/backend/api/dining/${venueName}/offers`).then(r => r.json()).then(offers => {
                const arr = Array.isArray(offers) ? offers : [];
                if (cart?.offerId) {
                    const offer = arr.find((o: OfferItem) => o.id === cart.offerId);
                    setSelectedOffer(offer || null);
                }
            }).catch(console.error);
        }
    }, [venueData, cart]);

    // Persist changes
    useEffect(() => {
        if (billing.name || billing.phone || billing.address) {
            sessionStorage.setItem('ticpin_billing_data', JSON.stringify(billing));
        }
    }, [billing]);

    useEffect(() => {
        sessionStorage.setItem('ticpin_dining_step', step);
    }, [step]);

    const orderAmount = cart?.totalPrice ?? 0;
    const bookingFee = 0; // Dining usually has 0 booking fee for now
    const totalDiscount = useMemo(() => {
        let disc = 0;
        if (selectedOffer && orderAmount) {
            disc += selectedOffer.discount_type === 'percent'
                ? Math.round(orderAmount * selectedOffer.discount_value / 100)
                : Math.min(selectedOffer.discount_value, orderAmount);
        }
        if (cart?.use_pass && pass) {
            disc += pass.benefits.dining_vouchers.value_each || 250;
        }
        return disc;
    }, [selectedOffer, orderAmount, cart?.use_pass, pass]);
    const grandTotal = Math.max(0, orderAmount + bookingFee - totalDiscount);
    const isPassApplied = cart?.use_pass ?? false;

    const billingComplete = useMemo(() => {
        return (
            billing.name.trim() !== '' &&
            billing.phone.trim().length >= 10 &&
            billing.email.trim().includes('@') &&
            billing.address.trim() !== '' &&
            billing.city.trim() !== '' &&
            billing.pincode.trim().length >= 6 &&
            acceptedTerms
        );
    }, [billing, acceptedTerms]);

    const handleContinue = () => {
        if (!billing.phone || billing.phone.length < 10) {
            setBookingError('Please enter a valid 10-digit mobile number');
            return;
        }

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
        if (!billing.email.trim() || !billing.email.includes('@')) { setBookingError('Please enter a valid email'); return; }
        if (!billing.address.trim()) { setBookingError('Please enter your address'); return; }
        if (!acceptedTerms) { setBookingError('Please accept the terms and conditions'); return; }

        setBookingLoading(true);
        setBookingError('');

        if (!cart) return;

        try {
            if (grandTotal === 0) {
                const freeId = isPassApplied ? `PASS_${cart.pass_id}_${Date.now()}` : `FREE_DINING_${Date.now()}`;
                await completeDiningBooking(freeId, isPassApplied ? 'TICPASS' : 'FREE');
                return;
            }

            // Load Razorpay
            await loadScript('https://checkout.razorpay.com/v1/checkout.js');

            const res: PaymentOrderResponse = await bookingApi.createPaymentOrder({
                amount: grandTotal,
                customer_email: billing.email,
                customer_phone: billing.phone,
                type: 'dining',
            });

            const options = {
                key: res.razorpay_key,
                amount: grandTotal * 100,
                currency: 'INR',
                name: cart?.eventName || 'Dining Reservation',
                description: `Dining reservation for ${cart?.guests || 1} guests`,
                order_id: res.order_id,
                method: {
                    upi: true,
                    card: true,
                    netbanking: true,
                    wallet: true
                },
                handler: async (response: any) => {
                    await completeDiningBooking(response.razorpay_payment_id, 'razorpay');
                },
                prefill: {
                    name: billing.name,
                    email: billing.email,
                    contact: billing.phone,
                },
                theme: { color: '#000000' },
                modal: {
                    ondismiss: () => {
                        setBookingLoading(false);
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err) {
            setBookingError('Failed to initiate payment. Please try again.');
            setBookingLoading(false);
        }
    };

    const completeDiningBooking = async (paymentId: string, gateway: string) => {
        try {
            await bookingApi.createDiningBooking({
                user_email: billing.email,
                user_name: billing.name,
                user_phone: billing.phone,
                address: billing.address,
                city: billing.city,
                state: billing.state,
                pincode: billing.pincode,
                nationality: billing.nationality,
                dining_id: cart!.eventId,
                venue_name: cart!.eventName,
                date: cart!.date,
                time_slot: cart!.timeSlot,
                guests: cart!.guests,
                order_amount: orderAmount,
                booking_fee: bookingFee,
                offer_id: cart!.offerId || undefined,
                payment_id: paymentId,
                payment_gateway: gateway,
                user_id: session?.id,
                use_ticpass: isPassApplied
            });
            setStep('success');
            sessionStorage.removeItem('dining_cart');
        } catch (err) {
            setBookingError(err instanceof Error ? err.message : 'Payment confirmation failed. Please contact support.');
            setBookingLoading(false);
        }
    };

    const handleOrganizerLogout = () => {
        clearOrganizerSession();
        setShowAuthModal(true);
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#ECE8FD] via-white to-white font-anek-latin">
                <div className="w-full max-w-[500px] bg-white rounded-[32px] p-10 mx-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={44} className="text-green-500" />
                    </div>
                    <h1 className="text-[32px] font-bold text-black mb-2 uppercase tracking-tight">Booking Confirmed!</h1>
                    <p className="text-[15px] text-[#686868] mb-8 leading-relaxed">
                        Reservation confirmed at <br /><span className="font-bold text-black">{cart?.eventName}</span>
                    </p>
                    <div className="bg-zinc-50 rounded-[20px] p-6 text-left space-y-2 mb-8 border border-zinc-100">
                        <p className="font-black text-black text-[20px] uppercase">{cart?.eventName}</p>
                        <p className="text-[16px] text-[#686868] font-semibold">{fmtDate(cart?.date || '')} &nbsp;•&nbsp; {cart?.timeSlot}</p>
                        <p className="text-[14px] text-[#686868] font-medium">{cart?.guests} Guests</p>
                    </div>
                    <p className="text-[26px] font-black text-black mb-8 uppercase">
                        {grandTotal === 0 ? 'FREE' : `₹${grandTotal.toLocaleString('en-IN')} Paid`}
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full h-[56px] bg-black text-white rounded-[14px] font-bold text-[18px] uppercase tracking-wider hover:bg-zinc-800 transition-all"
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
                                    <h2 style={{ color: 'black', fontSize: '25px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 100, lineHeight: '60px' }} className="uppercase tracking-tight">Dining Summary</h2>
                                    <div className="flex-grow h-[0.5px] bg-[#AEAEAE]" />
                                </div>

                                {cart && venueData ? (
                                    <div className="space-y-6">
                                        <div className="flex flex-col md:flex-row gap-6 p-5 bg-zinc-50 rounded-[18px] border border-zinc-100">
                                            <div className="w-full md:w-[120px] h-[150px] relative rounded-[14px] overflow-hidden">
                                                <Image src={venueData.portrait_image_url} alt={venueData.name} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="text-[20px] font-black text-black uppercase">{venueData.name}</h3>
                                                    <p className="text-[15px] text-[#686868] font-bold uppercase tracking-wider">{venueData.city} &nbsp;•&nbsp; {fmtDate(cart.date)}</p>
                                                    <div className="flex items-center gap-2 text-[#5331EA] font-black text-[14px] uppercase mt-1">
                                                        <CheckCircle2 size={14} /> {cart.timeSlot}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-4">
                                                    <span className="text-[14px] font-bold uppercase text-[#686868] tracking-widest">{cart.guests} Guests</span>
                                                    <p className="text-[22px] font-black text-black">₹{cart.totalPrice.toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-zinc-400 font-medium">Loading your reservation...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. OFFERS */}
                        {selectedOffer && (
                            <div className="bg-white rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                                <div className="p-6 md:p-8">
                                    <div className="flex items-center gap-4 mb-6">
                                        <h2 style={{ color: 'black', fontSize: '25px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 100, lineHeight: '60px' }} className="uppercase tracking-tight">Applied Offer</h2>
                                        <div className="flex-grow h-[0.5px] bg-[#AEAEAE]" />
                                    </div>
                                    <div className="flex items-center justify-between p-5 bg-green-50 border border-green-200 rounded-[18px]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                                <Tag size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[15px] font-black text-black uppercase">{selectedOffer.title}</p>
                                                <p className="text-[13px] text-green-700 font-semibold uppercase">{selectedOffer.discount_type === 'percent' ? `${selectedOffer.discount_value}%` : `₹${selectedOffer.discount_value}`} OFF APPLIED</p>
                                            </div>
                                        </div>
                                        <CheckCircle2 className="text-green-500" />
                                    </div>
                                </div>
                            </div>
                        )}
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
                                        <p className="text-[15px] text-[#686868] font-bold uppercase tracking-widest opacity-60">Dining Reservation &nbsp;·&nbsp; ₹{grandTotal.toLocaleString('en-IN')}</p>
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
                                        <input type="text" value={billing.name} onChange={e => { setBilling({ ...billing, name: e.target.value }); setBookingError(''); }} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black tracking-wide bg-zinc-50/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">Personal Email <span className="text-red-500">*</span></label>
                                        <input type="email" value={billing.email} onChange={e => { setBilling({ ...billing, email: e.target.value }); setBookingError(''); }} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black tracking-wide bg-zinc-50/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">Contact Phone</label>
                                        <div className="w-full h-[60px] border border-zinc-100 rounded-[16px] px-6 flex items-center bg-[#F9F9F9] text-black font-black text-[17px] tracking-widest">+91 {billing.phone}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">Residential Address <span className="text-red-500">*</span></label>
                                        <input type="text" placeholder="STREET, AREA, HOUSE NO." value={billing.address} onChange={e => { setBilling({ ...billing, address: e.target.value }); setBookingError(''); }} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black tracking-wide bg-zinc-50/30 uppercase placeholder:text-zinc-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">City <span className="text-red-500">*</span></label>
                                        <input type="text" placeholder="CITY" value={billing.city} onChange={e => { setBilling({ ...billing, city: e.target.value }); setBookingError(''); }} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black tracking-wide bg-zinc-50/30 uppercase" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">State</label>
                                        <input type="text" placeholder="STATE" value={billing.state} onChange={e => { setBilling({ ...billing, state: e.target.value }); setBookingError(''); }} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black tracking-wide bg-zinc-50/30 uppercase" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">Pincode <span className="text-red-500">*</span></label>
                                        <input type="text" placeholder="PINCODE" value={billing.pincode} onChange={e => { setBilling({ ...billing, pincode: e.target.value.replace(/\D/g, '') }); setBookingError(''); }} maxLength={6} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black tracking-wide bg-zinc-50/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#686868] uppercase tracking-[0.15em] ml-1">Nationality <span className="text-red-500">*</span></label>
                                        <select value={billing.nationality} onChange={e => { setBilling({ ...billing, nationality: e.target.value }); setBookingError(''); }} className="w-full h-[60px] border border-zinc-200 rounded-[16px] px-6 focus:outline-none focus:border-black text-[17px] font-black text-black bg-zinc-50/30 uppercase">
                                            <option value="Indian">Indian</option>
                                            <option value="Other">Other</option>
                                        </select>
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
