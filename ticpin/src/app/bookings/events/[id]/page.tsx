'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from '@/components/ui/Toast';
import { 
  ChevronLeft, 
  CheckCircle, 
  MessageCircle, 
  User,
  MapPin,
  X
} from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import { bookingApi } from '@/lib/api/booking';
import { getBookingStatus } from '@/lib/utils/booking-status';

export default function EventBookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.id as string;
  const session = useUserSession();
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (bookingId) {
      setLoading(true);
      
      bookingApi.getBookingDetails(bookingId, session?.id)
        .then((data: any) => {
          setBooking(data);
        })
        .catch((err: any) => {
          console.error('Error fetching booking details:', err);
          setError('Failed to load booking details');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [bookingId, session]);

  const handleCancel = async (reason: string) => {
    try {
      const response: any = await bookingApi.cancelBooking(bookingId, 'events');
      
      if (response?.message?.includes('cancelled successfully')) {
        toast.success('Booking cancelled successfully. Refund will be processed shortly.');
        setShowCancelModal(false);
        setTimeout(async () => {
          const updatedBooking = await bookingApi.getBookingDetails(bookingId, session?.id);
          setBooking(updatedBooking);
        }, 1000);
      } else {
        toast.error('Cancellation status unclear. Please refresh the page.');
        setShowCancelModal(false);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to cancel booking';
      toast.error(errorMessage);
      setShowCancelModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="text-zinc-500">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500">{error || 'Booking not found'}</div>
          <button 
            onClick={() => router.back()}
            className="px-6 py-3 bg-black text-white rounded-full font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const venueImage = booking.event_image || booking.image_url || booking.images?.[0] || null;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="w-full h-[114px] bg-white flex items-center justify-between px-10 border-b border-[#D9D9D9]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center border border-[#D0D0D0] shadow-sm"
          >
            <ChevronLeft size={20} className="text-black" />
          </button>
          <div className="flex items-center gap-4">
            {/* Yellow Image Badge */}
            <div className="w-[104px] h-[58px] bg-[#FFEF9A] rounded-[10px] overflow-hidden flex items-center justify-center">
              {venueImage ? (
                <img 
                  src={venueImage} 
                  alt="Venue" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-black font-bold text-lg">₹{booking.grand_total || booking.amount || 0}</span>
              )}
            </div>
            <div className="w-[1px] h-[22px] bg-[#AEAEAE]" />
            <div>
              <h2 className="text-[20px] font-medium text-black" style={{ fontFamily: 'Anek Latin', lineHeight: '22px' }}>
                {booking.event_name || booking.title}
              </h2>
              <p className="text-[17px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin', lineHeight: '19px' }}>
                {booking.venue_city || booking.city || booking.state}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
            <User size={20} className="text-zinc-500" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-[45px]">
        {/* Booking Confirmed Card */}
        <div className="max-w-[787px] mx-auto">
          <div className="border border-[#686868] rounded-[25px] overflow-hidden" style={{ background: 'radial-gradient(52.97% 102.98% at 0% -7.55%, #D6FAE5 0%, #FFFFFF 100%)' }}>
            <div className="p-8">
              <div className="flex items-center gap-4 mb-2">
                <CheckCircle size={38} className="text-[#0AC655]" />
                <h1 className="text-[34px] font-semibold text-black" style={{ fontFamily: 'Anek Latin', lineHeight: '37px' }}>
                  Booking confirmed
                </h1>
              </div>
              <p className="text-[17px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin', lineHeight: '19px' }}>
                Reach the venue 10 mins before your slot
              </p>

              <div className="border-b border-[#686868] my-6 w-[717px]" />

              <div className="space-y-6">
                {/* Date & Time */}
                <div>
                  <p className="text-[17px] font-medium text-[#686868] mb-1" style={{ fontFamily: 'Anek Latin', lineHeight: '19px' }}>
                    Date & Time
                  </p>
                  <p className="text-[20px] font-medium text-black" style={{ fontFamily: 'Anek Latin', lineHeight: '22px' }}>
                    {booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '-'} | {booking.time || booking.time_slot || '-'}
                  </p>
                </div>

                <div className="border-b border-[#686868] w-[717px]" />

                {/* Ticket Category */}
                <div>
                  <p className="text-[17px] font-medium text-[#686868] mb-1" style={{ fontFamily: 'Anek Latin', lineHeight: '19px' }}>
                    Ticket Category
                  </p>
                  <p className="text-[20px] font-medium text-black" style={{ fontFamily: 'Anek Latin', lineHeight: '22px' }}>
                    {booking.ticket_category || booking.category || 'General Entry'}
                  </p>
                </div>

                <div className="border-b border-[#686868] w-[717px]" />

                {/* Location */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[17px] font-medium text-[#686868] mb-1" style={{ fontFamily: 'Anek Latin', lineHeight: '19px' }}>
                      Location
                    </p>
                    <p className="text-[20px] font-medium text-black" style={{ fontFamily: 'Anek Latin', lineHeight: '22px' }}>
                      {booking.venue_city || booking.location || '-'}
                    </p>
                  </div>
                  <MapPin size={24} className="text-black" />
                </div>

                <div className="border-b border-[#686868] w-[717px]" />

                {/* Offer */}
                <div>
                  <p className="text-[17px] font-medium text-[#686868] mb-1" style={{ fontFamily: 'Anek Latin', lineHeight: '19px' }}>
                    Offer
                  </p>
                  <p className="text-[20px] font-medium text-black" style={{ fontFamily: 'Anek Latin', lineHeight: '22px' }}>
                    {booking.offer_name || booking.offer || 'No offer applied'}
                  </p>
                </div>

                <div className="border-b border-[#686868] w-[717px]" />

                {/* Cancel Booking */}
                {getBookingStatus(booking) === 'CONFIRMED' && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="text-[22px] font-semibold underline text-[#ED4D1B]"
                    style={{ fontFamily: 'Anek Latin', lineHeight: '24px' }}
                  >
                    Cancel booking
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Your Details Card */}
          <div className="border border-[#686868] rounded-[25px] mt-6 p-8">
            <h3 className="text-[25px] font-semibold text-black mb-4" style={{ fontFamily: 'Anek Latin', lineHeight: '28px' }}>
              Your details
            </h3>
            <div className="space-y-2">
              <p className="text-[20px] font-medium text-black" style={{ fontFamily: 'Anek Latin', lineHeight: '22px' }}>
                {booking.user_name || session?.name || '-'}
              </p>
              <p className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin', lineHeight: '22px' }}>
                {booking.user_phone || session?.phone || '-'}
              </p>
            </div>
          </div>

          {/* Booking Info Card */}
          <div className="border border-[#686868] rounded-[25px] mt-6 p-8">
            <div className="space-y-2">
              <p className="text-[17px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin', lineHeight: '19px' }}>
                Booking ID: {booking.booking_id || booking.id}
              </p>
              <p className="text-[17px] font-medium text-[#686868]" style={{ fontFamily: 'Anek Latin', lineHeight: '19px' }}>
                Booking date: {booking.booked_at ? new Date(booking.booked_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
              </p>
            </div>
          </div>

          {/* Terms & Conditions Card */}
          <div className="bg-[#E1E1E1] rounded-[25px] mt-6 p-8 h-[330px]">
            <h3 className="text-[25px] font-semibold text-black mb-4" style={{ fontFamily: 'Anek Latin', lineHeight: '28px' }}>
              Terms & Conditions
            </h3>
            <div className="space-y-3 text-[#686868] text-sm">
              <p>• Please arrive 10 minutes before the event.</p>
              <p>• Late arrivals may result in denied entry.</p>
              <p>• Tickets are non-transferable.</p>
              <p>• Cancellations must be made at least 24 hours before the event.</p>
              <p>• Refunds will be processed within 5-7 business days.</p>
            </div>
          </div>

          {/* Chat with Support Card */}
          <div 
            className="border border-[#686868] rounded-[25px] mt-6 p-8 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => router.push('/chat-support')}
          >
            <MessageCircle size={32} className="text-black" strokeWidth={2} />
            <h3 className="text-[25px] font-semibold text-black" style={{ fontFamily: 'Anek Latin', lineHeight: '28px' }}>
              Chat with support
            </h3>
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white rounded-[26px] w-[787px] h-[398px] p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[25px] font-semibold text-black" style={{ fontFamily: 'Anek Latin', lineHeight: '28px' }}>
                Booking cancellation request
              </h2>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-[25px] font-semibold text-black"
              >
                <X size={28} />
              </button>
            </div>

            <div className="border-b border-dashed border-[#686868] w-[787px] mb-4" />

            <p className="text-[17px] font-medium text-[#686868] mb-4" style={{ fontFamily: 'Anek Latin', lineHeight: '19px' }}>
              Select your reason here
            </p>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => handleCancel('Plan change')}
                className="px-6 py-3 border border-[#D9D9D9] rounded-[33px] text-[20px] font-medium text-black hover:bg-gray-50"
                style={{ fontFamily: 'Anek Latin', lineHeight: '22px' }}
              >
                Plan change
              </button>
              <button
                onClick={() => handleCancel('Found a better offer elsewhere')}
                className="px-6 py-3 border border-[#D9D9D9] rounded-[33px] text-[20px] font-medium text-black hover:bg-gray-50"
                style={{ fontFamily: 'Anek Latin', lineHeight: '22px' }}
              >
                Found a better offer elsewhere
              </button>
              <button
                onClick={() => handleCancel('Booked by mistake')}
                className="px-6 py-3 border border-[#D9D9D9] rounded-[33px] text-[20px] font-medium text-black hover:bg-gray-50"
                style={{ fontFamily: 'Anek Latin', lineHeight: '22px' }}
              >
                Booked by mistake
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleCancel('Others')}
                className="px-6 py-3 border border-[#D9D9D9] rounded-[33px] text-[20px] font-medium text-black hover:bg-gray-50"
                style={{ fontFamily: 'Anek Latin', lineHeight: '22px' }}
              >
                Others
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
