'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Clock, CheckCircle, XCircle, AlertCircle, ImageOff, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
    accentColor: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
    pending: { label: 'Under review', bg: 'bg-[#F9C9A9]/50', text: 'text-[#C2410C]', icon: Clock },
    approved: { label: 'Live', bg: 'bg-[#BBF7D0]', text: 'text-[#166534]', icon: CheckCircle },
    rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
};

export default function ListingCard({ listing, vertical, onDelete }: ListingCardProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const status = listing.status ?? 'pending';
    const statusCfg = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-zinc-100', text: 'text-zinc-600', icon: AlertCircle };

    const handleEdit = () => {
        router.push(`/${vertical}/edit/${listing.id}`);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
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
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-black/5 flex flex-col md:flex-row gap-8 min-h-[220px] relative group hover:shadow-md transition-shadow">
            {/* Image (16:9 aspect) */}
            <div className="w-full md:w-[320px] aspect-[16/9] bg-[#EBE4FF] rounded-[15px] overflow-hidden shrink-0 relative">
                {listing.landscape_image_url || listing.portrait_image_url ? (
                    <Image
                        src={listing.landscape_image_url || listing.portrait_image_url || ''}
                        alt={listing.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#5331EA]/30">
                        <ImageOff size={40} />
                        <span className="text-[14px] font-medium uppercase tracking-wider text-center px-4">
                            ({vertical} image)<br />16:9 aspect ratio
                        </span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col justify-between py-1">
                <div className="space-y-2">
                    <h3 className="text-[32px] font-bold text-black leading-tight uppercase" style={{ fontFamily: 'Anek Latin' }}>
                        {listing.name}
                    </h3>
                    <p className="text-[24px] font-medium text-[#686868] uppercase" style={{ fontFamily: 'Anek Latin' }}>
                        {listing.city || 'LOCATION'}
                    </p>
                </div>

                <div className="flex items-center gap-4 mt-6">
                    <button
                        onClick={handleEdit}
                        className="bg-black text-white px-6 h-[48px] rounded-[10px] flex items-center gap-3 text-[16px] font-bold transition-all active:scale-95 shadow-sm"
                    >
                        <Settings size={20} />
                        <span style={{ fontFamily: 'Anek Latin' }}>Manage {vertical}</span>
                    </button>

                    {confirmDelete ? (
                        <div className="flex gap-2">
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="h-[48px] px-6 rounded-[10px] bg-red-500 text-white text-[15px] font-bold"
                            >
                                {deleting ? '...' : 'Confirm'}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                                className="h-[48px] px-6 rounded-[10px] border border-zinc-200 text-zinc-500 text-[15px]"
                            >
                                x
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleDelete}
                            className="w-[48px] h-[48px] rounded-[10px] flex items-center justify-center text-red-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={22} />
                        </button>
                    )}
                </div>
            </div>

            {/* Status Badges Section (Top Right) */}
            <div className="md:absolute top-8 right-8 flex flex-col gap-3 items-end">
                <div className={`px-6 py-2 rounded-[15px] text-[18px] font-medium ${statusCfg.bg} ${statusCfg.text} shadow-sm min-w-[120px] text-center`} style={{ fontFamily: 'Anek Latin' }}>
                    {statusCfg.label}
                </div>
                {/* Visual purely for design matching (image shows two badges sometimes) */}
                {status === 'approved' && isDateToday(listing.createdAt) && (
                    <div className="px-6 py-2 rounded-[15px] text-[18px] font-medium bg-[#BBF7D0] text-[#166534] shadow-sm min-w-[120px] text-center" style={{ fontFamily: 'Anek Latin' }}>
                        New
                    </div>
                )}
            </div>
        </div>
    );
}

function isDateToday(dateStr?: string) {
    if (!dateStr) return false;
    try {
        const d = new Date(dateStr);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    } catch { return false; }
}
