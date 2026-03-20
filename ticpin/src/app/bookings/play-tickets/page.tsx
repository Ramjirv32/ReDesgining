'use client';

import React, { useState, useEffect } from 'react';
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
      // Refresh bookings after cancellation
      setBookings(prev => prev.map(booking => 
        booking.booking_id === bookingId 
          ? { ...booking, status: 'cancelled' }
          : booking
      ));
    } catch (err) {
      alert('Failed to cancel booking. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-b from-[#FFFCED] to-white">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-zinc-700 hover:text-black transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold text-black">Play Bookings</h1>
            <div className="w-16" /> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            <p className="text-zinc-500">Loading your bookings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-red-500 mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-black text-white rounded-full font-bold"
            >
              Try Again
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <Gamepad2 size={48} className="mx-auto text-zinc-300 mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">No Play Bookings</h3>
            <p className="text-zinc-500 mb-6">You haven't booked any play venues yet</p>
            <button 
              onClick={() => router.push('/play')}
              className="px-6 py-3 bg-black text-white rounded-full font-bold"
            >
              Explore Play Venues
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.booking_id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Booking Header */}
                <div className="bg-gradient-to-r from-black to-zinc-800 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{booking.venue_name}</h3>
                      <div className="flex items-center gap-4 text-white/90">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span className="text-sm">{booking.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span className="text-sm">{booking.slot}</span>
                        </div>
                        {booking.duration && (
                          <div className="flex items-center gap-1">
                            <Users size={16} />
                            <span className="text-sm">{booking.duration}h</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">₹{booking.grand_total || booking.order_amount}</div>
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mt-2 ${
                        booking.status === 'cancelled' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-green-500 text-white'
                      }`}>
                        {booking.status === 'cancelled' ? (
                          <>
                            <XCircle size={12} />
                            Cancelled
                          </>
                        ) : (
                          <>
                            <CheckCircle size={12} />
                            Confirmed
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="p-6 space-y-4">
                  {/* Booking Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-zinc-600 mb-1">
                        <Ticket size={16} />
                        <span className="text-sm font-medium">Booking ID</span>
                      </div>
                      <div className="font-bold text-black">{booking.booking_id}</div>
                    </div>
                    <div className="bg-zinc-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-zinc-600 mb-1">
                        <Gamepad2 size={16} />
                        <span className="text-sm font-medium">Courts</span>
                      </div>
                      <div className="font-bold text-black">
                        {booking.tickets?.reduce((sum: number, ticket: any) => sum + ticket.quantity, 0) || 1} courts
                      </div>
                    </div>
                  </div>

                  {/* Court Details */}
                  {booking.tickets && booking.tickets.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-black flex items-center gap-2">
                        <Gamepad2 size={16} />
                        Court Details
                      </h4>
                      {booking.tickets.map((ticket: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl">
                          <div>
                            <div className="font-medium text-black">{ticket.category}</div>
                            <div className="text-sm text-zinc-600">₹{ticket.price} per {ticket.category.includes('Court') ? 'hour' : 'slot'}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-black">{ticket.quantity}x</div>
                            <div className="text-sm text-zinc-600">₹{ticket.price * ticket.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Venue Info */}
                  {booking.date && (
                    <div className="bg-amber-50 p-4 rounded-xl">
                      <h4 className="font-bold text-black flex items-center gap-2 mb-2">
                        <MapPin size={16} />
                        Venue Information
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-zinc-600">Date:</span>
                          <span className="font-medium text-black ml-2">{booking.date}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600">Time:</span>
                          <span className="font-medium text-black ml-2">{booking.slot}</span>
                        </div>
                        {booking.duration && (
                          <div>
                            <span className="text-zinc-600">Duration:</span>
                            <span className="font-medium text-black ml-2">{booking.duration} hours</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(booking.booking_id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                      >
                        <XCircle size={18} />
                        Cancel Booking
                      </button>
                    )}
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition-colors">
                      <Download size={18} />
                      Download Ticket
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition-colors">
                      <Share2 size={18} />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
