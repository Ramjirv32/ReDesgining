'use client';

import { useParams, useRouter } from 'next/navigation';
import { User, ChevronRight, Trash2, CheckCircle, Circle } from 'lucide-react';
import { useState } from 'react';

export default function ReviewBookingPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    const [isIndianResident, setIsIndianResident] = useState(true);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Simulated login state

    return (
        <div className="min-h-screen flex flex-col font-[family-name:var(--font-anek-latin)]" style={{ background: 'rgba(211, 203, 245, 0.1)' }}>
            {/* Header */}
            <header className="w-full h-[60px] md:h-[80px] bg-white flex items-center justify-between px-6 md:px-10 border-b border-[#FFFFFF] shadow-sm relative z-10">
                <div className="flex-shrink-0 cursor-pointer" onClick={() => router.push('/')}>
                    <img src="/ticpin-logo-black.png" alt="TICPIN" className="h-[20px] md:h-[25px] w-auto" />
                </div>

                <div className="flex-grow flex justify-center">
                    <h1 className="text-[18px] md:text-[24px] font-semibold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        Review your booking
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsLoggedIn(!isLoggedIn)}
                        className="text-[12px] font-medium text-[#686868] hover:text-black border border-[#AEAEAE] px-2 py-1 rounded-[5px]"
                    >
                        {isLoggedIn ? 'Log Out (Demo)' : 'Log In (Demo)'}
                    </button>
                    <div className="w-[30px] h-[30px] md:w-[40px] md:h-[40px] bg-[#E1E1E1] rounded-full flex items-center justify-center cursor-pointer">
                        <User className="text-[#686868]" size={18} />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full max-w-[1100px] mx-auto px-6 py-8 space-y-8 flex-grow">

                {/* Order Summary Card */}
                <div className="w-full bg-white border border-white rounded-[20px]">
                    <div className="p-6 md:p-8">
                        <div className="flex justify-between items-center mb-2 mt-[-20px]">
                            <h2 style={{ color: 'black', fontSize: '30px', fontFamily: 'var(--font-anek-latin)', fontWeight: 600, wordWrap: 'break-word' }}>
                                Order Summary
                            </h2>
                            <div className="w-7 h-7 rounded-full border-4 border-[#1DB954] flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-[#ffffff]"></div>
                            </div>
                        </div>

                        <div className="border-t border-[#AEAEAE] pt-6 space-y-6 mx-[-24px] md:mx-[-32px] px-6 md:px-8">
                            {/* Tickets Section */}
                            <div>
                                <div className="flex items-center gap-4 mb-4 mt-[-20px]">
                                    <h3 style={{ color: 'black', fontSize: '25px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 100, lineHeight: '60px', wordWrap: 'break-word' }} className="uppercase">TICKETS</h3>
                                    <div className="flex-grow h-[1px] bg-[#AEAEAE]"></div>
                                </div>
                                <div className="border border-[#AEAEAE] rounded-[10px] p-4 flex justify-between items-start relative mt-[-20px]">
                                    <div className="space-y-1">
                                        <h4 className="text-[18px] md:text-[22px] font-bold text-black">
                                            {`{EVENT NAME}`} <span className="font-normal mx-1">|</span> {`{LOCATION CITY}`}
                                        </h4>
                                        <p className="text-[12px] md:text-[14px] text-[#686868] font-medium uppercase tracking-tight">
                                            {`{EARLY BIRD / PHASE NAME}`}
                                        </p>
                                        <p className="text-[14px] text-black font-semibold mt-2">
                                            {`{QTY}`} <span className="text-[12px] uppercase">tickets</span>
                                        </p>
                                    </div>
                                    <div className=" mt-[45px] ">
                                        <Trash2 size={14} className="text-[#AEAEAE] cursor-pointer" />
                                        <span style={{ color: 'black', fontSize: '20px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)' }} className="mt-8 ml-[-30px]">
                                            {`{PRICE}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Offers Section */}
                            <div>
                                <div className="flex items-center gap-4 mb-4 mt-[-20px]">
                                    <h3 style={{ color: 'black', fontSize: '25px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 100, lineHeight: '60px', wordWrap: 'break-word' }} className="uppercase">OFFERS</h3>
                                    <div className="flex-grow h-[0.5px] bg-[#AEAEAE]"></div>
                                </div>
                                <div className="border border-[#AEAEAE] rounded-[15px] overflow-hidden mt-[-10px]">
                                    <div className="flex items-center justify-between p-4 px-6 cursor-pointer border-b border-[#F0F0F0]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-6 h-6 rounded-full border-[2px] border-black flex items-center justify-center text-[15px] font-bold">%</div>
                                            <span style={{ color: 'black', fontSize: '20px', fontFamily: 'var(--font-anek-latin)', fontWeight: 500, wordWrap: 'break-word' }}>View all event offers</span>
                                        </div>
                                        <ChevronRight size={18} className="text-black" />
                                    </div>
                                    <div className="flex items-center justify-between p-4 px-6 cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-6 h-6 flex items-center justify-center">
                                                <img src="/events/cupon.svg" alt="Coupons" className="w-[40px] h-auto" />
                                            </div>
                                            <span style={{ color: 'black', fontSize: '20px', fontFamily: 'var(--font-anek-latin)', fontWeight: 500, wordWrap: 'break-word' }}>View all coupon codes</span>
                                        </div>
                                        <ChevronRight size={18} className="text-black" />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details Section */}
                            <div>
                                <div className="flex items-center gap-4 mb-4 mt-[-20px]">
                                    <h3 style={{ color: 'black', fontSize: '25px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 100, lineHeight: '60px', wordWrap: 'break-word' }} className="uppercase">PAYMENT DETAILS</h3>
                                    <div className="flex-grow h-[0.5px] bg-[#AEAEAE]"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center mt-[-20px]" style={{ color: 'black', fontSize: '20px', fontFamily: 'var(--font-anek-latin)', fontWeight: 500, wordWrap: 'break-word' }}>
                                        <span>Order amount</span>
                                        <span>{`{PRICE}`}</span>
                                    </div>
                                    <div className="flex justify-between items-center" style={{ color: '#686868', fontSize: '20px', fontFamily: 'var(--font-anek-latin)', fontWeight: 500, wordWrap: 'break-word' }}>
                                        <div className="flex items-center gap-1">
                                            <span>Booking fee (inc. of GST)</span>
                                            <ChevronRight size={18} className="rotate-90" />
                                        </div>
                                        <span>{`{PRICE}`}</span>
                                    </div>
                                    <div className="h-[0.5px] bg-[#AEAEAE] mt-2"></div>
                                    <div className="pt-2 flex justify-between items-center" style={{ color: 'black', fontFamily: 'var(--font-anek-latin)', fontWeight: 600, wordWrap: 'break-word' }}>
                                        <span style={{ fontSize: '20px' }}>Grand total</span>
                                        <span style={{ fontSize: '25px' }}>{`{PRICE}`}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Continue Button 1 */}
                            <button
                                className="w-full h-[40px] bg-black text-white rounded-[10px] uppercase font-semibold tracking-widest flex items-center justify-center"
                                style={{ color: 'white', fontSize: '30px', fontFamily: 'Anek Tamil Condensed, var(--font-anek-latin)', fontWeight: 500, wordWrap: 'break-word' }}
                            >
                                CONTINUE
                            </button>
                        </div>
                    </div>
                </div>

                {isLoggedIn ? (
                    /* Billing Details Card (Visible when logged in) */
                    <div className="w-full bg-white border border-white rounded-[20px] shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8">
                            <div className="flex justify-between items-center mb-6 mt-[-10px]">
                                <h2 style={{ color: 'black', fontSize: '30px', fontFamily: 'var(--font-anek-latin)', fontWeight: 600, wordWrap: 'break-word' }}>
                                    Billing Details
                                </h2>
                                <img src="/events/check-circle.svg" alt="Check" className="w-[30px] h-auto" />
                            </div>

                            <div className="border-t border-[#AEAEAE] pt-6 space-y-6 mx-[-24px] md:mx-[-32px] px-6 md:px-8 mt-[-15px]">
                                <p className="text-[13px] md:text-[15px] font-medium text-[#686868]">
                                    These details will be shown on your invoice *
                                </p>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="{PROFILE NAME AUTO FETCH}"
                                        className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 focus:outline-none focus:border-black text-black font-medium disabled:bg-[#f5f5f5]"
                                        disabled
                                    />
                                    <input
                                        type="text"
                                        placeholder="{PROFILE CONTACT NO AUTO FETCH}"
                                        className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 focus:outline-none focus:border-black text-black font-medium bg-[#f5f5f5] text-[#686868]"
                                        disabled
                                    />

                                    <div className="pt-2">
                                        <label className="text-[14px] md:text-[16px] font-semibold text-[#686868] block mb-3">Select nationality</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div
                                                onClick={() => setIsIndianResident(true)}
                                                className={`h-[55px] flex items-center justify-between px-5 rounded-[12px] border cursor-pointer transition-all ${isIndianResident ? 'bg-[#f0f0f0] border-black' : 'bg-white border-[#AEAEAE]'}`}
                                            >
                                                <span className="font-semibold text-black">Indian resident</span>
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isIndianResident ? 'border-black' : 'border-[#AEAEAE]'}`}>
                                                    {isIndianResident && <div className="w-2 h-2 rounded-full bg-black"></div>}
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => setIsIndianResident(false)}
                                                className={`h-[55px] flex items-center justify-between px-5 rounded-[12px] border cursor-pointer transition-all ${!isIndianResident ? 'bg-[#f0f0f0] border-black' : 'bg-white border-[#AEAEAE]'}`}
                                            >
                                                <span className="font-semibold text-black">International visitior</span>
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!isIndianResident ? 'border-black' : 'border-[#AEAEAE]'}`}>
                                                    {!isIndianResident && <div className="w-2 h-2 rounded-full bg-black"></div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="{PROFILE STATE AUTO FETCH}"
                                        className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 focus:outline-none focus:border-black text-black font-medium"
                                    />
                                    <input
                                        type="email"
                                        placeholder="{PROFILE MAIL AUTO FETCH}"
                                        className="w-full h-[55px] border border-[#AEAEAE] rounded-[10px] px-5 focus:outline-none focus:border-black text-black font-medium"
                                    />
                                </div>

                                <p className="text-[12px] md:text-[13px] font-medium text-[#686868] pt-2">
                                    We'll mail you ticket confirmation and invoices
                                    <span className="block h-[1px] w-full bg-[#AEAEAE] mt-2 opacity-30"></span>
                                </p>

                                <div className="flex items-center gap-3">
                                    <div
                                        onClick={() => setAcceptedTerms(!acceptedTerms)}
                                        className={`w-5 h-5 rounded-[4px] border border-[#AEAEAE] flex items-center justify-center cursor-pointer ${acceptedTerms ? 'bg-black border-black' : ''}`}
                                    >
                                        {acceptedTerms && <div className="w-2 h-1 border-white border-b-2 border-r-2 rotate-45 mb-1"></div>}
                                    </div>
                                    <span className="text-[13px] md:text-[14px] font-medium text-[#686868]">
                                        I have read and accepted the <span className="text-[#5331EA] cursor-pointer">terms and conditions</span>
                                    </span>
                                </div>

                                {/* Continue Button 2 */}
                                <button className="w-[120px] md:w-[150px] h-[45px] md:h-[50px] bg-black text-white rounded-[10px] font-bold text-[16px] uppercase ml-auto block hover:bg-zinc-800 transition-colors">
                                    CONTINUE
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Signup Card (Visible when NOT logged in - Based on user's CSS) */
                    <div className="w-full bg-white border border-white rounded-[20px] shadow-sm overflow-hidden">
                        <div className="p-6 md:p-10">
                            <h2 className="text-[32px] md:text-[40px] font-medium text-black mb-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Set up your Ticpin account
                            </h2>
                            <div className="w-[150px] h-[1px] bg-[#AEAEAE] mb-8"></div>

                            <div className="space-y-6">
                                <h3 className="text-[24px] md:text-[30px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    Set up Business account
                                </h3>

                                <button className="text-[14px] md:text-[15px] font-medium text-black flex items-center gap-1 hover:underline">
                                    Already have an account? Log in
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-10">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-[18px] md:text-[20px] font-medium text-[#686868] block">Enter your email</label>
                                            <div className="relative group">
                                                <input
                                                    type="email"
                                                    placeholder="Email address"
                                                    className="w-full h-[65px] border-[1.5px] border-[#AEAEAE] rounded-[20px] px-6 focus:outline-none focus:border-black text-black font-medium placeholder:text-[#AEAEAE]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-[18px] md:text-[20px] font-medium text-[#686868] block">Create your password</label>
                                            <div className="relative group">
                                                <input
                                                    type="password"
                                                    placeholder="Email address"
                                                    className="w-full h-[65px] border-[1.5px] border-[#AEAEAE] rounded-[20px] px-6 focus:outline-none focus:border-black text-black font-medium placeholder:text-[#AEAEAE]"
                                                />
                                            </div>
                                            <p className="text-[13px] md:text-[15px] font-medium text-[#5331EA] leading-tight max-w-[450px]">
                                                Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character, and no spaces.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <button className="w-[120px] md:w-[150px] h-[55px] md:h-[60px] bg-black text-white rounded-[15px] font-medium text-[20px] hover:bg-zinc-800 transition-colors flex items-center justify-center">
                                        Sign up
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
