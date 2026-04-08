'use client';

import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Download,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Ticket,
  QrCode,
  Image as ImageIcon,
  FileText,
  Share2,
  Clock,
  Users,
  CreditCard,
  XCircle,
  CheckCircle,
  Gamepad2
} from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import { bookingApi } from '@/lib/api/booking';
import { getBookingStatus, getBookingStatusStyles } from '@/lib/utils/booking-status';

export default function PlayTicketsPage() {
  const router = useRouter();
  const session = useUserSession();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.id) {
      setLoading(true);

      bookingApi.getUserBookings({ userId: session.id })
        .then((data: any[]) => {
          const playBookings = data.filter(booking => booking.category === 'play');
          setBookings(playBookings);
        })
        .catch((err: any) => {
          console.error('Error fetching play bookings:', err);
          setError('Failed to load your play bookings');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [session]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingApi.cancelBooking(bookingId, 'play');
      // Refetch bookings after cancellation to get updated status
      if (session?.id) {
        const data = await bookingApi.getUserBookings({ userId: session.id });
        const playBookings = data.filter(booking => booking.category === 'play');
        setBookings(playBookings);
      }
    } catch (err) {
      toast.error('Failed to cancel booking. Please try again.');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFCED] to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-black">Please Login</h2>
          <p className="text-gray-600">You need to be logged in to view your bookings</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-black text-white rounded-full font-bold"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#D1D5DB] py-10" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-600 font-bold uppercase tracking-wider text-[13px] hover:text-black transition-colors"
          >
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-black text-[#0A0132] tracking-tight uppercase">My Play Tickets</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E7C200]"></div>
            <p className="text-zinc-500 font-bold">Loading your tickets...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-zinc-200">
            <div className="text-red-500 mb-4 font-bold">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-black text-white rounded-full font-bold shadow-lg"
            >
              Try Again
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[24px] border border-zinc-200 shadow-sm px-6">
            <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gamepad2 size={48} className="text-zinc-300" />
            </div>
            <h3 className="text-2xl font-black text-[#0A0132] mb-2 uppercase">No Playtime Booked</h3>
            <p className="text-zinc-500 mb-10 font-medium text-lg">Time to get on the turf! Book your favorite sport slot now.</p>
            <button
              onClick={() => router.push('/play')}
              className="px-10 py-4 bg-[#E7C200] text-black rounded-full font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
            >
              Explore Sports
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {bookings.map((booking) => (
              <div key={booking.booking_id} className="bg-[#0A0132] border border-white rounded-[20px] overflow-hidden shadow-2xl transition-transform hover:scale-[1.01] duration-300">
                {/* Yellow Branding Header */}
                <div className="bg-[#E7C200] px-6 py-4 flex justify-between items-center">
                  <span className="text-black font-black text-xl tracking-[2px]">TICPIN</span>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white text-black shadow-sm`}>
                    {getBookingStatus(booking)}
                  </div>
                </div>

                {/* Main Content Area (Matching Details Page Style) */}
                <div className="px-3 pb-3">
                  <div className="bg-[#EBEBEB] rounded-b-[15px] p-5 md:p-7 space-y-5">

                    {/* Venue Flex Layout */}
                    <div className="flex flex-col md:flex-row gap-5">
                      <div className="w-full md:w-[150px] h-[90px] rounded-[6px] overflow-hidden bg-zinc-200 flex-shrink-0 shadow-sm border border-black/5">
                        <img
                          src={booking.venue_image || 'https://res.cloudinary.com/dt9vkv9as/image/upload/v1741270000/placeholder-yellow.png'}
                          alt="Venue"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[18px] font-black text-black leading-tight uppercase tracking-tight">{booking.venue_name}</h3>
                          {getBookingStatus(booking) === 'CONFIRMED' && <CheckCircle className="w-4 h-4 text-green-500 fill-green-500/10" />}
                        </div>
                        <p className="text-[14px] text-[#686868] font-bold flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#E7C200]" />
                          {booking.location || 'Location not specified'}
                        </p>
                      </div>
                      <div className="ml-auto text-right md:self-center">
                        <div className="text-[24px] font-black text-black">₹{booking.grand_total || booking.order_amount}</div>
                        <p className="text-[11px] font-bold text-zinc-400 -mt-1">TOTAL PAID</p>
                      </div>
                    </div>

                    <div className="h-[1px] bg-[#AEAEAE] w-full" />

                    {/* Info Grid */}
                    <div className="bg-white rounded-[10px] p-5 grid grid-cols-2 lg:grid-cols-4 gap-6 border border-black/5">
                      <div>
                        <p className="text-[11px] text-[#686868] mb-1 font-bold uppercase tracking-wider">Booking ID</p>
                        <p className="text-[14px] font-black text-black">{booking.booking_id || booking.id?.slice(-8).toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#686868] mb-1 font-bold uppercase tracking-wider">Date & Time</p>
                        <p className="text-[14px] font-black text-black">{booking.date} | {booking.slot}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#686868] mb-1 font-bold uppercase tracking-wider">Play Duration</p>
                        <p className="text-[14px] font-black text-black">{booking.duration || '60'} mins</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#686868] mb-1 font-bold uppercase tracking-wider">Contact</p>
                        <p className="text-[14px] font-black text-black truncate">{booking.user_phone || '+91 *****'}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                      <button
                        onClick={() => router.push(`/bookings/${booking.booking_id || booking.id}`)}
                        className="flex-1 h-[52px] bg-black text-white rounded-[12px] font-black text-[12px] uppercase tracking-[2px] shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all border border-white/10"
                      >
                        <Ticket size={16} />
                        Details
                      </button>
                      <button className="h-[52px] px-6 bg-white text-black rounded-[12px] font-black text-[12px] uppercase tracking-[2px] shadow-sm border border-zinc-200 flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all">
                        <Download size={16} />
                        Bill
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brand Footer */}
      <div className="text-center py-20 opacity-30">
        <span className="text-4xl font-black text-black tracking-[15px] select-none">TICPIN</span>
      </div>
    </div>
  );
}
