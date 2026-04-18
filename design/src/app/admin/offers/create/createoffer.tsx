'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CreateOfferForm({ onBack }: { onBack: () => void }) {
    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [discount, setDiscount] = useState('');

    return (
        <div className="bg-white rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex items-center justify-center gap-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-8 w-full mt-[-60px]">
                {/* Left Column */}
                <div className="space-y-8">
                    {/* Title Field */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Title</label>
                        <input
                            type="text"
                            placeholder="Enter offer title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 text-[#2a2a2a] placeholder:text-gray-300 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                            style={{ fontFamily: 'Anek Latin' }}
                        />
                    </div>

                    {/* Users Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Users</label>
                        <div className="relative">
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 appearance-none bg-white text-gray-400 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                                style={{ fontFamily: 'Anek Latin' }}
                            >
                                <option value="" disabled>Choose Valid Users</option>
                                <option value="all">All Users</option>
                                <option value="new">New Users</option>
                                <option value="returning">Returning Users</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        </div>
                    </div>

                    {/* Discount Percentage */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Discount Percentage</label>
                        <input
                            type="text"
                            placeholder="Enter Discount Percentage"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 text-[#2a2a2a] placeholder:text-gray-300 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                            style={{ fontFamily: 'Anek Latin' }}
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Description Field */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Description</label>
                        <input
                            type="text"
                            placeholder="Enter description here"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 text-[#2a2a2a] placeholder:text-gray-300 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                            style={{ fontFamily: 'Anek Latin' }}
                        />
                    </div>

                    {/* Valid Until Field */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Valid Until</label>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Row 1: Date & Time */}
                            <div className="relative">
                                <select
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 appearance-none bg-white text-gray-400 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                                    style={{ fontFamily: 'Anek Latin' }}
                                >
                                    <option value="" disabled>Select Date</option>
                                    <option value="2024-03-20">20th March 2024</option>
                                    <option value="2024-03-21">21st March 2024</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            </div>

                            <div className="relative">
                                <select
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 appearance-none bg-white text-gray-400 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                                    style={{ fontFamily: 'Anek Latin' }}
                                >
                                    <option value="" disabled>Select Time</option>
                                    <option value="12:00">12:00 PM</option>
                                    <option value="18:00">06:00 PM</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Image Upload box */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Image</label>
                        <div className="w-full h-[84px] border border-[#D9D9D9] rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="shrink-0">
                                <img src="/list your events/doc icon.svg" alt="Upload" className="w-[24px] h-[24px]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[16px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>Upload Image</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-gray-500 font-medium" style={{ fontFamily: 'Anek Latin' }}>Max 50MB</span>
                                    <span className="text-[6px] text-gray-400">●</span>
                                    <span className="text-[11px] text-gray-500 font-medium" style={{ fontFamily: 'Anek Latin' }}>JPEG, JPG, PNG</span>
                                    <span className="text-[6px] text-gray-400">●</span>
                                    <span className="text-[11px] text-gray-500 font-medium" style={{ fontFamily: 'Anek Latin' }}>3:1 aspect ratio</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Button - Bottom Right */}
            <div className="mt-[340px] flex justify-end">
                <button
                    className="w-[80px] h-[48px] bg-[#000000] text-white rounded-[14px] text-[16px] font-semibold"
                    style={{ fontFamily: 'Anek Latin' }}
                    onClick={() => console.log('Create clicked')}
                >
                    Create
                </button>
            </div>
        </div>
    );
}
