'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, MessageSquare, User, X, XCircle, Download, Check, MapPin, Navigation, RefreshCw, Ticket, PlayCircle, Utensils, ChevronLeft } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useUserSession } from '@/lib/auth/user';
import { bookingApi } from '@/lib/api/booking';
import { profileApi } from '@/lib/api/profile';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeCanvas } from 'qrcode.react';

export default function BookingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params?.id as string;
    const session = useUserSession();
    const ticketRef = useRef<HTMLDivElement>(null);

    const [booking, setBooking] = useState<any>(null);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const reasons = [
        "Plan change",
        "Found a better offer elsewhere",
        "Booked by mistake",
        "Others"
    ];

    useEffect(() => {
        if (bookingId) {
            setLoading(true);
            fetch(`/backend/api/bookings/${bookingId}${session?.id ? `?user_id=${session.id}` : ''}`, {
                credentials: 'include',
            })
                .then(res => res.ok ? res.json() : Promise.reject('Failed to load booking'))
                .then(data => {
                    setBooking(data);
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.toString());
                    setLoading(false);
                });
        }
    }, [bookingId, session]);

    // Fetch profile photo for the logged‑in user
    useEffect(() => {
        if (session?.id) {
            profileApi.getProfile(session.id).then(p => {
                if (p?.profilePhoto) setProfilePhoto(p.profilePhoto);
            }).catch(err => console.error('Failed to fetch profile:', err));
        }
    }, [session]);

    const handleCancelSubmit = async () => {
        if (!selectedReason || !booking) return;
        setCancelling(true);
        try {
            await bookingApi.cancelBooking(booking.id, booking.type || 'play');
            // Refresh booking data
            const res = await fetch(`/backend/api/bookings/${bookingId}${session?.id ? `?user_id=${session.id}` : ''}`, {
                credentials: 'include',
            });
            const data = await res.json();
            setBooking(data);
            setIsCancelModalOpen(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to cancel booking');
        } finally {
            setCancelling(false);
        }
    };

    const handleDownloadBill = async () => {
        if (!ticketRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(ticketRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#F5F5F5',
                width: 800,
                windowWidth: 800,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`TICPIN_Ticket_${booking?.booking_id || bookingId}.pdf`);
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <XCircle size={60} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Booking not found</h2>
                <p className="text-[#686868] mb-6">{error || 'The requested booking details could not be loaded.'}</p>
                <button onClick={() => router.push('/bookings')} className="px-8 py-3 bg-black text-white rounded-xl">
                    Back to Bookings
                </button>
            </div>
        );
    }

    const isCancelled = booking.status === 'cancelled';

    return (
        <div className={`min-h-screen bg-white font-[family-name:var(--font-anek-latin)] pb-20 relative ${(isCancelModalOpen) ? 'overflow-hidden' : ''}`}>
            {/* Header */}
            <header className="h-16 md:h-20 w-full bg-white border-b border-[#D9D9D9] flex items-center px-4 md:px-10 lg:px-[37px] sticky top-0 z-50">
                <div className="flex items-center gap-4 md:gap-10">
                    <button
                        onClick={() => router.push('/bookings')}
                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-[#D9D9D9] rounded-full hover:bg-zinc-50 transition-colors"
                    >
                        <ChevronLeft size={24} className="text-black" />
                    </button>

                    <Link href="/">
                        <img src="/ticpin-logo-black.png" alt="TICPIN" className="h-6 md:h-7 w-auto" />
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        {/* Divider Line */}
                        <div className="w-[1.5px] h-8 bg-[#AEAEAE] mx-1" />

                        <div className="flex items-center gap-6">
                            {/* Venue Thumbnail */}
                            <div className="w-[85px] h-[48px] bg-[#FFEF9A] rounded-[10px] overflow-hidden flex items-center justify-center">
                                {(booking.event_image_url || booking.venue_image_url || booking.play_image || booking.image_url) ? (
                                    <img src={booking.event_image_url || booking.venue_image_url || booking.play_image || booking.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <MapPin size={24} className="text-black/20" />
                                )}
                            </div>

                            <div className="flex flex-col justify-center">
                                <h2 className="text-[18px] font-medium text-black leading-tight uppercase tracking-tight">
                                    {booking.event_name || booking.venue_name}
                                </h2>
                                <p className="text-[15px] font-medium text-[#686868] leading-tight uppercase tracking-tight mt-0.5">
                                    {booking.venue_address?.split(',')[0]}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[787px] mx-auto px-4 mt-6 md:mt-[45px] pb-10 space-y-10">

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
                                    <div className="w-8 h-8 md:w-[38px] md:h-[38px] flex-shrink-0">
                                        {isCancelled ? (
                                            <XCircle className="w-full h-full text-red-500" />
                                        ) : (
                                            <CheckCircle className="w-full h-full text-[#009133]" />
                                        )}
                                    </div>
                                </div>
                                <p className="text-[17px] font-medium text-[#686868] mt-2">
                                    {isCancelled ? 'The refund if any will be processed soon' : 'Reach the venue 10 mins before your slot'}
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-[0.5px] bg-[#686868] w-full" />

                        {/* Booking Details Grid */}
                        <div className="space-y-6">
                            {/* Date & Time */}
                            <div className="space-y-1">
                                <p className="text-[17px] font-medium text-[#686868] leading-none">Date & Time</p>
                                <p className="text-[20px] font-medium text-black uppercase">
                                    {new Date(booking.date || Date.now()).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} | {booking.time || booking.time_slot}
                                </p>
                            </div>

                            <div className="h-[0.5px] bg-[#686868] w-full" />

                            {/* Play duration / Capacity */}
                            <div className="space-y-1">
                                <p className="text-[17px] font-medium text-[#686868] leading-none">
                                    {booking.type === 'play' ? 'Play duration' : booking.type === 'dining' ? 'Guests' : 'Quantity'}
                                </p>
                                <p className="text-[20px] font-medium text-black uppercase">
                                    {booking.type === 'play' ? `${booking.duration ? (booking.duration * 30) : '60'} mins` :
                                        booking.type === 'dining' ? `${booking.guests} Guests` :
                                            `${booking.tickets?.reduce((acc: number, t: any) => acc + (t.quantity || 0), 0) || 1} tickets`}
                                </p>
                            </div>

                            <div className="h-[0.5px] bg-[#686868] w-full" />

                            {/* Location */}
                            <div className="space-y-1 relative pr-12">
                                <p className="text-[17px] font-medium text-[#686868] leading-none">Location</p>
                                <p className="text-[20px] font-medium text-black uppercase leading-tight">
                                    {booking.venue_address || booking.event_location || 'Venue Location'}
                                </p>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-[#FFEF9A] rounded-full">
                                    <Navigation size={20} className="text-black" />
                                </div>
                            </div>

                            <div className="h-[0.5px] bg-[#686868] w-full" />

                            {/* Offer */}
                            <div className="space-y-1">
                                <p className="text-[17px] font-medium text-[#686868] leading-none">Discount</p>
                                <p className="text-[20px] font-medium text-black uppercase">
                                    {booking.discount_amount > 0 ? `₹${booking.discount_amount} Savings` : 'No offer applied'}
                                </p>
                            </div>

                            {/* Cancel Link / Download Link */}
                            <div className="pt-4 flex flex-wrap gap-6 items-center">
                                {!isCancelled && (
                                    <button
                                        onClick={() => setIsCancelModalOpen(true)}
                                        className="text-[22px] font-semibold text-[#ED4D1B] underline underline-offset-4 decoration-1 decoration-[#ED4D1B]"
                                    >
                                        Cancel booking
                                    </button>
                                )}
                                <button
                                    onClick={handleDownloadBill}
                                    disabled={downloading}
                                    className="text-[22px] font-semibold text-black underline underline-offset-4 decoration-1 decoration-black flex items-center gap-2 disabled:opacity-50"
                                >
                                    {downloading ? 'Downloading...' : 'Download Ticket'}
                                    <Download size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Details Section */}
                <div className="space-y-6">
                    <h2 className="text-[25px] font-semibold text-black px-1">Your details</h2>

                    <div className="bg-white border-[0.5px] border-[#686868] rounded-[25px] p-8 md:p-10 flex items-center gap-6">
                        <div className="w-[60px] h-[60px] flex items-center justify-center bg-[#E1E1E1] rounded-full overflow-hidden">
                            {profilePhoto ? (
                                <Image src={profilePhoto} alt="Profile" width={60} height={60} className="object-cover" />
                            ) : (
                                <User size={32} className="text-[#686868]" />
                            )}
                        </div>
                        <div className="space-y-1 overflow-hidden">
                            <p className="text-[20px] font-medium text-black uppercase leading-none truncate">{booking.user_name}</p>
                            <p className="text-[20px] font-medium text-[#686868] uppercase leading-none mt-1">{booking.user_phone}</p>
                        </div>
                    </div>

                    <div className="px-1 space-y-1">
                        <p className="text-[17px] font-medium text-[#686868]">Booking ID: {booking.booking_id || booking.id?.slice(-8).toUpperCase()}</p>
                        <p className="text-[17px] font-medium text-[#686868]">Booking date: {new Date(booking.created_at || booking.date).toLocaleDateString('en-IN')}</p>
                    </div>
                </div>

                {/* Terms & Conditions Box */}
                <div className="bg-[#E1E1E1] rounded-[25px] p-8 md:p-10">
                    <h2 className="text-[25px] font-semibold text-black mb-4">Terms & Conditions</h2>
                    <ul className="space-y-2 text-[#686868] text-[16px]">
                        <li>• Please arrive 10 minutes before the scheduled time.</li>
                        <li>• Carry a valid ID proof for verification at the venue.</li>
                        <li>• Cancellation policies apply as per the vendor's terms.</li>
                        <li>• Tickets are non-transferable unless specified otherwise.</li>
                    </ul>
                </div>

                {/* Chat with Support Box */}
                <Link href="/chat-support" className="bg-white border-[0.5px] border-[#686868] rounded-[25px] p-8 flex items-center gap-6 cursor-pointer hover:bg-zinc-50 transition-colors mb-0">
                    <div className="w-[56px] h-[56px] flex items-center justify-center bg-black rounded-full text-white">
                        <MessageSquare size={28} />
                    </div>
                    <h3 className="text-[25px] font-semibold text-black">Chat with support</h3>
                </Link>
            </main>

            {/* HIDDEN PREMIUM TICKET FOR PDF DOWNLOAD */}
            <div className="opacity-0 pointer-events-none absolute -left-[9999px]">
                <div ref={ticketRef} id="hidden-ticket-capture" style={{ width: '800px', background: '#F5F5F5', padding: '60px 40px' }}>
                    <div style={{ background: '#ffffff', borderRadius: '15px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                        <div style={{ background: '#000000', padding: '30px', textAlign: 'center' }}>
                            <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '42px', letterSpacing: '8px' }}>TICPIN</span>
                        </div>
                        <div style={{ padding: '40px' }}>
                            <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '10px' }}>Booking Confirmed</div>
                            <p style={{ color: '#686868', fontSize: '18px', marginBottom: '30px' }}>ID: {booking.booking_id || booking.id?.slice(-8).toUpperCase()}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                                <div>
                                    <p style={{ color: '#686868', fontSize: '14px' }}>Venue / Event</p>
                                    <p style={{ fontSize: '18px', fontWeight: 700 }}>{booking.event_name || booking.venue_name}</p>
                                </div>
                                <div>
                                    <p style={{ color: '#686868', fontSize: '14px' }}>Date & Time</p>
                                    <p style={{ fontSize: '18px', fontWeight: 700 }}>{new Date(booking.date).toLocaleDateString()} | {booking.time || booking.time_slot}</p>
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', padding: '30px', border: '2px dashed #D9D9D9', borderRadius: '15px' }}>
                                <div style={{ display: 'inline-block', padding: '10px', background: 'white' }}>
                                    <QRCodeCanvas value={booking.booking_id || bookingId} size={150} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancellation Modal Overlay */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop with Blur */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity"
                        onClick={() => !cancelling && setIsCancelModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-[700px] bg-white rounded-[25px] border border-[#AEAEAE] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 md:p-8 border-b-[0.5px] border-[#AEAEAE]">
                            <h2 className="text-[24px] md:text-[28px] font-semibold text-black">Booking cancellation request</h2>
                            <button
                                onClick={() => setIsCancelModalOpen(false)}
                                disabled={cancelling}
                                className="text-black hover:opacity-70 disabled:opacity-30"
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
                                            disabled={cancelling}
                                            className={`px-6 py-2 rounded-[25px] border text-[17px] font-medium transition-all ${selectedReason === reason
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-black border-[#AEAEAE] hover:border-black'
                                                } ${cancelling ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[0.5px] border-t border-[#AEAEAE] border-dashed w-full" />

                            {/* Submit Button */}
                            <button
                                onClick={handleCancelSubmit}
                                disabled={!selectedReason || cancelling}
                                className={`w-full h-[60px] rounded-full text-[20px] font-semibold transition-all flex items-center justify-center ${selectedReason && !cancelling
                                        ? 'bg-black text-white active:scale-95'
                                        : 'bg-[#AEAEAE] text-white/70 cursor-not-allowed'
                                    }`}
                            >
                                {cancelling ? (
                                    <RefreshCw className="animate-spin" size={24} />
                                ) : (
                                    'Submit Request'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
