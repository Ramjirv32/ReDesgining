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
  XCircle,
  CheckCircle
} from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import { bookingApi } from '@/lib/api/booking';

export default function EventBookingDetailPage() {
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
      
      bookingApi.getBookingDetails(bookingId, session?.id)
        .then((data: any) => {
          console.log('DEBUG: Booking data received:', data);
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

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await bookingApi.cancelBooking(bookingId, 'events');
      // Refetch booking details to get updated status
      const updatedBooking = await bookingApi.getBookingDetails(bookingId, session?.id);
      setBooking(updatedBooking);
    } catch (err) {
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const downloadTicket = (format: 'png' | 'pdf') => {
    // Create ticket HTML content
    const ticketContent = `
      <div style="width: 600px; padding: 40px; background: linear-gradient(135deg, #7c00e6 0%, #9333ea 100%); color: white; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 32px; margin: 0;">EVENT TICKET</h1>
          <div style="font-size: 18px; opacity: 0.9;">Booking ID: ${booking?.booking_id}</div>
        </div>
        
        <div style="background: white; color: black; padding: 30px; border-radius: 15px; margin-bottom: 20px;">
          <h2 style="font-size: 24px; color: #7c00e6; margin: 0 0 20px 0;">${booking?.event_name}</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <div style="font-size: 14px; color: #666;">Date</div>
              <div style="font-size: 16px; font-weight: bold;">${booking?.date}</div>
            </div>
            <div>
              <div style="font-size: 14px; color: #666;">Time</div>
              <div style="font-size: 16px; font-weight: bold;">${booking?.time || 'All Day'}</div>
            </div>
          </div>
          
          <div style="border-top: 2px solid #f0f0f0; padding-top: 20px;">
            <h3 style="font-size: 18px; margin: 0 0 15px 0;">Ticket Details</h3>
            ${booking?.tickets?.map((ticket: any, idx: number) => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>${ticket.category} x ${ticket.quantity}</span>
                <span>₹${ticket.price * ticket.quantity}</span>
              </div>
            `).join('') || ''}
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 2px solid #f0f0f0;">
              <span>Total</span>
              <span>₹${booking?.grand_total || booking?.order_amount}</span>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; font-size: 12px; opacity: 0.7;">
          <div>Status: ${booking?.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}</div>
          <div>Generated on ${new Date().toLocaleDateString()}</div>
        </div>
      </div>
    `;

    if (format === 'png') {
      // For PNG, create a downloadable HTML file
      const blob = new Blob([ticketContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-ticket-${bookingId}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // For PDF, create a print-friendly version
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Event Ticket - ${bookingId}</title>
              <style>
                body { margin: 0; font-family: Arial, sans-serif; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>${ticketContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F3F0FF] to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c00e6]"></div>
          <p className="text-zinc-500">Loading booking details...</p>
          <p className="text-xs text-zinc-400">Booking ID: {bookingId}</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F3F0FF] to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500">{error || 'Booking not found'}</div>
          <p className="text-sm text-zinc-600">Booking ID: {bookingId}</p>
          <button 
            onClick={() => router.back()}
            className="px-6 py-3 bg-[#7c00e6] text-white rounded-full font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3F0FF] to-white">
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
            <h1 className="text-xl font-bold text-black">Event Ticket Details</h1>
            <div className="w-16" /> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-[#7c00e6] to-purple-600 p-8 text-white">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">EVENT TICKET</h1>
              <div className="text-xl opacity-90">Booking ID: {booking.booking_id}</div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="p-8 space-y-6">
            {/* Event Info */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-black mb-4">{booking.event_name}</h2>
              <div className="flex justify-center gap-8 text-zinc-600">
                <div className="flex items-center gap-2">
                  <Calendar size={20} />
                  <span>{booking.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  <span>{booking.time || 'All Day'}</span>
                </div>
              </div>
            </div>

            {/* Ticket Categories */}
            {booking.tickets && booking.tickets.length > 0 && (
              <div className="bg-zinc-50 p-6 rounded-xl">
                <h3 className="font-bold text-black mb-4 flex items-center gap-2">
                  <Ticket size={20} />
                  Ticket Details
                </h3>
                {booking.tickets.map((ticket: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-200 last:border-b-0">
                    <div>
                      <div className="font-medium text-black">{ticket.category}</div>
                      <div className="text-sm text-zinc-600">₹{ticket.price} per ticket</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-black">{ticket.quantity}x</div>
                      <div className="text-sm text-zinc-600">₹{ticket.price * ticket.quantity}</div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-zinc-200">
                  <span className="text-lg font-bold text-black">Total</span>
                  <span className="text-lg font-bold text-[#7c00e6]">₹{booking.grand_total || booking.order_amount}</span>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold ${
                booking.status === 'cancelled' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {booking.status === 'cancelled' ? (
                  <>
                    <XCircle size={20} />
                    Cancelled
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Confirmed
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              {booking.status !== 'cancelled' && (
                <button
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                >
                  <XCircle size={20} />
                  Cancel Booking
                </button>
              )}
              <button
                onClick={() => downloadTicket('png')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors"
              >
                <Download size={20} />
                Download PNG
              </button>
              <button
                onClick={() => downloadTicket('pdf')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-50 text-green-600 rounded-xl font-bold hover:bg-green-100 transition-colors"
              >
                <FileText size={20} />
                Download PDF
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition-colors">
                <Share2 size={20} />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
