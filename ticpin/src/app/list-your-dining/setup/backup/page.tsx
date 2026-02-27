'use client';

import React, { Suspense, useState, useRef } from 'react';
import SetupSidebar from '@/app/list-your-dining/list-your-Setups/SetupSidebar';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { organizerApi } from '@/lib/api/organizer';
import { getOrganizerSession } from '@/lib/auth/organizer';

function BackupContactContent() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [showOtp, setShowOtp] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();

    const handleSendOTP = async () => {
        setError('');
        if (!email) { setError('Please enter an email address.'); return; }
        const session = getOrganizerSession();
        if (session?.email && email.toLowerCase() === session.email.toLowerCase()) {
            setError('Backup email must be different from your login email.');
            return;
        }
        setLoading(true);
        try {
            await organizerApi.sendBackupOTP(session?.id ?? '', email, 'dining');
            setShowOtp(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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

    const handleVerifyAndContinue = async () => {
        setError('');
        const otpValue = otp.join('');
        if (otpValue.length < 6) { setError('Please enter the complete 6-digit OTP.'); return; }
        const session = getOrganizerSession();
        setVerifying(true);
        try {
            await organizerApi.verifyBackupOTP(session?.id ?? '', otpValue);
            const existing = JSON.parse(sessionStorage.getItem('setup_dining') ?? '{}');
            sessionStorage.setItem('setup_dining', JSON.stringify({ ...existing, backupEmail: email }));
            router.push('/list-your-dining/setup/agreement');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'OTP verification failed');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)] h-[calc(100vh-80px)]" style={{ background: 'rgba(211, 203, 245, 0.1)' }}>
            <main className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-14 lg:px-32 py-10 md:py-16">
                <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">

                    <aside className="w-fit pt-32 hidden lg:block">
                        <SetupSidebar currentStep="03" completedSteps={['01', '02']} />
                    </aside>

                    <div className="flex-1 flex flex-col pt-4 mt-[-75px]">
                        <div className="mb-12">
                            <p className="text-[14px] font-medium text-black opacity-80 uppercase" style={{ fontFamily: 'Anek Latin' }}>
                                &#123; Backup Contact &#125;
                            </p>
                            <div className="w-[120px] h-[1px] bg-zinc-300 mt-6" />
                        </div>

                        <div className="lg:hidden mb-12">
                            <SetupSidebar currentStep="03" completedSteps={['01', '02']} />
                        </div>

                        <div className="space-y-10 mt-[-15px]">
                            <h1 className="text-[32px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>
                                Backup contact
                            </h1>

                            {error && (
                                <p className="text-red-500 text-[14px] font-medium">{error}</p>
                            )}

                            <div className="space-y-8 max-w-2xl">
                                <div className="space-y-3">
                                    <label className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                        Enter backup email (must be different from your login email)
                                    </label>
                                    <div className="max-w-md">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="backup@example.com"
                                            disabled={showOtp}
                                            className={`w-full h-12 px-4 border border-black/30 rounded-[14px] text-[15px] font-medium focus:outline-none placeholder:text-zinc-400 mt-3 ${showOtp ? 'bg-zinc-50 opacity-70' : ''}`}
                                        />
                                        {showOtp && (
                                            <button
                                                onClick={() => { setShowOtp(false); setOtp(['', '', '', '', '', '']); setError(''); }}
                                                className="mt-2 text-[14px] font-medium text-[#5331EA]"
                                            >
                                                Change email
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {!showOtp ? (
                                    <button
                                        onClick={handleSendOTP}
                                        disabled={loading}
                                        className="bg-black text-white h-[48px] px-8 rounded-[15px] text-[15px] font-medium flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                                    >
                                        {loading ? 'Sending...' : 'Send OTP'} <ChevronRight size={18} />
                                    </button>
                                ) : (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <p className="text-[14px] text-[#686868] font-medium" style={{ fontFamily: 'Anek Latin' }}>
                                            An OTP has been sent to <span className="text-black font-semibold">{email}</span> for verification.
                                        </p>

                                        <div className="space-y-3">
                                            <label className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin' }}>
                                                Enter OTP
                                            </label>
                                            <div className="flex gap-3 md:gap-4">
                                                {otp.map((digit, index) => (
                                                    <input
                                                        key={index}
                                                        ref={el => { inputRefs.current[index] = el; }}
                                                        type="text"
                                                        maxLength={1}
                                                        value={digit}
                                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                                        onPaste={handlePaste}
                                                        className={`w-10 h-10 md:w-12 md:h-12 border ${digit ? 'border-[#5331EA]' : 'border-black/30'} rounded-[12px] text-center text-xl font-bold focus:outline-none focus:border-[#5331EA] bg-white transition-colors mt-3`}
                                                    />
                                                ))}
                                            </div>
                                            <button
                                                onClick={handleSendOTP}
                                                disabled={loading}
                                                className="text-[14px] font-medium text-[#5331EA] disabled:opacity-60"
                                            >
                                                {loading ? 'Sending...' : 'Resend OTP'}
                                            </button>
                                        </div>

                                        <button
                                            onClick={handleVerifyAndContinue}
                                            disabled={verifying}
                                            className="bg-black text-white h-[48px] px-8 rounded-[15px] text-[15px] font-medium flex items-center justify-center gap-2 transition-all active:scale-95 mt-4 disabled:opacity-60"
                                        >
                                            {verifying ? 'Verifying...' : 'Verify & Continue'} <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function BackupContactPage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <BackupContactContent />
        </Suspense>
    );
}
