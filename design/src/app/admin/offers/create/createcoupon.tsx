'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CreateCouponPage({ onBack }: { onBack: () => void }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [discount, setDiscount] = useState('');

    return (
        <div className="bg-white rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex items-center justify-center gap-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-8 w-full">
                {/* Left Column */}
                <div className="space-y-8">
                    {/* Title Field */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Title</label>
                            <span className="text-[#5331EA] text-[13px] font-medium" style={{ fontFamily: 'Anek Latin' }}>ex: FLAT 50% OFF</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Enter Coupon title"
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

                    {/* Discount Percentage Field */}
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

                    {/* Valid Until Field - 2x2 Grid */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Valid Until</label>
                        <div className="flex flex-col gap-3">
                            {/* Row 1: Date & Time */}
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <select
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 appearance-none bg-white text-gray-400 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                                        style={{ fontFamily: 'Anek Latin' }}
                                    >
                                        <option value="" disabled>Start Date</option>
                                        <option value="today">Today</option>
                                        <option value="tomorrow">Tomorrow</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                </div>

                                <div className="relative flex-1">
                                    <select
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 appearance-none bg-white text-gray-400 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                                        style={{ fontFamily: 'Anek Latin' }}
                                    >
                                        <option value="" disabled>Start Time</option>
                                        <option value="09:00">09:00 AM</option>
                                        <option value="12:00">12:00 PM</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                </div>
                            </div>

                            {/* Row 2: End Date & Time */}
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <select
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 appearance-none bg-white text-gray-400 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                                        style={{ fontFamily: 'Anek Latin' }}
                                    >
                                        <option value="" disabled>End Date</option>
                                        <option value="next-week">Next Week</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                </div>

                                <div className="relative flex-1">
                                    <select
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 appearance-none bg-white text-gray-400 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                                        style={{ fontFamily: 'Anek Latin' }}
                                    >
                                        <option value="" disabled>End Time</option>
                                        <option value="18:00">06:00 PM</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Button - Bottom Right */}
            <div className="mt-80 flex">
                <button
                    className="w-[80px] h-[48px] bg-[#000000] text-white rounded-[14px] text-[16px] font-bold"
                    style={{ fontFamily: 'Anek Latin' }}
                    onClick={() => console.log('Create clicked')}
                >
                    Create
                </button>
            </div>
        </div>
    );
}
