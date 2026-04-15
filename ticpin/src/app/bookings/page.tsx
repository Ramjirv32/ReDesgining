'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, RefreshCw, Ticket, PlayCircle, Utensils, MapPin, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useUserSession } from '@/lib/auth/user';
import { bookingApi } from '@/lib/api/booking';

function BookingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const session = useUserSession();
    const initialTab = searchParams.get('type') as any;
    
    const [activeTab, setActiveTab] = useState<'dining' | 'events' | 'play'>(
        initialTab && ['dining', 'events', 'play'].includes(initialTab) ? initialTab : 'play'
    );
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const type = searchParams.get('type') as any;
        if (type && ['dining', 'events', 'play'].includes(type) && type !== activeTab) {
            setActiveTab(type);
        }
    }, [searchParams, activeTab]);

    const tabs = [
        { id: 'dining', label: 'Dining' },
        { id: 'events', label: 'Events' },
        { id: 'play', label: 'Play' },
    ];

    const fetchBookings = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        setError(null);
        try {
            const data = await bookingApi.getUserBookings({ 
                email: session.email, 
                phone: session.phone, 
                userId: session.id 
            });
            setBookings(data);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
            setError('Failed to load bookings. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (session) {
            fetchBookings();
        } else if (!loading) {
            setLoading(false);
        }
    }, [session, fetchBookings]);

    const filteredBookings = bookings.filter(b => (b.category || b.type) === activeTab);

    if (!session && !loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <h2 className="text-[34px] font-semibold text-black mb-4">Please log in</h2>
                    <p className="text-[#686868] text-[20px] mb-8">You need to be logged in to review your bookings.</p>
                    <Link href="/login" className="px-8 py-4 bg-black text-white rounded-full text-[20px] font-semibold inline-block">
                        Login / Sign Up
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-white border-b border-[#D9D9D9] z-50">
                {/* Logo - Fixed left position */}
                <div className="absolute left-4 md:left-[37px] top-0 bottom-0 flex items-center">
                    <Link href="/">
                        <img src="/ticpin-logo-black.png" alt="TICPIN" className="h-6 md:h-7 w-auto" />
                    </Link>
                </div>

                {/* Title - Centered */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <h1 className="text-[20px] md:text-[34px] font-semibold text-black leading-none whitespace-nowrap pointer-events-auto">
                        Review your bookings
                    </h1>
                </div>
            </header>

            <main className="pt-16 md:pt-20 pb-20 px-4 flex flex-col items-center">
                {/* Tabs Section */}
                <div className="mt-[47px] bg-[#E1E1E1] rounded-[40px] p-[6px] flex items-center max-w-full overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                                router.replace(`/bookings?type=${tab.id}`, { scroll: false });
                            }}
                            className={`px-[30px] md:px-[45px] py-[10px] rounded-[40px] text-[18px] md:text-[25px] font-medium transition-all duration-300 whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-black text-white' 
                                : 'text-black'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Section */}
                <div className="mt-[30px] w-full max-w-[460px] space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center py-20">
                            <RefreshCw className="animate-spin text-zinc-400 mb-4" size={40} />
                            <p className="text-zinc-500">Loading your bookings...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-red-500 mb-4">{error}</p>
                            <button onClick={fetchBookings} className="text-black underline font-medium">Try again</button>
                        </div>
                    ) : filteredBookings.length > 0 ? (
                        filteredBookings.map((booking, idx) => (
                            <div key={booking.id || idx} className="bg-white border-[0.5px] border-[#686868] rounded-[25px] px-[35px] pt-[35px] pb-[20px] relative">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-[25px] font-medium text-black leading-tight uppercase truncate max-w-[200px]">
                                            {booking.event_name || booking.venue_name || booking.title || 'Booking'}
                                        </h3>
                                        {activeTab === 'play' && booking.court_name && (
                                            <p className="text-[20px] font-normal text-[#686868] leading-tight uppercase">{booking.court_name}</p>
                                        )}
                                    </div>
                                    <div className="w-[134px] h-[75px] bg-[#FFEF9A] rounded-[15px] overflow-hidden flex items-center justify-center">
                                        {(booking.play_image || booking.image_url || booking.event_image_url || booking.venue_image_url) ? (
                                            <img src={booking.play_image || booking.image_url || booking.event_image_url || booking.venue_image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <MapPin size={24} className="text-black/10" />
                                        )}
                                    </div>
                                </div>

                                <div className="mt-2 space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-[17px] font-medium text-[#686868] leading-none">Date & Time</p>
                                        <div className="text-[22px] font-medium text-black uppercase leading-[1.2]">
                                            <div>{new Date(booking.date || Date.now()).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                                            <div>{booking.time || booking.time_slot || booking.slot || ''}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mt-[-8px]">
                                        <p className="text-[17px] font-medium text-[#686868] leading-none">Location</p>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[22px] font-medium text-black uppercase leading-tight truncate pr-4">
                                                {booking.address?.split(',')[0] || booking.city || booking.venue_address?.split(',')[0] || 'Location'}
                                            </p>
                                            <div className="w-10 h-10 bg-[#FFEF9A] rounded-full flex items-center justify-center">
                                                <MapPin size={24} className="text-black" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-[18px] pt-3 border-t border-[#D1D1D1] flex justify-between items-center">
                                    <div className={`px-4 py-1.5 rounded-[9px] flex items-center justify-center min-w-[104px] ${
                                        booking.status === 'booked' || booking.status === 'confirmed' ? 'bg-[#D6FAE5]' : 'bg-red-50'
                                    }`}>
                                        <span className={`text-[15px] font-bold ${
                                            booking.status === 'booked' || booking.status === 'confirmed' ? 'text-[#009133]' : 'text-red-600'
                                        }`}>
                                            {booking.status === 'booked' || booking.status === 'confirmed' ? 'Confirmed' : booking.status?.toUpperCase() || 'BOOKED'}
                                        </span>
                                    </div>
                                    <Link href={`/bookings/${booking.id}`} className="flex items-center gap-1 text-black hover:opacity-70 transition-opacity">
                                        <span className="text-[17px] font-bold mr-4">₹{booking.grand_total || booking.order_amount || 0}</span>
                                        <span className="text-[15px] font-semibold">View details</span>
                                        <span className="text-[14px]">›</span>
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-zinc-50 rounded-[25px] border border-dashed border-zinc-300 w-full">
                            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                {activeTab === 'events' ? <Ticket size={32} className="text-zinc-400" /> : 
                                 activeTab === 'play' ? <PlayCircle size={32} className="text-zinc-400" /> : 
                                 <Utensils size={32} className="text-zinc-400" />}
                            </div>
                            <p className="text-zinc-500 text-[18px]">No {activeTab} bookings found</p>
                            <p className="text-zinc-400 text-[14px] mt-1">Start exploring and make your first booking!</p>
                            <Link href={`/${activeTab}`} className="inline-block mt-6 text-black font-semibold border-b-2 border-black">
                                Browse {activeTab}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Chat with Support Box */}
                <div className="mt-10 w-full max-w-[460px]">
                    <Link href="/chat-support" className="bg-white border-[0.5px] border-[#686868] rounded-[25px] p-6 flex items-center gap-6 cursor-pointer hover:bg-zinc-50 transition-colors">
                        <div className="w-[48px] h-[48px] flex items-center justify-center bg-black rounded-full text-white">
                            <MessageSquare size={24} />
                        </div>
                        <h3 className="text-[22px] font-semibold text-black">Chat with support</h3>
                    </Link>
                </div>
            </main>
        </div>
    );
}

export default function BookingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <BookingsContent />
        </Suspense>
    );
}
