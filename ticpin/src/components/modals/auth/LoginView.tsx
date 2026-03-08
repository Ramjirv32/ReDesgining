import React from 'react';
import Image from 'next/image';
import { X, ChevronDown } from 'lucide-react';

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
    handleOtpPaste,
    otpRefs,
    loading,
    error,
    handleSendOtp,
    handleVerifyOtp,
    handleResend,
    onClose,
    onNumberChange
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
                            <h3 className="text-[32px] text-zinc-900 font-bold">Enter your mobile number</h3>
                            <p className="text-base text-zinc-500 font-medium">Don't have an account? We'll set one up for you</p>
                        </div>

                        <div className="w-full max-w-[604px] space-y-8">
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 px-4 bg-white border border-zinc-200 rounded-2xl h-[60px] min-w-[100px] cursor-pointer hover:border-zinc-300 transition-all">
                                    <Image src="https://flagcdn.com/w40/in.png" alt="IN" width={24} height={16} className="w-6 h-4 object-cover rounded-sm" />
                                    <span className="text-lg text-zinc-900 font-semibold">+91</span>
                                    <ChevronDown size={16} className="text-zinc-400" />
                                </div>
                                <input
                                    autoFocus
                                    type="tel"
                                    placeholder="Enter mobile number"
                                    className="flex-1 px-5 bg-white border border-zinc-200 rounded-2xl text-lg font-medium focus:outline-none focus:border-zinc-900 h-[60px] transition-all"
                                    value={number}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setNumber(val);
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp(e)}
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm -mt-4">{error}</p>}

                            <button
                                onClick={handleSendOtp}
                                disabled={number.length !== 10 || loading}
                                className="w-full h-[55px] bg-black text-white text-xl font-bold rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed shadow-xl shadow-black/10"
                            >
                                {loading ? 'Sending OTP…' : 'Continue'}
                            </button>

                            <div className="text-center">
                                <p className="text-[13px] text-zinc-500 font-medium leading-relaxed">
                                    By continuing, you agree to our<br />
                                    <span className="text-zinc-400 font-semibold cursor-pointer hover:text-zinc-600 transition-colors">Terms of Service</span>&nbsp;
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
                                We sent a 6-digit code to +91 {number}{' '}
                                <span
                                    className="text-black font-bold cursor-pointer hover:underline"
                                    onClick={onNumberChange}
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
                                        ref={(el) => { if (otpRefs.current) otpRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        className="w-[64px] h-[64px] bg-white border border-zinc-200 rounded-[11px] text-center text-2xl font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        onPaste={handleOtpPaste}
                                    />
                                ))}
                            </div>

                            {error && <p className="text-red-500 text-sm -mt-6">{error}</p>}

                            <div className="space-y-4">
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={otp.some(d => !d) || loading}
                                    className="w-full h-[55px] bg-black text-white text-xl font-bold rounded-[11px] hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed shadow-xl shadow-black/10"
                                >
                                    {loading ? 'Verifying…' : 'Continue'}
                                </button>
                                <div className="text-center">
                                    <p className="text-[15px] text-zinc-500 font-medium">
                                        Didn&apos;t get the OTP?{' '}
                                        <span
                                            onClick={handleResend}
                                            className="text-black font-bold cursor-pointer hover:underline"
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
