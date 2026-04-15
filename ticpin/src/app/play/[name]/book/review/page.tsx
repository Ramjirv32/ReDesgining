'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, Tag, Trash2, ChevronDown, ArrowLeft, TriangleAlert, User, Percent, ChevronUp, Clock } from 'lucide-react';
import { bookingApi, OfferItem, PaymentOrderResponse } from '@/lib/api/booking';
import { useSlotLock } from '@/hooks/useSlotLock';
import { profileApi } from '@/lib/api/profile';
import { useUserSession } from '@/lib/auth/user';
import { useOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import { getBookingStatus } from '@/lib/utils/booking-status';
import { useIdentityStore } from '@/store/useIdentityStore';
import AuthModal from '@/components/modals/AuthModal';
import OrganizerLogoutModal from '@/components/modals/OrganizerLogoutModal';
import { toast } from '@/components/ui/Toast';


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
    use_pass?: boolean;
    pass_id?: string;
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
    
    const { timeRemaining, loading: lockLoading, locks } = useSlotLock('play');

    useEffect(() => {
        if (step === 'success') return;
        
        // If locks finished loading and we have no active locks or timer hit 0, kick out.
        if (!lockLoading && timeRemaining === 0 && locks.length === 0) {
            sessionStorage.removeItem('ticpin_cart');
            toast.error("Booking session expired. Please start over.");
            router.push('/');
        }
    }, [step, timeRemaining, lockLoading, locks.length, router]);

    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

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
    const [timeLeft, setTimeLeft] = useState<{[key: string]: string}>({});

    const [email, setEmail] = useState('');
    useEffect(() => {
        if (session?.email) {
            setEmail(session.email);
        } else if (organizerSession?.email) {
            setEmail(organizerSession.email);
        }
    }, [session, organizerSession]);

    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const { rememberedBilling, setRememberedBilling } = useIdentityStore();
    const [billing, setBilling] = useState({
        name: rememberedBilling?.name || '',
        phone: rememberedBilling?.phone || '',
        nationality: rememberedBilling?.nationality || 'Indian',
        address: rememberedBilling?.address || '',
        city: rememberedBilling?.city || '',
        state: rememberedBilling?.state || '',
        pincode: rememberedBilling?.pincode || '',
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

        /* const urlParams = new URLSearchParams(window.location.search);
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
                            completeBooking(p.orderID, p.orderID, 'cashfree', p.cart, p.email, p.sessionId,
                                p.orderAmount, p.bookingFee, p.appliedCoupon || '', p.offerId);
                        }, 200);
                    }
                } catch { / * ignore * / }
            }
        } */
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
                        ?.filter((b: any) => getBookingStatus(b) === 'booked' || getBookingStatus(b) === 'confirmed')
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
        if (billing.name || billing.phone) {
            sessionStorage.setItem('ticpin_billing_data', JSON.stringify(billing));
            setRememberedBilling(billing);
        }
    }, [billing, setRememberedBilling]);
    useEffect(() => { sessionStorage.setItem('ticpin_play_step', step); }, [step]);

    // Countdown timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft: {[key: string]: string} = {};
            
            // Calculate time left for offers
            offers.forEach(o => {
                if (o.valid_until) {
                    const expiry = new Date(o.valid_until).getTime();
                    const now = Date.now();
                    const diff = expiry - now;
                    
                    if (diff > 0) {
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                        
                        if (hours > 24) {
                            const days = Math.floor(hours / 24);
                            const remainingHours = hours % 24;
                            newTimeLeft[o.id] = `${days}d ${remainingHours}h ${minutes}m`;
                        } else if (hours > 0) {
                            newTimeLeft[o.id] = `${hours}h ${minutes}m ${seconds}s`;
                        } else if (minutes > 0) {
                            newTimeLeft[o.id] = `${minutes}m ${seconds}s`;
                        } else {
                            newTimeLeft[o.id] = `${seconds}s`;
                        }
                    } else {
                        newTimeLeft[o.id] = 'Expired';
                    }
                }
            });
            
            // Calculate time left for coupons
            availableCoupons.forEach(c => {
                if (c.valid_until) {
                    const expiry = new Date(c.valid_until).getTime();
                    const now = Date.now();
                    const diff = expiry - now;
                    
                    if (diff > 0) {
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                        
                        if (hours > 24) {
                            const days = Math.floor(hours / 24);
                            const remainingHours = hours % 24;
                            newTimeLeft[`coupon_${c.id}`] = `${days}d ${remainingHours}h ${minutes}m`;
                        } else if (hours > 0) {
                            newTimeLeft[`coupon_${c.id}`] = `${hours}h ${minutes}m ${seconds}s`;
                        } else if (minutes > 0) {
                            newTimeLeft[`coupon_${c.id}`] = `${minutes}m ${seconds}s`;
                        } else {
                            newTimeLeft[`coupon_${c.id}`] = `${seconds}s`;
                        }
                    } else {
                        newTimeLeft[`coupon_${c.id}`] = 'Expired';
                    }
                }
            });
            
            setTimeLeft(newTimeLeft);
        }, 1000); // Update every second
        
        return () => clearInterval(timer);
    }, [offers, availableCoupons]);

    useEffect(() => {
        if (!venueName) return;
        bookingApi.getPlayOffers(venueName).then(setOffers).catch(() => setOffers([]));
        bookingApi.getCouponsByCategory('play', session?.id).then(res => {
            setAvailableCoupons(Array.isArray(res) ? res : []);
        }).catch(() => setAvailableCoupons([]));
    }, [venueName, session?.id]);
    const orderAmount = cart?.totalPrice ?? 0;
    const bookingFee = Math.round(orderAmount * 0.1);
    // Check if any offers are expiring soon
    const hasExpiringOffers = offers.some(o => o.valid_until && new Date(o.valid_until) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && new Date(o.valid_until) > new Date());
    const hasExpiringCoupons = availableCoupons.some(c => c.valid_until && new Date(c.valid_until) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && new Date(c.valid_until) > new Date());
    const totalDiscount = offerDiscount + couponDiscount;
    const isPassApplied = cart?.use_pass ?? false;
    const grandTotal = isPassApplied ? 0 : Math.max(0, orderAmount + bookingFee - totalDiscount);

    const applyOffer = (offer: OfferItem) => {
        if (grandTotal === 0 && offer.id !== appliedOffer?.id) {
            toast.warning("The total is already ₹0. No more offers can be applied.");
            return;
        }
        
        const isExpiringSoon = offer.valid_until && new Date(offer.valid_until) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && new Date(offer.valid_until) > new Date();
        
        const disc = offer.discount_type === 'percent'
            ? Math.round(orderAmount * offer.discount_value / 100)
            : Math.min(offer.discount_value, orderAmount);
        setOfferDiscount(disc);
        setAppliedOffer(offer);
        setExpandedSection('none');
        
        // Show urgency message for expiring offers
        if (isExpiringSoon) {
            const expiryDate = new Date(offer.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            toast.success(`🎉 Perfect timing! You saved ₹${disc} with an offer expiring on ${expiryDate}!`);
        } else {
            toast.success(`✅ Offer applied! You saved ₹${disc}`);
        }
    };

    const validateCoupon = async (code?: string) => {
        if (grandTotal === 0 && !appliedCoupon) {
            toast.warning("The total is already ₹0. No coupon needed.");
            return;
        }
        const c = (code ?? couponInput).trim();
        if (!c) return;
        setCouponLoading(true);
        setCouponError('');
        setCouponSuccess('');
        try {
            const result = await bookingApi.validateCoupon(c, 'play', orderAmount, session?.id);
            setCouponDiscount(Math.round(result.discount_amount));
            setAppliedCoupon(c.toUpperCase());
            
            // Check if this coupon is expiring soon
            const coupon = availableCoupons.find(cp => cp.code.toUpperCase() === c.toUpperCase());
            const isExpiringSoon = coupon && coupon.valid_until && new Date(coupon.valid_until) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && new Date(coupon.valid_until) > new Date();
            
            if (isExpiringSoon) {
                const expiryDate = new Date(coupon.valid_until!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                setCouponSuccess(`🎉 Perfect timing! Coupon applied! You save ₹${Math.round(result.discount_amount)} (Expires ${expiryDate})`);
            } else {
                setCouponSuccess(`✓ Coupon applied! You save ₹${Math.round(result.discount_amount)}`);
            }
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
        orderId: string,
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
                order_id: orderId,
                payment_gateway: paymentGateway,
                status: 'booked',
                use_ticpass: isPassApplied,
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
            const freeId = isPassApplied ? `PASS_${cart.pass_id}_${Date.now()}` : `FREE_BOOKING_${Date.now()}`;
            await completeBooking(
                freeId,
                freeId,
                isPassApplied ? 'TICPASS' : 'FREE',
                cart,
                email,
                session?.id || organizerSession?.id,
                isPassApplied ? orderAmount : 0, // Order amount for pass is full but discount is 100%
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
                type: 'play',
                notes: {
                    user_id: session?.id || '',
                    billing_name: billing.name,
                    billing_email: email || `user_${billing.phone}@ticpin.in`,
                    billing_phone: billing.phone,
                    billing_state: billing.state,
                    billing_city: billing.city,
                    billing_address: billing.address,
                    billing_pincode: billing.pincode,
                }
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

            // 2. Stage the booking in "pending" status before opening payment modal
            // This prevents "lost bookings" if the user closes the tab after paying
            const stagedBooking = await bookingApi.createPlayBooking({
                user_email: email || `user_${billing.phone}@ticpin.in`,
                user_name: billing.name,
                user_phone: billing.phone,
                address: billing.address,
                city: billing.city,
                state: billing.state,
                pincode: billing.pincode,
                nationality: billing.nationality,
                play_id: cart.eventId,
                venue_name: cart.eventName,
                date: cart.date,
                slot: cart.slot,
                duration: cart.duration,
                tickets: cart.tickets.map(t => ({
                    category: t.category ?? t.name,
                    price: t.price,
                    quantity: t.quantity,
                })),
                order_amount: orderAmount,
                booking_fee: bookingFee,
                coupon_code: appliedCoupon || undefined,
                offer_id: appliedOffer?.id,
                user_id: session?.id || organizerSession?.id,
                payment_id: orderRes.order_id, // Store Order ID as temporary payment ID
                order_id: orderRes.order_id,
                payment_gateway: orderRes.gateway,
                status: 'pending'
            });

            // Use Razorpay only
            await loadScript('https://checkout.razorpay.com/v1/checkout.js');
            const options = {
                key: orderRes.razorpay_key,
                amount: grandTotal * 100,
                currency: 'INR',
                order_id: orderRes.order_id,
                name: 'Ticpin',
                description: `${cart.eventName} — ${cart.slot}`,
                method: {
                    upi: true,
                    card: true,
                    netbanking: true,
                    wallet: true
                },
                prefill: { name: billing.name, email, contact: billing.phone },
                theme: { color: '#000000' },
                handler: async (response: { razorpay_payment_id: string }) => {
                    await completeBooking(
                        response.razorpay_payment_id, orderRes.order_id, 'razorpay',
                        cart, email, session?.id || organizerSession?.id,
                        orderAmount, bookingFee,
                        appliedCoupon, appliedOffer?.id,
                    );
                },
                modal: {
                    ondismiss: () => {
                        sessionStorage.removeItem('ticpin_pending_play');
                        setBookingLoading(false);
                        setBookingError('Payment was cancelled. You can resume it from your bookings.');
                    },
                },
            };
            new (window as any).Razorpay(options).open();
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
                        Confirmation has been sent to your email <br /><span className="font-semibold text-black">{email}</span>
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
            </header>

            {timeRemaining > 0 && (
                <div className="w-full bg-[#f4effe] flex items-center justify-center py-2 border-b border-[#e9defe]">
                    <Clock className="w-4 h-4 text-[#5331EA] mr-2" />
                    <span className="text-[13px] font-medium text-[#4a3978]">
                        Complete your booking in <span className="text-[#5331EA] font-bold">{timeRemaining > 0 ? formatTimer(timeRemaining) : "00:00"}</span> mins
                    </span>
                </div>
            )}

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
                                    <span className="text-[15px] font-medium text-black">Play Offers</span>
                                    {offers.length > 0 ? (
                                        <span className={`px-2 py-1 text-[11px] font-semibold rounded-full ${
                                            appliedOffer ? 'bg-green-100 text-green-700' : 'bg-black text-white'
                                        }`}>
                                            {offers.length}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-zinc-100 text-zinc-500 text-[11px] font-medium rounded-full">
                                            0
                                        </span>
                                    )}
                                    {hasExpiringOffers && !appliedOffer && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full animate-pulse">
                                            ⏰ EXPIRING SOON
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {appliedOffer && <span className="text-[12px] text-green-600 font-semibold uppercase">{appliedOffer.title}</span>}
                                    {expandedSection === 'offers' ? 
                                        <ChevronUp size={18} className="text-zinc-400 transition-transform" /> : 
                                        <ChevronDown size={18} className="text-zinc-400 transition-transform" />
                                    }
                                </div>
                            </button>

                            {expandedSection === 'offers' && (
                                <div className="p-4 bg-zinc-50 border-t border-zinc-100 space-y-3">
                                    {offers.length > 0 ? offers.map(o => {
                                        const isExpiringSoon = o.valid_until && new Date(o.valid_until) <= new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
                                        const expiryDate = o.valid_until ? new Date(o.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
                                        const isExpired = Boolean(o.valid_until && new Date(o.valid_until) < new Date());
                                        const countdown = timeLeft[o.id] || 'Loading...';
                                        
                                        return (
                                        <div key={o.id} className={`flex justify-between items-center p-3 rounded-lg border shadow-sm ${
                                            isExpired ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-zinc-200'
                                        }`}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className={`text-[14px] font-semibold ${isExpired ? 'text-gray-500' : 'text-black'}`}>
                                                        {o.title}
                                                    </p>
                                                    {isExpiringSoon && !isExpired && (
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full animate-pulse">
                                                            EXPIRES SOON
                                                        </span>
                                                    )}
                                                    {isExpired && (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                                                            EXPIRED
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[13px] text-zinc-500 mb-1">{o.description}</p>
                                                {o.valid_until && (
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-[11px] font-medium ${isExpired ? 'text-gray-400' : 'text-zinc-600'}`}>
                                                            Valid until: {expiryDate}
                                                        </p>
                                                        {!isExpired && (
                                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                                                isExpiringSoon 
                                                                    ? 'bg-red-100 text-red-700 animate-pulse' 
                                                                    : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                ⏰ {countdown}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => applyOffer(o)} 
                                                disabled={isExpired}
                                                className={`px-4 py-1.5 text-[12px] font-semibold rounded-md transition-colors ${
                                                    isExpired 
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                                        : isExpiringSoon 
                                                            ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                                                            : 'bg-black text-white hover:bg-gray-800'
                                                }`}
                                            >
                                                {isExpired ? 'Expired' : isExpiringSoon ? 'Apply Quick!' : 'Apply'}
                                            </button>
                                        </div>
                                    )}) : <p className="text-[13px] text-zinc-500 text-center py-2">No offers available</p>}
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
                                    <span className="text-[15px] font-medium text-black ml-1">Coupon Codes</span>
                                    {availableCoupons.length > 0 ? (
                                        <span className={`px-2 py-1 text-[11px] font-semibold rounded-full ${
                                            appliedCoupon ? 'bg-green-100 text-green-700' : 'bg-black text-white'
                                        }`}>
                                            {availableCoupons.length}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-zinc-100 text-zinc-500 text-[11px] font-medium rounded-full">
                                            0
                                        </span>
                                    )}
                                    {hasExpiringCoupons && !appliedCoupon && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full animate-pulse">
                                            ⏰ EXPIRING SOON
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {appliedCoupon && <span className="text-[12px] text-green-600 font-semibold uppercase">{appliedCoupon}</span>}
                                    {expandedSection === 'coupons' ? 
                                        <ChevronUp size={18} className="text-zinc-400 transition-transform" /> : 
                                        <ChevronDown size={18} className="text-zinc-400 transition-transform" />
                                    }
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
                                            {availableCoupons.map(c => {
                                                const isExpiringSoon = c.valid_until && new Date(c.valid_until) <= new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
                                                const expiryDate = c.valid_until ? new Date(c.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
                                                const isExpired = Boolean(c.valid_until && new Date(c.valid_until) < new Date());
                                                const isAlmostUsedUp = c.max_uses && c.used_count >= (c.max_uses * 0.8); // 80% used
                                                const countdown = timeLeft[`coupon_${c.id}`] || 'Loading...';
                                                
                                                return (
                                                <div key={c.id} className={`flex justify-between items-center p-3 rounded-lg border ${
                                                    isExpired ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-zinc-200 border-dashed'
                                                }`}>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className={`text-[14px] font-semibold ${isExpired ? 'text-gray-500' : 'text-black'}`}>
                                                                {c.code}
                                                            </p>
                                                            {isExpiringSoon && !isExpired && (
                                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full animate-pulse">
                                                                    EXPIRES SOON
                                                                </span>
                                                            )}
                                                            {isExpired && (
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                                                                    EXPIRED
                                                                </span>
                                                            )}
                                                            {isAlmostUsedUp && !isExpired && (
                                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-medium rounded-full">
                                                                    FEW LEFT
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[12px] mb-1 ${isExpired ? 'text-gray-400' : 'text-zinc-500'}`}>
                                                            {c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`} OFF
                                                        </p>
                                                        {c.valid_until && (
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className={`text-[11px] font-medium ${isExpired ? 'text-gray-400' : 'text-zinc-600'}`}>
                                                                    Valid until: {expiryDate}
                                                                </p>
                                                                {!isExpired && (
                                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                                                        isExpiringSoon 
                                                                            ? 'bg-red-100 text-red-700 animate-pulse' 
                                                                            : 'bg-blue-100 text-blue-700'
                                                                    }`}>
                                                                        ⏰ {countdown}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {c.max_uses && (
                                                            <p className={`text-[11px] font-medium ${isExpired ? 'text-gray-400' : 'text-zinc-600'}`}>
                                                                Uses: {c.used_count}/{c.max_uses}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => { setCouponInput(c.code); validateCoupon(c.code); }} 
                                                        disabled={isExpired}
                                                        className={`px-4 py-1.5 text-[12px] font-semibold rounded-md transition-colors ${
                                                            isExpired 
                                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                                                : isExpiringSoon 
                                                                    ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                                                                    : 'bg-zinc-100 text-black hover:bg-zinc-200'
                                                        }`}
                                                    >
                                                        {isExpired ? 'Expired' : isExpiringSoon ? 'Quick Apply!' : 'Apply'}
                                                    </button>
                                                </div>
                                            )})}
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

                            {isPassApplied && (
                                <div className="flex justify-between items-center text-[15px] text-[#5331EA] font-semibold">
                                    <span>TicPin Pass Benefit</span>
                                    <span>FREE</span>
                                </div>
                            )}

                            {!isPassApplied && totalDiscount > 0 && (
                                <div className="flex justify-between items-center text-[15px] text-green-600 font-semibold">
                                    <span>Total Discount</span>
                                    <span>-₹{totalDiscount}</span>
                                </div>
                            )}

                            <div className="h-[1px] bg-zinc-200 my-4" />

                            <div className="flex justify-between items-center">
                                <span className="text-[16px] font-bold text-black">Grand total</span>
                                <span className={`text-[20px] font-bold ${grandTotal === 0 ? 'text-[#5331EA]' : 'text-black'}`}>
                                    {grandTotal === 0 ? 'FREE' : `₹${grandTotal}`}
                                </span>
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
                                <input type="text" value={billing.name} onChange={e => { setBilling({ ...billing, name: e.target.value }); setBookingError(''); }} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px]" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">Email Address <span className="text-red-500">*</span></label>
                                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setBookingError(''); }} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px]" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">Mobile Number <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-[15px]">+91</span>
                                    <input type="tel" maxLength={10} value={billing.phone} onChange={e => { setBilling({ ...billing, phone: e.target.value.replace(/\D/g, '') }); setBookingError(''); }} className="w-full h-12 border border-zinc-200 rounded-lg pl-12 pr-4 focus:outline-none focus:border-black text-[15px]" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">Nationality <span className="text-red-500">*</span></label>
                                <select value={billing.nationality} onChange={e => { setBilling({ ...billing, nationality: e.target.value }); setBookingError(''); }} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px] appearance-none bg-white">
                                    <option value="Indian">Indian</option>
                                    <option value="International">International</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5 mt-6">
                            <label className="text-[13px] font-semibold text-zinc-600">Address <span className="text-red-500">*</span></label>
                            <input type="text" value={billing.address} onChange={e => { setBilling({ ...billing, address: e.target.value }); setBookingError(''); }} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px]" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">City <span className="text-red-500">*</span></label>
                                <select value={billing.city} onChange={e => { setBilling({ ...billing, city: e.target.value }); setBookingError(''); }} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px] appearance-none bg-white">
                                    <option value="">Select City</option>
                                    {CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">State <span className="text-red-500">*</span></label>
                                <select value={billing.state} onChange={e => { setBilling({ ...billing, state: e.target.value }); setBookingError(''); }} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px] appearance-none bg-white">
                                    <option value="">Select State</option>
                                    {STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-600">PIN Code <span className="text-red-500">*</span></label>
                                <input type="tel" maxLength={6} value={billing.pincode} onChange={e => { setBilling({ ...billing, pincode: e.target.value.replace(/\D/g, '') }); setBookingError(''); }} className="w-full h-12 border border-zinc-200 rounded-lg px-4 focus:outline-none focus:border-black text-[15px]" />
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