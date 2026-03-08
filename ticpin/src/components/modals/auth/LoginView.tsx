'use client';

import React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface LoginViewProps {
    view: 'number' | 'otp';
    number: string;
    setNumber: (val: string) => void;
    otp: string[];
    handleOtpChange: (index: number, value: string) => void;
    handleKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleOtpPaste: (e: React.ClipboardEvent) => void;
    otpRefs: React.RefObject<(HTMLInputElement | null)[]>;
    loading: boolean;
    error: string;
    handleSendOtp: (e: React.FormEvent) => void;
    handleVerifyOtp: (e: React.FormEvent) => void;
    handleResend: () => void;
    onClose: () => void;
    onNumberChange?: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({
    view,
    number,
    setNumber,
    otp,
    handleOtpChange,
    handleKeyDown,
    otpRefs,
    loading,
    error,
    handleSendOtp,
    handleVerifyOtp,
    handleResend,
    onClose
}) => {
    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Banner Section */}
            <div className="relative h-[320px] flex flex-col items-center justify-center p-0 overflow-hidden shrink-0">
                <Image
                    src="/login/banner.jpeg"
                    alt="Login Banner"
                    fill
                    className="object-cover"
                    priority
                />
                <button onClick={onClose} className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors z-20 bg-black/20 p-2 rounded-full backdrop-blur-sm">
                    <X size={24} />
                </button>
            </div>

            <div className="p-8 space-y-6 flex-1 flex flex-col items-center justify-center bg-white">
                {view === 'number' ? (
                    <>
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Welcome to Ticpin</h2>
                            <p className="text-zinc-500 font-medium">Enter your number to get started</p>
                        </div>

                        <form onSubmit={handleSendOtp} className="w-full max-w-sm space-y-4">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">+91</span>
                                <input
                                    autoFocus
                                    type="tel"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Enter mobile number"
                                    className="w-full h-14 pl-14 pr-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-lg font-bold focus:outline-none focus:border-[#7c00e6] focus:bg-white transition-all"
                                />
                            </div>

                            {error && <p className="text-red-500 text-xs font-bold px-2">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading || number.length !== 10}
                                className="w-full h-14 bg-[#7c00e6] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Sending...' : 'Continue'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Verify Code</h2>
                            <p className="text-zinc-500 font-medium">Sent to +91 {number}</p>
                        </div>

                        <div className="w-full max-w-sm space-y-8">
                            <div className="flex justify-between gap-2">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { if (otpRefs.current) otpRefs.current[i] = el; }}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        className="w-12 h-14 text-center text-xl font-black bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-[#7c00e6] focus:bg-white transition-all shadow-sm"
                                    />
                                ))}
                            </div>

                            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                            <div className="space-y-4">
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={loading || otp.some(d => !d)}
                                    className="w-full h-14 bg-[#7c00e6] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {loading ? 'Verifying...' : 'Verify & Log In'}
                                </button>

                                <div className="text-center">
                                    <p className="text-[15px] text-zinc-500 font-medium">
                                        Didn&apos;t get the OTP?{' '}
                                        <span
                                            onClick={handleResend}
                                            className="text-[#7c00e6] font-bold cursor-pointer hover:underline"
                                        >
                                            {loading ? 'Sending…' : 'Resend OTP'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginView;
