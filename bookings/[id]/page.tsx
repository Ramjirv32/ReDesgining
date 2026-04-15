'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, MessageSquare, User, X, XCircle } from 'lucide-react';
import { useState } from 'react';

export default function BookingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [isCancelled, setIsCancelled] = useState(false);

    const reasons = [
        "Plan change",
        "Found a better offer elsewhere",
        "Booked by mistake",
        "Others"
    ];

    // Mock data based on placeholders in the design
    const booking = {
        playName: '{PLAY NAME}',
        address: '{ADDRESS}',
        dateTime: '{DAY} {DATE} {MONTH} | {TIME}',
        playDuration: '{TIME}',
        location: '{LOCATION}',
        offer: '{OFFER}',
        userName: '{USER NAME}',
        userContact: '{USER CONTACT NUM}',
        bookingId: '{BOOKING ID}',
        bookingDate: '{BOOKING DATE}'
    };

    return (
        <div className={`min-h-screen bg-white font-[family-name:var(--font-anek-latin)] pb-20 relative ${(isCancelModalOpen) ? 'overflow-hidden' : ''}`}>
            {/* Header */}
            <header className="h-16 md:h-20 w-full bg-white border-b border-[#D9D9D9] flex items-center px-4 md:px-10 lg:px-[37px] relative sticky top-0 z-50">
                <div className="flex items-center gap-4 md:gap-10">
                    <Link href="/">
                        <img src="/ticpin-logo-black.png" alt="TICPIN" className="h-6 md:h-7 w-auto" />
                    </Link>
                    
                    <div className="hidden md:flex items-center gap-8">
                        {/* Divider Line */}
                        <div className="w-[1.5px] h-8 bg-[#AEAEAE] mx-1" />
                        
                        <div className="flex items-center gap-6">
                            {/* Venue Thumbnail Placeholder */}
                            <div className="w-[85px] h-[48px] bg-[#FFEF9A] rounded-[10px]" />
                            
                            <div className="flex flex-col justify-center">
                                <h2 className="text-[18px] font-medium text-black leading-tight uppercase tracking-tight">{booking.playName}</h2>
                                <p className="text-[15px] font-medium text-[#686868] leading-tight uppercase tracking-tight mt-0.5">{booking.address}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[787px] mx-auto px-4 mt-10 md:mt-[45px] space-y-10">
                {/* Main Booking Card (Confirm/Cancel state) */}
                <div className="relative bg-white border-[0.5px] border-[#686868] rounded-[25px] overflow-hidden">
                    {/* Gradient Background Overlay */}
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-100 transition-colors duration-500"
                        style={{ 
                            background: isCancelled 
                                ? 'radial-gradient(52.97% 102.98% at 0% -7.55%, #FFD6D6 0%, #FFFFFF 100%)'
                                : 'radial-gradient(52.97% 102.98% at 0% -7.55%, #D6FAE5 0%, #FFFFFF 100%)' 
                        }}
                    />
                    
                    <div className="relative p-7 md:p-10 space-y-8">
                        {/* Header Box */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-[28px] md:text-[34px] font-semibold text-black leading-none">
                                        {isCancelled ? 'Booking cancelled' : 'Booking confirmed'}
                                    </h1>
                                    {isCancelled ? (
                                        <img 
                                            src="/play/check-circle.svg" 
                                            alt="Cancelled" 
                                            className="w-8 h-8 md:w-[38px] md:h-[38px] flex-shrink-0" 
                                        />
                                    ) : (
                                        <img 
                                            src="/play/check-circle green.svg" 
                                            alt="Confirmed" 
                                            className="w-8 h-8 md:w-[38px] md:h-[38px] flex-shrink-0" 
                                        />
                                    )}
                                </div>
                                <p className="text-[17px] font-medium text-[#686868] mt-2">Reach the venue 10 mins before your slot</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-[0.5px] bg-[#686868] w-full" />

                        {/* Booking Details Grid */}
                        <div className="space-y-6">
                            {/* Date & Time */}
                            <div className="space-y-1">
                                <p className="text-[17px] font-medium text-[#686868] leading-none">Date & Time</p>
                                <p className="text-[20px] font-medium text-black uppercase">{booking.dateTime}</p>
                            </div>

                            <div className="h-[0.5px] bg-[#686868] w-full" />

                            {/* Play duration */}
                            <div className="space-y-1">
                                <p className="text-[17px] font-medium text-[#686868] leading-none">Play duration</p>
                                <p className="text-[20px] font-medium text-black uppercase">{booking.playDuration}</p>
                            </div>

                            <div className="h-[0.5px] bg-[#686868] w-full" />

                            {/* Location */}
                            <div className="space-y-1 relative pr-12">
                                <p className="text-[17px] font-medium text-[#686868] leading-none">Location</p>
                                <p className="text-[20px] font-medium text-black uppercase leading-tight md:leading-none">{booking.location}</p>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                     <img src="/play/dir.svg" alt="Directions" className="w-[24px] h-[24px]" />
                                </div>
                            </div>

                            <div className="h-[0.5px] bg-[#686868] w-full" />

                            {/* Offer */}
                            <div className="space-y-1">
                                <p className="text-[17px] font-medium text-[#686868] leading-none">Offer</p>
                                <p className="text-[20px] font-medium text-black uppercase">{booking.offer}</p>
                            </div>

                            {/* Cancel Link - Hide when cancelled */}
                            {!isCancelled && (
                                <div className="pt-2">
                                    <button 
                                        onClick={() => setIsCancelModalOpen(true)}
                                        className="text-[22px] font-semibold text-[#ED4D1B] underline underline-offset-4 decoration-1 decoration-[#ED4D1B]"
                                    >
                                        Cancel booking
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* User Details Section */}
                <div className="space-y-6">
                    <h2 className="text-[25px] font-semibold text-black px-1">Your details</h2>
                    
                    <div className="bg-white border-[0.5px] border-[#686868] rounded-[25px] p-8 md:p-10 flex items-center gap-6">
                        <div className="w-[60px] h-[60px] flex items-center justify-center">
                           <img src="/play/Group.svg" alt="User" className="w-[60px] h-[60px] object-contain" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[20px] font-medium text-black uppercase leading-none">{booking.userName}</p>
                            <p className="text-[20px] font-medium text-[#686868] uppercase leading-none mt-1">{booking.userContact}</p>
                        </div>
                    </div>

                    <div className="px-1 space-y-1">
                        <p className="text-[17px] font-medium text-[#686868]">Booking ID: {booking.bookingId}</p>
                        <p className="text-[17px] font-medium text-[#686868]">Booking date: {booking.bookingDate}</p>
                    </div>
                </div>

                {/* Terms & Conditions Box */}
                <div className="bg-[#E1E1E1] rounded-[25px] min-h-[330px] p-8 md:p-10">
                    <h2 className="text-[25px] font-semibold text-black">Terms & Conditions</h2>
                </div>

                {/* Chat with Support Box */}
                <div className="bg-white border-[0.5px] border-[#686868] rounded-[25px] p-8 flex items-center gap-6 cursor-pointer hover:bg-zinc-50 transition-colors">
                    <div className="w-[56px] h-[56px] flex items-center justify-center">
                        <img src="/play/chat.svg" alt="Chat" className="w-[45px] h-[45px] object-contain" />
                    </div>
                    <h3 className="text-[25px] font-semibold text-black">Chat with support</h3>
                </div>
            </main>

            {/* Cancellation Modal Overlay */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop with Blur */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity"
                        onClick={() => setIsCancelModalOpen(false)}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative w-full max-w-[700px] bg-white rounded-[25px] border border-[#AEAEAE] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 md:p-8 border-b-[0.5px] border-[#AEAEAE]">
                            <h2 className="text-[24px] md:text-[28px] font-semibold text-black">Booking cancellation request</h2>
                            <button 
                                onClick={() => setIsCancelModalOpen(false)}
                                className="text-black hover:opacity-70"
                            >
                                <X size={28} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 md:p-10 space-y-8">
                            <div className="space-y-4">
                                <p className="text-[17px] font-medium text-[#686868]">Select your reason here</p>
                                
                                <div className="flex flex-wrap gap-4">
                                    {reasons.map((reason) => (
                                        <button
                                            key={reason}
                                            onClick={() => setSelectedReason(reason)}
                                            className={`px-6 py-2 rounded-[25px] border text-[17px] font-medium transition-all ${
                                                selectedReason === reason 
                                                ? 'bg-black text-white border-black' 
                                                : 'bg-white text-black border-[#AEAEAE] hover:border-black'
                                            }`}
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider Placeholder */}
                            <div className="h-[0.5px] border-t border-[#AEAEAE] border-dashed w-full" />

                            {/* Submit Button */}
                            <button
                                onClick={() => {
                                    setIsCancelled(true);
                                    setIsCancelModalOpen(false);
                                }}
                                disabled={!selectedReason}
                                className={`w-full h-[60px] rounded-full text-[20px] font-semibold transition-all flex items-center justify-center ${
                                    selectedReason 
                                    ? 'bg-black text-white' 
                                    : 'bg-[#AEAEAE] text-white/70 cursor-not-allowed'
                                }`}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


