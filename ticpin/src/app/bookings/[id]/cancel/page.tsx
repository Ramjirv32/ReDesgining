'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, AlertTriangle, Clock, Shield, CreditCard, CheckCircle, XCircle } from 'lucide-react';

export default function CancelBookingPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.id as string;
  
  const [reason, setReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const handleCancel = async () => {
    if (!reason || !agreed) return;
    
    setLoading(true);
    
    try {
      // Get user session for authentication
      const sessionStr = sessionStorage.getItem('ticpin_user_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      
      // Call the backend API
      const response = await fetch(`/backend/api/bookings/${bookingId}/cancel?category=events${session?.id ? `&user_id=${session.id}` : ''}`, {
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
      setCancelled(true);
    } catch (error: any) {
      console.error('Cancellation error:', error);
      alert(error?.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                    REFUND INITIATED
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 md:px-10 py-8 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-[14px] p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Cancellation Successful</h3>
                <p className="text-green-700 mb-4">
                  Your booking has been successfully cancelled. A refund will be processed to your original payment method within 5-7 business days.
                </p>
                <div className="space-y-2 text-sm text-green-600">
                  <p>• Booking ID: {bookingId}</p>
                  <p>• Refund Amount: ₹1.00</p>
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
                  <span className="font-medium">{bookingId?.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Event</span>
                  <span className="font-medium">Sample Event</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Date</span>
                  <span className="font-medium">March 20, 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Amount Paid</span>
                  <span className="font-medium">₹1.00</span>
                </div>
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
                      Free cancellation available up to 24 hours before the event start time. 
                      Cancellations within 24 hours may incur a cancellation fee.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#E7C200] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-black mb-1">Refund Policy</h3>
                    <p className="text-zinc-600 text-sm">
                      Full refund will be processed to your original payment method within 5-7 business days 
                      after cancellation. Partial refunds may apply for late cancellations.
                    </p>
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
