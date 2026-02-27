'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { playApi } from '@/lib/api/play';
import { getOrganizerSession } from '@/lib/auth/organizer';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const session = getOrganizerSession();
        if (session) {
            if (session.isAdmin) {
                router.replace('/admin');
            } else {
                router.replace(session.categoryStatus?.play
                    ? '/organizer/dashboard?category=play'
                    : '/list-your-play/setup');
            }
        }
    }, [router]);

    const handleLogin = async () => {
        if (!email || !password) { setError('Email and password are required'); return; }
        setLoading(true); setError('');
        try {
            await playApi.login(email, password);
            sessionStorage.setItem('otp_pending_email', email);
            router.push('/list-your-play/otp');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Login failed';
            if (msg === 'user_not_found') {
                router.push(`/list-your-play/Signin?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
            } else {
                setError(msg === 'invalid_password' ? 'Incorrect password. Please try again.' : msg);
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
                        Log in Business account
                    </h2>
                    <p className="text-base font-medium text-black mb-12" style={{ fontSize: '15px', lineHeight: '16px' }}>
                        Don&apos;t have an account?{' '}
                        <Link href="/list-your-play/Signin" className="text-[#5331EA] border-b border-[#5331EA] hover:opacity-80">Sign up</Link>
                    </p>
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <label className="block font-medium text-[#686868] mb-4" style={{ fontSize: '20px', lineHeight: '22px' }}>Enter your email</label>
                            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full px-6 py-4 border-[1.5px] border-[#AEAEAE] rounded-[20px] text-[#AEAEAE] placeholder-[#AEAEAE] focus:outline-none focus:border-black transition-colors"
                                style={{ height: '65px' }} />
                        </div>
                        <div>
                            <label className="block font-medium text-[#686868] mb-4" style={{ fontSize: '20px', lineHeight: '22px' }}>Enter your password</label>
                            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                className="w-full px-6 py-4 border-[1.5px] border-[#AEAEAE] rounded-[20px] text-[#AEAEAE] placeholder-[#AEAEAE] focus:outline-none focus:border-black transition-colors"
                                style={{ height: '65px' }} />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button onClick={handleLogin} disabled={loading}
                        className="bg-black text-white px-8 py-4 rounded-[15px] flex items-center gap-2 font-medium transition-all active:scale-95 disabled:opacity-60"
                        style={{ fontSize: '20px', lineHeight: '22px', width: 'fit-content' }}>
                        {loading ? 'Please wait...' : 'Log in'} <ChevronRight size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
}
