'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  XCircle
} from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import { bookingApi } from '@/lib/api/booking';

export default function BookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.id as string;
  const session = useUserSession();
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      console.log('DEBUG: Loading booking details for ID:', bookingId);
      setLoading(true);
      
      // Try the API call with better error handling
      fetch(`/backend/api/bookings/${bookingId}${session?.id ? `?user_id=${session.id}` : ''}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
        .then(response => {
          console.log('DEBUG: Response status:', response.status);
          console.log('DEBUG: Response headers:', response.headers.get('content-type'));
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return response.json();
        })
        .then(data => {
          console.log('DEBUG: Booking data received:', data);
          setBooking(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('DEBUG: Error loading booking:', err);
          setError(err.message || 'Failed to load booking details');
          setLoading(false);
        });
    } else {
      console.log('DEBUG: No booking ID provided');
      setLoading(false);
    }
  }, [bookingId, session]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      if (bookingId) {
        // Reload the booking data
        fetch(`/backend/api/bookings/${bookingId}${session?.id ? `?user_id=${session.id}` : ''}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        })
          .then(response => response.json())
          .then(data => {
            console.log('DEBUG: Booking refreshed:', data);
            setBooking(data);
          })
          .catch(err => {
            console.error('DEBUG: Error refreshing booking:', err);
          });
      }
    };

    window.addEventListener('refresh-bookings', handleRefresh);
    return () => window.removeEventListener('refresh-bookings', handleRefresh);
  }, [bookingId, session]);

  const handleDownloadBill = () => {
    if (booking?.id) {
      window.open(`/backend/api/bookings/${booking.id}/bill`, '_blank');
    }
  };

  const handleShareBooking = () => {
    if (booking?.id) {
      const shareUrl = `${window.location.origin}/bookings/${booking.id}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Booking link copied to clipboard!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#E7C200] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-zinc-500 font-medium">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (booking?.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-[#F1F1F1]" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-zinc-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {/* Cancelled Card */}
          <div className="bg-white border border-zinc-200 rounded-[24px] overflow-hidden shadow-sm">
            <div className="px-6 md:px-10 pt-8 pb-6 border-b border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-[28px] md:text-[32px] font-semibold text-black leading-tight uppercase tracking-tight">
                    Booking Cancelled
                  </h1>
                  <p className="text-[16px] text-[#686868] font-medium mt-1 uppercase tracking-wider">
                    REFUND PROCESSING
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 md:px-10 py-8 space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-[14px] p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">Cancellation Confirmed</h3>
                <p className="text-red-700 mb-4">
                  This booking has been cancelled and a refund will be processed to your original payment method.
                </p>
                <div className="space-y-2 text-sm text-red-600">
                  <p>• Booking ID: {booking.booking_id || booking.id?.slice(-8).toUpperCase()}</p>
                  <p>• Refund Amount: {formatCurrency(booking.grand_total || 0)}</p>
                  <p>• Processing Time: 5-7 business days</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/profile/bookings/events')}
                  className="flex-1 h-[52px] bg-black text-white rounded-[14px] font-bold hover:bg-zinc-800 transition-colors"
                >
                  View My Bookings
                </button>
                <button
                  onClick={() => router.push('/events')}
                  className="flex-1 h-[52px] bg-zinc-100 text-black rounded-[14px] font-bold hover:bg-zinc-200 transition-colors"
                >
                  Browse Events
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Ticket className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Booking Not Found</h2>
          <p className="text-zinc-500 mb-6">
            {error?.includes('HTTP 404') 
              ? 'This booking could not be found or has been removed'
              : error || 'Unable to load booking details'
            }
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 h-[48px] bg-black text-white rounded-xl font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1]" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-zinc-400 hover:text-black transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {/* Main Card */}
        <div className="bg-white border border-zinc-200 rounded-[24px] overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 md:px-10 pt-8 pb-6 border-b border-zinc-100">
            <h1 className="text-[28px] md:text-[32px] font-semibold text-black leading-tight uppercase tracking-tight">
              Booking Details
            </h1>
            <p className="text-[16px] text-[#686868] font-medium mt-1 uppercase tracking-wider">
              CONFIRMATION
            </p>
          </div>

          <div className="px-6 md:px-10 py-8 space-y-10">
            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Event Info & Image */}
              <div className="space-y-6">
                {/* Hero Section with Image */}
                <div className="relative h-64 bg-gradient-to-br from-[#E7C200] to-[#FFB800] rounded-[14px] overflow-hidden">
                  {booking.event_image_url ? (
                    <img
                      src={booking.event_image_url}
                      alt={booking.event_name || 'Event'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                          <Ticket className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold">{booking.event_name || 'Event'}</h2>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      booking.status === 'booked' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-zinc-500 text-white'
                    }`}>
                      {booking.status?.toUpperCase() || 'BOOKED'}
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-4">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                    EVENT INFORMATION
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#E7C200]" />
                      <div>
                        <p className="text-sm text-zinc-500">Date & Time</p>
                        <p className="font-semibold text-black">
                          {new Date(booking.date || Date.now()).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-zinc-600">{booking.time || 'Time not specified'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-[#E7C200]" />
                      <div>
                        <p className="text-sm text-zinc-500">Venue</p>
                        <p className="font-semibold text-black">{booking.venue_name || 'Venue not specified'}</p>
                        <p className="text-sm text-zinc-600">{booking.venue_address || 'Address not specified'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Ticket & Payment Details */}
              <div className="space-y-6">
                {/* QR Code Section */}
                <section className="space-y-4">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                    BOOKING QR CODE
                  </h2>
                  
                  <div className="bg-zinc-900 rounded-[14px] p-6 text-center">
                    <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-zinc-800" />
                    </div>
                    <p className="text-white/80 text-sm mb-2">Booking ID</p>
                    <p className="text-white font-bold text-lg">{booking.booking_id || booking.id?.slice(-8).toUpperCase()}</p>
                    <p className="text-white/60 text-xs mt-1">Show this QR at the venue</p>
                  </div>
                </section>

                {/* Tickets Section */}
                <section className="space-y-4">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                    TICKET DETAILS
                  </h2>
                  
                  <div className="space-y-2">
                    {booking.tickets?.map((ticket: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0">
                        <span className="font-medium text-black">{ticket.category} × {ticket.quantity}</span>
                        <span className="text-zinc-600">{formatCurrency(ticket.price * ticket.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Pricing Section */}
                <section className="space-y-4">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                    PAYMENT DETAILS
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Order Amount</span>
                      <span className="font-medium">{formatCurrency(booking.order_amount || 0)}</span>
                    </div>
                    
                    {booking.booking_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Booking Fee</span>
                        <span className="font-medium">{formatCurrency(booking.booking_fee)}</span>
                      </div>
                    )}
                    
                    {booking.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount Applied</span>
                        <span className="font-medium">-{formatCurrency(booking.discount_amount)}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-bold text-black">Total Paid</span>
                        <span className="font-bold text-black text-lg">{formatCurrency(booking.grand_total || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {booking.payment_method && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <CreditCard className="w-4 h-4" />
                        <span>Paid via {booking.payment_method}</span>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* Contact Section - Full Width */}
            <section className="space-y-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                CONTACT INFORMATION
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E7C200]/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#E7C200]" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Booked by</p>
                    <p className="font-semibold text-black">{booking.user_name || 'User'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E7C200]/10 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#E7C200]" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Email</p>
                    <p className="font-semibold text-black">{booking.user_email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E7C200]/10 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#E7C200]" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Phone</p>
                    <p className="font-semibold text-black">{booking.user_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Actions - Full Width */}
            <section className="space-y-3">
              {booking.status !== 'cancelled' && (
                <button
                  onClick={() => router.push(`/bookings/${booking.id}/cancel`)}
                  className="w-full h-[52px] bg-red-600 text-white rounded-[14px] font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Cancel Booking
                </button>
              )}
              
              <button
                onClick={handleDownloadBill}
                className="w-full h-[52px] bg-black text-white rounded-[14px] font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Bill (PDF)
              </button>
              
              <button
                onClick={() => router.push('/support')}
                className="w-full h-[52px] bg-zinc-100 text-black rounded-[14px] font-bold hover:bg-zinc-200 transition-colors"
              >
                Need Help? Contact Support
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
