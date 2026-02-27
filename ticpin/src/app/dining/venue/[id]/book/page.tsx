'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

interface RealDining {
    id: string;
    name: string;
    city?: string;
    price_starts_from?: number;
    time?: string;
}

const DiningBooking: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const id = params?.id ?? '';

    const [venue, setVenue] = useState<RealDining | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMeal, setSelectedMeal] = useState<'lunch' | 'dinner'>('lunch');
    const [selectedSlot, setSelectedSlot] = useState<string | null>('1:30 PM');
    const [selectedOffer, setSelectedOffer] = useState<'offers' | 'regular' | null>('offers');
    const [selectedDate, setSelectedDate] = useState<string>('27');
    const [guests, setGuests] = useState(2);

    useEffect(() => {
        if (!id) return;
        fetch(`/backend/api/dining/${id}`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: RealDining) => {
                setVenue(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const handleBooking = () => {
        if (!venue || !selectedSlot) {
            alert('Please select a time slot');
            return;
        }

        const pricePerPerson = 0;
        const cartItem = {
            eventId: venue.id,
            eventName: venue.name,
            city: venue.city || 'Bangalore',
            type: 'dining',
            date: selectedDate,
            timeSlot: selectedSlot,
            guests: guests,
            tickets: [
                {
                    name: `Table Reservation (${guests} Guests)`,
                    price: pricePerPerson,
                    quantity: 1
                }
            ],
            totalPrice: 0
        };

        localStorage.setItem('ticpin_cart', JSON.stringify(cartItem));
        router.push(`/events/${venue.id}/book/review`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!venue) return <div className="text-center py-20">Restaurant not found</div>;

    const offsetX = 80;
    const offsetY = 180;

    return (
        <div className="w-full flex flex-col items-center bg-[#ECE8FD] min-h-screen py-10 overflow-x-auto">
            <div
                className="relative bg-white rounded-[30px] shadow-[0px_4px_24px_rgba(0,0,0,0.05)] shrink-0 overflow-hidden"
                style={{ width: '1278px', height: '1350px' }}
            >
                <h1
                    className="absolute font-medium text-[40px] leading-[44px] text-black uppercase"
                    style={{ left: `${120 - offsetX}px`, top: `${222 - offsetY}px`, fontFamily: 'var(--font-anek-latin)' }}
                >
                    Book a table
                </h1>

                <p
                    className="absolute font-medium text-[25px] leading-[200%] text-[#686868] uppercase"
                    style={{ left: `${121 - offsetX}px`, top: `${259 - offsetY}px`, fontFamily: 'var(--font-anek-latin)' }}
                >
                    {venue.name}
                </p>

                <h2
                    className="absolute font-anek-condensed font-medium text-[30px] leading-[200%] text-black uppercase"
                    style={{ left: `${121 - offsetX}px`, top: `${317 - offsetY}px` }}
                >
                    SELECT DATE & TIME
                </h2>

                <div
                    className="absolute h-[0px] border-[0.5px] border-[#AEAEAE]"
                    style={{ width: '1050px', left: `${308 - offsetX}px`, top: `${345 - offsetY}px` }}
                />

                <div
                    className="absolute w-[53px] h-[66px] bg-[#D9D9D9] rounded-[15px] flex items-center justify-center"
                    style={{ left: `${134 - offsetX}px`, top: `${386 - offsetY}px` }}
                >
                    <span className="font-anek-condensed font-medium text-[20px] text-black rotate-[-90deg]">FEB</span>
                </div>

                {[
                    { key: '27', label: '27', day: 'Fri' },
                    { key: '28', label: '28', day: 'Sat' },
                    { key: '01', label: '01', day: 'Sun' },
                ].map((d, i) => (
                    <div
                        key={d.key}
                        className={`absolute w-[53px] h-[66px] rounded-[15px] flex flex-col items-center justify-center pt-1 cursor-pointer transition-all ${selectedDate === d.key ? 'bg-black' : 'bg-white border-[0.5px] border-[#686868]'}`}
                        style={{ left: `${(197 + (i * 63)) - offsetX}px`, top: `${386 - offsetY}px` }}
                        onClick={() => setSelectedDate(d.key)}
                    >
                        <span className={`font-anek-condensed font-medium text-[30px] leading-none ${selectedDate === d.key ? 'text-white' : 'text-black'}`}>{d.label}</span>
                        <span className={`font-medium text-[15px] ${selectedDate === d.key ? 'text-white' : 'text-[#686868]'}`} style={{ fontFamily: 'var(--font-anek-latin)' }}>{d.day}</span>
                    </div>
                ))}

                <h2
                    className="absolute font-anek-condensed font-medium text-[30px] leading-[200%] text-black uppercase"
                    style={{ left: `${121 - offsetX}px`, top: `${473 - offsetY}px` }}
                >
                    SELECT NUMBER OF GUESTS
                </h2>

                <div
                    className="absolute h-[0px] border-[0.5px] border-[#AEAEAE]"
                    style={{ width: '989px', left: `${369 - offsetX}px`, top: `${501 - offsetY}px` }}
                />

                <div
                    className="absolute w-[396px] h-[66px] border-[0.5px] border-[#686868] rounded-[15px] bg-white flex items-center justify-between px-6 cursor-pointer"
                    style={{ left: `${132 - offsetX}px`, top: `${546 - offsetY}px` }}
                >
                    <select
                        className="w-full h-full bg-transparent appearance-none font-medium text-[25px] text-black outline-none"
                        style={{ fontFamily: 'var(--font-anek-latin)' }}
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <option key={n} value={n}>{n} Guests</option>
                        ))}
                    </select>
                </div>

                <h2
                    className="absolute font-anek-condensed font-medium text-[30px] leading-[200%] text-black uppercase"
                    style={{ left: `${121 - offsetX}px`, top: `${632 - offsetY}px` }}
                >
                    AVAILABLE TIME SLOTS
                </h2>

                <div
                    className="absolute h-[0px] border-[0.5px] border-[#AEAEAE]"
                    style={{ width: '1025px', left: `${333 - offsetX}px`, top: `${661 - offsetY}px` }}
                />

                <div className="absolute flex gap-4" style={{ left: `${121 - offsetX}px`, top: `${701 - offsetY}px` }}>
                    {['lunch', 'dinner'].map((meal) => (
                        <div
                            key={meal}
                            className={`w-[94px] h-[41px] rounded-[25px] flex items-center justify-center cursor-pointer transition-colors uppercase ${selectedMeal === meal ? 'bg-[#D9D9D9]' : 'bg-white border border-[#D9D9D9]'}`}
                            onClick={() => setSelectedMeal(meal as 'lunch' | 'dinner')}
                        >
                            <span className="font-medium text-[20px] text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>{meal}</span>
                        </div>
                    ))}
                </div>

                {/* Slots */}
                <TimeSlot time="12:30 PM" left={134 - offsetX} top={766 - offsetY} active={selectedSlot === '12:30 PM'} onClick={() => setSelectedSlot('12:30 PM')} />
                <TimeSlot time="01:00 PM" left={286 - offsetX} top={766 - offsetY} active={selectedSlot === '01:00 PM'} onClick={() => setSelectedSlot('01:00 PM')} />
                <TimeSlot time="01:30 PM" left={438 - offsetX} top={766 - offsetY} active={selectedSlot === '01:30 PM'} onClick={() => setSelectedSlot('01:30 PM')} />
                <TimeSlot time="02:00 PM" left={590 - offsetX} top={766 - offsetY} active={selectedSlot === '02:00 PM'} onClick={() => setSelectedSlot('02:00 PM')} />
                <TimeSlot time="02:30 PM" left={742 - offsetX} top={766 - offsetY} active={selectedSlot === '02:30 PM'} onClick={() => setSelectedSlot('02:30 PM')} />
                <TimeSlot time="03:00 PM" left={894 - offsetX} top={766 - offsetY} active={selectedSlot === '03:00 PM'} onClick={() => setSelectedSlot('03:00 PM')} />
                <TimeSlot time="03:30 PM" left={1046 - offsetX} top={766 - offsetY} active={selectedSlot === '03:30 PM'} onClick={() => setSelectedSlot('03:30 PM')} />
                <TimeSlot time="04:00 PM" left={1198 - offsetX} top={766 - offsetY} active={selectedSlot === '04:00 PM'} onClick={() => setSelectedSlot('04:00 PM')} />

                <TimeSlot time="07:00 PM" left={134 - offsetX} top={853 - offsetY} active={selectedSlot === '07:00 PM'} onClick={() => setSelectedSlot('07:00 PM')} />
                <TimeSlot time="07:30 PM" left={286 - offsetX} top={853 - offsetY} active={selectedSlot === '07:30 PM'} onClick={() => setSelectedSlot('07:30 PM')} />
                <TimeSlot time="08:00 PM" left={438 - offsetX} top={853 - offsetY} active={selectedSlot === '08:00 PM'} onClick={() => setSelectedSlot('08:00 PM')} />
                <TimeSlot time="08:30 PM" left={590 - offsetX} top={853 - offsetY} active={selectedSlot === '08:30 PM'} onClick={() => setSelectedSlot('08:30 PM')} />
                <TimeSlot time="09:00 PM" left={742 - offsetX} top={853 - offsetY} active={selectedSlot === '09:00 PM'} onClick={() => setSelectedSlot('09:00 PM')} />
                <TimeSlot time="09:30 PM" left={894 - offsetX} top={853 - offsetY} active={selectedSlot === '09:30 PM'} onClick={() => setSelectedSlot('09:30 PM')} />
                <TimeSlot time="10:00 PM" left={1046 - offsetX} top={853 - offsetY} active={selectedSlot === '10:00 PM'} onClick={() => setSelectedSlot('10:00 PM')} />
                <TimeSlot time="10:30 PM" left={1198 - offsetX} top={853 - offsetY} active={selectedSlot === '10:30 PM'} onClick={() => setSelectedSlot('10:30 PM')} />

                <h2
                    className="absolute font-anek-condensed font-medium text-[30px] leading-[200%] text-black uppercase"
                    style={{ left: `${117 - offsetX}px`, top: `${1018 - offsetY}px` }}
                >
                    AVAILABLE OFFERS
                </h2>

                <div
                    className="absolute h-[0px] border-[0.5px] border-[#AEAEAE]"
                    style={{ width: '1062px', left: `${302 - offsetX}px`, top: `${1047 - offsetY}px` }}
                />

                <div
                    className={`absolute w-[477px] h-[254px] border-[0.5px] rounded-[30px] overflow-hidden bg-white cursor-pointer transition-all ${selectedOffer === 'offers' ? 'border-black shadow-lg' : 'border-[#686868]'}`}
                    style={{ left: `${193 - offsetX}px`, top: `${1116 - offsetY}px` }}
                    onClick={() => setSelectedOffer('offers')}
                >
                    <div className={`h-[55px] flex items-center justify-between px-8 transition-colors ${selectedOffer === 'offers' ? 'bg-[#AC9BF7]' : 'bg-[#D9D9D9]'}`}>
                        <span className="font-medium text-[25px] text-black">Offers Available</span>
                        {selectedOffer === 'offers' && <div className="w-4 h-4 bg-white rounded-full" />}
                    </div>
                    <div className="p-8">
                        <p className="text-[#686868] text-lg">Indulge in our special booking offers. Discounts applied at venue.</p>
                    </div>
                </div>

                <div
                    className={`absolute w-[477px] h-[254px] border-[0.5px] rounded-[30px] overflow-hidden bg-white cursor-pointer transition-all ${selectedOffer === 'regular' ? 'border-black shadow-lg' : 'border-[#686868]'}`}
                    style={{ left: `${770 - offsetX}px`, top: `${1116 - offsetY}px` }}
                    onClick={() => setSelectedOffer('regular')}
                >
                    <div className={`h-[55px] flex items-center justify-between px-8 transition-colors ${selectedOffer === 'regular' ? 'bg-[#AC9BF7]' : 'bg-[#D9D9D9]'}`}>
                        <span className="font-medium text-[25px] text-black">Regular Booking</span>
                        {selectedOffer === 'regular' && <div className="w-4 h-4 bg-white rounded-full" />}
                    </div>
                    <div className="p-8">
                        <p className="text-[#686868] text-lg">Standard table reservation. No special offers included.</p>
                    </div>
                </div>

                <button
                    className="absolute w-[1181px] h-[60px] bg-black rounded-[15px] flex items-center justify-center hover:opacity-90 active:scale-[0.99] transition-all"
                    style={{ left: `${130 - offsetX}px`, top: `${1440 - offsetY}px` }}
                    onClick={handleBooking}
                >
                    <span className="font-anek-condensed font-medium text-[40px] text-white uppercase transform scale-y-125">BOOK SLOTS</span>
                </button>
            </div>
        </div>
    );
};

const TimeSlot = ({ time, left, top, active = false, onClick }: { time: string, left: number, top: number, active?: boolean, onClick?: () => void }) => (
    <div
        className={`absolute w-[132px] h-[66px] rounded-[15px] border-[0.5px] flex flex-col items-center justify-center cursor-pointer transition-all ${active ? 'bg-black text-white border-transparent' : 'border-[#686868] bg-white hover:border-black'}`}
        style={{ left: `${left}px`, top: `${top}px` }}
        onClick={onClick}
    >
        <span className={`font-anek-condensed font-medium text-[24px] leading-none ${active ? 'text-white' : 'text-black'}`}>{time}</span>
        <span className={`font-medium text-[12px] leading-none mt-1 ${active ? 'text-zinc-400' : 'text-[#5331EA]'}`}>AVAILABLE</span>
    </div>
);

export default DiningBooking;