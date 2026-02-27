'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, ChevronLeft, Settings, Mail, ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { saveUserSession, clearUserSession } from '@/lib/auth/user';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: 'number' | 'otp' | 'profile' | 'location';
    onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, initialView = 'number', onSuccess }: AuthModalProps) {
    const router = useRouter();
    const [view, setView] = useState<'number' | 'otp' | 'profile' | 'location'>(initialView);

    useEffect(() => {
        if (isOpen) {
            setView(initialView);
        }
    }, [isOpen, initialView]);
    const [number, setNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (view === 'otp') {
            otpRefs.current[0]?.focus();
        }
    }, [view]);

    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const completeLogin = async () => {
        try {
            const res = await fetch('/backend/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ phone: number }),
            });
            const data = await res.json();
            saveUserSession({
                id: data.id || 'mock-user-id',
                phone: number,
                name: data.name || ('User ' + number.slice(-4)),
            });
        } catch {
            // Fallback: save mock session if backend unreachable
            saveUserSession({
                id: 'mock-user-id',
                phone: number,
                name: 'User ' + number.slice(-4),
            });
        }

        if (onSuccess) {
            onSuccess();
            onClose();
        } else {
            setView('profile');
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[10000] flex transition-all duration-500 ${view === 'profile' ? 'justify-end pointer-events-none' : 'items-center justify-center p-4'
                }`}
            style={{ fontFamily: 'var(--font-anek-latin)' }}
        >
            {/* Backdrop - only clickable here if not profile view, or separate backdrop for profile */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
            />

            <div
                className={`bg-white relative shadow-2xl transition-all duration-500 flex flex-col pointer-events-auto z-10 overflow-hidden ${view === 'profile'
                    ? 'h-full w-full max-w-[750px] rounded-l-[60px] translate-x-0'
                    : 'rounded-[35px] animate-in zoom-in duration-300'
                    }`}
                style={view !== 'profile' ? { width: '850px', height: '700px' } : {}}
            >
                {/* VIEW: MOBILE NUMBER & OTP */}
                {(view === 'number' || view === 'otp') && (
                    <div className="h-full flex flex-col overflow-hidden">
                        {/* Banner Section */}
                        <div className="relative h-[320px] flex flex-col items-center justify-center p-0 overflow-hidden shrink-0">
                            {/* Banner Image */}
                            <img
                                src="/login/banner.jpeg"
                                alt="Login Banner"
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            <button onClick={onClose} className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors z-20 bg-black/20 p-2 rounded-full backdrop-blur-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 flex-1 flex flex-col items-center justify-center bg-white ">
                            {view === 'number' ? (
                                <>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-[32px] text-zinc-900 font-bold">Enter your mobile number</h3>
                                        <p className="text-base text-zinc-500 font-medium">Don't have an account? We'll set one up for you</p>
                                    </div>

                                    <div className="w-full max-w-[604px] space-y-8">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2 px-4 bg-white border border-zinc-200 rounded-2xl h-[60px] min-w-[100px] cursor-pointer hover:border-zinc-300 transition-all">
                                                <img src="https://flagcdn.com/w40/in.png" alt="IN" className="w-6 h-4 object-cover rounded-sm" />
                                                <span className="text-lg text-zinc-900 font-semibold">+91</span>
                                                <ChevronDown size={16} className="text-zinc-400" />
                                            </div>
                                            <input
                                                type="tel"
                                                placeholder="Enter mobile number"
                                                className="flex-1 px-5 bg-white border border-zinc-200 rounded-2xl text-lg font-medium focus:outline-none focus:border-zinc-900 h-[60px] transition-all"
                                                value={number}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    if (val.length <= 10) setNumber(val);
                                                }}
                                            />
                                        </div>

                                        <button
                                            onClick={() => setView('otp')}
                                            disabled={number.length !== 10}
                                            className="w-full h-[55px] bg-black text-white text-xl font-bold rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed shadow-xl shadow-black/10"
                                        >
                                            Continue
                                        </button>

                                        <div className="text-center">
                                            <p className="text-[13px] text-zinc-500 font-medium leading-relaxed">
                                                By continuing, you agree to our<br />
                                                <span className="text-zinc-400 font-semibold cursor-pointer hover:text-zinc-600 transition-colors">Terms of Service</span> &nbsp;
                                                <span className="text-zinc-400 font-semibold cursor-pointer hover:text-zinc-600 transition-colors">Privacy Policy</span>
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-[32px] text-zinc-900 font-bold">Enter OTP</h3>
                                        <p className="text-[15px] text-zinc-500 font-medium">
                                            We have sent a verification code to {number || '{ NUMBER }'}{' '}
                                            <span
                                                className="text-[#7c00e6] font-bold cursor-pointer hover:underline"
                                                onClick={() => setView('number')}
                                            >
                                                (Change)
                                            </span>
                                        </p>
                                    </div>

                                    <div className="w-full max-w-[604px] space-y-10">
                                        <div className="flex justify-between gap-3">
                                            {otp.map((digit, i) => (
                                                <input
                                                    key={i}
                                                    ref={(el) => { otpRefs.current[i] = el; }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    className="w-[64px] h-[64px] bg-white border border-zinc-200 rounded-[11px] text-center text-2xl font-bold focus:outline-none focus:border-[#7c00e6] focus:ring-1 focus:ring-[#7c00e6] transition-all shadow-sm"
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                                />
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <button
                                                onClick={completeLogin}
                                                disabled={otp.join('').length !== 6}
                                                className="w-full h-[55px] bg-black text-white text-xl font-bold rounded-[11px] hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed shadow-xl shadow-black/10"
                                            >
                                                Continue
                                            </button>
                                            <div className="text-center">
                                                <p className="text-[15px] text-zinc-500 font-medium">
                                                    Didn't get the OPT? <span className="text-[#7c00e6] font-bold cursor-pointer hover:underline">Resend OTP</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW: PROFILE PANEL (Sidebar format) */}
                {view === 'profile' && (
                    <div className="h-full flex flex-col bg-[#F6F6F6] animate-in slide-in-from-right duration-500">
                        {/* Logout Confirmation Overlay */}
                        {showLogoutConfirm && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-6 animate-in fade-in duration-200">
                                <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center text-center space-y-8 animate-in zoom-in duration-300">
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                                        <LogOut size={40} />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl text-zinc-900 font-bold">Log Out?</h3>
                                        <p className="text-zinc-500 font-medium">Are you sure you want to log out of your account?</p>
                                    </div>
                                    <div className="flex gap-4 w-full">
                                        <button
                                            onClick={() => setShowLogoutConfirm(false)}
                                            className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl hover:bg-zinc-200 transition-colors font-bold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowLogoutConfirm(false);
                                                clearUserSession();
                                                setView('number');
                                                setNumber('');
                                                setOtp(['', '', '', '', '', '']);
                                            }}
                                            className="flex-1 py-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 font-bold"
                                        >
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Header */}
                        <div className="flex items-center gap-6 px-8 pt-10 pb-6 bg-white shrink-0">
                            <button onClick={onClose} className="p-2 -ml-2 text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
                                <ChevronLeft size={32} strokeWidth={2.5} />
                            </button>
                            <h3 className="text-[32px] text-zinc-900 font-bold tracking-tight">Profile</h3>
                        </div>

                        <div className="flex-1 px-8 py-8 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
                            {/* Profile Info Section (No Card Background) */}
                            <div className="flex items-center gap-6 px-2 py-4">
                                <div className="w-24 h-24 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-400 shrink-0">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </div>
                                <div className="space-y-1">
                                    <h4 style={{ fontSize: '36px', fontWeight: 500, lineHeight: '100%', fontFamily: 'var(--font-anek-latin)' }} className="text-zinc-900">Name</h4>
                                    <p className="text-lg text-zinc-500 font-medium tracking-tight uppercase">{number ? `+91 ${number}` : '{ NUMBER }'}</p>
                                </div>
                            </div>

                            {/* Menu Items Section */}
                            <div className="space-y-4 pt-4">
                                {[
                                    { label: 'Admin Panel', action: () => { router.push('/admin'); onClose(); } },
                                    { label: 'View all bookings', action: () => { } },
                                    { label: 'Chat with us', action: () => { } },
                                    { label: 'Terms & Conditions', action: () => { } },
                                    { label: 'Privacy Policy', action: () => { } },
                                    { label: 'Logout', action: () => setShowLogoutConfirm(true) }
                                ].map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={item.action}
                                        className="w-full flex items-center justify-between h-[80px] px-8 bg-white rounded-[15px] shadow-sm hover:shadow-md transition-all active:scale-[0.99] group border border-zinc-100/50"
                                    >
                                        <span style={{ fontSize: '20px', fontWeight: 500, lineHeight: '100%', fontFamily: 'var(--font-anek-latin)' }} className="text-zinc-500 group-hover:text-zinc-900 transition-colors">{item.label}</span>
                                        <ChevronLeft size={20} className="rotate-180 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
