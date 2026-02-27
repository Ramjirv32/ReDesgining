'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { adminApi, UserRecord } from '@/lib/api/admin';

// ── Reusable multi-select checkbox dropdown ───────────────────────────────────
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
            {/* Trigger */}
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

            {/* Dropdown panel */}
            {open && (
                <div className="absolute z-50 left-0 right-0 top-[calc(100%+6px)] bg-white border border-[#D9D9D9] rounded-2xl shadow-xl overflow-hidden">
                    {/* All / None row */}
                    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
                        <button
                            type="button"
                            onClick={allSelected ? onClear : onSelectAll}
                            className="flex items-center gap-2 text-[13px] font-semibold text-[#5331EA] hover:underline"
                        >
                            {allSelected ? <X size={13} /> : <Check size={13} />}
                            {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                        {selected.length > 0 && !allSelected && (
                            <button type="button" onClick={onClear} className="text-[12px] text-zinc-400 hover:text-red-500 ml-auto">Clear</button>
                        )}
                    </div>
                    {/* Items */}
                    <div className="max-h-[220px] overflow-y-auto">
                        {loading ? (
                            <p className="text-center text-zinc-400 text-sm py-4">Loading…</p>
                        ) : items.length === 0 ? (
                            <p className="text-center text-zinc-400 text-sm py-4">{emptyText ?? 'No items'}</p>
                        ) : (
                            items.map(item => {
                                const checked = selected.includes(item.id);
                                return (
                                    <label
                                        key={item.id}
                                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#F5F3FF] transition-colors ${checked ? 'bg-[#F5F3FF]' : ''}`}
                                    >
                                        <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                            checked ? 'bg-[#5331EA] border-[#5331EA]' : 'border-[#D9D9D9] bg-white'
                                        }`}>
                                            {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <span className="text-[15px] font-medium text-[#2a2a2a]" style={{ fontFamily: 'Anek Latin' }}>
                                            {item.label}
                                        </span>
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

export default function CreateCouponPage({ onBack }: { onBack: () => void }) {
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
    const [discount, setDiscount] = useState('');
    const [maxUses, setMaxUses] = useState('');
    const [userIds, setUserIds] = useState<string[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [validFrom, setValidFrom] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setUsersLoading(true);
        adminApi.listUsers()
            .then(setUsers)
            .catch(() => setUsers([]))
            .finally(() => setUsersLoading(false));
    }, []);

    const toggleUser = (id: string) =>
        setUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const selectAllUsers = () => setUserIds(users.map(u => u.id));
    const clearUsers = () => setUserIds([]);

    const handleCreate = async () => {
        setError('');
        setSuccess('');
        if (!code.trim()) { setError('Coupon code is required'); return; }
        if (!discount || isNaN(Number(discount)) || Number(discount) <= 0) { setError('Enter a valid discount value'); return; }
        if (!validFrom || !validUntil) { setError('Valid From and Valid Until dates are required'); return; }

        setLoading(true);
        try {
            await adminApi.createCoupon({
                code: code.trim().toUpperCase(),
                description: description.trim() || undefined,
                discount_type: discountType,
                discount_value: Number(discount),
                valid_from: new Date(validFrom).toISOString(),
                valid_until: new Date(validUntil).toISOString(),
                max_uses: maxUses ? Number(maxUses) : 0,
                user_ids: userIds.length > 0 ? userIds : undefined,
            });
            setSuccess(`Coupon "${code.toUpperCase()}" created!`);
            setCode(''); setDescription(''); setDiscount(''); setMaxUses(''); setUserIds([]); setValidFrom(''); setValidUntil('');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to create coupon');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex items-center justify-center gap-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-8 w-full">
                {/* Left Column */}
                <div className="space-y-8">
                    {/* Code */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Coupon Code</label>
                            <span className="text-[#5331EA] text-[13px] font-medium" style={{ fontFamily: 'Anek Latin' }}>ex: FLAT50</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Enter coupon code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 text-[#2a2a2a] placeholder:text-gray-300 text-[16px] font-bold uppercase focus:border-purple-300 outline-none transition-all"
                            style={{ fontFamily: 'Anek Latin' }}
                        />
                    </div>

                    {/* Discount */}
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

                    {/* Max Uses */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Max Uses</label>
                            <span className="text-[#5331EA] text-[13px] font-medium" style={{ fontFamily: 'Anek Latin' }}>0 = unlimited</span>
                        </div>
                        <input
                            type="number"
                            placeholder="e.g. 100"
                            value={maxUses}
                            onChange={(e) => setMaxUses(e.target.value)}
                            className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 text-[#2a2a2a] placeholder:text-gray-300 text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                            style={{ fontFamily: 'Anek Latin' }}
                        />
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

                    {/* User Multi-Select */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Apply to Users</label>
                            <span className="text-[#5331EA] text-[13px] font-medium" style={{ fontFamily: 'Anek Latin' }}>
                                {userIds.length === 0 ? 'All users (global)' : `${userIds.length} selected`}
                            </span>
                        </div>
                        <MultiSelect
                            items={users.map(u => ({ id: u.id, label: `${u.name || 'No name'} — ${u.phone}` }))}
                            selected={userIds}
                            onToggle={toggleUser}
                            onSelectAll={selectAllUsers}
                            onClear={clearUsers}
                            placeholder="-- All Users (Global) --"
                            loading={usersLoading}
                            emptyText="No users found"
                        />
                    </div>

                    {/* Valid From & Until */}
                    <div className="space-y-1.5">
                        <label className="text-gray-600 text-[16px] font-medium block" style={{ fontFamily: 'Anek Latin' }}>Valid Period</label>
                        <div className="flex flex-col gap-3">
                            <input
                                type="datetime-local"
                                value={validFrom}
                                onChange={(e) => setValidFrom(e.target.value)}
                                className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 text-[#2a2a2a] text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                                style={{ fontFamily: 'Anek Latin' }}
                                placeholder="Start date"
                            />
                            <input
                                type="datetime-local"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                                className="w-full h-[52px] border border-[#D9D9D9] rounded-2xl px-5 text-[#2a2a2a] text-[16px] font-medium focus:border-purple-300 outline-none transition-all"
                                style={{ fontFamily: 'Anek Latin' }}
                                placeholder="End date"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback & Create */}
            <div className="absolute bottom-14 left-14 flex flex-col gap-2">
                {error && <p className="text-red-500 text-[13px] font-medium">{error}</p>}
                {success && <p className="text-green-600 text-[13px] font-bold">{success}</p>}
                <button
                    className="w-[80px] h-[48px] bg-[#000000] text-white rounded-[14px] text-[16px] font-bold disabled:opacity-40"
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
