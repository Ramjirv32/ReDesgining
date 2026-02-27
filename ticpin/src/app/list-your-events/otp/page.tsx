'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { eventsApi } from '@/lib/api/events';
import { saveOrganizerSession } from '@/lib/auth/organizer';

function EventsOTPContent() {
    const router = useRouter();
    const [email, setEmail] = useState('');

    useEffect(() => {
        const storedEmail = sessionStorage.getItem('otp_pending_email');
        if (!storedEmail) {
            router.replace('/list-your-events/Login');
            return;
        }
        setEmail(storedEmail);
    }, [router]);

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resent, setResent] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => { inputRefs.current[0]?.focus(); }, []);

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
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!data) return;

        const next = [...otp];
        data.split('').forEach((char, i) => {
            next[i] = char;
        });
        setOtp(next);

        // Focus the last filled input or next empty
        const focusIndex = Math.min(data.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6) { setError('Enter all 6 digits'); return; }
        setLoading(true); setError('');
        try {
            const res = await eventsApi.verifyOTP(email, code);
            const id = (res._id ?? res.id ?? '').toString();
            const catStatus = res.categoryStatus ?? {};
            const isAdmin = !!res.isAdmin;
            saveOrganizerSession({ id, email, vertical: 'events', isAdmin, categoryStatus: catStatus });
            sessionStorage.removeItem('otp_pending_email');

            if (isAdmin) {
                router.push('/admin');
            } else if (catStatus['events']) {
                router.push('/organizer/dashboard?category=events');
            } else {
                router.push('/list-your-events/setup');
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Invalid OTP');
        } finally { setLoading(false); }
    };

    const handleResend = async () => {
        setResent(false); setError('');
        try {
            await eventsApi.resendOTP(email);
            setResent(true);
        } catch {
            setError('Could not resend OTP. Try again later.');
        }
    };

    return (
        <div className="overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)]"
            style={{ background: 'rgba(211, 203, 245, 0.1)', height: 'calc(100vh - 80px)' }}>
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
                                onChange={e => handleChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                onPaste={handlePaste}
                                className="w-14 h-14 text-center text-[24px] font-medium border-[1.5px] border-[#AEAEAE] rounded-[14px] focus:outline-none focus:border-black transition-colors"
                            />
                        ))}
                    </div>

                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    {resent && <p className="text-green-600 text-sm mb-4">OTP resent successfully!</p>}

                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleVerify}
                            disabled={loading}
                            className="bg-black text-white px-8 py-4 rounded-[15px] flex items-center gap-2 font-medium transition-all active:scale-95 disabled:opacity-60"
                            style={{ fontSize: '20px', lineHeight: '22px' }}
                        >
                            {loading ? 'Verifying...' : 'Verify'} <ChevronRight size={20} />
                        </button>
                        <button
                            onClick={handleResend}
                            className="text-[#5331EA] border-b border-[#5331EA] text-[15px] font-medium hover:opacity-70"
                        >
                            Resend OTP
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function EventsOTPPage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <EventsOTPContent />
        </Suspense>
    );
}
