'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Minus, Plus, ChevronLeft } from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import { getOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import AuthModal from '@/components/modals/AuthModal';
import OrganizerLogoutModal from '@/components/modals/OrganizerLogoutModal';

interface RealDining {
    id: string;
    name: string;
    city?: string;
    price_starts_from?: number;
    time?: string;
}

interface Offer {
    id: string;
    title: string;
    description?: string;
    image?: string;
    discount_type: 'percent' | 'flat';
    discount_value: number;
    valid_until: string;
}

const DiningBooking: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const name = params?.name ?? '';

    // Generate next 3 days for date selection
    const getNextDays = () => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 2; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push({
                key: date.getDate().toString(),
                label: date.getDate(),
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                fullDate: date
            });
        }
        return days;
    };

    const [venue, setVenue] = useState<RealDining | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMeal, setSelectedMeal] = useState<'lunch' | 'dinner'>('lunch');
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedOfferType, setSelectedOfferType] = useState<'regular' | 'offers'>('offers');
    const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<any>(getNextDays()[0]);
    const [guests, setGuests] = useState(1);
    const [customGuests, setCustomGuests] = useState('');
    const [showCustomGuest, setShowCustomGuest] = useState(false);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [nextDays] = useState(getNextDays());
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const session = useUserSession();
    const organizerSession = getOrganizerSession();

    useEffect(() => {
        if (!name || typeof name !== 'string') return;
        fetch(`/backend/api/dining/${encodeURIComponent(name)}`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: RealDining) => {
                setVenue(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [name]);

    useEffect(() => {
        if (!name || typeof name !== 'string') return;
        fetch(`/backend/api/dining/${encodeURIComponent(name)}/offers`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: Offer[]) => {
                const arr = Array.isArray(data) ? data : [];
                setOffers(arr);
                if (arr.length > 0 && !selectedOfferId) {
                    setSelectedOfferId(arr[0].id);
                    setSelectedOfferType('offers');
                } else if (arr.length === 0) {
                    setSelectedOfferType('regular');
                }
            })
            .catch(() => setOffers([]));
    }, [name]);

    const handleGuestChange = (delta: number) => {
        const newGuests = Math.max(1, Math.min(10, guests + delta));
        setGuests(newGuests);
        setShowCustomGuest(false);
        setCustomGuests('');
    };

    const handleCustomGuest = () => {
        const num = parseInt(customGuests);
        if (!isNaN(num) && num >= 1) {
            setGuests(num);
            setShowCustomGuest(false);
            setCustomGuests('');
        }
    };

    const handleBooking = () => {
        if (organizerSession) {
            setShowLogoutModal(true);
            return;
        }

        if (!session) {
            setShowAuthModal(true);
            return;
        }

        if (!venue || !selectedSlot) {
            alert('Please select a time slot');
            return;
        }

        const cartItem = {
            eventId: venue.id,
            eventName: venue.name,
            city: venue.city || 'Bangalore',
            type: 'dining',
            date: selectedDate.fullDate.toISOString().split('T')[0],
            timeSlot: selectedSlot,
            guests: guests,
            offerId: selectedOfferId,
            offerType: selectedOfferType,
            tickets: [
                {
                    name: `Table Reservation (${guests} Guests)`,
                    price: venue.price_starts_from || 0,
                    quantity: 1
                }
            ],
            totalPrice: (venue.price_starts_from || 0) * guests
        };

        sessionStorage.setItem('dining_cart', JSON.stringify(cartItem));
        router.push(`/dining/venue/${encodeURIComponent(String(name))}/book/review`);
    };

    const handleOrganizerLogout = () => {
        clearOrganizerSession();
        setShowAuthModal(true);
    };

    const lunchSlots = ['12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM'];
    const dinnerSlots = ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM'];
    const currentSlots = selectedMeal === 'lunch' ? lunchSlots : dinnerSlots;

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
                    <span className="font-anek-condensed font-medium text-[20px] text-black rotate-[-90deg]">{selectedDate.month.toUpperCase()}</span>
                </div>

                {nextDays.map((d, i) => (
                    <div
                        key={d.key}
                        className={`absolute w-[53px] h-[66px] rounded-[15px] flex flex-col items-center justify-center pt-1 cursor-pointer transition-all ${selectedDate.key === d.key ? 'bg-black' : 'bg-white border-[0.5px] border-[#686868]'}`}
                        style={{ left: `${(197 + (i * 63)) - offsetX}px`, top: `${386 - offsetY}px` }}
                        onClick={() => setSelectedDate(d)}
                    >
                        <span className={`font-anek-condensed font-medium text-[30px] leading-none ${selectedDate.key === d.key ? 'text-white' : 'text-black'}`}>{d.label}</span>
                        <span className={`font-medium text-[15px] ${selectedDate.key === d.key ? 'text-white' : 'text-[#686868]'}`} style={{ fontFamily: 'var(--font-anek-latin)' }}>{d.day}</span>
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
                    className="absolute h-[66px] border-[0.5px] border-[#686868] rounded-[15px] bg-white flex items-center px-6 transition-all"
                    style={{ left: `${132 - offsetX}px`, top: `${546 - offsetY}px`, width: showCustomGuest ? '500px' : '396px' }}
                >
                    {!showCustomGuest ? (
                        <select
                            className="w-full h-full bg-transparent appearance-none font-medium text-[25px] text-black outline-none cursor-pointer"
                            style={{ fontFamily: 'var(--font-anek-latin)' }}
                            value={guests > 10 ? 'more' : guests}
                            onChange={(e) => {
                                if (e.target.value === 'more') {
                                    setShowCustomGuest(true);
                                } else {
                                    setGuests(Number(e.target.value));
                                }
                            }}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                            ))}
                            <option value="more">More...</option>
                        </select>
                    ) : (
                        <div className="flex items-center w-full gap-4">
                            <input
                                type="number"
                                placeholder="Number of guests"
                                className="flex-1 bg-transparent border-none outline-none text-[25px] font-medium"
                                style={{ fontFamily: 'var(--font-anek-latin)' }}
                                value={customGuests}
                                onChange={(e) => setCustomGuests(e.target.value)}
                                min="1"
                                autoFocus
                            />
                            <button
                                onClick={handleCustomGuest}
                                className="bg-black text-white px-4 py-1 rounded-[8px] text-[18px] font-medium"
                            >
                                Set
                            </button>
                            <button
                                onClick={() => setShowCustomGuest(false)}
                                className="text-[#686868] text-[18px]"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
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

                <div className="absolute flex gap-8 items-start" style={{ left: `${117 - offsetX}px`, top: `${1100 - offsetY}px` }}>
                    {/* Offers List */}
                    <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide max-w-[1100px]">
                        {offers.length > 0 ? (
                            offers.map((offer) => (
                                <div
                                    key={offer.id}
                                    className={`w-[477px] h-[254px] border-[0.5px] rounded-[30px] overflow-hidden bg-white cursor-pointer transition-all flex-shrink-0 flex flex-col ${selectedOfferId === offer.id ? 'border-black shadow-lg scale-[1.02]' : 'border-[#686868] shadow-sm'}`}
                                    onClick={() => {
                                        setSelectedOfferId(offer.id);
                                        setSelectedOfferType('offers');
                                    }}
                                >
                                    <div className={`h-[55px] flex items-center justify-between px-8 transition-colors ${selectedOfferId === offer.id ? 'bg-[#AC9BF7]' : 'bg-[#D9D9D9]'}`}>
                                        <span className="font-medium text-[20px] text-black uppercase truncate max-w-[300px]">{offer.title}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${selectedOfferId === offer.id ? 'bg-black' : 'bg-transparent'}`}>
                                            {selectedOfferId === offer.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                    </div>
                                    <div className="p-6 flex gap-6 h-full items-center">
                                        {offer.image && (
                                            <div className="w-[120px] h-[120px] rounded-[15px] overflow-hidden bg-zinc-100 flex-shrink-0 relative">
                                                <Image src={offer.image} alt={offer.title} fill className="object-cover" />
                                            </div>
                                        )}
                                        <div className="flex flex-col flex-1">
                                            <p className="text-[18px] font-bold text-black uppercase">
                                                {offer.discount_type === 'percent' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
                                            </p>
                                            <p className="text-[#686868] text-[15px] mt-2 line-clamp-2 leading-tight">{offer.description || 'Special booking offer available at venue.'}</p>
                                            <p className="text-[12px] text-[#AEAEAE] mt-auto font-medium">VALID UNTIL {new Date(offer.valid_until).toLocaleDateString().toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : null}

                        {/* Regular Booking Option */}
                        <div
                            className={`w-[477px] h-[254px] border-[0.5px] rounded-[30px] overflow-hidden bg-white cursor-pointer transition-all flex-shrink-0 ${selectedOfferType === 'regular' ? 'border-black shadow-lg' : 'border-[#686868] shadow-sm'}`}
                                onClick={() => {
                                    setSelectedOfferType('regular');
                                    setSelectedOfferId(null);
                                }}
                        >
                            <div className={`h-[55px] flex items-center justify-between px-8 transition-colors ${selectedOfferType === 'regular' ? 'bg-[#AC9BF7]' : 'bg-[#D9D9D9]'}`}>
                                <span className="font-medium text-[25px] text-black">Regular Booking</span>
                                <div className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${selectedOfferType === 'regular' ? 'bg-black' : 'bg-transparent'}`}>
                                    {selectedOfferType === 'regular' && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                            </div>
                            <div className="p-8">
                                <p className="text-[#686868] text-lg leading-tight">Standard table reservation. No special offers included at this time.</p>
                            </div>
                        </div>
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

            {/* Bottom Offers Info (Only if offers exist and none selected yet, or just as info) */}
            {offers.length > 0 && (
                <div className="w-full max-w-[1278px] mt-8 bg-white rounded-[20px] p-8 space-y-4 shadow-[0px_4px_24px_rgba(0,0,0,0.05)]">
                    <h2 className="text-[24px] font-semibold text-black uppercase" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        Featured Offers
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {offers.map((offer, idx) => (
                            <div key={idx} className={`flex items-center gap-4 p-4 border rounded-[15px] transition-all ${selectedOfferId === offer.id ? 'bg-[#F5F3FF] border-[#7B2FF7]' : 'bg-white border-[#E5E5E5]'}`}>
                                {offer.image && (
                                    <div className="w-16 h-16 rounded-lg overflow-hidden relative flex-shrink-0">
                                        <Image src={offer.image} alt={offer.title} fill className="object-cover" />
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <p className="text-[16px] font-semibold text-black uppercase">{offer.title}</p>
                                    <p className="text-[13px] text-[#686868]">
                                        {offer.discount_type === 'percent' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedOfferId(offer.id);
                                        setSelectedOfferType('offers');
                                        window.scrollTo({ top: 1000, behavior: 'smooth' });
                                    }}
                                    className={`px-6 py-2 rounded-lg font-bold text-[12px] uppercase transition-all ${selectedOfferId === offer.id ? 'bg-[#7B2FF7] text-white' : 'bg-zinc-100 text-black'}`}
                                >
                                    {selectedOfferId === offer.id ? 'SELECTED' : 'SELECT'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => {
                    setShowAuthModal(false);
                    handleBooking();
                }}
            />
            
            <OrganizerLogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleOrganizerLogout}
                organizerName={organizerSession?.email}
            />
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