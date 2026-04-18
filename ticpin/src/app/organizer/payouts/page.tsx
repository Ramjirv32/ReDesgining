'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import OrganizerHeader from '@/components/organizer/OrganizerHeader';
import { getOrganizerSession } from '@/lib/auth/organizer';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

interface Booking {
    _id: string;
    booking_id: string;
    user_name: string;
    grand_total: number;
    status: string;
    booked_at: string;
    payout_processed: boolean;
    booking_category: string;
}

function PayoutsContent() {
    const router = useRouter();
    const [hasMounted, setHasMounted] = useState(false);
    const [session, setSession] = useState<ReturnType<typeof getOrganizerSession>>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
    const [triggerLoading, setTriggerLoading] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        const s = getOrganizerSession();
        if (!s) {
            router.replace('/organizer/login');
            return;
        }
        setSession(s);
    }, [router]);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/backend/api/organizer/payouts', {
                headers: {
                    'Authorization': `Bearer ${session?.id}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setBookings(data.bookings || []);
            }
        } catch (err) {
            console.error("Failed to fetch payouts", err);
            toast.error("Failed to load payouts data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!session) return;
        fetchPayouts();
    }, [session]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select only pending ones
            const pendingIds = bookings
                .filter(b => !b.payout_processed)
                .map(b => b._id);
            setSelectedBookings(new Set(pendingIds));
        } else {
            setSelectedBookings(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSet = new Set(selectedBookings);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedBookings(newSet);
    };

    const handleTriggerPayout = async () => {
        if (selectedBookings.size === 0) return;
        
        setTriggerLoading(true);
        try {
            const res = await fetch('/backend/api/organizer/payouts/trigger', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.id}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    booking_ids: Array.from(selectedBookings)
                })
            });

            if (res.ok) {
                toast.success(`Successfully processed payout for ${selectedBookings.size} bookings.`);
                setSelectedBookings(new Set());
                fetchPayouts(); // Refresh the list
            } else {
                toast.error("Failed to trigger payout.");
            }
        } catch (err) {
            toast.error("Error triggering payout.");
        } finally {
            setTriggerLoading(false);
        }
    };

    if (!hasMounted) {
        return <div className="min-h-screen bg-zinc-50 animate-pulse" />;
    }

    const unpayoutableCount = bookings.filter(b => !b.payout_processed).length;
    const totalSelectedAmount = bookings
        .filter(b => selectedBookings.has(b._id))
        .reduce((sum, b) => sum + (b.grand_total || 0), 0);

    const category = session?.vertical || 'events';
    const firstItemLabel = category === 'play' ? 'All Plays' : category === 'dining' ? 'All Dining' : 'All Events';

    return (
        <div className="flex flex-col min-h-screen font-[family-name:var(--font-anek-latin)] bg-[#F8F9FA]">
            <OrganizerHeader firstItemLabel={firstItemLabel} />

            <main className="flex-1 px-8 md:px-14 lg:px-20 py-16">
                <div className="max-w-[1228px] mx-auto w-full space-y-12">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-[40px] font-bold text-black leading-tight">
                                Payout Management
                            </h1>
                            <p className="text-[20px] font-medium text-[#686868] mt-2">
                                Review bookings and transfer funds to your bank account
                            </p>
                        </div>
                        
                        {/* Action Box */}
                        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-end">
                            <span className="text-zinc-500 font-medium mb-1">Selected for Payout</span>
                            <span className="text-3xl font-bold text-black mb-4">₹{totalSelectedAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                            <button 
                                onClick={handleTriggerPayout}
                                disabled={selectedBookings.size === 0 || triggerLoading}
                                className={`px-8 py-3 rounded-xl font-bold text-lg transition-all flex items-center gap-2
                                    ${selectedBookings.size > 0 
                                        ? 'bg-black text-white hover:bg-zinc-800 active:scale-95 shadow-md' 
                                        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
                            >
                                {triggerLoading ? 'Processing...' : 'Trigger Payout'}
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-[1px] bg-[#AEAEAE] opacity-50" />

                    {/* Bookings Table */}
                    <div className="bg-white border border-zinc-200 rounded-[24px] overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-black">Booking Returns</h3>
                            <span className="text-sm font-medium text-zinc-500 bg-white px-3 py-1 rounded-full border border-zinc-200">
                                {unpayoutableCount} pending payouts
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-zinc-200">
                                        <th className="py-4 px-8 w-16 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                                                onChange={handleSelectAll}
                                                checked={unpayoutableCount > 0 && selectedBookings.size === unpayoutableCount}
                                            />
                                        </th>
                                        <th className="py-4 px-4 text-sm font-semibold uppercase text-zinc-500 tracking-wider">Booking Info</th>
                                        <th className="py-4 px-4 text-sm font-semibold uppercase text-zinc-500 tracking-wider">Date</th>
                                        <th className="py-4 px-4 text-sm font-semibold uppercase text-zinc-500 tracking-wider">Category</th>
                                        <th className="py-4 px-4 text-sm font-semibold uppercase text-zinc-500 tracking-wider">Amount</th>
                                        <th className="py-4 px-8 text-sm font-semibold uppercase text-zinc-500 tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        [1, 2, 3].map(i => (
                                            <tr key={i} className="border-b border-zinc-100 animate-pulse">
                                                <td className="py-6 px-8"><div className="w-5 h-5 bg-zinc-200 rounded" /></td>
                                                <td className="py-6 px-4"><div className="h-4 w-32 bg-zinc-200 rounded" /></td>
                                                <td className="py-6 px-4"><div className="h-4 w-24 bg-zinc-200 rounded" /></td>
                                                <td className="py-6 px-4"><div className="h-4 w-16 bg-zinc-200 rounded" /></td>
                                                <td className="py-6 px-4"><div className="h-4 w-20 bg-zinc-200 rounded" /></td>
                                                <td className="py-6 px-8"><div className="h-6 w-24 bg-zinc-200 rounded-full" /></td>
                                            </tr>
                                        ))
                                    ) : bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-zinc-500 font-medium">
                                                No bookings found.
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.map((booking) => (
                                            <tr key={booking._id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                                                <td className="py-5 px-8 text-center">
                                                    {!booking.payout_processed && (
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-5 h-5 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                                                            checked={selectedBookings.has(booking._id)}
                                                            onChange={() => handleSelectOne(booking._id)}
                                                        />
                                                    )}
                                                </td>
                                                <td className="py-5 px-4">
                                                    <div className="font-bold text-black">{booking.user_name || 'Guest User'}</div>
                                                    <div className="text-sm text-zinc-500 uppercase tracking-widest mt-1">
                                                        {(booking.booking_id || booking._id).toString().slice(-8)}
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4 font-medium text-zinc-600">
                                                    {new Date(booking.booked_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="py-5 px-4">
                                                    <span className="capitalize font-semibold text-zinc-700 bg-zinc-100 px-3 py-1 rounded-lg">
                                                        {booking.booking_category}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-4 font-bold text-black">
                                                    ₹{(booking.grand_total || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                                </td>
                                                <td className="py-5 px-8">
                                                    {booking.payout_processed ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-semibold text-sm border border-green-200">
                                                            <CheckCircle size={14} /> Paid Out
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-sm border border-amber-200">
                                                            <Clock size={14} /> Pending
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function PayoutsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <PayoutsContent />
        </Suspense>
    );
}
