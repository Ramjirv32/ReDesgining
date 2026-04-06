'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { saveOrganizerSession } from '@/lib/auth/organizer';
import { useIdentityStore } from '@/store/useIdentityStore';

interface OTPApi {
    verifyOTP: (email: string, otp: string) => Promise<{
        _id?: string;
        id?: string;
        email: string;
        isAdmin?: boolean;
        categoryStatus?: Record<string, string>;
    }>;
    resendOTP: (email: string) => Promise<unknown>;
}

interface Props {
    vertical: 'play' | 'events' | 'dining';
    api: OTPApi;
    setupPath: string;
    loginPath: string;
}

function OTPContent({ vertical, api, setupPath, loginPath }: Props) {
    const router = useRouter();
    const [email, setEmail] = useState('');

    useEffect(() => {
        const storedEmail = sessionStorage.getItem('otp_pending_email');
        if (!storedEmail) {
            router.replace(loginPath);
            return;
        }
        setEmail(storedEmail);
    }, [router, loginPath]);

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resent, setResent] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => { inputRefs.current[0]?.focus(); }, []);

    useEffect(() => {
        if (!email) return;
        const syncTimer = async () => {
            const { getRemainingCooldown } = await import('@/lib/utils/otp-state');
            setTimeLeft(getRemainingCooldown(email, vertical));
        };
        syncTimer();
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [email, vertical]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value.slice(-1);
        setOtp(next);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'Enter') handleVerify();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!data) return;
        const next = [...otp];
        data.split('').forEach((char, i) => { next[i] = char; });
        setOtp(next);
        inputRefs.current[Math.min(data.length, 5)]?.focus();
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6) { setError('Enter all 6 digits'); return; }
        setLoading(true); setError('');
        try {
            const res = await api.verifyOTP(email, code);
            const id = (res._id ?? res.id ?? '').toString();
            const catStatus = res.categoryStatus ?? {};
            const isAdmin = !!res.isAdmin;
            const session = { id, email, vertical, isAdmin, categoryStatus: catStatus };
            saveOrganizerSession(session);
            useIdentityStore.getState().loginOrganizer(session);
            const { clearOTPSentAt } = await import('@/lib/utils/otp-state');
            clearOTPSentAt(email, vertical);
            
            if (isAdmin) {
                router.push('/admin');
            } else if (catStatus[vertical]) {
                router.push(`/organizer/dashboard?category=${vertical}`);
            } else {
                router.push(setupPath);
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Invalid OTP');
        } finally { setLoading(false); }
    };

    const handleResend = async () => {
        if (timeLeft > 0) return;
        setResent(false); setError('');
        try {
            await api.resendOTP(email);
            const { setOTPSentAt } = await import('@/lib/utils/otp-state');
            setOTPSentAt(email, vertical);
            setResent(true);
            setTimeLeft(180); // Reset local timer
        } catch {
            setError('Could not resend OTP. Try again later.');
        }
    };

    const isPlay = vertical === 'play';
    const bgClass = isPlay ? 'bg-gradient-to-b from-[#FFFCED] via-white to-white' : '';
    const bgStyle = !isPlay ? { background: 'rgba(211, 203, 245, 0.1)' } : {};

    return (
        <div className={`overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)] ${bgClass}`}
            style={{ ...bgStyle, height: 'calc(100vh - 80px)' }}>
            <main className="flex-1 flex flex-col items-center justify-start pt-20 px-6 overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-[1000px]">
                    <h1 className="font-medium text-black mb-2" style={{ fontSize: '40px', lineHeight: '44px' }}>
                        Verify your email
                    </h1>
                    <div className="w-52 h-px bg-[#AEAEAE] my-8" />
                    <h2 className="font-medium text-black mb-3" style={{ fontSize: '30px', lineHeight: '33px' }}>
                        Enter OTP
                    </h2>
                    <p className="text-[15px] font-medium text-[#686868] mb-10">
                        We sent a 6-digit code to <span className="text-black">{email}</span>
                    </p>
                    <div className="flex gap-4 mb-8">
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => { inputRefs.current[i] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                aria-label={`OTP digit ${i + 1}`}
                                placeholder="·"
                                onChange={e => handleChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                onPaste={handlePaste}
                                className="w-14 h-14 text-center text-[24px] font-medium border-[1.5px] border-[#AEAEAE] rounded-[14px] focus:outline-none focus:border-black transition-colors"
                            />
                        ))}
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    {resent && <p className="text-green-600 text-sm mb-4">OTP resent successfully!</p>}
                    <div className="flex items-center gap-6 mt-6">
                        <button
                            onClick={handleVerify}
                            disabled={loading}
                            className="bg-black text-white px-8 py-4 rounded-[15px] flex items-center gap-2 font-medium transition-all active:scale-95 disabled:opacity-60"
                            style={{ fontSize: '20px', lineHeight: '22px' }}
                        >
                            {loading ? 'Verifying...' : 'Continue'} <ChevronRight size={20} />
                        </button>
                        {timeLeft > 0 ? (
                            <p className="text-[#AEAEAE] font-medium" style={{ fontSize: '15px' }}>
                                Next OTP in {formatTime(timeLeft)}
                            </p>
                        ) : (
                            <button
                                onClick={handleResend}
                                className="text-[#5331EA] border-b border-[#5331EA] text-[15px] font-medium hover:opacity-70"
                            >
                                Resend OTP
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function OrganizerOTPForm(props: Props) {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <OTPContent {...props} />
        </Suspense>
    );
}
