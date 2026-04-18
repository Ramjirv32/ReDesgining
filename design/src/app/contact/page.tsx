'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ContactComponent() {
    const [formData, setFormData] = useState({
        category: '',
        fullName: '',
        email: '',
        mobileNumber: '',
        issue: ''
    });

    const isFormValid =
        formData.category !== '' &&
        formData.fullName.trim() !== '' &&
        formData.email.trim() !== '' &&
        formData.mobileNumber.trim() !== '' &&
        formData.issue.trim() !== '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            {/* Header / Logo Section */}
            <header className="w-full h-20 flex items-center justify-center border-b border-[#D9D9D9]">
                <img src="/ticpin-logo-black.png" alt="TICPIN" className="h-8 md:h-9 object-contain" />
            </header>

            <main className="w-full py-16 mt-[-10px]">
                <div className="flex justify-center mb-20">
                    <h1 className="text-[34px] font-semibold text-black break-words" style={{ fontFamily: 'Anek Latin' }}>
                        How may we assist you?
                    </h1>
                </div>

                <div className="px-15">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-12 max-w-[1100px]">
                        {/* Left Side: Form */}
                        <div className="space-y-4">
                            {/* Category Dropdown */}
                            <div className="relative">
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full h-14 px-6 rounded-[20px] border-[1.5px] border-[#AEAEAE] text-gray-400 appearance-none focus:outline-none focus:ring-1 focus:ring-black/5 bg-white transition-all text-[16px]"
                                >
                                    <option value="" disabled>Dining / Events / Play</option>
                                    <option value="dining">Dining</option>
                                    <option value="events">Events</option>
                                    <option value="play">Play</option>
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            </div>

                            {/* Full Name */}
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Full name *"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full h-14 px-6 rounded-[20px] border-[1.5px] border-[#AEAEAE] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black/5 transition-all text-[16px]"
                            />

                            {/* Email Address */}
                            <input
                                type="email"
                                name="email"
                                placeholder="Email address *"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full h-14 px-6 rounded-[20px] border-[1.5px] border-[#AEAEAE] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black/5 transition-all text-[16px]"
                            />

                            {/* Mobile Number */}
                            <input
                                type="tel"
                                name="mobileNumber"
                                placeholder="Mobile number *"
                                value={formData.mobileNumber}
                                onChange={handleChange}
                                className="w-full h-14 px-6 rounded-[20px] border-[1.5px] border-[#AEAEAE] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black/5 transition-all text-[16px]"
                            />

                            {/* Issue Textarea */}
                            <textarea
                                name="issue"
                                placeholder="Tell us about your issue *"
                                value={formData.issue}
                                onChange={handleChange}
                                rows={5}
                                className="w-full px-6 py-4 rounded-[20px] border-[1.5px] border-[#AEAEAE] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black/5 transition-all text-[16px] resize-none"
                            />

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    disabled={!isFormValid}
                                    className={`w-[140px] h-14 rounded-[20px] font-bold text-[18px] transition-all duration-300 ${isFormValid
                                        ? 'bg-black text-white shadow-lg active:scale-95'
                                        : 'bg-[#D9D9D9] text-[#9E9E9E] cursor-not-allowed'
                                        }`}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Other Options */}
                        <div className="lg:pt-32">
                            <div className="space-y-2">
                                <h3 className="text-[20px] font-medium text-black">Other options</h3>
                                <p className="text-[15px] md:text-[16px] text-gray-400 leading-relaxed font-medium">
                                    Open the Ticpin website &rarr; Go to your profile &rarr; Tap &ldquo;Chat with us&rdquo; under View all bookings to quickly get help from our support team.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}