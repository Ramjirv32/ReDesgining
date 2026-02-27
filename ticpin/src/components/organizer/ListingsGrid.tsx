'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ListingCard, { type Listing } from './ListingCard';
import { eventsApi } from '@/lib/api/events';
import { diningApi } from '@/lib/api/dining';
import { playApi } from '@/lib/api/play';
import { getOrganizerSession } from '@/lib/auth/organizer';

interface ListingsGridProps {
    vertical: 'events' | 'dining' | 'play';
    createPath: string;
    createLabel: string;
    accentColor: string;
    Icon: React.ElementType;
}

const VERTICAL_APIS = {
    events: eventsApi,
    dining: diningApi,
    play: playApi,
};

export default function ListingsGrid({ vertical, createPath, createLabel, accentColor, Icon }: ListingsGridProps) {
    const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loadingListings, setLoadingListings] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchListings = useCallback(async () => {
        const session = getOrganizerSession();
        if (!session) return;
        setLoadingListings(true);
        setErrorMsg('');
        try {
            const api = VERTICAL_APIS[vertical];
            const data = await api.list(session.id) as Listing[];
            setListings(Array.isArray(data) ? data : []);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Failed to load listings');
        } finally {
            setLoadingListings(false);
        }
    }, [vertical]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    const handleDelete = async (id: string) => {
        const session = getOrganizerSession();
        if (!session) return;
        const api = VERTICAL_APIS[vertical];
        await api.delete(id, session.id);
        setListings(prev => prev.filter(l => l.id !== id));
    };

    if (loadingListings) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-black/5 rounded-[20px] h-[280px]" />
                ))}
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <p className="text-red-500 text-[15px]">{errorMsg}</p>
                <button
                    onClick={fetchListings}
                    className="flex items-center gap-2 text-[14px] text-zinc-600 hover:text-black"
                >
                    <RefreshCw size={15} /> Try again
                </button>
            </div>
        );
    }

    if (listings.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed border-black/10 rounded-[24px] w-full">
                <Icon size={40} className="mx-auto mb-4 text-black/20" />
                <p className="text-[18px] text-zinc-500">No listings found.</p>
                <p className="text-[14px] text-zinc-400 mt-1">
                    Click <strong>+</strong> above to create your first {vertical} listing.
                </p>
                <button
                    onClick={() => router.push(createPath)}
                    className="mt-6 bg-black text-white px-8 h-[44px] rounded-[12px] text-[15px] font-medium flex items-center gap-2 mx-auto"
                >
                    <Plus size={16} /> {createLabel}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-[14px] text-zinc-500">{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
                <button
                    onClick={fetchListings}
                    className="flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-black"
                >
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listings.map(listing => (
                    <ListingCard
                        key={listing.id}
                        listing={listing}
                        vertical={vertical}
                        onDelete={handleDelete}
                        accentColor={accentColor}
                    />
                ))}
            </div>
        </div>
    );
}
