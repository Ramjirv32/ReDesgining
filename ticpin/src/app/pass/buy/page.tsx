'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserSession } from '@/lib/auth/user';
import { useOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import { toast } from '@/components/ui/Toast';
import { passApi, type TicpinPass } from '@/lib/api/pass';
import { profileApi, UserProfile } from '@/lib/api/profile';
import { bookingApi } from '@/lib/api/booking';
import { getBookingStatus } from '@/lib/utils/booking-status';
import { 
    Loader2,
    LogOut,
    ChevronDown,
    ArrowRight,
    Search
} from 'lucide-react';
import Script from 'next/script';
import Image from 'next/image';

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_S4cSv1Z2KjpNpt';

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
    "Ladakh", "Lakshadweep", "Puducherry"
];

export default function BuyPassPage() {
    const router = useRouter();
    const user = useUserSession();
    const organizer = useOrganizerSession();

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
    const [latestPass, setLatestPass] = useState<TicpinPass | null>(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    
    // Form States
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        state: ''
    });
    const [stateSearch, setStateSearch] = useState('');
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    const [hasExistingProfile, setHasExistingProfile] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user?.id) {
            // Priority 1: sessionStorage
            const savedData = sessionStorage.getItem('ticpin_pass_buy_form');
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    setFormData(parsed);
                    setStateSearch(parsed.state || '');
                    setInitialLoading(false);
                    passApi.getLatestPass(user.id).then(setLatestPass);
                    return;
                } catch { /* ignore */ }
            }

            Promise.all([
                passApi.getLatestPass(user.id),
                profileApi.getProfile(user.id),
                bookingApi.getUserBookings({ userId: user.id })
            ]).then(([pass, prof, history]) => {
                setLatestPass(pass);
                
                const latestBooking = (Array.isArray(history) ? [...history] : [])
                    ?.filter((b: any) => getBookingStatus(b) === 'booked' || getBookingStatus(b) === 'confirmed')
                    ?.sort((a: any, b: any) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime())[0];

                if (prof) {
                    setFormData({
                        name: prof.name || latestBooking?.user_name || user.name || '',
                        phone: prof.phone || latestBooking?.user_phone || user.phone || '',
                        email: prof.email || latestBooking?.user_email || user.email || '',
                        state: prof.state || latestBooking?.state || ''
                    });
                    setStateSearch(prof.state || latestBooking?.state || '');
                    setHasExistingProfile(true);
                } else {
                    setFormData({
                        name: latestBooking?.user_name || user.name || '',
                        phone: latestBooking?.user_phone || user.phone || '',
                        email: latestBooking?.user_email || user.email || '',
                        state: latestBooking?.state || ''
                    });
                    setStateSearch(latestBooking?.state || '');
                    setHasExistingProfile(false);
                }
                setInitialLoading(false);
            }).catch(err => {
                console.error('Fetch failed:', err);
                setInitialLoading(false);
            });
        } else {
            const timer = setTimeout(() => {
                if (!user) setInitialLoading(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user, user?.id]);

    const handleEmailBlur = async () => {
        if (!formData.email || !formData.email.includes('@')) return;
        
        setCheckingEmail(true);
        try {
            // Check if email belongs to an organizer first
            const orgCheck = await fetch(`/backend/api/organizer/check-email?email=${encodeURIComponent(formData.email)}`);
            const orgData = await orgCheck.json();
            
            if (orgData.exists && orgData.isOrganizer) {
                toast.error('This email is registered as an organizer. Organizers cannot purchase a Ticpin Pass.');
                setFormData(prev => ({ ...prev, email: '' }));
                setCheckingEmail(false);
                return;
            }

            // Look up existing profile by email
            const res = await fetch(`/backend/api/profiles/lookup?email=${encodeURIComponent(formData.email)}`);
            if (res.ok) {
                const profile = await res.json();
                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        name: profile.name || prev.name,
                        phone: profile.phone || prev.phone,
                        state: profile.state || prev.state
                    }));
                    if (profile.state) setStateSearch(profile.state);
                    setHasExistingProfile(true);
                    toast.info('Profile details found and updated.');
                }
            }
        } catch (err) {
            console.error('Email lookup failed:', err);
        } finally {
            setCheckingEmail(false);
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowStateDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (formData.name || formData.email || formData.state || formData.phone) {
            sessionStorage.setItem('ticpin_pass_buy_form', JSON.stringify(formData));
        }
    }, [formData]);

    const filteredStates = INDIAN_STATES.filter(s => 
        s.toLowerCase().includes(stateSearch.toLowerCase())
    );

    const syncProfile = async () => {
        if (!user?.id) return;
        try {
            const payload = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                state: formData.state
            };
            if (hasExistingProfile) {
                await profileApi.updateProfile(user.id, payload);
            } else {
                await profileApi.createProfile({
                    userId: user.id,
                    ...payload
                } as UserProfile);
            }
        } catch (err: any) {
            console.error('Profile sync failed:', err);
            throw err;
        }
    };

    const handlePayment = async () => {
        if (organizer) {
            setShowLogoutModal(true);
            return;
        }

        if (!user) {
            toast.error('Please login to continue');
            router.push(`/login?redirect=${encodeURIComponent('/pass/buy')}`);
            return;
        }

        if (!formData.name || !formData.phone || !formData.email || !formData.state) {
            toast.error('Please fill all billing details');
            return;
        }

        if (!agreeTerms) {
            toast.error('Please agree to the Terms & Conditions');
            return;
        }

        setLoading(true);

        try {
            const activePass = await passApi.getActivePass(user.id);
            if (activePass && activePass.status === 'active') {
                toast.error('You already have an active Ticpin Pass!');
                router.push('/pass');
                setLoading(false);
                return;
            }

            const order = await passApi.createPassOrder(user.id, formData.phone);
            const options = {
                key: RAZORPAY_KEY_ID,
                amount: 79900,
                currency: "INR",
                name: "Ticpin Pass",
                description: "3 Months Ticpin Pass Subscription",
                image: "https://res.cloudinary.com/dk4oxsddy/image/upload/v1741701358/pass-logo-gold.png",
                order_id: order.order_id,
                handler: async function (response: any) {
                    setLoading(true);
                    try {
                        const verificationData = {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: order.order_id,
                            razorpay_signature: response.razorpay_signature,
                            user_id: user.id,
                            email: formData.email,
                            phone: formData.phone
                        };
                        
                        const result = await passApi.verifyPassPayment(verificationData);

                        if (result.success) {
                            // SYNC PROFILE ONLY AFTER PAYMENT SUCCESS
                            await syncProfile();
                            toast.success('Your Ticpin Pass is now active!');
                            router.push('/pass');
                        } else {
                            toast.error('Payment verification failed.');
                        }
                    } catch (err: any) {
                        console.error('Verification/Sync error:', err);
                        toast.error(err.message || 'Action failed after payment. Please contact support.');
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone
                },
                theme: { color: "#000000" }
            };

            const rzp = (window as any).Razorpay(options);
            rzp.open();

        } catch (err: any) {
            toast.error('Failed to initialize payment: ' + (err.message || 'Unknown error'));
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearOrganizerSession();
        setShowLogoutModal(false);
        toast.success('Logged out successfully.');
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-black animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black font-['Anek_Latin']" style={{ height: '100vh' }}>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setIsRazorpayLoaded(true)} />

            <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-200 px-10 py-6">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                    <div className="flex-shrink-0 cursor-pointer" onClick={() => router.push('/')}>
                        <Image 
                            src="/ticpin-logo-black.png" 
                            alt="Ticpin" 
                            width={120} 
                            height={30} 
                            priority 
                            className="object-contain" 
                        />
                    </div>
                    <h1 className="text-[28px] font-semibold text-black absolute left-1/2 -translate-x-1/2">Review your Ticpin Pass</h1>
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 border border-gray-200" />
                </div>
            </header>

            <main className="pt-32 pb-12 px-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] overflow-y-auto">
                <div className="w-full max-w-[1200px] bg-white border-[0.5px] border-gray-300 rounded-[20px] shadow-sm p-12 relative overflow-visible">
                    <h2 className="text-[32px] font-bold mb-6">Billing Details</h2>
                    <div className="w-full h-[0.5px] bg-gray-300 mb-8" />

                    <div className="space-y-6">
                        <p className="text-[18px] text-gray-500 mb-6">These details will be shown on your invoice *</p>
                        
                        <div className="relative">
                            <input 
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                onBlur={handleEmailBlur}
                                placeholder="Enter your email"
                                className="w-full h-[60px] border border-gray-200 rounded-[12px] px-6 text-[18px] focus:border-black outline-none transition-colors"
                            />
                            {checkingEmail && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />}
                        </div>

                        <input 
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Enter your full name"
                            className="w-full h-[60px] border border-gray-200 rounded-[12px] px-6 text-[18px] focus:border-black outline-none transition-colors"
                        />

                        <input 
                            type="tel"
                            value={formData.phone}
                            readOnly={hasExistingProfile}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            placeholder="Enter contact number"
                            className={`w-full h-[60px] border border-gray-200 rounded-[12px] px-6 text-[18px] focus:border-black outline-none transition-colors ${hasExistingProfile ? 'bg-gray-50 cursor-not-allowed opacity-70' : 'bg-[#F2F2F2]'}`}
                        />

                        <div className="space-y-2 relative" ref={dropdownRef} style={{ zIndex: 110 }}>
                            <label className="text-[20px] text-black/60 font-medium ml-1">Select State</label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={stateSearch}
                                    onChange={(e) => {
                                        setStateSearch(e.target.value);
                                        setShowStateDropdown(true);
                                    }}
                                    onFocus={() => setShowStateDropdown(true)}
                                    placeholder="Type to search state..."
                                    className="w-full h-[72px] border border-gray-200 rounded-[15px] px-6 pr-14 text-[20px] bg-[#F2F2F2] focus:border-black outline-none transition-colors"
                                />
                                <ChevronDown className={`absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
                            </div>

                            {showStateDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-[15px] shadow-2xl z-[120] max-h-[250px] overflow-y-auto">
                                    {filteredStates.length > 0 ? filteredStates.map(st => (
                                        <div 
                                            key={st}
                                            onClick={() => {
                                                setFormData({...formData, state: st});
                                                setStateSearch(st);
                                                setShowStateDropdown(false);
                                            }}
                                            className="px-6 py-4 hover:bg-black hover:text-white cursor-pointer text-[18px] transition-all"
                                        >
                                            {st}
                                        </div>
                                    )) : (
                                        <div className="px-6 py-4 text-gray-400 italic">No states found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <p className="text-[18px] text-gray-500 mt-4">We'll mail you pass confirmation and invoices</p>
                    </div>

                    <div className="mt-12 flex items-center justify-between">
                        <label className="flex items-center gap-4 cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="h-6 w-6 rounded border-gray-300 accent-black cursor-pointer"
                            />
                            <span className="text-[18px] text-gray-500">
                                I have read and accepted the <a href="/terms" className="text-[#5331EA] hover:underline">terms and conditions</a>
                            </span>
                        </label>

                        <button 
                            onClick={handlePayment}
                            disabled={loading || !agreeTerms}
                            className="w-[280px] h-[72px] bg-black rounded-[10px] flex items-center active:scale-95 disabled:opacity-40 transition-all overflow-hidden"
                        >
                            <div className="flex-1 px-6 border-r border-white/20 text-left">
                                <div className="text-white font-bold text-[24px]">₹799</div>
                                <div className="text-white/40 text-[10px] font-bold">TOTAL</div>
                            </div>
                            <div className="w-[100px] flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin text-white" /> : (
                                    <>
                                        <span className="text-white font-bold text-[20px]">Buy</span>
                                        <ArrowRight className="w-5 h-5 text-white" />
                                    </>
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            </main>

            {showLogoutModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
                    <div className="bg-white border border-gray-200 rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <LogOut size={40} className="text-black" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Organizer Account</h2>
                        <p className="text-gray-500 mb-8">Ticpin Pass is only available for users. Please logout to continue.</p>
                        <button onClick={handleLogout} className="w-full py-4 bg-black text-white rounded-full font-bold mb-3">Logout & Continue</button>
                        <button onClick={() => setShowLogoutModal(false)} className="w-full py-4 text-gray-400 font-bold">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}
