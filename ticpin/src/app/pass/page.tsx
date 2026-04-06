'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronRight, Star, Smartphone, HelpCircle, Ticket, Utensils, PlayCircle, LogOut, Loader2 } from 'lucide-react';
import { useUserSession, clearUserSession } from '@/lib/auth/user';
import { useOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import { toast } from '@/components/ui/Toast';
import { passApi, TicpinPass } from '@/lib/api/pass';
import { useEffect } from 'react';

export default function TicpassPage() {
    const router = useRouter();
    const user = useUserSession();
    const organizer = useOrganizerSession();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [hasCheckedSession, setHasCheckedSession] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [latestPass, setLatestPass] = useState<TicpinPass | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setHasCheckedSession(true), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!hasCheckedSession) return;
        
        console.log('User session state in TicpassPage:', user);
        
        if (user?.id) {
            console.log('User identified, fetching latest pass:', user.id);
            passApi.getLatestPass(user.id)
                .then(pass => {
                    console.log('Received latest pass:', pass);
                    setLatestPass(pass);
                    setInitialLoading(false);
                })
                .catch(err => {
                    console.error('Latest pass fetch failed:', err);
                    setInitialLoading(false);
                });
        } else {
            console.log('No user session found, stopping initial load');
            setInitialLoading(false);
        }
    }, [user, user?.id, hasCheckedSession]);

    const price = 1;

    const handleBuyNow = async () => {
        if (organizer) {
            setShowLogoutModal(true);
            return;
        }

        if (!user) {
            toast.error('Please login to buy Ticpin Pass');
            router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/backend/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: price,
                    customer_id: user.id,
                    customer_phone: user.phone,
                    customer_email: user.email || '',
                    type: 'pass',
                    notes: {
                        user_id: user.id,
                        booking_type: 'pass',
                        pass_id: latestPass?.id || ''
                    }
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create order');

            if (data.gateway === 'razorpay') {
                const options = {
                    key: data.razorpay_key,
                    amount: price * 100,
                    currency: 'INR',
                    name: 'Ticpin',
                    description: '3 Months Ticpin Pass',
                    order_id: data.order_id,
                    handler: async function (response: any) {
                        try {
                            setLoading(true);
                            const endpoint = latestPass ? `/backend/api/pass/${latestPass.id}/renew` : '/backend/api/pass/apply';
                            const activateRes = await fetch(endpoint, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    user_id: user.id,
                                    payment_id: response.razorpay_payment_id || response.razorpay_order_id,
                                    order_id: response.razorpay_order_id
                                })
                            });

                            if (!activateRes.ok) {
                                const errData = await activateRes.json();
                                throw new Error(errData.error || 'Failed to activate pass');
                            }

                            toast.success('Payment Successful! Your pass is active.');
                            router.push('/profile');
                        } catch (err: any) {
                            console.error('Activation Error:', err);
                            toast.error('Payment succeeded but activation failed. Contact support.');
                        } finally {
                            setLoading(false);
                        }
                    },
                    prefill: {
                        name: user.name || '',
                        email: user.email || '',
                        contact: user.phone || ''
                    },
                    theme: { color: '#000000' }
                };
                const rzp = (window as any).Razorpay(options);
                rzp.open();
            } else if (data.gateway === 'cashfree') {
                // Load Cashfree SDK
                if (!(window as any).Cashfree) {
                    await new Promise<void>((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
                        script.onload = () => resolve();
                        script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
                        document.head.appendChild(script);
                    });
                }

                // Stash pending pass info for return_url handling if needed
                // But usually Cashfree v3 handles via redirection or modal.
                // Here we use the checkout integration.
                const cashfree = (window as any).Cashfree({
                    mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
                });

                cashfree.checkout({
                    paymentSessionId: data.payment_session_id,
                    redirectTarget: '_self', // This will redirect back to the page
                });
            }

        } catch (error: any) {
            console.error('Payment Error:', error);
            toast.error(error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearOrganizerSession();
        setShowLogoutModal(false);
        toast.success('Logged out successfully. You can now buy the pass as a user.');
    };

    return (
        <div className="h-[100vh] w-full bg-black text-white flex flex-col items-center justify-start overflow-hidden relative selection:bg-white/20 pt-16 md:pt-20">
            {/* Background Layer */}
            <div 
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                style={{
                    backgroundImage: 'url("/TICPASS BG WEB 1.svg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center h-full max-h-[85vh] justify-between py-4">
                
                {/* Header Section */}
                <div className="text-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-baseline justify-center gap-3">
                        <span className="text-6xl md:text-8xl font-bold font-[family-name:var(--font-anek-latin)] tracking-tighter">₹{price}</span>
                        <span className="text-xl md:text-2xl text-white/60 font-medium uppercase font-[family-name:var(--font-anek-latin)]">For 3 Months</span>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <div className="flex items-center justify-center gap-4 opacity-60">
                        <div className="h-px w-20 bg-gradient-to-r from-transparent to-white" />
                        <Star className="w-4 h-4 fill-white" />
                        <span className="text-sm font-bold tracking-[0.2em] uppercase">Pass Benefits</span>
                        <Star className="w-4 h-4 fill-white" />
                        <div className="h-px w-20 bg-gradient-to-l from-transparent to-white" />
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-6 backdrop-blur-md">
                        <div className="flex items-start gap-5">
                            <div className="mt-1 p-3 bg-white/10 rounded-2xl">
                                <PlayCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold uppercase mb-1">2 Free Turf Bookings</h3>
                                <p className="text-white/60 text-sm leading-relaxed">Book your next two games at no cost and make the most of your playtime.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-5">
                            <div className="mt-1 p-3 bg-white/10 rounded-2xl">
                                <Utensils className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold uppercase mb-1">2 Dining Vouchers (₹250 each)</h3>
                                <p className="text-white/60 text-sm leading-relaxed">Use on dining bills above ₹1000 and save on your next two meals.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-5">
                            <div className="mt-1 p-3 bg-white/10 rounded-2xl">
                                <Ticket className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold uppercase mb-1">Early Access & Event Discounts</h3>
                                <p className="text-white/60 text-sm leading-relaxed">Unlock access before anyone else and save more on every booking.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support Links */}
                <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-3xl flex flex-col overflow-hidden backdrop-blur-md">
                    <Link href="/support" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <Smartphone className="w-5 h-5 text-white/70" />
                            <span className="text-lg font-medium">Chat with support</span>
                        </div>
                        <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <div className="h-px bg-white/5 mx-4" />
                    <Link href="/faq" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <HelpCircle className="w-5 h-5 text-white/70" />
                            <span className="text-lg font-medium">Frequently Asked Questions</span>
                        </div>
                        <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity" />
                    </Link>
                </div>

                {/* Terms and Disclaimer */}
                <div className="text-center flex flex-col gap-1 opacity-40">
                    <p className="text-xs">T&C applies • Offer handling charge will be applied at checkout</p>
                </div>

                {/* Action Button */}
                <button
                    onClick={() => {
                        if (latestPass?.status === 'active') {
                            router.push('/profile/pass');
                            return;
                        }
                        handleBuyNow();
                    }}
                    disabled={loading || initialLoading}
                    className="w-full max-w-5xl h-16 bg-white text-black rounded-full font-bold text-2xl uppercase tracking-tighter hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                >
                    {loading || initialLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : latestPass?.status === 'active' ? (
                        'View Pass Usage'
                    ) : latestPass?.status === 'expired' ? (
                        'Renew Ticpin Pass'
                    ) : (
                        'Get Ticpin Pass'
                    )}
                </button>
            </div>

            {/* Logout Modal for Organizers */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <LogOut className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4 tracking-tight">Organizer Account</h2>
                        <p className="text-white/60 mb-8 leading-relaxed">Ticpin Pass is only available for regular users. Please logout from your organizer account and login as a user to continue.</p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleLogout}
                                className="w-full py-4 bg-white text-black rounded-full font-bold text-xl uppercase tracking-tight hover:bg-zinc-200 transition-colors"
                            >
                                Logout & Continue
                            </button>
                            <button 
                                onClick={() => setShowLogoutModal(false)}
                                className="w-full py-4 bg-transparent text-white/60 rounded-full font-bold text-lg hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}