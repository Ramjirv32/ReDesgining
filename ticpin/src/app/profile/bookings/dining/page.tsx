'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Utensils, Calendar, Users, MapPin, Search, Filter } from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import { bookingApi } from '@/lib/api/booking';

export default function DiningBookingsPage() {
  const router = useRouter();
  const session = useUserSession();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      bookingApi.getUserBookings({ email: session.email, phone: session.phone, userId: session.id })
        .then(all => {
          // Filter only dining bookings
          setBookings(all.filter(b => b.type === 'dining' || b.category === 'dining'));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else if (session) {
       // If no email, maybe try by phone if API supports (but here it uses email)
       setLoading(false);
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-sans pb-20" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md px-[15px] pt-6 pb-4 flex items-center justify-between border-b border-[#D0D0D0]/30 shadow-sm">
        <div className="flex items-center gap-[10px]">
          <button
            onClick={() => router.back()}
            className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center border border-[#D0D0D0] shadow-sm font-semibold"
          >
            <ChevronLeft size={20} className="text-black" />
          </button>
          <h1 className="text-[18px] font-semibold text-black">Dining Bookings</h1>
        </div>
        <div className="flex items-center gap-3">
           <Search size={20} className="text-zinc-400" />
           <Filter size={20} className="text-zinc-400" />
        </div>
      </header>

      <main className="pt-[100px] px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 font-medium">Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-zinc-100">
              <Utensils size={32} className="text-zinc-300" />
            </div>
            <h2 className="text-[20px] font-bold text-black mb-2">No dining bookings yet</h2>
            <p className="text-zinc-500 text-[15px] max-w-[250px] mb-8">
              Discover the best restaurants and bars in your city.
            </p>
            <button 
              onClick={() => router.push('/dining')}
              className="px-8 h-[52px] bg-black text-white rounded-full font-bold shadow-lg shadow-black/10 active:scale-95 transition-all"
            >
              Explore Dining
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, idx) => (
              <div key={idx} className="bg-white rounded-[24px] p-5 border border-[#D0D0D0]/20 shadow-sm">
                 <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-[#866BFF]/10 rounded-2xl flex items-center justify-center">
                          <Utensils size={24} className="text-[#866BFF]" />
                       </div>
                       <div>
                          <h3 className="text-[16px] font-bold text-black">{booking.venue_name || booking.title}</h3>
                          <p className="text-[13px] text-zinc-400 font-medium">Booking ID: {booking.id.slice(0, 8)}</p>
                       </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      booking.status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {booking.status}
                    </span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 py-4 border-t border-zinc-50">
                    <div className="flex items-center gap-2">
                       <Calendar size={16} className="text-zinc-400" />
                       <span className="text-[14px] font-medium text-zinc-600">{new Date(booking.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Users size={16} className="text-zinc-400" />
                       <span className="text-[14px] font-medium text-zinc-600">{booking.guests} Guests</span>
                    </div>
                 </div>
                 
                 <button 
                   onClick={() => router.push(`/bookings/${booking.id}`)}
                   className="w-full h-[48px] bg-zinc-50 border border-zinc-100 rounded-xl text-black font-bold text-[14px] mt-2"
                 >
                   View Booking Details
                 </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
