'use client';

import React from 'react';
import Image from 'next/image';

interface DiningBookingProps {
    onBack?: () => void;
}

const DiningBooking: React.FC<DiningBookingProps> = ({ onBack }) => {
    // State management
    const [selectedMeal, setSelectedMeal] = React.useState<'lunch' | 'dinner'>('lunch');
    const [selectedSlot, setSelectedSlot] = React.useState<string | null>('1:30 PM');
    const [selectedOffer, setSelectedOffer] = React.useState<'offers' | 'regular' | null>('offers');
    const [selectedDate, setSelectedDate] = React.useState<string>('14A'); // Use unique keys for identical dates

    // Normalizing coordinates by subtracting offsets
    const offsetX = 80;
    const offsetY = 180;

    return (
        <div className="w-full flex flex-col items-center bg-[#ECE8FD] min-h-screen py-10 overflow-x-auto">
            {/* The main white layout container */}
            <div
                className="relative bg-white rounded-[30px] shadow-[0px_4px_24px_rgba(0,0,0,0.05)] shrink-0 overflow-hidden"
                style={{ width: '1278px', height: '1350px' }}
            >

                {/* Book a table */}
                <h1
                    className="absolute font-medium text-[40px] leading-[44px] text-black"
                    style={{ left: `${120 - offsetX}px`, top: `${222 - offsetY}px`, fontFamily: 'var(--font-anek-latin)' }}
                >
                    Book a table
                </h1>

                {/* Dining Name */}
                <p
                    className="absolute font-medium text-[25px] leading-[200%] text-[#686868]"
                    style={{ left: `${121 - offsetX}px`, top: `${259 - offsetY}px`, fontFamily: 'var(--font-anek-latin)' }}
                >
                    Dining Name
                </p>

                {/* SELECT DATE & TIME */}
                <h2
                    className="absolute font-anek-condensed font-medium text-[30px] leading-[200%] text-black uppercase"
                    style={{ left: `${121 - offsetX}px`, top: `${317 - offsetY}px` }}
                >
                    SELECT DATE & TIME
                </h2>

                {/* Line 78 */}
                <div
                    className="absolute h-[0px] border-[0.5px] border-[#AEAEAE]"
                    style={{ width: '1050px', left: `${308 - offsetX}px`, top: `${345 - offsetY}px` }}
                />

                {/* Month/Dates Section */}
                <div
                    className="absolute w-[53px] h-[66px] bg-[#D9D9D9] rounded-[15px] flex items-center justify-center"
                    style={{ left: `${134 - offsetX}px`, top: `${386 - offsetY}px` }}
                >
                    <span
                        className="font-anek-condensed font-medium text-[20px] text-black rotate-[-90deg]"
                    >
                        MONTH
                    </span>
                </div>

                {/* Date 14 (Box A) */}
                <div
                    className={`absolute w-[53px] h-[66px] rounded-[15px] flex flex-col items-center justify-center pt-1 cursor-pointer transition-all ${selectedDate === '14A' ? 'bg-black' : 'bg-white border-[0.5px] border-[#686868]'}`}
                    style={{ left: `${197 - offsetX}px`, top: `${386 - offsetY}px` }}
                    onClick={() => setSelectedDate('14A')}
                >
                    <span className={`font-anek-condensed font-medium text-[30px] leading-none ${selectedDate === '14A' ? 'text-white' : 'text-black'}`}>14</span>
                    <span className={`font-medium text-[15px] ${selectedDate === '14A' ? 'text-white' : 'text-[#686868]'}`} style={{ fontFamily: 'var(--font-anek-latin)' }}>Sat</span>
                </div>

                {/* Date 14 (Box B) */}
                <div
                    className={`absolute w-[53px] h-[66px] rounded-[15px] flex flex-col items-center justify-center pt-1 cursor-pointer transition-all ${selectedDate === '14B' ? 'bg-black' : 'bg-white border-[0.5px] border-[#686868]'}`}
                    style={{ left: `${260 - offsetX}px`, top: `${386 - offsetY}px` }}
                    onClick={() => setSelectedDate('14B')}
                >
                    <span className={`font-anek-condensed font-medium text-[30px] leading-none ${selectedDate === '14B' ? 'text-white' : 'text-black'}`}>15</span>
                    <span className={`font-medium text-[15px] ${selectedDate === '14B' ? 'text-white' : 'text-[#686868]'}`} style={{ fontFamily: 'var(--font-anek-latin)' }}>Sun</span>
                </div>

                {/* SELECT NUMBER OF GUESTS */}
                <h2
                    className="absolute font-anek-condensed font-medium text-[30px] leading-[200%] text-black uppercase"
                    style={{ left: `${121 - offsetX}px`, top: `${473 - offsetY}px` }}
                >
                    SELECT NUMBER OF GUESTS
                </h2>

                {/* Line 79 */}
                <div
                    className="absolute h-[0px] border-[0.5px] border-[#AEAEAE]"
                    style={{ width: '989px', left: `${369 - offsetX}px`, top: `${501 - offsetY}px` }}
                />

                {/* Guests Box */}
                <div
                    className="absolute w-[396px] h-[66px] border-[0.5px] border-[#686868] rounded-[15px] bg-white flex items-center justify-between px-6 cursor-pointer"
                    style={{ left: `${132 - offsetX}px`, top: `${546 - offsetY}px` }}
                >
                    <span className="font-medium text-[25px] text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        Select number of guests
                    </span>
                    <div className="flex items-center gap-3 bg-[#D9D9D9] px-4 py-1.5 rounded-[11px] h-[41px]">
                        <span className="font-medium text-[20px] text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>2</span>
                        <Image
                            src="/dining/diningBookingDetails/Polygon-icon.svg"
                            alt="Dropdown"
                            width={13}
                            height={13}
                            className="rotate-360"
                        />
                    </div>
                </div>

                {/* AVAILABLE TIME SLOTS */}
                <h2
                    className="absolute font-anek-condensed font-medium text-[30px] leading-[200%] text-black uppercase"
                    style={{ left: `${121 - offsetX}px`, top: `${632 - offsetY}px` }}
                >
                    AVAILABLE TIME SLOTS
                </h2>

                {/* Line 80 */}
                <div
                    className="absolute h-[0px] border-[0.5px] border-[#AEAEAE]"
                    style={{ width: '1025px', left: `${333 - offsetX}px`, top: `${661 - offsetY}px` }}
                />

                {/* Lunch/Dinner Tabs */}
                <div
                    className={`absolute w-[94px] h-[41px] rounded-[25px] flex items-center justify-center cursor-pointer transition-colors ${selectedMeal === 'lunch' ? 'bg-[#D9D9D9]' : 'bg-white border border-[#D9D9D9]'}`}
                    style={{ left: `${121 - offsetX}px`, top: `${701 - offsetY}px` }}
                    onClick={() => setSelectedMeal('lunch')}
                >
                    <span className="font-medium text-[20px] text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Lunch</span>
                </div>
                <div
                    className={`absolute w-[94px] h-[41px] rounded-[25px] flex items-center justify-center cursor-pointer transition-colors ${selectedMeal === 'dinner' ? 'bg-[#D9D9D9]' : 'bg-white border border-[#D9D9D9]'}`}
                    style={{ left: `${225 - offsetX}px`, top: `${701 - offsetY}px` }}
                    onClick={() => setSelectedMeal('dinner')}
                >
                    <span className="font-medium text-[20px] text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Dinner</span>
                </div>

                {/* Time Slots Grid */}
                <TimeSlot time="1:30 PM" left={134 - offsetX} top={766 - offsetY} active={selectedSlot === '1:30 PM'} onClick={() => setSelectedSlot('1:30 PM')} />
                <TimeSlot time="1:45 PM" left={286 - offsetX} top={766 - offsetY} active={selectedSlot === '1:45 PM'} onClick={() => setSelectedSlot('1:45 PM')} />
                <TimeSlot time="2:00 PM" left={438 - offsetX} top={765 - offsetY} active={selectedSlot === '2:00 PM'} onClick={() => setSelectedSlot('2:00 PM')} />
                <TimeSlot time="2:15 PM" left={590 - offsetX} top={765 - offsetY} active={selectedSlot === '2:15 PM'} onClick={() => setSelectedSlot('2:15 PM')} />
                <TimeSlot time="2:30 PM" left={742 - offsetX} top={764 - offsetY} active={selectedSlot === '2:30 PM'} onClick={() => setSelectedSlot('2:30 PM')} />
                <TimeSlot time="2:45 PM" left={894 - offsetX} top={765 - offsetY} active={selectedSlot === '2:45 PM'} onClick={() => setSelectedSlot('2:45 PM')} />
                <TimeSlot time="3:00 PM" left={1046 - offsetX} top={765 - offsetY} active={selectedSlot === '3:00 PM'} onClick={() => setSelectedSlot('3:00 PM')} />
                <TimeSlot time="3:15 PM" left={1198 - offsetX} top={764 - offsetY} active={selectedSlot === '3:15 PM'} onClick={() => setSelectedSlot('3:15 PM')} />

                <TimeSlot time="4:30 PM" left={134 - offsetX} top={853 - offsetY} active={selectedSlot === '4:30 PM'} onClick={() => setSelectedSlot('4:30 PM')} />
                <TimeSlot time="4:45 PM" left={286 - offsetX} top={853 - offsetY} active={selectedSlot === '4:45 PM'} onClick={() => setSelectedSlot('4:45 PM')} />
                <TimeSlot time="5:00 PM" left={438 - offsetX} top={852 - offsetY} active={selectedSlot === '5:00 PM'} onClick={() => setSelectedSlot('5:00 PM')} />
                <TimeSlot time="5:15 PM" left={590 - offsetX} top={852 - offsetY} active={selectedSlot === '5:15 PM'} onClick={() => setSelectedSlot('5:15 PM')} />
                <TimeSlot time="5:30 PM" left={742 - offsetX} top={852 - offsetY} active={selectedSlot === '5:30 PM'} onClick={() => setSelectedSlot('5:30 PM')} />
                <TimeSlot time="5:45 PM" left={894 - offsetX} top={852 - offsetY} active={selectedSlot === '5:45 PM'} onClick={() => setSelectedSlot('5:45 PM')} />
                <TimeSlot time="6:00 PM" left={1046 - offsetX} top={852 - offsetY} active={selectedSlot === '6:00 PM'} onClick={() => setSelectedSlot('6:00 PM')} />
                <TimeSlot time="6:15 PM" left={1198 - offsetX} top={852 - offsetY} active={selectedSlot === '6:15 PM'} onClick={() => setSelectedSlot('6:15 PM')} />

                {/* View all slots */}
                <div
                    className="absolute flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
                    style={{ left: '522px', top: `${958 - offsetY}px` }}
                >
                    <span className="font-medium text-[20px] text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>View all available slots</span>
                    <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="black"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-[4px]"
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>

                {/* AVAILABLE OFFERS */}
                <h2
                    className="absolute font-anek-condensed font-medium text-[30px] leading-[200%] text-black uppercase"
                    style={{ left: `${117 - offsetX}px`, top: `${1018 - offsetY}px` }}
                >
                    AVAILABLE OFFERS
                </h2>

                {/* Line 81 */}
                <div
                    className="absolute h-[0px] border-[0.5px] border-[#AEAEAE]"
                    style={{ width: '1062px', left: `${302 - offsetX}px`, top: `${1047 - offsetY}px` }}
                />

                <p
                    className="absolute font-medium text-[20px] text-[#686868]"
                    style={{ left: `${117 - offsetX}px`, top: `${1056 - offsetY}px`, fontFamily: 'var(--font-anek-latin)' }}
                >
                    Choose one dining offer to continue
                </p>

                {/* Offer Card 1 */}
                <div
                    className={`absolute w-[477px] h-[254px] border-[0.5px] rounded-[30px] overflow-hidden bg-white cursor-pointer transition-all ${selectedOffer === 'offers' ? 'border-black' : 'border-[#686868]'}`}
                    style={{ left: `${193 - offsetX}px`, top: `${1116 - offsetY}px` }}
                    onClick={() => setSelectedOffer('offers')}
                >
                    <div className={`h-[55px] flex items-center justify-between px-8 transition-colors ${selectedOffer === 'offers' ? 'bg-[#AC9BF7]' : 'bg-[#D9D9D9]'}`}>
                        <span className="font-medium text-[25px] text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Offers</span>
                        <div className="w-[18px] h-[18px] border-2 border-white rounded-full flex items-center justify-center">
                            {selectedOffer === 'offers' && <div className="w-[8px] h-[8px] bg-white rounded-full"></div>}
                        </div>
                    </div>
                    <div className="flex flex-col h-[calc(254px-55px)] relative">
                        <div className="flex-1 flex items-center justify-center pt-4">
                            <div className="relative w-[288px] h-[120px]">
                                <Image src="/dining/diningBookingDetails/Ticket-icon.svg" alt="Ticket" fill className="object-contain" />
                            </div>
                        </div>
                        <p className="font-medium text-[20px] text-[#686868] px-8 pb-5 text-left" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            Any covers charges if appilicable
                        </p>
                    </div>
                </div>

                {/* Offer Card 2 */}
                <div
                    className={`absolute w-[477px] h-[254px] border-[0.5px] rounded-[30px] overflow-hidden bg-white cursor-pointer transition-all ${selectedOffer === 'regular' ? 'border-black' : 'border-[#686868]'}`}
                    style={{ left: `${770 - offsetX}px`, top: `${1116 - offsetY}px` }}
                    onClick={() => setSelectedOffer('regular')}
                >
                    <div className={`h-[55px] flex items-center justify-between px-8 transition-colors ${selectedOffer === 'regular' ? 'bg-[#AC9BF7]' : 'bg-[#D9D9D9]'}`}>
                        <span className="font-medium text-[25px] text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Regular Table Reservation</span>
                        <div className="w-[18px] h-[18px] border-2 border-white rounded-full flex items-center justify-center">
                            {selectedOffer === 'regular' && <div className="w-[8px] h-[8px] bg-white rounded-full"></div>}
                        </div>
                    </div>
                    <div className="flex flex-col h-[calc(254px-55px)] relative">
                        <div className="flex-1 flex items-center justify-center pt-4">
                            <div className="relative w-[110px] h-[98px]">
                                <Image src="/dining/diningBookingDetails/Dining-icon.svg" alt="Dining" fill className="object-contain" />
                            </div>
                        </div>
                        <p className="font-medium text-[20px] text-[#686868] px-8 pb-6 text-left" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            No cover charge required
                        </p>
                    </div>
                </div>

                {/* Footer Line */}
                <div
                    className="absolute h-[0px] border border-[#686868]"
                    style={{ width: '1181px', left: `${130 - offsetX}px`, top: `${1410 - offsetY}px` }}
                />

                {/* BOOK SLOTS Button */}
                <button
                    className="absolute w-[1181px] h-[47px] bg-black rounded-[8px] flex items-center justify-center hover:opacity-90 active:scale-[0.99] transition-all"
                    style={{ left: `${130 - offsetX}px`, top: `${1440 - offsetY}px` }}
                    onClick={() => alert(`Booking confirmed for ${selectedSlot} (${selectedMeal})\nOffer: ${selectedOffer}`)}
                >
                    <span
                        className="font-anek-condensed font-medium text-[40px] text-white uppercase"
                    >
                        BOOK SLOTS
                    </span>
                </button>
            </div>
        </div>
    );
};

// Helper for TimeSlot with exact positioning
const TimeSlot = ({ time, left, top, active = false, onClick }: { time: string, left: number, top: number, active?: boolean, onClick?: () => void }) => (
    <div
        className={`absolute w-[132px] h-[66px] rounded-[15px] border-[0.5px] flex flex-col items-center justify-center cursor-pointer transition-all ${active ? 'bg-[#D9D9D9] border-transparent' : 'border-[#686868] bg-white hover:border-black'}`}
        style={{ left: `${left}px`, top: `${top}px` }}
        onClick={onClick}
    >
        <span className="font-anek-condensed font-medium text-[30px] text-black leading-none">{time}</span>
        <span className="font-medium text-[15px] text-[#5331EA] leading-none mt-1" style={{ fontFamily: 'var(--font-anek-latin)' }}>OFFERS</span>
    </div>
);

export default DiningBooking;