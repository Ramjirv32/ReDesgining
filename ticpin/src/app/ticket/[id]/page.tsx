'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { Ticket, Calendar, MapPin, Clock } from 'lucide-react';

export default function PublicTicketPage() {
    const params = useParams();
    const ticketId = params?.id as string;

    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (ticketId) {
            fetch(`/backend/api/bookings/public/${ticketId}`)
                .then(res => {
                    if (!res.ok) throw new Error('Ticket not found or invalid');
                    return res.json();
                })
                .then(data => {
                    setBooking(data);
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.message);
                    setLoading(false);
                });
        }
    }, [ticketId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ticket className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 mb-2">Invalid Ticket</h1>
                    <p className="text-zinc-500 mb-6">{error || 'This ticket could not be verified.'}</p>
                    <div className="border-t border-zinc-100 pt-6">
                        <p className="text-sm text-zinc-400">© TICPIN Verification System</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] py-8 px-4 font-[family-name:var(--font-anek-latin)]">
            <div className="max-w-[800px] mx-auto bg-white rounded-[24px] border border-zinc-200 overflow-hidden shadow-2xl">
                {/* Branded Header */}
                <div className="bg-[#E7C200] py-8 px-6 text-center">
                    <span className="text-zinc-950 font-black text-4xl tracking-[0.2em] uppercase">TICPIN</span>
                    <div className="mt-2 text-zinc-800 font-bold text-sm tracking-widest bg-white/20 inline-block px-4 py-1 rounded-full">
                        OFFICIAL TICKET
                    </div>
                </div>

                <div className="p-6 md:p-10 space-y-10">
                    {/* Confirmation Status */}
                    <div className="flex items-center gap-4 text-green-600">
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-900">Verification Success</h2>
                            <p className="font-medium text-zinc-500">This booking is valid and confirmed</p>
                        </div>
                    </div>

                    {/* Event Detail Card */}
                    <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-[240px] h-[160px] relative rounded-xl overflow-hidden shadow-lg">
                            <img 
                                src={booking.event_image_url || 'https://res.cloudinary.com/dt9vkv9as/image/upload/v1741270000/placeholder-yellow.png'} 
                                className="w-full h-full object-cover"
                                alt={booking.event_name}
                            />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <h3 className="text-2xl font-black text-zinc-900 uppercase leading-none mb-2">{booking.event_name}</h3>
                            <div className="flex items-start gap-2 text-zinc-500">
                                <MapPin size={18} className="mt-1 shrink-0" />
                                <p className="font-medium">{booking.venue_address || booking.venue_name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-5 shadow-sm">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Booking ID</p>
                            <p className="text-2xl font-black text-zinc-900 tracking-wider">{booking.id}</p>
                        </div>
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-5 shadow-sm">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <p className="text-2xl font-black text-green-600 uppercase">CONFIRMED</p>
                            </div>
                        </div>
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                            <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                                <Calendar className="text-zinc-600" size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Date</p>
                                <p className="text-lg font-bold text-zinc-900">{new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="bg-white border-2 border-zinc-100 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                            <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                                <Clock className="text-zinc-600" size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Time & Duration</p>
                                <p className="text-lg font-bold text-zinc-900">{booking.time} {booking.duration ? `(${booking.duration * 30} mins)` : ''}</p>
                            </div>
                        </div>
                    </div>

                    {/* QR Verification Section */}
                    <div className="text-center bg-zinc-950 rounded-[32px] p-10 shadow-2xl">
                        <div className="inline-block p-4 bg-white rounded-3xl mb-6 shadow-[0_0_50px_rgba(255,184,0,0.3)]">
                            <QRCodeCanvas value={`${window.location.origin}/ticket/${booking.id}`} size={200} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-white font-black text-xl tracking-[0.2em]">VERIFIED TICKET</p>
                            <p className="text-zinc-500 text-sm font-medium">Scan results in authentic TICPIN system verification</p>
                        </div>
                    </div>

                    {/* User Info Footnote */}
                    <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                        <div>
                            <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest">Customer Details</p>
                            <p className="text-[15px] font-semibold text-zinc-600">{booking.user_name} • {booking.user_phone}</p>
                        </div>
                        <p className="text-[11px] font-bold text-zinc-400">© 2026 TICPIN TECHNOLOGIES PRIVATE LIMITED</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
