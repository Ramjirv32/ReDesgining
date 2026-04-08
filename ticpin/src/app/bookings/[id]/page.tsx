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
import { getBookingStatus, getBookingStatusStyles } from '@/lib/utils/booking-status';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function BookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.id as string;
  const session = useUserSession();
  const ticketRef = React.useRef<HTMLDivElement>(null);

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

  const [downloading, setDownloading] = useState(false);

  const handleDownloadBill = async () => {
    if (!ticketRef.current) return;
    
    setDownloading(true);
    // Note: If toast is not available, we can use a simple alert if needed, 
    // but the user previously had it. I'll just proceed as in the prev implementation.
    console.log('Generating PDF...');

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#F5F5F5',
        width: 800,
        height: 1100, // Explicit height to ensure QR code capture
        windowWidth: 800,
        windowHeight: 1100
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit entire content on A4
      let finalWidth = pdfWidth;
      let finalHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // If content is too tall for one page, we scale it down to fit exactly
      if (finalHeight > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = (imgProps.width * pdfHeight) / imgProps.height;
      }
      
      const xOffset = (pdfWidth - finalWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
      pdf.save(`TICPIN_Ticket_${booking?.booking_id || bookingId}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
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
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-zinc-400 hover:text-black transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="bg-white border border-zinc-200 rounded-[24px] overflow-hidden shadow-sm">
          <div className="px-6 md:px-10 pt-8 pb-6 border-b border-zinc-100">
            <h1 className="text-[28px] md:text-[32px] font-semibold text-black leading-tight uppercase tracking-tight">
              Booking Details
            </h1>
            <p className="text-[16px] text-[#686868] font-medium mt-1 uppercase tracking-wider">
              CONFIRMATION
            </p>
          </div>

          <div className="px-6 md:px-10 py-8 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="relative h-64 bg-gradient-to-br from-[#E7C200] to-[#FFB800] rounded-[14px] overflow-hidden">
                  {booking.event_image_url ? (
                    <img src={booking.event_image_url} alt={booking.event_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                          <Ticket className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold">{booking.event_name}</h2>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'booked' ? 'bg-green-500 text-white' : 'bg-zinc-500 text-white'}`}>
                      {booking.status?.toUpperCase() || 'BOOKED'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">EVENT INFORMATION</h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#E7C200]" />
                      <div>
                        <p className="text-sm text-zinc-500">Date & Time</p>
                        <p className="font-semibold text-black">{new Date(booking.date || Date.now()).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-sm text-zinc-600">{booking.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-[#E7C200]" />
                      <div>
                        <p className="text-sm text-zinc-500">Venue</p>
                        <p className="font-semibold text-black">{booking.venue_name}</p>
                        <p className="text-sm text-zinc-600">{booking.venue_address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <section className="space-y-4">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">BOOKING QR CODE</h2>
                  <div className="bg-zinc-900 rounded-[14px] p-6 text-center">
                    <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-zinc-800" />
                    </div>
                    <p className="text-white/80 text-sm mb-2">Booking ID</p>
                    <p className="text-white font-bold text-lg">{booking.booking_id || booking.id?.slice(-8).toUpperCase()}</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">TICKET DETAILS</h2>
                  <div className="space-y-2">
                    {booking.tickets?.map((ticket: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0">
                        <span className="font-medium text-black">{ticket.category} × {ticket.quantity}</span>
                        <span className="text-zinc-600">{formatCurrency(ticket.price * ticket.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">PAYMENT DETAILS</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between text-zinc-600"><span className="text-zinc-600">Order Amount</span><span>{formatCurrency(booking.order_amount || 0)}</span></div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-bold text-black">Total Paid</span>
                      <span className="font-bold text-black text-lg">{formatCurrency(booking.grand_total || 0)}</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <section className="space-y-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black border-b border-zinc-200 pb-3">IMPORTANT NOTES</h2>
              <div className="bg-zinc-50 rounded-[14px] p-6 space-y-4">
                {[
                  "Please arrive 10 minutes before the scheduled time for your slot booking.",
                  "Your booking time is strictly reserved, late arrivals may result in reduced playtime.",
                  "Ensure you vacate the turf on or before your end time to avoid inconvenience to the next booking."
                ].map((note, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 bg-[#E7C200] rounded-full mt-1.5 shrink-0" />
                    <p className="text-[15px] text-[#686868] leading-relaxed">{note}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 pt-6 border-t border-zinc-100">
              {booking.status !== 'cancelled' && (
                <button
                  onClick={() => router.push(`/bookings/${booking.id}/cancel?category=${booking.type}`)}
                  className="w-full h-[52px] bg-red-600 text-white rounded-[14px] font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" /> Cancel Booking
                </button>
              )}
              <button
                onClick={handleDownloadBill}
                disabled={downloading}
                className="w-full h-[52px] bg-black text-white rounded-[14px] font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" /> {downloading ? 'Preparing Ticket...' : 'Download Ticket (PDF)'}
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

      {/* HIDDEN PREMIUM TICKET */}
      <div ref={ticketRef} style={{ 
        position: 'absolute', 
        left: '-9999px', 
        top: 0, 
        width: '800px', 
        minHeight: '1100px', // Tall enough for A4 aspect ratio
        background: '#F5F5F5', 
        padding: '60px 40px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ width: '720px', margin: '0 auto', background: '#ffffff', borderRadius: '15px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <div style={{ background: '#E7C200', padding: '30px 50px', textAlign: 'center' }}>
            <span style={{ color: '#000000', fontWeight: 900, fontSize: '42px', letterSpacing: '8px' }}>TIC<span style={{ fontStyle: 'italic' }}>P</span>IN</span>
          </div>
          <div style={{ background: '#EBEBEB', padding: '40px 50px' }}>
            <div style={{ marginBottom: '8px', fontSize: '32px', fontWeight: 700, color: '#000000', display: 'flex', alignItems: 'center' }}>
              Play booking confirmed &nbsp;
              <img src="https://res.cloudinary.com/dt9vkv9as/image/upload/v1741270000/check-circle-premium.png" width="32" height="32" alt="Check" />
            </div>
            <p style={{ margin: '0 0 25px 0', fontSize: '18px', color: '#686868' }}>
              Booking Date: {new Date(booking.date || Date.now()).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}, {booking.time}
            </p>
            <div style={{ borderTop: '1px solid #AEAEAE', marginBottom: '25px' }}></div>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', gap: '24px' }}>
              <img src={booking.event_image_url || 'https://res.cloudinary.com/dt9vkv9as/image/upload/v1741270000/placeholder-yellow.png'} width="220" height="124" style={{ borderRadius: '8px', objectFit: 'cover' }} alt="Play" />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 700, fontSize: '20px', color: '#000000' }}>{booking.venue_name}</p>
                <p style={{ margin: 0, fontSize: '16px', color: '#686868', lineHeight: '1.4' }}>{booking.venue_address}</p>
              </div>
            </div>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px 28px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#686868', fontWeight: 500 }}>Booking ID</p>
              <p style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 800, color: '#000000', letterSpacing: '1px' }}>{booking.booking_id || booking.id?.slice(-8).toUpperCase()}</p>
              <div style={{ borderTop: '1px solid #D9D9D9', margin: '16px 0 20px 0' }}></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div><p style={{ fontSize: '14px', color: '#686868', marginBottom: '4px' }}>Date & Time</p><p style={{ fontSize: '19px', fontWeight: 700 }}>{new Date(booking.date || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', timeZone: 'UTC' })} | {booking.time}</p></div>
                <div><p style={{ fontSize: '14px', color: '#686868', marginBottom: '4px' }}>Play duration</p><p style={{ fontSize: '19px', fontWeight: 700 }}>{booking.duration ? (booking.duration * 30) : '60'} mins</p></div>
                <div><p style={{ fontSize: '14px', color: '#686868', marginBottom: '4px' }}>Total Paid</p><p style={{ fontSize: '22px', fontWeight: 800, color: '#E7C200' }}>₹{booking.grand_total}</p></div>
                <div><p style={{ fontSize: '14px', color: '#686868', marginBottom: '4px' }}>Phone</p><p style={{ fontSize: '19px', fontWeight: 700 }}>{booking.user_phone}</p></div>
              </div>
            </div>
            <div style={{ textAlign: 'center', margin: '35px 0', background: '#ffffff', borderRadius: '12px', padding: '30px' }}>
              <div style={{ display: 'inline-block', border: '5px solid #000000', padding: '15px', borderRadius: '15px' }}>
                <QrCode size={160} />
              </div>
              <p style={{ color: 'black', fontWeight: 800, marginTop: '15px', fontSize: '18px', letterSpacing: '2px' }}>VERIFIED TICKPIN PASS</p>
            </div>
            <p style={{ fontWeight: 700, fontSize: '18px', color: '#000000', marginBottom: '12px' }}>Important Notes</p>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px' }}>
              <table width="100%">
                <tbody>
                  {[
                    "Please arrive 10 minutes before the scheduled time for your slot booking.",
                    "Your booking time is strictly reserved, late arrivals may result in reduced playtime.",
                    "Ensure you vacate the turf on or before your end time to avoid inconvenience to the next booking."
                  ].map((note, i) => (
                    <tr key={i}>
                      <td width="24" style={{ verticalAlign: 'top', paddingTop: '8px' }}><div style={{ width: '6px', height: '6px', background: '#E7C200', borderRadius: '50%' }}></div></td>
                      <td style={{ fontSize: '15px', color: '#4b5563', paddingBottom: '12px', lineHeight: '1.5' }}>{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
