'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase';
import { saveOrganizerSession } from '@/lib/auth/organizer';
import { getUserSession } from '@/lib/auth/user';
import { useIdentityStore } from '@/store/useIdentityStore';
import { toast } from '@/components/ui/Toast';

interface SigninApi {
    signin: (email: string, password: string) => Promise<unknown>;
    googleAuth: (email: string) => Promise<{
        id?: string;
        _id?: string;
        email: string;
        isAdmin?: boolean;
        categoryStatus?: Record<string, string>;
    }>;
}

interface Props {
    vertical: 'play' | 'events' | 'dining';
    api: SigninApi;
    setupPath: string;
    otpPath: string;
    loginPath: string;

    signinTitle?: string;
    /** Override the password input placeholder (default: "Password") */
    passwordPlaceholder?: string;
    /** Override the password hint text */
    passwordHint?: string;
}

export default function OrganizerSigninForm({ vertical, api, setupPath, otpPath, loginPath, signinTitle, passwordPlaceholder, passwordHint }: Props) {
    const { rememberedEmail, setRememberedEmail } = useIdentityStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const e = params.get('email');
        if (e) setEmail(decodeURIComponent(e));
        else if (rememberedEmail) setEmail(rememberedEmail);

        // Read password from sessionStorage (set by login form), not from URL
        const savedPassword = sessionStorage.getItem('otp_pending_password');
        if (savedPassword) {
            setPassword(savedPassword);
            sessionStorage.removeItem('otp_pending_password');
        }
    }, [rememberedEmail]);

    const handleSignup = async () => {
        if (!email || !password) { setError('Email and password are required'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setError('');
        // No loading state needed if we transition instantly
        api.signin(email, password).catch(e => {
            const msg = e instanceof Error ? e.message : 'Signup failed';
            console.error("Background signin failed:", msg);
        });

        sessionStorage.setItem('otp_pending_email', email);
        if (rememberMe) setRememberedEmail(email);
        router.push(otpPath);
    };

    const handleGoogleSignup = async () => {
        setLoading(true); setError('');
        try {
            if (!auth) throw new Error('Google Auth is not configured. Please check your credentials.');
            const result = await signInWithPopup(auth, googleProvider);
            const userEmail = result.user.email;
            if (!userEmail) throw new Error('No email from google');
            const res = await api.googleAuth(userEmail);
            const session = {
                id: (res.id ?? res._id ?? '') as string,
                email: res.email,
                vertical,
                isAdmin: !!res.isAdmin,
                categoryStatus: res.categoryStatus as Record<string, string>,
            };
            useIdentityStore.getState().loginOrganizer(session);
            if (res.isAdmin) {
                router.replace('/admin');
            } else {
                router.replace(res.categoryStatus?.[vertical]
                    ? `/organizer/dashboard?category=${vertical}`
                    : setupPath);
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Google signup failed');
        } finally { setLoading(false); }
    };

    const isPlay = vertical === 'play';
    const bgClass = isPlay ? 'bg-gradient-to-b from-[#FFFCED] via-white to-white' : '';
    const bgStyle = !isPlay ? { background: 'rgba(211, 203, 245, 0.1)' } : {};

    // Check if regular user is logged in
    useEffect(() => {
        const userSession = getUserSession();
        if (userSession) {
            toast.error('Please logout from your user account first to access organizer signup', 5000);
            router.push('/');
        }
    }, [router]);

    return (
        <div className={`overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)] ${bgClass}`} style={{ ...bgStyle, height: 'calc(100vh - 80px)' }}>
            <main className="flex-1 flex flex-col items-center justify-start pt-20 px-6 overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-[1000px]">
                    <h1 className="text-5xl font-medium text-black mb-2" style={{ fontSize: '40px', lineHeight: '44px', width: '446px' }}>
                        Set up your Ticpin account
                    </h1>
                    <div className="w-52 h-px bg-[#AEAEAE] my-8"></div>
                    <h2 className="text-3xl font-medium text-black mb-4" style={{ fontSize: '30px', lineHeight: '33px', marginBottom: '24px' }}>
                        {signinTitle ?? 'Set up Business account'}
                    </h2>
                    <p className="text-base font-medium text-black mb-12" style={{ fontSize: '15px', lineHeight: '16px' }}>
                        Already have an account?{' '}
                        <Link href={loginPath} className="text-[#5331EA] border-b border-[#5331EA] hover:opacity-80">Log in</Link>
                    </p>
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <label className="block font-medium text-[#686868] mb-4" style={{ fontSize: '20px', lineHeight: '22px' }}>Enter your email</label>
                            <input type="email" placeholder="Email address" value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSignup()}
                                className="w-full px-6 py-4 border-[1.5px] border-[#AEAEAE] rounded-[20px] text-[#AEAEAE] placeholder-[#AEAEAE] focus:outline-none focus:border-black transition-colors"
                                style={{ height: '65px' }} />
                        </div>
                        <div>
                            <label className="block font-medium text-[#686868] mb-4" style={{ fontSize: '20px', lineHeight: '22px' }}>Create your password</label>
                            <input type="password" placeholder={passwordPlaceholder ?? 'Password'} value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSignup()}
                                className="w-full px-6 py-4 border-[1.5px] border-[#AEAEAE] rounded-[20px] text-[#AEAEAE] placeholder-[#AEAEAE] focus:outline-none focus:border-black transition-colors"
                                style={{ height: '65px' }} />
                            <div className="flex items-center gap-2 mt-3">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 accent-black cursor-pointer"
                                />
                                <label htmlFor="rememberMe" className="text-sm font-medium text-[#686868] cursor-pointer">Remember me</label>
                            </div>
                            <p className="text-sm font-medium text-[#5331EA] mt-4" style={{ fontSize: '15px', lineHeight: '16px' }}>{passwordHint ?? 'Password must be at least 8 characters.'}</p>
                        </div>
                    </div>
                    {error && (
                        <div className="mb-4">
                            <p className="text-red-500 text-sm">{error}</p>
                            {error.includes('already exists') && (
                                <Link href={loginPath} className="text-[#5331EA] text-sm border-b border-[#5331EA] hover:opacity-80 mt-1 inline-block">Go to Login →</Link>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col items-center gap-4">
                        <button onClick={handleSignup} disabled={loading}
                            className="bg-black text-white px-8 py-4 rounded-[15px] flex items-center gap-2 font-medium transition-all active:scale-95 disabled:opacity-60"
                            style={{ fontSize: '20px', lineHeight: '22px', width: 'fit-content' }}>
                            {loading ? 'Please wait...' : 'Continue'} <ChevronRight size={20} />
                        </button>
                        <div className="flex items-center gap-4 my-2 w-full max-w-[446px]">
                            <div className="h-px bg-[#AEAEAE] flex-1"></div>
                            <span className="text-[#686868] font-medium">OR</span>
                            <div className="h-px bg-[#AEAEAE] flex-1"></div>
                        </div>
                        <button onClick={handleGoogleSignup} disabled={loading}
                            className="bg-white text-black border-[1.5px] border-[#AEAEAE] px-8 py-4 rounded-[15px] flex items-center justify-center gap-3 font-medium transition-all active:scale-95 disabled:opacity-60 hover:border-black"
                            style={{ fontSize: '20px', lineHeight: '22px', width: 'fit-content' }}>
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
