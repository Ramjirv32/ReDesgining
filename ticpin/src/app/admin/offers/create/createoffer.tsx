'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { adminApi, AdminListing } from '@/lib/api/admin';

// ── Reusable multi-select checkbox dropdown ────────────────────────────
function MultiSelect<T extends { id: string; label: string }>({
    items, selected, onToggle, onSelectAll, onClear,
    placeholder, loading, emptyText,
}: {
    items: T[];
    selected: string[];
    onToggle: (id: string) => void;
    onSelectAll: () => void;
    onClear: () => void;
    placeholder: string;
    loading?: boolean;
    emptyText?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const allSelected = items.length > 0 && selected.length === items.length;

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full min-h-[52px] border border-[#D9D9D9] rounded-2xl px-5 py-2 flex items-center justify-between gap-2 bg-white focus:border-purple-300 outline-none transition-all text-left"
            >
                <div className="flex flex-wrap gap-1.5 flex-1">
                    {selected.length === 0 ? (
                        <span className="text-gray-300 text-[16px] font-medium" style={{ fontFamily: 'Anek Latin' }}>
                            {loading ? 'Loading...' : placeholder}
                        </span>
                    ) : allSelected ? (
                        <span className="text-[#5331EA] text-[15px] font-semibold" style={{ fontFamily: 'Anek Latin' }}>All selected ({items.length})</span>
                    ) : (
                        selected.map(id => {
                            const item = items.find(i => i.id === id);
                            return (
                                <span key={id} className="inline-flex items-center gap-1 bg-[#EDE9FD] text-[#5331EA] text-[13px] font-semibold rounded-full px-2.5 py-0.5">
                                    {item?.label ?? id}
                                    <button type="button" onClick={e => { e.stopPropagation(); onToggle(id); }}>
                                        <X size={11} />
                                    </button>
                                </span>
                            );
                        })
                    )}
                </div>
                <ChevronDown size={18} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-50 left-0 right-0 top-[calc(100%+6px)] bg-white border border-[#D9D9D9] rounded-2xl shadow-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
                        <button type="button" onClick={allSelected ? onClear : onSelectAll}
                            className="flex items-center gap-2 text-[13px] font-semibold text-[#5331EA] hover:underline">
                            {allSelected ? <X size={13} /> : <Check size={13} />}
                            {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                        {selected.length > 0 && !allSelected && (
                            <button type="button" onClick={onClear} className="text-[12px] text-zinc-400 hover:text-red-500 ml-auto">Clear</button>
                        )}
                    </div>
                    <div className="max-h-[220px] overflow-y-auto">
                        {loading ? (
                            <p className="text-center text-zinc-400 text-sm py-4">Loading…</p>
                        ) : items.length === 0 ? (
                            <p className="text-center text-zinc-400 text-sm py-4">{emptyText ?? 'No items'}</p>
                        ) : (
                            items.map(item => {
                                const checked = selected.includes(item.id);
                                return (
                                    <label key={item.id}
                                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#F5F3FF] transition-colors ${checked ? 'bg-[#F5F3FF]' : ''}`}>
                                        <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                            checked ? 'bg-[#5331EA] border-[#5331EA]' : 'border-[#D9D9D9] bg-white'
                                        }`}>
                                            {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <span className="text-[15px] font-medium text-[#2a2a2a]" style={{ fontFamily: 'Anek Latin' }}>{item.label}</span>
                                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => onToggle(item.id)} />
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CreateOfferForm({ onBack }: { onBack: () => void }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [appliesTo, setAppliesTo] = useState<'event' | 'play' | 'dining'>('event');
    const [entityIds, setEntityIds] = useState<string[]>([]);
    const [listings, setListings] = useState<AdminListing[]>([]);
    const [listingsLoading, setListingsLoading] = useState(false);
    const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
    const [discount, setDiscount] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load approved listings for the selected category
    useEffect(() => {
        setEntityIds([]);
        setListings([]);
        setListingsLoading(true);
        const fetcher =
            appliesTo === 'event' ? adminApi.listEvents() :
            appliesTo === 'dining' ? adminApi.listDining() :
            adminApi.listPlay();
        fetcher
            .then(all => setListings(
                (all as AdminListing[]).filter(l => l.status === 'approved')
            ))
            .catch(() => setListings([]))
            .finally(() => setListingsLoading(false));
    }, [appliesTo]);

    const toggleListing = (id: string) =>
        setEntityIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const selectAllListings = () => setEntityIds(listings.map(l => (l.id || l._id || '')));
    const clearListings = () => setEntityIds([]);

    const handleCreate = async () => {
        setError('');
        setSuccess('');
        if (!title.trim()) { setError('Title is required'); return; }
        if (entityIds.length === 0) { setError(`Select at least one ${appliesTo} listing`); return; }
        if (!discount || isNaN(Number(discount)) || Number(discount) <= 0) { setError('Enter a valid discount value'); return; }
        if (!validUntil) { setError('Valid Until date is required'); return; }

        setLoading(true);
        try {
            await adminApi.createOffer({
                title: title.trim(),
                description: description.trim(),
                discount_type: discountType,
                discount_value: Number(discount),
                applies_to: appliesTo,
                entity_ids: entityIds,
                valid_until: new Date(validUntil).toISOString(),
            });
            setSuccess('Offer created successfully!');
            setTitle(''); setDescription(''); setDiscount(''); setEntityIds([]); setValidUntil('');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to create offer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex items-center justify-center gap-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-8 w-full mt-[-60px]">
                {/* Left Column */}
                <div className="space-y-8">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Title</label>
                        <input
                            type="text"
                            placeholder="Enter offer title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 text-[#2a2a2a] placeholder:text-gray-300 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                            style={{ fontFamily: 'Anek Latin' }}
                        />
                    </div>

                    {/* Applies To — when changed, listings reload */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Applies To</label>
                        <div className="relative">
                            <select
                                value={appliesTo}
                                onChange={(e) => setAppliesTo(e.target.value as 'event' | 'play' | 'dining')}
                                className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 appearance-none bg-white text-[#2a2a2a] text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                                style={{ fontFamily: 'Anek Latin' }}
                            >
                                <option value="event">Events</option>
                                <option value="play">Play</option>
                                <option value="dining">Dining</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        </div>
                    </div>

                    {/* Discount Type & Value */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Discount</label>
                        <div className="flex gap-3">
                            <div className="relative w-1/2">
                                <select
                                    value={discountType}
                                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'flat')}
                                    className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 appearance-none bg-white text-[#2a2a2a] text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                                    style={{ fontFamily: 'Anek Latin' }}
                                >
                                    <option value="percent">Percent (%)</option>
                                    <option value="flat">Flat (₹)</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            </div>
                            <input
                                type="number"
                                placeholder={discountType === 'percent' ? 'e.g. 20' : 'e.g. 200'}
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                className="w-1/2 h-[52px] border border-[#D9D9D9] rounded-2xl px-5 text-[#2a2a2a] placeholder:text-gray-300 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                                style={{ fontFamily: 'Anek Latin' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Description</label>
                        <input
                            type="text"
                            placeholder="Enter description here"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 text-[#2a2a2a] placeholder:text-gray-300 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                            style={{ fontFamily: 'Anek Latin' }}
                        />
                    </div>

                    {/* Specific Listing Multi-Select */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>
                                {appliesTo === 'event' ? 'Events' : appliesTo === 'dining' ? 'Dining Venues' : 'Play Venues'}
                            </label>
                            <span className="text-[#5331EA] text-[13px] font-medium" style={{ fontFamily: 'Anek Latin' }}>
                                {listingsLoading ? 'Loading...' : `${entityIds.length} of ${listings.length} selected`}
                            </span>
                        </div>
                        <MultiSelect
                            items={listings.map(l => ({ id: l.id || l._id || '', label: l.name || l.title || (l.id || l._id || '') }))}
                            selected={entityIds}
                            onToggle={toggleListing}
                            onSelectAll={selectAllListings}
                            onClear={clearListings}
                            placeholder={`-- Select ${appliesTo} listings --`}
                            loading={listingsLoading}
                            emptyText={`No approved ${appliesTo}s found`}
                        />
                    </div>

                    {/* Valid Until */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Valid Until</label>
                        <input
                            type="datetime-local"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 text-[#2a2a2a] text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                            style={{ fontFamily: 'Anek Latin' }}
                        />
                    </div>
                </div>
            </div>

            {/* Feedback & Create Button */}
            <div className="absolute bottom-14 right-14 flex flex-col items-end gap-2">
                {error && <p className="text-red-500 text-[13px] font-medium">{error}</p>}
                {success && <p className="text-green-600 text-[13px] font-bold">{success}</p>}
                <button
                    className="w-[80px] h-[48px] bg-[#000000] text-white rounded-[14px] text-[16px] font-semibold disabled:opacity-40"
                    style={{ fontFamily: 'Anek Latin' }}
                    onClick={handleCreate}
                    disabled={loading}
                >
                    {loading ? '...' : 'Create'}
                </button>
            </div>
        </div>
    );
}
