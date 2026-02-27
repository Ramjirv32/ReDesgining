'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Clock, CheckCircle, XCircle, AlertCircle, ImageOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface Listing {
    id: string;
    name: string;
    category?: string;
    sub_category?: string;
    city?: string;
    status?: string;
    portrait_image_url?: string;
    landscape_image_url?: string;
    createdAt?: string;
    [key: string]: unknown;
}

interface ListingCardProps {
    listing: Listing;
    vertical: 'events' | 'dining' | 'play';
    onDelete: (id: string) => Promise<void>;
    accentColor: string;          // e.g. '#AC9BF7' | '#E7C200'
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
    pending: { label: 'Pending Review', bg: 'bg-orange-50', text: 'text-orange-600', icon: Clock },
    approved: { label: 'Live', bg: 'bg-green-50', text: 'text-green-600', icon: CheckCircle },
    rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-500', icon: XCircle },
};

export default function ListingCard({ listing, vertical, onDelete, accentColor }: ListingCardProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const status = listing.status ?? 'pending';
    const statusCfg = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-zinc-100', text: 'text-zinc-600', icon: AlertCircle };
    const StatusIcon = statusCfg.icon;

    const handleEdit = () => {
        router.push(`/${vertical}/edit/${listing.id}`);
    };

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        setDeleting(true);
        try {
            await onDelete(listing.id);
        } catch {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-black/5 flex flex-col group">
            {/* Image */}
            <div className="relative w-full aspect-[3/2] bg-zinc-100 overflow-hidden">
                {listing.portrait_image_url || listing.landscape_image_url ? (
                    <img
                        src={listing.landscape_image_url || listing.portrait_image_url}
                        alt={listing.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-300">
                        <ImageOff size={32} />
                        <span className="text-[12px]">No image</span>
                    </div>
                )}
                {/* Status badge */}
                <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                    <StatusIcon size={12} />
                    {statusCfg.label}
                </div>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col gap-3">
                <div>
                    <h3 className="text-[15px] font-semibold text-black leading-tight line-clamp-1">{listing.name}</h3>
                    <p className="text-[12px] text-zinc-500 mt-1">
                        {[listing.category, listing.sub_category].filter(Boolean).join(' › ')}
                        {listing.city ? ` — ${listing.city}` : ''}
                    </p>
                </div>

                {/* Actions */}
                {confirmDelete ? (
                    <div className="flex gap-2 mt-auto">
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 h-[38px] rounded-[10px] bg-red-500 text-white text-[13px] font-medium disabled:opacity-50"
                        >
                            {deleting ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="px-4 h-[38px] rounded-[10px] border border-zinc-300 text-zinc-600 text-[13px]"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2 mt-auto">
                        <button
                            onClick={handleEdit}
                            className="flex-1 h-[38px] rounded-[10px] flex items-center justify-center gap-2 text-[13px] font-medium text-black border border-black/10 hover:bg-black hover:text-white transition-colors"
                        >
                            <Pencil size={14} />
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
