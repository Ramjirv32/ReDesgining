'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronRight, Trash2, X, Tag, CheckCircle2, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { bookingApi, OfferItem, PaymentOrderResponse } from '@/lib/api/booking';
import { profileApi } from '@/lib/api/profile';
import Link from 'next/link';
import { useUserSession } from '@/lib/auth/user';

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
}

interface BillingInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
}

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

    const [cart, setCart] = useState<CartData | null>(null);
    const [venueData, setVenueData] = useState<{id: string; name: string; portrait_image_url: string; landscape_image_url: string; city?: string} | null>(null);
    const [billing, setBilling] = useState<BillingInfo>({ name: '', email: '', phone: '', address: '' });
    const [step, setStep] = useState<'review' | 'billing' | 'success'>('review');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [showBillingForm, setShowBillingForm] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
    const billingRef = useRef<HTMLDivElement>(null);

    // Load cart data from sessionStorage
    useEffect(() => {
        const savedCart = sessionStorage.getItem('dining_cart');
        if (savedCart) {
            const parsed = JSON.parse(savedCart);
            setCart(parsed);
            // Load venue data
            fetch(`/backend/api/dining/${venueName}`).then(r => r.json()).then(data => {
                setVenueData({ id: data._id, name: data.name, portrait_image_url: data.portrait_image_url, landscape_image_url: data.landscape_image_url });
                // Set cart city from venue data
                setCart(prev => prev ? { ...prev, city: data.city || '' } : null);
            }).catch(console.error);
        } else {
            router.push(`/dining/venue/${venueName}/book`);
        }
    }, [venueName, router]);

    // Load user profile for billing info
    useEffect(() => {
        if (session && !billing.name) {
            profileApi.getProfile(session.id).then(profile => {
                if (profile) {
                    setBilling({
                        name: profile.name || '',
                        email: profile.email || session.email || '',
                        phone: profile.phone || session.phone || '',
                        address: profile.address || ''
                    });
                }
            }).catch(console.error);
        }
    }, [session]);

    // Load offers
    useEffect(() => {
        if (venueData) {
            fetch(`/backend/api/dining/${venueName}/offers`).then(r => r.json()).then(offers => {
                if (cart?.offerId) {
                    const offer = offers.find((o: OfferItem) => o.id === cart.offerId);
                    setSelectedOffer(offer || null);
                }
            }).catch(console.error);
        }
    }, [venueData, cart]);

    const handlePayNow = async () => {
        if (!billing.name.trim()) { setBookingError('Please enter your full name'); return; }
        if (!billing.email.trim() || !billing.email.includes('@')) { setBookingError('Please enter a valid email'); return; }
        if (!billing.address.trim()) { setBookingError('Please enter your address'); return; }

        setBookingLoading(true);
        setBookingError('');

        try {
            // Load Razorpay if needed
            await loadScript('https://checkout.razorpay.com/v1/checkout.js');

            const res: PaymentOrderResponse = await bookingApi.createPaymentOrder({
                amount: cart!.totalPrice,
                customer_email: billing.email,
                customer_phone: billing.phone,
            });

            const options = {
                key: res.razorpay_key,
                amount: cart!.totalPrice * 100, // Convert to paise
                currency: 'INR',
                name: cart!.eventName,
                description: `Dining reservation for ${cart!.guests} guests`,
                order_id: res.order_id,
                handler: async (response: any) => {
                    try {
                        await bookingApi.createDiningBooking({
                            user_email: billing.email,
                            user_name: billing.name,
                            dining_id: cart!.eventId,
                            venue_name: cart!.eventName,
                            date: cart!.date,
                            time_slot: cart!.timeSlot,
                            guests: cart!.guests,
                            order_amount: cart!.totalPrice,
                            booking_fee: 0,
                            offer_id: cart!.offerId || undefined,
                            payment_id: response.razorpay_payment_id,
                            payment_gateway: 'razorpay',
                        });
                        setStep('success');
                        sessionStorage.removeItem('dining_cart');
                    } catch (err) {
                        setBookingError('Payment confirmation failed. Please contact support.');
                        console.error(err);
                    }
                },
                prefill: {
                    name: billing.name,
                    email: billing.email,
                    contact: billing.phone,
                },
                theme: {
                    color: '#3399cc',
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err) {
            setBookingError('Failed to initiate payment. Please try again.');
            console.error(err);
        } finally {
            setBookingLoading(false);
        }
    };

    if (!cart || !venueData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                    <p className="text-gray-600 mb-6">Your dining reservation has been successfully booked.</p>
                    <Link href="/organizer/dashboard" className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href={`/dining/venue/${venueName}/book`} className="flex items-center text-gray-600 hover:text-black">
                        <ChevronRight className="w-5 h-5 rotate-180 mr-1" />
                        Back
                    </Link>
                    <h1 className="text-xl font-semibold">Review & Pay</h1>
                    <div className="w-20"></div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Venue Details */}
                        <section className="bg-white rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Venue Details</h2>
                            <div className="flex gap-4">
                                <Image
                                    src={venueData.portrait_image_url}
                                    alt={venueData.name}
                                    width={100}
                                    height={120}
                                    className="rounded-lg object-cover"
                                />
                                <div>
                                    <h3 className="font-semibold text-lg">{venueData.name}</h3>
                                    <p className="text-gray-600">{venueData.city}</p>
                                    <p className="text-sm text-gray-500 mt-1">{fmtDate(cart.date)}</p>
                                    <p className="text-sm text-gray-500">{cart.timeSlot}</p>
                                    <p className="text-sm text-gray-500">{cart.guests} guests</p>
                                </div>
                            </div>
                        </section>

                        {/* Billing Information */}
                        <section className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Billing Information</h2>
                                <button
                                    onClick={() => setShowBillingForm(!showBillingForm)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    {showBillingForm ? 'Cancel' : 'Edit'}
                                </button>
                            </div>

                            {!showBillingForm ? (
                                <div className="space-y-2">
                                    <p><span className="font-medium">Name:</span> {billing.name || 'Not provided'}</p>
                                    <p><span className="font-medium">Email:</span> {billing.email || 'Not provided'}</p>
                                    <p><span className="font-medium">Phone:</span> {billing.phone || 'Not provided'}</p>
                                    <p><span className="font-medium">Address:</span> {billing.address || 'Not provided'}</p>
                                </div>
                            ) : (
                                <div className="space-y-4" ref={billingRef}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            value={billing.name}
                                            onChange={(e) => setBilling(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            value={billing.email}
                                            onChange={(e) => setBilling(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={billing.phone}
                                            onChange={(e) => setBilling(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                                        <textarea
                                            value={billing.address}
                                            onChange={(e) => setBilling(prev => ({ ...prev, address: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                            placeholder="Enter your address"
                                        />
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Offer Applied */}
                        {selectedOffer && (
                            <section className="bg-white rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">Offer Applied</h2>
                                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div>
                                        <p className="font-medium text-green-800">{selectedOffer.title}</p>
                                        <p className="text-sm text-green-600">{selectedOffer.description}</p>
                                    </div>
                                    <Tag className="w-5 h-5 text-green-600" />
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Price Summary */}
                        <section className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                            <h2 className="text-lg font-semibold mb-4">Price Summary</h2>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Base Price ({cart.guests} guests)</span>
                                    <span>₹{cart.totalPrice}</span>
                                </div>
                                {selectedOffer && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount ({selectedOffer.discount_type === 'percent' ? `${selectedOffer.discount_value}%` : `₹${selectedOffer.discount_value}`})</span>
                                        <span>-₹{Math.round(cart.totalPrice * (selectedOffer.discount_type === 'percent' ? selectedOffer.discount_value / 100 : selectedOffer.discount_value / cart.totalPrice))}</span>
                                    </div>
                                )}
                                <div className="border-t pt-2">
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Total</span>
                                        <span>₹{cart.totalPrice}</span>
                                    </div>
                                </div>
                            </div>

                            {bookingError && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {bookingError}
                                </div>
                            )}

                            <button
                                onClick={handlePayNow}
                                disabled={bookingLoading}
                                className="w-full mt-6 h-[54px] bg-black text-white rounded-xl font-semibold text-lg tracking-wide hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {bookingLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Pay Now
                                        <ChevronRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                By clicking "Pay Now", you agree to our terms and conditions
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
