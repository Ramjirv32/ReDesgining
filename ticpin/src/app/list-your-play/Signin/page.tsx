'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { playApi } from '@/lib/api/play';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const e = params.get('email');
        const p = params.get('password');
        if (e) setEmail(decodeURIComponent(e));
        if (p) setPassword(decodeURIComponent(p));
    }, []);

    const handleSignup = async () => {
        if (!email || !password) { setError('Email and password are required'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
        setLoading(true); setError('');
        try {
            await playApi.signin(email, password);
            router.push(`/list-your-play/otp?email=${encodeURIComponent(email)}`);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Signup failed';
            if (msg.includes('email_exists')) {
                setError('An account with this email already exists.');
            } else {
                setError(msg);
            }
        } finally { setLoading(false); }
    };

    return (
        <div className="overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)]" style={{ background: 'rgba(255, 241, 168, 0.1)', height: 'calc(100vh - 80px)' }}>
            <main className="flex-1 flex flex-col items-center justify-start pt-20 px-6 overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-[1000px]">
                    <h1 className="text-5xl font-medium text-black mb-2" style={{ fontSize: '40px', lineHeight: '44px', width: '446px' }}>
                        Set up your Ticpin account
                    </h1>
                    <div className="w-52 h-px bg-[#AEAEAE] my-8"></div>
                    <h2 className="text-3xl font-medium text-black mb-4" style={{ fontSize: '30px', lineHeight: '33px', marginBottom: '24px' }}>
                        Set up Business account
                    </h2>
                    <p className="text-base font-medium text-black mb-12" style={{ fontSize: '15px', lineHeight: '16px' }}>
                        Already have an account?{' '}
                        <Link href="/list-your-play/Login" className="text-[#5331EA] border-b border-[#5331EA] hover:opacity-80">Log in</Link>
                    </p>
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <label className="block font-medium text-[#686868] mb-4" style={{ fontSize: '20px', lineHeight: '22px' }}>Enter your email</label>
                            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full px-6 py-4 border-[1.5px] border-[#AEAEAE] rounded-[20px] text-[#AEAEAE] placeholder-[#AEAEAE] focus:outline-none focus:border-black transition-colors"
                                style={{ height: '65px' }} />
                        </div>
                        <div>
                            <label className="block font-medium text-[#686868] mb-4" style={{ fontSize: '20px', lineHeight: '22px' }}>Create your password</label>
                            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full px-6 py-4 border-[1.5px] border-[#AEAEAE] rounded-[20px] text-[#AEAEAE] placeholder-[#AEAEAE] focus:outline-none focus:border-black transition-colors"
                                style={{ height: '65px' }} />
                            <p className="text-sm font-medium text-[#5331EA] mt-4" style={{ fontSize: '15px', lineHeight: '16px' }}>Password must be at least 8 characters.</p>
                        </div>
                    </div>
                    {error && (
                        <div className="mb-4">
                            <p className="text-red-500 text-sm">{error}</p>
                            {error.includes('already exists') && (
                                <Link href="/list-your-play/Login" className="text-[#5331EA] text-sm border-b border-[#5331EA] hover:opacity-80 mt-1 inline-block">Go to Login →</Link>
                            )}
                        </div>
                    )}
                    <button onClick={handleSignup} disabled={loading}
                        className="bg-black text-white px-8 py-4 rounded-[15px] flex items-center gap-2 font-medium transition-all active:scale-95 disabled:opacity-60"
                        style={{ fontSize: '20px', lineHeight: '22px', width: 'fit-content' }}>
                        {loading ? 'Please wait...' : 'Sign up'} <ChevronRight size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
}
