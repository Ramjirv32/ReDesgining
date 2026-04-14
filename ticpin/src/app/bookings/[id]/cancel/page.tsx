'use client';

import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/Toast';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, AlertTriangle, Clock, Shield, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import { useQueryClient } from '@tanstack/react-query';

export default function CancelBookingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params?.id as string;
  const category = searchParams.get('category') || 'events';
  
  const [reason, setReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  React.useEffect(() => {
    const fetchBooking = async () => {
      try {
        const sessionStr = sessionStorage.getItem('ticpin_user_session');
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        
        const res = await fetch(`/backend/api/bookings/${bookingId}?${category ? `category=${category}` : ''}${session?.id ? `&user_id=${session.id}` : ''}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
          setBooking(data);
        } else {
          toast.error(data.error || 'Failed to fetch booking details');
        }
      } catch (err) {
        console.error('Error fetching booking:', err);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, category]);

  const calculateRefund = () => {
    if (!booking) return { refund: 0, penalty: 0, percentage: 0 };
    
    // Get booking date
    let bookingDateStr = '';
    if (booking.event_id) {
        // Event booking - usually nested or in booking.event.date
        // For simplicity let's check if there's a date field
        bookingDateStr = booking.date || '';
    } else {
        bookingDateStr = booking.date || '';
    }

    if (!bookingDateStr) return { refund: booking.grand_total, penalty: 0, percentage: 100 };

    try {
        const bookingDate = new Date(bookingDateStr);
        const now = new Date();
        const diffMs = bookingDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // Tiered Logic
        if (diffHours > 24) {
            return { 
                refund: booking.grand_total, 
                penalty: 0, 
                percentage: 100 
            };
        } else if (diffHours > 12) {
            return { 
                refund: booking.grand_total * 0.5, 
                penalty: booking.grand_total * 0.5, 
                percentage: 50 
            };
        } else {
            return { 
                refund: 0, 
                penalty: booking.grand_total, 
                percentage: 0 
            };
        }
    } catch (e) {
        return { refund: booking.grand_total, penalty: 0, percentage: 100 };
    }
  };

  const refundInfo = calculateRefund();

  const queryClient = useQueryClient();
  const session = useUserSession();

  const handleCancel = async () => {
    if (!reason || !agreed) return;
    
    setLoading(true);
    
    try {
      // Call the backend API
      const response = await fetch(`/backend/api/bookings/${bookingId}/cancel?category=${category}${session?.id ? `&user_id=${session.id}` : ''}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason,
          cancel_reason: reason,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }
      
      console.log('Cancellation successful:', data);
      
      // Invalidate queries to refresh "local" cache
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      
      // Also clear any stale session storage that might be related to this booking
      try {
        const cartStr = sessionStorage.getItem('ticpin_cart');
        if (cartStr) {
          const cart = JSON.parse(cartStr);
          if (cart.eventId === booking.event_id || cart.bookingId === bookingId) {
            sessionStorage.removeItem('ticpin_cart');
          }
        }
      } catch (e) {
        console.error('Error clearing session storage:', e);
      }

      setCancelled(true);
    } catch (error: any) {
      console.error('Cancellation error:', error);
      toast.error(error?.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-[#F1F1F1] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F1F1F1] flex items-center justify-center flex-col gap-4">
        <XCircle className="w-12 h-12 text-zinc-300" />
        <p className="text-zinc-500 font-medium">Booking not found or unavailable.</p>
        <button onClick={() => router.back()} className="text-black font-bold underline">Go Back</button>
      </div>
    );
  }

  const isExpired = booking.date && new Date(booking.date).getTime() < new Date().setHours(0,0,0,0);

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#F1F1F1] flex items-center justify-center flex-col gap-4">
        <AlertTriangle className="w-12 h-12 text-zinc-300" />
        <p className="text-zinc-500 font-medium text-center px-6">
          This booking has expired and cannot be cancelled. 
          <br />
          Cancellations are only allowed for upcoming bookings.
        </p>
        <button onClick={() => router.back()} className="text-black font-bold underline">Go Back</button>
      </div>
    );
  }

  if (cancelled) {
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

          {/* Success Card */}
          <div className="bg-white border border-zinc-200 rounded-[24px] overflow-hidden shadow-sm">
            <div className="px-6 md:px-10 pt-8 pb-6 border-b border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-[28px] md:text-[32px] font-semibold text-black leading-tight uppercase tracking-tight">
                    Booking Cancelled
                  </h1>
                  <p className="text-[16px] text-[#686868] font-medium mt-1 uppercase tracking-wider">
                    {refundInfo.refund > 0 ? 'REFUND INITIATED' : 'CANCELLED (NO REFUND)'}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 md:px-10 py-8 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-[14px] p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Cancellation Successful</h3>
                <p className="text-green-700 mb-4">
                  Your booking has been successfully cancelled. {refundInfo.refund > 0 
                    ? `A refund of ₹${refundInfo.refund.toLocaleString('en-IN', { minimumFractionDigits: 2 })} will be processed to your original payment method within 5-7 business days.`
                    : 'This was a late cancellation, so no refund could be processed according to the policy.'}
                </p>
                <div className="space-y-2 text-sm text-green-600">
                  <p>• Booking ID: {booking.booking_id || bookingId}</p>
                  <p>• Refund Amount: ₹{refundInfo.refund.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  {refundInfo.penalty > 0 && <p>• Cancellation Fee: ₹{refundInfo.penalty.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>}
                  {refundInfo.refund > 0 && <p>• Processing Time: 5-7 business days</p>}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/bookings')} // Fixed path for general bookings
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
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-[28px] md:text-[32px] font-semibold text-black leading-tight uppercase tracking-tight">
                  Cancel Booking
                </h1>
                <p className="text-[16px] text-[#686868] font-medium mt-1 uppercase tracking-wider">
                  CANCELLATION POLICY
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 md:px-10 py-8 space-y-10">
            {/* Booking Summary */}
            <section className="space-y-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                BOOKING SUMMARY
              </h2>
              
              <div className="bg-zinc-50 rounded-[14px] p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Booking ID</span>
                  <span className="font-medium text-black">{(booking.booking_id || bookingId).slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Venue/Event</span>
                  <span className="font-medium text-black">{booking.event_name || booking.venue_name || 'Booking Details'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Date</span>
                  <span className="font-medium text-black">{booking.date || 'To be selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Paid Amount</span>
                  <span className="font-medium text-black">₹{booking.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-zinc-200 flex justify-between">
                  <span className="text-zinc-600 font-semibold">Estimated Refund</span>
                  <span className={`font-bold ${refundInfo.refund > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{refundInfo.refund.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 italic">
                  * &gt;24 hrs: Full refund | 12-24 hrs: 50% refund | 0-12 hrs: No refund.
                </p>
              </div>
            </section>

            {/* Cancellation Policy */}
            <section className="space-y-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                CANCELLATION POLICY
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#E7C200] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-black mb-1">Timing</h3>
                    <p className="text-zinc-600 text-sm">
                      Full refund available up to 24 hours before the booking start time. 
                      Tiered refunds (50% or 0%) apply for cancellations within 24 hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#E7C200] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-black mb-1">Refund Policy</h3>
                    <div className="text-zinc-600 text-sm space-y-2">
                      <p>Full refund will be processed for cancellations made more than 24 hours before the booking start time.</p>
                      <div className="bg-zinc-50 rounded-lg p-3 space-y-1 border border-zinc-100">
                        <div className="flex justify-between text-xs font-medium">
                          <span>&gt; 24 hours</span>
                          <span className="text-green-600">Full Refund</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span>12 - 24 hours</span>
                          <span className="text-amber-600">50% Refund</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span>0 - 12 hours</span>
                          <span className="text-red-600">No Refund</span>
                        </div>
                      </div>
                      <p className="text-[11px] italic">Refunds will be processed to your original payment method within 5-7 business days.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-[#E7C200] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-black mb-1">Payment Method</h3>
                    <p className="text-zinc-600 text-sm">
                      Refunds will be processed to the same payment method used for booking. 
                      Bank transfers may take additional time to reflect in your account.
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-[14px] p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Important Notes</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Once cancelled, this action cannot be undone</li>
                  <li>• Some events may have specific cancellation terms</li>
                  <li>• Processing fees may apply for certain payment methods</li>
                  <li>• Contact support for assistance with special circumstances</li>
                </ul>
              </div>
            </section>

            {/* Cancellation Form */}
            <section className="space-y-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">
                CANCELLATION DETAILS
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Reason for Cancellation *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-[14px] focus:outline-none focus:border-black"
                  >
                    <option value="">Select a reason</option>
                    <option value="change-of-plans">Change of plans</option>
                    <option value="scheduling-conflict">Scheduling conflict</option>
                    <option value="emergency">Emergency</option>
                    <option value="double-booking">Double booking</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {reason === 'other' && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Additional Details
                    </label>
                    <textarea
                      placeholder="Please provide more details..."
                      className="w-full px-4 py-3 border border-zinc-300 rounded-[14px] focus:outline-none focus:border-black"
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreement"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 text-black border-zinc-300 rounded focus:ring-black"
                  />
                  <label htmlFor="agreement" className="text-sm text-zinc-600">
                    I understand that this cancellation is final and the refund will be processed 
                    according to the cancellation policy. I agree to the terms and conditions.
                  </label>
                </div>
              </div>
            </section>

            {/* Actions */}
            <section className="space-y-3">
              <button
                onClick={handleCancel}
                disabled={!reason || !agreed || loading}
                className="w-full h-[52px] bg-red-600 text-white rounded-[14px] font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Cancellation...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Confirm Cancellation
                  </>
                )}
              </button>
              
              <button
                onClick={() => router.back()}
                className="w-full h-[52px] bg-zinc-100 text-black rounded-[14px] font-bold hover:bg-zinc-200 transition-colors"
              >
                Keep Booking
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
