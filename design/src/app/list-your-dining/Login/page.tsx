'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)]" style={{ background: 'rgba(211, 203, 245, 0.1)', height: 'calc(100vh - 80px)' }}>
            {/* Header */}


            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-start pt-20 px-6 overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-[1000px]">
                    {/* Title */}
                    <h1 className="text-5xl font-medium text-black mb-2" style={{ fontSize: '40px', lineHeight: '44px', width: '446px' }}>
                        Set up your Ticpin account
                    </h1>

                    {/* Divider Line */}
                    <div className="w-52 h-px bg-[#AEAEAE] my-8"></div>

                    {/* Subtitle */}
                    <h2 className="text-3xl font-medium text-black mb-4" style={{ fontSize: '30px', lineHeight: '33px', marginBottom: '24px' }}>
                        Log in Business account
                    </h2>

                    {/* Sign up Link */}
                    <p className="text-base font-medium text-black mb-12" style={{ fontSize: '15px', lineHeight: '16px' }}>
                        Don't have an account?{' '}
                        <Link href="/list-your-dining/setup" className="text-[#5331EA] border-b border-[#5331EA] hover:opacity-80">
                            Sign up
                        </Link>
                    </p>

                    {/* Form Content */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        {/* Email Input */}
                        <div>
                            <label className="block font-medium text-[#686868] mb-4" style={{ fontSize: '20px', lineHeight: '22px' }}>
                                Enter your email
                            </label>
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-6 py-4 border-[1.5px] border-[#AEAEAE] rounded-[20px] text-[#AEAEAE] placeholder-[#AEAEAE] focus:outline-none focus:border-black transition-colors"
                                style={{ height: '65px' }}
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block font-medium text-[#686868] mb-4" style={{ fontSize: '20px', lineHeight: '22px' }}>
                                Enter your password
                            </label>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-6 py-4 border-[1.5px] border-[#AEAEAE] rounded-[20px] text-[#AEAEAE] placeholder-[#AEAEAE] focus:outline-none focus:border-black transition-colors"
                                style={{ height: '65px' }}
                            />
                        </div>
                    </div>

                    {/* Log in Button */}
                    <button
                        className="bg-black text-white px-8 py-4 rounded-[15px] flex items-center gap-2 font-medium transition-all active:scale-95"
                        style={{ fontSize: '20px', lineHeight: '22px', width: 'fit-content' }}
                    >
                        Log in <ChevronRight size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
}

