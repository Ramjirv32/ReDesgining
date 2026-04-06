'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from '@/components/ui/Toast';
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
import { getBookingStatus, getBookingStatusStyles } from '@/lib/utils/booking-status';

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
      toast.error('Failed to cancel booking. Please try again.');
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
          <div>Status: ${getBookingStatus(booking) === 'CANCELLED' ? 'CANCELLED' : getBookingStatus(booking) === 'EXPIRED' ? 'EXPIRED' : 'CONFIRMED'}</div>
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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center py-12 px-4 font-[family-name:var(--font-anek-latin)]">
      {/* Back Button */}
      <div className="w-full max-w-[711px] mb-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
            <ChevronLeft size={18} />
          </div>
          <span className="font-medium">Back to bookings</span>
        </button>
      </div>

      {/* Main Ticket Card */}
      <div className="w-full max-w-[711px] bg-[#0A0132] rounded-[15px] border border-white/10 overflow-hidden shadow-2xl">
        
        {/* Purple Header */}
        <div className="bg-[#5331EA] px-12 py-6 flex items-center">
          <span className="text-white font-[900] text-4xl tracking-[4px]">
            TIC<span className="italic">P</span>IN
          </span>
        </div>

        {/* Main Content Box */}
        <div className="mx-12 bg-[#EBEBEB] rounded-b-[15px] p-8 md:p-9">
          
          {/* Title Row */}
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-[30px] font-bold text-black m-0">Event booking confirmed</h2>
            <div className="w-7 h-7 bg-[#0AC655] rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <path d="M8 14.5L12 18.5L20 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          <p className="text-base text-[#686868] m-0 mb-5">
            Booking Date : {new Date(booking.booked_at).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}, {new Date(booking.booked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>

          <hr className="border-t border-[#AEAEAE] m-0 mb-5" />

          {/* Event Summary Card */}
          <div className="bg-white rounded-[10px] p-5 mb-4 flex gap-5 items-center">
            <div className="w-[197px] h-[111px] bg-[#AC9BF7] rounded-[6px] flex-shrink-0 overflow-hidden">
               {/* Use a real image if available, otherwise fallback */}
               <div className="w-full h-full flex items-center justify-center text-white/50">
                <ImageIcon size={40} />
               </div>
            </div>
            <div>
              <p className="text-lg font-bold text-black m-0 mb-1.5">{booking.event_name}</p>
              <p className="text-base text-[#686868] m-0">{booking.city}, {booking.state}</p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-[10px] px-6 py-5 mb-4">
            <div className="space-y-3">
              <div className="pb-3 border-b border-[#D9D9D9]">
                <p className="text-sm text-[#686868] m-0 mb-0.5">Booking ID</p>
                <p className="text-lg font-semibold text-black m-0">{booking.booking_id}</p>
              </div>
              
              <div className="pb-3 border-b border-[#D9D9D9]">
                <p className="text-sm text-[#686868] m-0 mb-0.5">Date & Time</p>
                <p className="text-lg font-semibold text-black m-0">{booking.date} | {booking.time || 'All Day'}</p>
              </div>

              <div className="pb-3 border-b border-[#D9D9D9]">
                <p className="text-sm text-[#686868] m-0 mb-0.5">Number of ticket(s)</p>
                <p className="text-lg font-semibold text-black m-0">
                  {booking.tickets?.reduce((acc: number, t: any) => acc + t.quantity, 0) || 0}
                </p>
              </div>

              <div className="pb-3 border-b border-[#D9D9D9]">
                <p className="text-sm text-[#686868] m-0 mb-0.5">Location</p>
                <p className="text-lg font-semibold text-black m-0">{booking.city || 'Venue'}</p>
              </div>

              <div>
                <p className="text-sm text-[#686868] m-0 mb-0.5">Total Amount</p>
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-[#5331EA] m-0">₹{booking.grand_total}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getBookingStatusStyles(getBookingStatus(booking))}`}>
                    {getBookingStatus(booking)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex justify-center mb-4">
            <div className="w-[215px] h-[215px] bg-[#5331EA1A] rounded-[8px] flex items-center justify-center border-2 border-dashed border-[#5331EA33]">
              <div className="flex flex-col items-center gap-2">
                <QrCode size={100} className="text-[#5331EA]" strokeWidth={1.5} />
                <span className="text-sm text-black font-medium">{booking.booking_id}</span>
              </div>
            </div>
          </div>

          {/* Access Info */}
          <p className="text-sm text-[#686868] mb-5">
            To access your booking, please sign in to your <span className="text-[#5331EA] font-semibold">Ticpin</span> account with {booking.user_phone}
          </p>

          {/* Notes Section */}
          <p className="text-lg font-bold text-black mb-3">Notes</p>
          <div className="bg-white rounded-[10px] px-6 py-5">
            <div className="space-y-3.5">
              {[
                "Please arrive at the venue at least 15 minutes before the event start time for smooth entry.",
                "Carry your event booking confirmation or ticket (digital or printed) for verification.",
                "Follow all venue rules and safety instructions during the event.",
              ].map((note, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-2.5 h-2.5 border-2 border-[#5331EA] rotate-45 flex-shrink-0 mt-1" />
                  <p className="text-sm text-[#686868] m-0">{note}</p>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-[#686868] m-0 mt-4">
              See you there!<br />
              Team <span className="text-[#5331EA] font-semibold">Ticpin</span>
            </p>
          </div>
        </div>

        {/* Support Section */}
        <div className="px-12 py-7 pt-4">
          <p className="text-white font-bold text-[26px] m-0 mb-2 uppercase">Looking for help?</p>
          <p className="text-white text-base m-0 mb-6">
            Mail us at <span className="text-[#7C5CFC] underline font-medium">support@ticpin.in</span> (10AM-5PM), and we'll help you out.
          </p>
          <hr className="border-t border-white m-0 mb-6" />

          {/* Social Links Placeholder */}
          <div className="flex justify-center gap-6 mb-6">
            {['FB', 'IG', 'X', 'YT'].map(s => (
              <div key={s} className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-xs text-white font-bold hover:bg-white/10 transition-colors cursor-pointer">
                {s}
              </div>
            ))}
          </div>
          <hr className="border-t border-white m-0 mb-0" />
        </div>
      </div>

      {/* Action Buttons (External to the ticket) */}
      <div className="w-full max-w-[711px] mt-8 flex gap-4">
          <button 
            onClick={() => downloadTicket('pdf')}
            className="flex-1 h-14 bg-white text-black rounded-[15px] font-bold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all active:scale-95"
          >
            <Download size={20} />
            Download Ticket
          </button>
          {getBookingStatus(booking) === 'CONFIRMED' && (
            <button 
              onClick={handleCancel}
              className="flex-1 h-14 bg-red-500/10 text-red-500 border border-red-500/20 rounded-[15px] font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-95"
            >
              <XCircle size={20} />
              Cancel Booking
            </button>
          )}
      </div>
    </div>
  );
}
