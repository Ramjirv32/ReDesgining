'use client';

import React from 'react';
import { PlusCircle, Upload } from 'lucide-react';
import Image from 'next/image';

interface Artist {
    name: string;
    image_url: string;
    description: string;
}

interface TicketCategory {
    name: string;
    price: string;
    capacity: string;
    image_url: string;
    has_image: boolean;
}

interface ArtistSectionProps {
    artists: Artist[];
    onChange: (artists: Artist[]) => void;
    onUpload: (idx: number, file: File) => void;
}

export const ArtistSection = ({
    artists,
    onChange,
    onUpload
}: ArtistSectionProps) => (
    <section className="bg-white rounded-[15px] p-8 shadow-sm">
        <h2 className="text-[30px] font-medium text-black mb-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>Artists</h2>
        <p className="text-[20px] font-medium text-[#AEAEAE] mb-6" style={{ fontFamily: 'var(--font-anek-latin)' }}>Add performers or artists for your event.</p>
        <div className="w-full h-[1px] bg-[#AEAEAE] mb-8" />

        {artists.map((artist, idx) => (
            <div key={idx} className="bg-[#F5F5F5] rounded-[12px] p-6 mb-6 space-y-4">
                <input
                    type="file"
                    id={`upload-artist-${idx}`}
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(idx, f); }}
                />
                <div className="flex items-center justify-between">
                    <span className="text-[22px] font-semibold text-black">Artist {idx + 1}</span>
                    <button onClick={() => onChange(artists.filter((_, i) => i !== idx))} className="text-red-500 text-[18px] font-medium hover:underline">Remove</button>
                </div>
                <div>
                    <label className="text-[18px] font-medium text-[#686868]">Artist Name *</label>
                    <div className="border border-[#686868] rounded-[10px] h-[56px] flex items-center px-6 mt-2 bg-white">
                        <input
                            type="text"
                            placeholder="Enter artist name"
                            value={artist.name}
                            onChange={e => onChange(artists.map((a, i) => i === idx ? { ...a, name: e.target.value } : a))}
                            className="w-full bg-transparent outline-none text-[20px] text-black"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-[18px] font-medium text-[#686868]">About the Artist</label>
                    <div className="border border-[#686868] rounded-[10px] p-4 mt-2 bg-white">
                        <textarea
                            value={artist.description}
                            onChange={e => onChange(artists.map((a, i) => i === idx ? { ...a, description: e.target.value } : a))}
                            placeholder="Brief description..."
                            className="w-full bg-transparent outline-none text-[20px] text-black min-h-[80px]"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-[18px] font-medium text-[#686868]">Artist Image</label>
                    <div className="flex items-center gap-4 mt-2">
                        {artist.image_url && (
                            <div className="relative w-[60px] h-[60px]">
                                <Image src={artist.image_url} alt="" fill className="rounded-[8px] object-cover" />
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => document.getElementById(`upload-artist-${idx}`)?.click()}
                            className="flex items-center border border-[#686868] rounded-[8px] h-[40px] overflow-hidden bg-white"
                        >
                            <span className="px-4 text-[18px] font-medium text-black">
                                {artist.image_url ? 'Replace' : 'Upload Image'}
                            </span>
                            <div className="bg-[#AC9BF7] w-[40px] h-full flex items-center justify-center border-l border-[#686868]">
                                <Upload size={18} className="text-black" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        ))}

        <button
            type="button"
            onClick={() => onChange([...artists, { name: '', image_url: '', description: '' }])}
            className="flex items-center gap-3 bg-black text-white rounded-[12px] h-[52px] px-6 text-[20px] font-medium"
        >
            <PlusCircle size={22} /> Add Artist
        </button>
    </section>
);

interface TicketSectionProps {
    categories: TicketCategory[];
    onChange: (categories: TicketCategory[]) => void;
    onUpload: (idx: number, file: File) => void;
}

export const TicketSection = ({
    categories,
    onChange,
    onUpload
}: TicketSectionProps) => (
    <section className="bg-white rounded-[15px] p-8 shadow-sm">
        <h2 className="text-[30px] font-medium text-black mb-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>Ticket Categories</h2>
        <p className="text-[20px] font-medium text-[#AEAEAE] mb-6" style={{ fontFamily: 'var(--font-anek-latin)' }}>Define ticket tiers for your event.</p>
        <div className="w-full h-[1px] bg-[#AEAEAE] mb-8" />

        {categories.map((cat, idx) => (
            <div key={idx} className="bg-[#F5F5F5] rounded-[12px] p-6 mb-6 space-y-4">
                <input
                    type="file"
                    id={`upload-ticket-${idx}`}
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(idx, f); }}
                />
                <div className="flex items-center justify-between">
                    <span className="text-[22px] font-semibold text-black">Category {idx + 1}</span>
                    <button onClick={() => onChange(categories.filter((_, i) => i !== idx))} className="text-red-500 text-[18px] font-medium hover:underline">Remove</button>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => onChange(categories.map((c, i) => i === idx ? { ...c, has_image: false } : c))}
                        className={`px-5 py-2 rounded-[8px] text-[18px] font-medium border ${!cat.has_image ? 'bg-black text-white border-black' : 'bg-white text-[#686868] border-[#686868]'}`}
                    >
                        Basic
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange(categories.map((c, i) => i === idx ? { ...c, has_image: true } : c))}
                        className={`px-5 py-2 rounded-[8px] text-[18px] font-medium border ${cat.has_image ? 'bg-black text-white border-black' : 'bg-white text-[#686868] border-[#686868]'}`}
                    >
                        With Image
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <label className="text-[18px] font-medium text-[#686868]">Category Name *</label>
                        <div className="border border-[#686868] rounded-[10px] h-[56px] flex items-center px-6 mt-2 bg-white">
                            <input
                                type="text"
                                placeholder="e.g. Gold"
                                value={cat.name}
                                onChange={e => onChange(categories.map((c, i) => i === idx ? { ...c, name: e.target.value } : c))}
                                className="w-full bg-transparent outline-none text-[20px] text-black"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[18px] font-medium text-[#686868]">Price (₹)</label>
                        <div className="border border-[#686868] rounded-[10px] h-[56px] flex items-center px-6 mt-2 bg-white">
                            <input
                                type="number"
                                placeholder="0.00"
                                value={cat.price}
                                onChange={e => onChange(categories.map((c, i) => i === idx ? { ...c, price: e.target.value } : c))}
                                className="w-full bg-transparent outline-none text-[20px] text-black"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[18px] font-medium text-[#686868]">Capacity</label>
                        <div className="border border-[#686868] rounded-[10px] h-[56px] flex items-center px-6 mt-2 bg-white">
                            <input
                                type="number"
                                placeholder="Max tickets"
                                value={cat.capacity}
                                onChange={e => onChange(categories.map((c, i) => i === idx ? { ...c, capacity: e.target.value } : c))}
                                className="w-full bg-transparent outline-none text-[20px] text-black"
                            />
                        </div>
                    </div>
                </div>

                {cat.has_image && (
                    <div>
                        <label className="text-[18px] font-medium text-[#686868]">Category Image</label>
                        <div className="flex items-center gap-4 mt-2">
                            {cat.image_url && (
                                <div className="relative w-[60px] h-[60px]">
                                    <Image src={cat.image_url} alt="" fill className="rounded-[8px] object-cover" />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => document.getElementById(`upload-ticket-${idx}`)?.click()}
                                className="flex items-center border border-[#686868] rounded-[8px] h-[40px] overflow-hidden bg-white"
                            >
                                <span className="px-4 text-[18px] font-medium text-black">
                                    {cat.image_url ? 'Replace' : 'Upload Image'}
                                </span>
                                <div className="bg-[#AC9BF7] w-[40px] h-full flex items-center justify-center border-l border-[#686868]">
                                    <Upload size={18} className="text-black" />
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ))}

        <button
            type="button"
            onClick={() => onChange([...categories, { name: '', price: '', capacity: '', image_url: '', has_image: false }])}
            className="flex items-center gap-3 bg-black text-white rounded-[12px] h-[52px] px-6 text-[20px] font-medium"
        >
            <PlusCircle size={22} /> Add Ticket Category
        </button>
    </section>
);
