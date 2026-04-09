'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUserSession, clearUserSession } from '@/lib/auth/user';
import { useOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import { toast } from '@/components/ui/Toast';
import { passApi, type TicpinPass } from '@/lib/api/pass';
import { Loader2, LogOut } from 'lucide-react';
import Link from 'next/link';

const SupportIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const FAQIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const DocsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

export default function PassPage() {
    const router = useRouter();
    const userSession = useUserSession();
    const organizerSession = useOrganizerSession();
    const user = userSession;
    const organizer = organizerSession;

    const [latestPass, setLatestPass] = useState<TicpinPass | null>(null);
    const [loading, setLoading] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [hasCheckedSession, setHasCheckedSession] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setHasCheckedSession(true), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!hasCheckedSession) return;
        
        if (user?.id) {
            passApi.getLatestPass(user.id)
                .then(pass => {
                    setLatestPass(pass);
                    setInitialLoading(false);
                })
                .catch(err => {
                    console.error('Latest pass fetch failed:', err);
                    setInitialLoading(false);
                });
        } else {
            setInitialLoading(false);
        }
    }, [user, user?.id, hasCheckedSession]);

    const handleBuy = () => {
        if (organizer) {
            setShowLogoutModal(true);
            return;
        }

        if (!user) {
            toast.error('Please login to buy Ticpin Pass');
            router.push(`/login?redirect=${encodeURIComponent('/pass/buy')}`);
            return;
        }

        if (latestPass?.status === 'active') {
            router.push('/profile');
            return;
        }

        router.push('/pass/buy');
    };

    const handleLogout = () => {
        clearOrganizerSession();
        setShowLogoutModal(false);
        toast.success('Logged out successfully. You can now buy the pass as a user.');
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen bg-black overflow-hidden" style={{ fontFamily: 'Anek Latin, sans-serif' }}>
            {/* Background Images */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ 
                    backgroundImage: "url('/TICPASS BG WEB.jpg')",
                    height: '874px'
                }}
            />
            <div 
                className="absolute bottom-0 left-0 right-0 bg-cover bg-center bg-no-repeat"
                style={{ 
                    backgroundImage: "url('/PAGE EXTENDER.jpg')",
                    height: '874px',
                    transform: 'rotate(180deg)'
                }}
            />

            {/* Main Content */}
            <div className="relative z-10 px-4 py-8">
                {/* Price Section */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <h1 className="text-white font-semibold" style={{ fontSize: '96px', lineHeight: '106px' }}>
                            ₹799
                        </h1>
                        <h2 className="text-white font-medium" style={{ fontSize: '28px', lineHeight: '30px' }}>
                            FOR 3 MONTHS
                        </h2>
                    </div>
                </div>

                {/* Pass Benefits Title */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2">
                        <img src="/LINE.png" alt="Line" className="w-32 h-1" style={{ transform: 'rotate(180deg)' }} />
                        <img src="/STAR.png" alt="Star" className="w-6 h-6" />
                        <h3 className="text-white font-medium tracking-wider" style={{ fontSize: '28px', letterSpacing: '0.06em' }}>
                            PASS BENEFITS
                        </h3>
                        <img src="/STAR.png" alt="Star" className="w-6 h-6" />
                        <img src="/LINE.png" alt="Line" className="w-32 h-1" />
                    </div>
                </div>

                {/* Benefits Container */}
                <div className="max-w-7xl mx-auto px-4">
                    <div 
                        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-8"
                        style={{ width: '1223px', height: '525px', margin: '0 auto' }}
                    >
                        {/* Turf Bookings */}
                        <div className="flex items-start gap-6 mb-8">
                            <div className="flex-shrink-0">
                                <img src="/Play icon.png" alt="Play" className="w-[127px] h-[117px]" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2" style={{ fontSize: '36px', lineHeight: '39px' }}>
                                    2 FREE TURF BOOKINGS
                                </h4>
                                <p className="text-white/80" style={{ fontSize: '20px', lineHeight: '22px' }}>
                                    Enjoy 2 free turf bookings. Book your next two games at no cost and make the most of your playtime
                                </p>
                            </div>
                        </div>

                        {/* Dining Vouchers */}
                        <div className="flex items-start gap-6 mb-8">
                            <div className="flex-shrink-0">
                                <img src="/Food Tray.png" alt="Dining" className="w-[127px] h-[117px]" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2" style={{ fontSize: '36px', lineHeight: '39px' }}>
                                    2 DINNING VOUCHERS WORTH ₹250 EACH
                                </h4>
                                <p className="text-white/80" style={{ fontSize: '20px', lineHeight: '22px' }}>
                                    Enjoy 2 dining vouchers worth ₹250 each. Use on dining bills above ₹1000 and save on your next two meals
                                </p>
                            </div>
                        </div>

                        {/* Events Access */}
                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0">
                                <img src="/Ticket.png" alt="Events" className="w-[134px] h-[125px]" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2" style={{ fontSize: '36px', lineHeight: '39px' }}>
                                    EARLY ACCESS + EXCLUSIVE DISCOUNTS ON EVENTS
                                </h4>
                                <p className="text-white/80" style={{ fontSize: '20px', lineHeight: '22px' }}>
                                    Enjoy early access to premium events plus exclusive discounts on tickets and experiences. Unlock access before anyone else and save more on every booking
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Support Links */}
                    <div 
                        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-8"
                        style={{ width: '869px', height: '251px', margin: '0 auto' }}
                    >
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <SupportIcon />
                                </div>
                                <Link href="/support" className="text-white font-medium hover:text-white/80 transition-colors" style={{ fontSize: '34px', lineHeight: '37px' }}>
                                    Chat with support
                                </Link>
                            </div>
                            <div className="w-full border-t border-white/75" />
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <FAQIcon />
                                </div>
                                <Link href="/faq" className="text-white font-medium hover:text-white/80 transition-colors" style={{ fontSize: '34px', lineHeight: '37px' }}>
                                    Frequently Asked Questions
                                </Link>
                            </div>
                            <div className="w-full border-t border-white/75" />
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <DocsIcon />
                                </div>
                                <Link href="/terms" className="text-white font-medium hover:text-white/80 transition-colors" style={{ fontSize: '34px', lineHeight: '37px' }}>
                                    Terms & Conditions
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="text-center mb-4">
                        <p className="text-white/60 text-sm">T&C applies</p>
                        <p className="text-white/60 text-sm mt-1">*Offer handling charge will be applied at checkout</p>
                    </div>

                    {/* Buy Button */}
                    <div className="text-center">
                        <button
                            onClick={handleBuy}
                            disabled={loading}
                            className="bg-white text-black font-semibold rounded-full hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 mx-auto"
                            style={{ 
                                width: '244px', 
                                height: '70px', 
                                fontSize: '50px', 
                                lineHeight: '70px',
                                fontFamily: 'Anek Tamil Condensed, sans-serif'
                            }}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : latestPass?.status === 'active' ? (
                                "VIEW YOUR PASS"
                            ) : (
                                "BUY TICPIN PASS"
                            )}
                            <div className="flex flex-col gap-1">
                                <div className="w-4 h-0.5 bg-black" />
                                <div className="w-4 h-0.5 bg-black" />
                                <div className="w-4 h-0.5 bg-black" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Social Media Icons */}
            <div className="absolute bottom-8 right-8 flex gap-4">
                <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="black">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                    </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="black">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
                    </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="black">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="black">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                </a>
            </div>

            {/* Logout Modal for Organizers */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
                    <div 
                        className="relative bg-gray-900 border border-white/15 rounded-3xl p-8 max-w-md w-full"
                        style={{ background: '#0d0630', borderRadius: '40px' }}
                    >
                        <div className="text-center">
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <LogOut size={40} className="text-white" />
                            </div>
                            <h2 className="text-white font-bold text-2xl mb-4">Organizer Account</h2>
                            <p className="text-white/60 mb-8 leading-relaxed">
                                Ticpin Pass is only available for users. Please logout from your organizer account and login as a user to continue.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleLogout}
                                    className="w-full py-4 bg-white text-black rounded-full font-bold hover:bg-gray-100 transition-colors"
                                >
                                    Logout & Continue
                                </button>
                                <button 
                                    onClick={() => setShowLogoutModal(false)}
                                    className="w-full py-4 bg-transparent text-white/40 rounded-full font-bold hover:text-white/60 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
