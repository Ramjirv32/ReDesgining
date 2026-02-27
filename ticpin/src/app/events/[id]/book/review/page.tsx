'use client';

import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Trash2, X, Tag, CheckCircle2, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { bookingApi, OfferItem } from '@/lib/api/booking';
import Link from 'next/link';
import { useUserSession } from '@/lib/auth/user';

interface CartData {
    eventId: string;
    eventName: string;
    city: string;
    tickets: { name: string; price: number; quantity: number }[];
    totalPrice: number;
    type?: 'event' | 'dining' | 'play';
    // Specific fields for dining/play
    date?: string;
    timeSlot?: string;
    guests?: number;
    slot?: string;
}

export default function ReviewBookingPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const session = useUserSession();

    const [cart, setCart] = useState<CartData | null>(null);


    const [offers, setOffers] = useState<OfferItem[]>([]);
    const [appliedOffer, setAppliedOffer] = useState<OfferItem | null>(null);
    const [offerDiscount, setOfferDiscount] = useState(0);

    // Coupon
    const [couponInput, setCouponInput] = useState('');
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponLoading, setCouponLoading] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

    // Inline UI state
    const [expandedSection, setExpandedSection] = useState<'none' | 'offers' | 'coupons'>('none');

    // User details
    const [email, setEmail] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Billing details
    const [billing, setBilling] = useState({
        name: '',
        phone: '',
        nationality: 'Indian',
        address: '',
        city: '',
        state: '',
        pincode: '',
    });

    // All required billing fields completed
    const billingComplete =
        billing.name.trim() !== '' &&
        billing.phone.trim().length >= 10 &&
        billing.nationality.trim() !== '' &&
        billing.address.trim() !== '' &&
        billing.city.trim() !== '' &&
        billing.pincode.trim().length >= 6 &&
        acceptedTerms;

    // Flow state
    const [step, setStep] = useState<'review' | 'billing' | 'success'>('review');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingId, setBookingId] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('ticpin_cart');
        if (saved) {
            const data = JSON.parse(saved);
            // Default to 'event' if not specified
            setCart({ ...data, type: data.type || 'event' });
        }
    }, []);

    useEffect(() => {
        if (id && cart?.type) {
            const fetchOffers = cart.type === 'dining'
                ? bookingApi.getDiningOffers(id)
                : cart.type === 'play'
                    ? bookingApi.getPlayOffers(id)
                    : bookingApi.getEventOffers(id);

            fetchOffers.then(res => {
                setOffers(res || []);
            }).catch(() => {
                setOffers([]);
            });

            // Fetch Coupons — pass user ID so user-specific coupons are included
            bookingApi.getCouponsByCategory(cart.type, session?.id ?? undefined).then(res => {
                setAvailableCoupons(res || []);
            }).catch(() => {
                setAvailableCoupons([]);
            });
        }
    }, [id, cart?.type, session?.id]);

    const orderAmount = cart?.totalPrice ?? 0;
    const bookingFee = Math.round(orderAmount * 0.1);
    const totalDiscount = offerDiscount + couponDiscount;
    const grandTotal = Math.max(0, orderAmount + bookingFee - totalDiscount);

    const removeTicket = (i: number) => {
        if (!cart) return;
        const newTickets = cart.tickets.filter((_, idx) => idx !== i);
        const newTotal = newTickets.reduce((s, t) => s + t.price * t.quantity, 0);
        const newCart = { ...cart, tickets: newTickets, totalPrice: newTotal };
        setCart(newCart);
        localStorage.setItem('ticpin_cart', JSON.stringify(newCart));
        if (appliedOffer) applyOffer(appliedOffer, newTotal);
        if (appliedCoupon) validateCoupon(couponInput, newTotal);
    };

    const updateTicketQuantity = (i: number, newQuantity: number) => {
        if (!cart || newQuantity < 1) return;
        const newTickets = [...cart.tickets];
        newTickets[i] = { ...newTickets[i], quantity: newQuantity };
        const newTotal = newTickets.reduce((s, t) => s + t.price * t.quantity, 0);
        const newCart = { ...cart, tickets: newTickets, totalPrice: newTotal };
        setCart(newCart);
        localStorage.setItem('ticpin_cart', JSON.stringify(newCart));
        if (appliedOffer) applyOffer(appliedOffer, newTotal);
        if (appliedCoupon) validateCoupon(couponInput, newTotal);
    };

    const applyOffer = (offer: OfferItem, base?: number) => {
        const amount = base ?? orderAmount;
        let disc = offer.discount_type === 'percent'
            ? Math.round(amount * offer.discount_value / 100)
            : Math.min(offer.discount_value, amount);
        setOfferDiscount(disc);
        setAppliedOffer(offer);
        setExpandedSection('none');
    };

    const removeOffer = () => {
        setAppliedOffer(null);
        setOfferDiscount(0);
    };

    const validateCoupon = async (code?: string, base?: number) => {
        const c = code ?? couponInput;
        if (!c.trim()) return;
        const amount = base ?? orderAmount;
        setCouponLoading(true);
        setCouponError('');
        setCouponSuccess('');
        try {
            const result = await bookingApi.validateCoupon(c, id, amount, session?.id);
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

    const removeCoupon = () => {
        setAppliedCoupon('');
        setCouponDiscount(0);
        setCouponInput('');
        setCouponSuccess('');
        setCouponError('');
    };

    const handleContinue = () => {
        if (!email.trim() || !email.includes('@')) {
            setBookingError('Please enter a valid email address');
            return;
        }
        setBookingError('');
        setStep('billing');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePayNow = async () => {
        if (!billing.name.trim()) { setBookingError('Please enter your full name'); return; }
        if (!billing.phone.trim() || billing.phone.length < 10) { setBookingError('Please enter a valid phone number'); return; }
        if (!billing.nationality.trim()) { setBookingError('Please select your nationality'); return; }
        if (!billing.address.trim()) { setBookingError('Please enter your address'); return; }
        if (!billing.city.trim()) { setBookingError('Please enter your city'); return; }
        if (!billing.pincode.trim() || billing.pincode.length < 6) { setBookingError('Please enter a valid PIN code'); return; }
        if (!acceptedTerms) {
            setBookingError('Please accept the terms and conditions');
            return;
        }
        if (!cart) return;
        setBookingLoading(true);
        setBookingError('');
        try {
            let result;
            if (cart.type === 'dining') {
                result = await bookingApi.createDiningBooking({
                    user_email: email,
                    dining_id: cart.eventId,
                    venue_name: cart.eventName,
                    date: cart.date || '',
                    time_slot: cart.timeSlot || '',
                    guests: cart.guests || 1,
                    order_amount: orderAmount,
                    booking_fee: bookingFee,
                    coupon_code: appliedCoupon || undefined,
                    offer_id: appliedOffer?.id || undefined,
                    user_id: session?.id || undefined,
                });
            } else if (cart.type === 'play') {
                result = await bookingApi.createPlayBooking({
                    user_email: email,
                    play_id: cart.eventId,
                    venue_name: cart.eventName,
                    date: cart.date || '',
                    slot: cart.slot || '',
                    tickets: cart.tickets.map(t => ({
                        category: t.name,
                        price: t.price,
                        quantity: t.quantity,
                    })),
                    order_amount: orderAmount,
                    booking_fee: bookingFee,
                    coupon_code: appliedCoupon || undefined,
                    offer_id: appliedOffer?.id || undefined,
                    user_id: session?.id || undefined,
                });
            } else {
                result = await bookingApi.createEventBooking({
                    user_email: email,
                    event_id: cart.eventId,
                    event_name: cart.eventName,
                    tickets: cart.tickets.map(t => ({
                        category: t.name,
                        price: t.price,
                        quantity: t.quantity,
                    })),
                    order_amount: orderAmount,
                    booking_fee: bookingFee,
                    coupon_code: appliedCoupon || undefined,
                    offer_id: appliedOffer?.id || undefined,
                    user_id: session?.id || undefined,
                });
            }
            setBookingId(result.booking_id);
            localStorage.removeItem('ticpin_cart');
            setStep('success');
        } catch (err: unknown) {
            setBookingError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    const toggleSection = (section: 'offers' | 'coupons') => {
        if (step !== 'review') return;
        setExpandedSection(prev => prev === section ? 'none' : section);
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center font-[family-name:var(--font-anek-latin)]" style={{ background: 'rgba(211, 203, 245, 0.1)' }}>
                <div className="w-full max-w-[560px] bg-white rounded-[20px] p-10 mx-6 text-center shadow-sm">
                    <CheckCircle2 size={56} className="text-green-500 mx-auto mb-4" />
                    <h1 className="text-[28px] font-semibold text-black mb-2">Booking Confirmed!</h1>
                    <p className="text-[15px] text-[#686868] mb-1">Your booking ID is</p>
                    <p className="text-[18px] font-bold text-black mb-4 bg-[#f5f5f5] rounded-[10px] py-3 px-4 font-mono">
                        #{bookingId.slice(-10).toUpperCase()}
                    </p>
                    <p className="text-[14px] text-[#686868] mb-8">
                        A confirmation has been recorded for <span className="text-black font-medium">{email}</span>.
                    </p>
                    <p style={{ color: 'black', fontSize: '20px', fontFamily: 'var(--font-anek-latin)', fontWeight: 500 }} className="mb-2">
                        {cart?.eventName}
                    </p>
                    <div className="h-[0.5px] bg-[#AEAEAE] my-4" />
                    <p className="text-[22px] font-semibold text-black mb-8">₹{grandTotal.toLocaleString('en-IN')} <span className="text-[14px] font-normal text-[#686868]">Total paid</span></p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full h-[50px] bg-black text-white rounded-[12px] font-semibold text-[16px] hover:bg-zinc-800 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col font-[family-name:var(--font-anek-latin)]" style={{ background: 'rgba(211, 203, 245, 0.1)' }}>

            {/* Header */}
            <header className="w-full h-[60px] md:h-[80px] bg-white flex items-center justify-between px-6 md:px-10 border-b border-[#FFFFFF] shadow-sm relative z-10">
                <div className="flex-shrink-0 cursor-pointer" onClick={() => router.push('/')}>
                    <img src="/ticpin-logo-black.png" alt="TICPIN" className="h-[20px] md:h-[25px] w-auto" />
                </div>
                <h1 className="text-[18px] md:text-[24px] font-semibold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                    {step === 'billing' ? 'Billing Details' : 'Review your booking'}
                </h1>
                <div className="w-6 h-6 md:w-[25px]" />
            </header>

            <main className="w-full max-w-[1100px] mx-auto px-6 py-8 space-y-8 flex-grow">

                <div className="w-full bg-white border border-white rounded-[20px]">
                    <div className="p-6 md:p-8">
                        <div className="flex justify-between items-center mb-2 mt-[-20px]">
                            <h2 style={{ color: 'black', fontSize: '30px', fontFamily: 'var(--font-anek-latin)', fontWeight: 600 }}>
                                Order Summary
                            </h2>
                            <div style={{ width: 47, height: 47, borderRadius: '50%', border: '4px solid #1DB954', flexShrink: 0 }} />
                        </div>

                        <div className="border-t border-[#AEAEAE] pt-6 space-y-6 mx-[-24px] md:mx-[-32px] px-6 md:px-8">

                            {/* ITEM DETAILS */}
                            <div>
                                <div className="flex items-center gap-4 mb-4 mt-[-20px]">
                                    <h3 style={{ color: 'black', fontSize: '25px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 100, lineHeight: '60px' }} className="uppercase">
                                        {cart?.type === 'dining' ? 'RESERVATION' : cart?.type === 'play' ? 'ACTIVITY' : 'TICKETS'}
                                    </h3>
                                    <div className="flex-grow h-[1px] bg-[#AEAEAE]" />
                                </div>

                                {cart?.tickets && cart.tickets.length > 0 ? cart.tickets.map((ticket, i) => (
                                    <div key={i} className="border border-[#AEAEAE] rounded-[10px] p-4 flex justify-between items-start relative mb-4">
                                        <div className="space-y-1">
                                            <h4 className="text-[18px] md:text-[22px] font-bold text-black">
                                                {cart.eventName} <span className="font-normal mx-1">|</span> {cart.city}
                                            </h4>
                                            <p className="text-[12px] md:text-[14px] text-[#686868] font-medium uppercase tracking-tight">{ticket.name}</p>

                                            {/* Details for Dining/Play */}
                                            {(cart.type === 'dining' || cart.type === 'play') && (
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                                    {cart.date && <p className="text-[13px] text-zinc-600">Date: <span className="text-black font-semibold">{cart.date} Feb</span></p>}
                                                    {cart.timeSlot && <p className="text-[13px] text-zinc-600">Time: <span className="text-black font-semibold">{cart.timeSlot}</span></p>}
                                                    {cart.slot && <p className="text-[13px] text-zinc-600">Slot: <span className="text-black font-semibold">{cart.slot}</span></p>}
                                                    {cart.guests && <p className="text-[13px] text-zinc-600">Guests: <span className="text-black font-semibold">{cart.guests}</span></p>}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 mt-2">
                                                {step === 'review' ? (
                                                    <div className="flex items-center gap-2 border border-[#AEAEAE] rounded-[6px] px-2 py-1">
                                                        <button
                                                            onClick={() => updateTicketQuantity(i, ticket.quantity - 1)}
                                                            disabled={ticket.quantity <= 1}
                                                            className="w-[24px] h-[24px] flex items-center justify-center text-[16px] font-bold text-black hover:text-[#5331EA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-[30px] text-center text-[14px] font-semibold text-black">
                                                            {ticket.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateTicketQuantity(i, ticket.quantity + 1)}
                                                            className="w-[24px] h-[24px] flex items-center justify-center text-[16px] font-bold text-black hover:text-[#5331EA] transition-colors"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-[14px] text-black font-semibold">
                                                        {ticket.quantity} <span className="text-[12px] uppercase font-normal">{cart.type === 'dining' ? 'reservation' : 'ticket'}{ticket.quantity > 1 ? 's' : ''}</span>
                                                    </p>
                                                )}
                                                <span className="text-[#AEAEAE]">×</span>
                                                <p className="text-[14px] text-[#686868]">₹{ticket.price.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-4">
                                            {step === 'review' && (
                                                <Trash2 size={14} className="text-[#AEAEAE] cursor-pointer hover:text-red-500 transition-colors"
                                                    onClick={() => removeTicket(i)}
                                                />
                                            )}
                                            <span style={{ color: 'black', fontSize: '20px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}>
                                                ₹{(ticket.price * ticket.quantity).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-[#AEAEAE]">
                                        <p className="text-[16px]">No selection found.</p>
                                        <button onClick={() => router.back()} className="text-[14px] text-black underline mt-2">Go back to selection</button>
                                    </div>
                                )}
                            </div>

                            {/* OFFERS */}
                            <div>
                                <div className="flex items-center gap-4 mb-4 mt-[-20px]">
                                    <h3 style={{ color: 'black', fontSize: '25px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 100, lineHeight: '60px' }} className="uppercase">OFFERS</h3>
                                    <div className="flex-grow h-[0.5px] bg-[#AEAEAE]" />
                                </div>

                                {appliedOffer && (
                                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-[10px] p-3 px-5 mb-3">
                                        <div className="flex items-center gap-3">
                                            <Tag size={16} className="text-green-600" />
                                            <div>
                                                <p className="text-[14px] font-semibold text-green-700">{appliedOffer.title}</p>
                                                <p className="text-[12px] text-green-600">-₹{offerDiscount.toLocaleString('en-IN')} discount applied</p>
                                            </div>
                                        </div>
                                        <button onClick={removeOffer} className="text-[#AEAEAE] hover:text-red-500 transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                {appliedCoupon && (
                                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-[10px] p-3 px-5 mb-3">
                                        <div className="flex items-center gap-3">
                                            <Tag size={16} className="text-blue-600" />
                                            <div>
                                                <p className="text-[14px] font-semibold text-blue-700">Code: {appliedCoupon}</p>
                                                <p className="text-[12px] text-blue-600">-₹{couponDiscount.toLocaleString('en-IN')} discount applied</p>
                                            </div>
                                        </div>
                                        <button onClick={removeCoupon} className="text-[#AEAEAE] hover:text-red-500 transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                <div className="border border-[#AEAEAE] rounded-[15px] overflow-hidden mt-[-10px] bg-[#FDFDFD]">
                                    <div className="border-b border-[#F0F0F0]">
                                        <div
                                            className="flex items-center justify-between p-4 px-6 cursor-pointer hover:bg-[#fafafa] transition-colors"
                                            onClick={() => toggleSection('offers')}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-6 h-6 rounded-full border-[2px] border-black flex items-center justify-center text-[15px] font-bold">%</div>
                                                <span style={{ color: 'black', fontSize: '20px', fontFamily: 'var(--font-anek-latin)', fontWeight: 500 }}>
                                                    {appliedOffer ? `Offer applied: ${appliedOffer.title}` : `View all ${cart?.type || 'event'} offers`}
                                                    {offers?.length > 0 && !appliedOffer && (
                                                        <span className="ml-2 text-[13px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{offers.length} available</span>
                                                    )}
                                                </span>
                                            </div>
                                            {expandedSection === 'offers' ? <ChevronDown size={18} className="text-black" /> : <ChevronRight size={18} className="text-black" />}
                                        </div>

                                        {expandedSection === 'offers' && (
                                            <div className="p-6 pt-0 space-y-4 animate-in fade-in duration-300">
                                                {!offers || offers.length === 0 ? (
                                                    <p className="text-[14px] text-[#AEAEAE] pb-4">No offers available for this {cart?.type || 'event'}.</p>
                                                ) : (
                                                    offers.map((offer, i) => (
                                                        <div key={i} className="border border-[#F0F0F0] bg-white rounded-[12px] p-4 flex justify-between items-center transition-all hover:border-[#AEAEAE]">
                                                            <div className="flex-1 pr-4">
                                                                <p className="text-[16px] font-bold text-black">{offer.title}</p>
                                                                <p className="text-[13px] text-[#686868]">{offer.description}</p>
                                                                <p className="text-[12px] text-green-600 font-semibold mt-1">
                                                                    {offer.discount_type === 'percent' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => applyOffer(offer)}
                                                                className={`px-4 h-[34px] rounded-[6px] text-[13px] font-bold uppercase transition-all ${appliedOffer?.id === offer.id ? 'bg-green-100 text-green-700' : 'bg-black text-white hover:bg-zinc-800'}`}
                                                            >
                                                                {appliedOffer?.id === offer.id ? 'Applied' : 'Apply'}
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div
                                            className="flex items-center justify-between p-4 px-6 cursor-pointer hover:bg-[#fafafa] transition-colors"
                                            onClick={() => toggleSection('coupons')}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-6 h-6 flex items-center justify-center">
                                                    <img src="/events/cupon.svg" alt="Coupons" className="w-[40px] h-auto" />
                                                </div>
                                                <span style={{ color: 'black', fontSize: '20px', fontFamily: 'var(--font-anek-latin)', fontWeight: 500 }}>
                                                    {appliedCoupon ? `Code applied: ${appliedCoupon}` : 'View coupon codes'}
                                                    {availableCoupons.length > 0 && !appliedCoupon && (
                                                        <span className="ml-2 text-[13px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">{availableCoupons.length} available</span>
                                                    )}
                                                </span>
                                            </div>
                                            {expandedSection === 'coupons' ? <ChevronDown size={18} className="text-black" /> : <ChevronRight size={18} className="text-black" />}
                                        </div>

                                        {expandedSection === 'coupons' && (
                                            <div className="p-6 pt-0 space-y-4 animate-in fade-in duration-300">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={couponInput}
                                                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                                                        onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                                                        placeholder="ENTER CODE"
                                                        className="flex-1 h-[45px] border border-[#AEAEAE] rounded-[8px] px-4 focus:outline-none focus:border-black text-[14px] font-bold uppercase placeholder:normal-case placeholder:font-medium"
                                                    />
                                                    <button
                                                        onClick={() => validateCoupon()}
                                                        disabled={couponLoading || !couponInput.trim()}
                                                        className="px-6 h-[45px] bg-[#AC9BF7] text-white rounded-[8px] text-[13px] font-bold uppercase disabled:opacity-40 transition-all active:scale-[0.98]"
                                                    >
                                                        {couponLoading ? '...' : 'APPLY'}
                                                    </button>
                                                </div>
                                                {couponError && <p className="text-red-500 text-[12px] font-medium">{couponError}</p>}
                                                {couponSuccess && <p className="text-green-600 text-[12px] font-bold">{couponSuccess}</p>}

                                                {/* Available Coupons List — backend already filtered for this user */}
                                                {availableCoupons.length > 0 && !appliedCoupon && (
                                                    <div className="space-y-2 mt-4">
                                                        {availableCoupons.map((c, i) => {
                                                            const expiry = new Date(c.valid_until);
                                                            const now = new Date();
                                                            const hoursLeft = (expiry.getTime() - now.getTime()) / 36e5;
                                                            const isExpiringSoon = hoursLeft <= 24;
                                                            const expiryLabel = expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                                            const usesLeft = c.max_uses > 0 ? c.max_uses - (c.used_count ?? 0) : null;
                                                            return (
                                                                <div key={i} className={`flex items-center justify-between p-3 border rounded-[10px] bg-white ${isExpiringSoon ? 'border-orange-300' : 'border-[#F0F0F0]'}`}>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                                                            <Tag size={14} className={isExpiringSoon ? 'text-orange-400' : 'text-[#AEAEAE]'} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[14px] font-bold text-black uppercase">{c.code}</p>
                                                                            <p className="text-[11px] text-[#686868] uppercase font-medium">
                                                                                {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                                                                            </p>
                                                                            <p className={`text-[10px] font-medium mt-0.5 ${isExpiringSoon ? 'text-orange-500' : 'text-[#AEAEAE]'}`}>
                                                                                {isExpiringSoon ? `⚠ Expires today (${expiryLabel})` : `Valid till ${expiryLabel}`}
                                                                                {usesLeft !== null && ` · ${usesLeft} use${usesLeft !== 1 ? 's' : ''} left`}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => validateCoupon(c.code)}
                                                                        className="px-4 py-1.5 bg-[#AC9BF7] text-white rounded-[8px] text-[11px] font-bold uppercase transition-all"
                                                                    >
                                                                        Apply
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                <div className="bg-[#f9f9f9] p-3 rounded-[8px]">
                                                    <p className="text-[12px] text-[#686868] font-medium leading-tight">
                                                        {session?.id
                                                            ? 'Showing coupons available for your account. Only one coupon can be applied per order.'
                                                            : 'Login to see personalised coupon codes. Only one coupon can be applied per order.'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* PAYMENT DETAILS */}
                            <div>
                                <div className="flex items-center gap-4 mb-4 mt-[-20px]">
                                    <h3 style={{ color: 'black', fontSize: '25px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 100, lineHeight: '60px' }} className="uppercase">PAYMENT DETAILS</h3>
                                    <div className="flex-grow h-[0.5px] bg-[#AEAEAE]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center mt-[-20px]" style={{ color: 'black', fontSize: '20px', fontFamily: 'var(--font-anek-latin)', fontWeight: 500 }}>
                                        <span>Subtotal</span>
                                        <span>₹{orderAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center" style={{ color: '#686868', fontSize: '20px', fontFamily: 'var(--font-anek-latin)', fontWeight: 500 }}>
                                        <div className="flex items-center gap-1">
                                            <span>Booking fee (inc. of GST)</span>
                                            <ChevronRight size={18} className="rotate-90" />
                                        </div>
                                        <span>₹{bookingFee.toLocaleString('en-IN')}</span>
                                    </div>
                                    {totalDiscount > 0 && (
                                        <div className="flex justify-between items-center" style={{ color: '#16a34a', fontSize: '18px', fontFamily: 'var(--font-anek-latin)', fontWeight: 500 }}>
                                            <span>Discount applied</span>
                                            <span>-₹{totalDiscount.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div className="h-[0.5px] bg-[#AEAEAE] mt-2" />
                                    <div className="pt-2 flex justify-between items-center" style={{ color: 'black', fontFamily: 'var(--font-anek-latin)', fontWeight: 600 }}>
                                        <span style={{ fontSize: '20px' }}>Grand total</span>
                                        <span style={{ fontSize: '25px' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* EMAIL & CONTINUE */}
                            {step === 'review' && (
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <label className="text-[15px] font-medium text-[#686868] block mb-2">
                                            Enter your email to receive booking confirmation
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => { setEmail(e.target.value); setBookingError(''); }}
                                            placeholder="your@email.com"
                                            className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 focus:outline-none focus:border-black text-black font-medium text-[16px] placeholder:text-[#AEAEAE]"
                                        />
                                    </div>
                                    {bookingError && (
                                        <p className="text-red-500 text-[14px] font-medium">{bookingError}</p>
                                    )}
                                    <button
                                        onClick={handleContinue}
                                        disabled={!cart?.tickets?.length}
                                        className="w-full h-[50px] bg-black text-white rounded-[10px] uppercase font-semibold tracking-widest flex items-center justify-center disabled:opacity-40"
                                        style={{ color: 'white', fontSize: '28px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 500 }}
                                    >
                                        CONTINUE
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── BILLING FORM ───────────────────── */}
                {step === 'billing' && (
                    <div className="w-full bg-white border border-white rounded-[20px] shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 md:p-8">

                            {/* Mini order summary */}
                            <div className="flex justify-between items-center mb-6 mt-[-10px]">
                                <div>
                                    <h2 style={{ color: 'black', fontSize: '30px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 600 }}>Billing Details</h2>
                                    <p style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }} className="text-[14px] text-[#686868] mt-1">{cart?.eventName} &nbsp;·&nbsp; ₹{grandTotal.toLocaleString('en-IN')} total</p>
                                </div>
                                {/* Check-circle: purple outline → solid green #0AC655 with white tick when all fields done */}
                                <div
                                    style={{
                                        width: 47,
                                        height: 47,
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background 0.25s, border-color 0.25s',
                                        background: billingComplete ? '#0AC655' : 'transparent',
                                        border: billingComplete ? 'none' : '4px solid #5331EA',
                                    }}
                                >
                                    {billingComplete ? (
                                        <svg
                                            style={{ width: '83.33%', height: '83.33%' }}
                                            viewBox="0 0 39 39"
                                            fill="none"
                                        >
                                            <path
                                                d="M7 20l9 9 16-16"
                                                stroke="white"
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    ) : (
                                        <div className="w-3 h-3 rounded-full bg-white" />
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-[#AEAEAE] pt-6 space-y-6 mx-[-24px] md:mx-[-32px] px-6 md:px-8 mt-[-15px]">

                                {/* Name + Phone */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[15px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}>Full Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={billing.name}
                                            onChange={e => { setBilling(b => ({ ...b, name: e.target.value })); setBookingError(''); }}
                                            placeholder="Enter your full name"
                                            className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 focus:outline-none focus:border-black text-black font-medium text-[16px] placeholder:text-[#AEAEAE]"
                                            style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[15px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}>Phone Number <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            value={billing.phone}
                                            onChange={e => { setBilling(b => ({ ...b, phone: e.target.value.replace(/\D/g, '') })); setBookingError(''); }}
                                            placeholder="10-digit mobile number"
                                            maxLength={10}
                                            className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 focus:outline-none focus:border-black text-black font-medium text-[16px] placeholder:text-[#AEAEAE]"
                                            style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}
                                        />
                                    </div>
                                </div>

                                {/* Email (read-only) + Nationality */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[15px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}>Email</label>
                                        <div className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 flex items-center bg-[#f8f8f8]">
                                            <span className="text-[16px] font-medium text-black" style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}>{email}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[15px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}>Nationality <span className="text-red-500">*</span></label>
                                        <select
                                            value={billing.nationality}
                                            onChange={e => { setBilling(b => ({ ...b, nationality: e.target.value })); setBookingError(''); }}
                                            className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 focus:outline-none focus:border-black text-black font-medium text-[16px] bg-white appearance-none"
                                            style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}
                                        >
                                            <option value="">Select nationality</option>
                                            <option value="Indian">Indian</option>
                                            <option value="American">American</option>
                                            <option value="British">British</option>
                                            <option value="Australian">Australian</option>
                                            <option value="Canadian">Canadian</option>
                                            <option value="Chinese">Chinese</option>
                                            <option value="French">French</option>
                                            <option value="German">German</option>
                                            <option value="Japanese">Japanese</option>
                                            <option value="Korean">Korean</option>
                                            <option value="Russian">Russian</option>
                                            <option value="Singaporean">Singaporean</option>
                                            <option value="South African">South African</option>
                                            <option value="UAE">UAE</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <label className="text-[15px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}>Address <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={billing.address}
                                        onChange={e => { setBilling(b => ({ ...b, address: e.target.value })); setBookingError(''); }}
                                        placeholder="House / Flat no., Street, Area"
                                        className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 focus:outline-none focus:border-black text-black font-medium text-[16px] placeholder:text-[#AEAEAE]"
                                        style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}
                                    />
                                </div>

                                {/* City + State + PIN */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[15px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}>City <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={billing.city}
                                            onChange={e => { setBilling(b => ({ ...b, city: e.target.value })); setBookingError(''); }}
                                            placeholder="City"
                                            className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 focus:outline-none focus:border-black text-black font-medium text-[16px] placeholder:text-[#AEAEAE]"
                                            style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[15px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}>State</label>
                                        <input
                                            type="text"
                                            value={billing.state}
                                            onChange={e => setBilling(b => ({ ...b, state: e.target.value }))}
                                            placeholder="State"
                                            className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 focus:outline-none focus:border-black text-black font-medium text-[16px] placeholder:text-[#AEAEAE]"
                                            style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[15px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}>PIN Code <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={billing.pincode}
                                            onChange={e => { setBilling(b => ({ ...b, pincode: e.target.value.replace(/\D/g, '') })); setBookingError(''); }}
                                            placeholder="6-digit PIN"
                                            maxLength={6}
                                            className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 focus:outline-none focus:border-black text-black font-medium text-[16px] placeholder:text-[#AEAEAE]"
                                            style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}
                                        />
                                    </div>
                                </div>

                                {/* Terms */}
                                <div className="flex items-start gap-3 pt-2">
                                    <div
                                        onClick={() => setAcceptedTerms(!acceptedTerms)}
                                        className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors ${acceptedTerms ? 'bg-black border-black' : 'border-[#AEAEAE]'}`}
                                    >
                                        {acceptedTerms && <div className="w-2 h-1 border-white border-b-2 border-r-2 rotate-45 mb-1" />}
                                    </div>
                                    <span className="text-[13px] md:text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}>
                                        I have read and accepted the <Link href="/terms" className="text-[#5331EA] hover:underline font-semibold">Terms &amp; Conditions</Link> and <Link href="/refund" className="text-[#5331EA] hover:underline font-semibold">Refund Policy</Link>
                                    </span>
                                </div>

                                {bookingError && (
                                    <p className="text-red-500 text-[14px] font-medium" style={{ fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }}>{bookingError}</p>
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        onClick={() => { setStep('review'); setBookingError(''); }}
                                        className="col-span-1 h-[55px] border border-[#AEAEAE] text-black rounded-[10px] font-bold text-[16px] hover:bg-[#f5f5f5] transition-colors uppercase"
                                        style={{ fontFamily: 'Anek Tamil Condensed' }}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handlePayNow}
                                        disabled={bookingLoading}
                                        className="col-span-2 h-[55px] bg-black text-white rounded-[10px] font-bold text-[22px] uppercase hover:bg-zinc-800 transition-colors disabled:opacity-50 tracking-wider shadow-lg shadow-black/10"
                                        style={{ fontFamily: 'Anek Tamil Condensed' }}
                                    >
                                        {bookingLoading ? 'Processing...' : 'PAY NOW'}
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
