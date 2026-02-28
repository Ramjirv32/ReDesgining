'use client';

import { ChevronRight, Pencil, Trash2, X, Clock, BarChart3, Info } from 'lucide-react';
import { adminApi, OfferRecord } from '@/lib/api/admin';
import CreateOfferForm from '../create/createoffer';
import { useState, useEffect } from 'react';

export default function ViewOfferForm({ onBack }: { onBack: () => void }) {
    const [offers, setOffers] = useState<OfferRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOffer, setSelectedOffer] = useState<OfferRecord | null>(null);
    const [editingOffer, setEditingOffer] = useState<OfferRecord | null>(null);

    const fetchOffers = () => {
        setLoading(true);
        adminApi.listOffers()
            .then(setOffers)
            .catch(() => setError('Failed to load offers'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this offer?')) return;
        try {
            await adminApi.deleteOffer(id);
            setOffers(prev => prev.filter(o => o.id !== id));
        } catch (err) {
            alert('Failed to delete offer');
        }
    };

    const handleEdit = (e: React.MouseEvent, offer: OfferRecord) => {
        e.stopPropagation();
        setEditingOffer(offer);
    };

    const formatDate = (iso: string) => {
        try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return iso; }
    };

    const formatFullDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch { return iso; }
    };

    if (editingOffer) {
        return <CreateOfferForm onBack={() => { setEditingOffer(null); fetchOffers(); }} editData={editingOffer || undefined} />;
    }

    return (
        <div className="bg-white rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex items-center justify-center gap-12 relative overflow-hidden">
            <div className="relative w-full max-w-[1050px]">
                {loading ? (
                    <div className="text-center py-20 text-gray-400 text-[16px]">Loading offers...</div>
                ) : error ? (
                    <div className="text-center py-20 text-red-400 text-[16px]">{error}</div>
                ) : offers.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 text-[16px]">No offers created yet.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-2">
                        {offers.map((offer) => (
                            <div
                                key={offer.id}
                                onClick={() => setSelectedOffer(offer)}
                                className="bg-[#F1EDFF] rounded-[24px] p-5 flex flex-col justify-center cursor-pointer hover:shadow-lg transition-all active:scale-95 group relative border border-transparent hover:border-[#866BFF]/30"
                                style={{ width: '290px', height: '150px' }}
                            >
                                {/* Quick Actions */}
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleEdit(e, offer)}
                                        className="p-1.5 bg-white rounded-full shadow-sm text-blue-600 hover:bg-blue-50"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, offer.id)}
                                        className="p-1.5 bg-white rounded-full shadow-sm text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Offer Image or Token */}
                                    <div className="relative flex items-center justify-center shrink-0 rounded-[12px] overflow-hidden" style={{ width: '110px', height: '110px', background: '#F5F5F5' }}>
                                        {offer.image ? (
                                            <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 bg-white flex items-center justify-center">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <span className="text-[8px] font-bold text-black uppercase leading-none text-center tracking-tight px-1" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                                        {offer.title}
                                                    </span>
                                                    <span className="text-[5.5px] text-[#686868] font-medium uppercase leading-none text-center tracking-tight px-1" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                                        {offer.applies_to}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="bg-[#AEAEAE] shrink-0" style={{ width: '1px', height: '80px' }} />

                                    {/* Info */}
                                    <div className="flex flex-col flex-1 min-w-0" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                        <h3 className="text-[14px] font-bold text-black uppercase tracking-tight leading-tight truncate mb-1">
                                            {offer.title}
                                        </h3>
                                        <div className="flex flex-col space-y-0.5">
                                            <p className="text-[9px] text-gray-700 font-medium uppercase tracking-tight mt-[-2px]">
                                                {offer.discount_type === 'percent' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
                                            </p>
                                            <p className="text-[9px] text-gray-700 font-medium uppercase tracking-tight mt-[-2px]">
                                                Till {formatDate(offer.valid_until)}
                                            </p>
                                        </div>
                                        <div className="mt-3">
                                            <span
                                                className={`text-black text-[9px] font-bold flex items-center justify-center rounded-[8px] ${offer.is_active ? 'bg-[#B5E4B8]' : 'bg-[#FFCDD2]'}`}
                                                style={{ width: '64px', height: '24px' }}
                                            >
                                                {offer.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button className="absolute -right-10 top-1/2 -translate-y-1/2 bg-black text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all hidden lg:flex z-20">
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Offer Detail Modal */}
            {selectedOffer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white w-full max-w-[500px] rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#866BFF] p-8 text-white relative">
                            <button onClick={() => setSelectedOffer(null)} className="absolute right-8 top-8 p-1 hover:bg-white/20 rounded-full transition-all">
                                <X size={24} />
                            </button>
                            <h2 className="text-[24px] font-bold" style={{ fontFamily: 'var(--font-anek-latin)' }}>Offer Details</h2>
                            <div className="mt-2 inline-block px-3 py-1 bg-white/20 rounded-lg text-[14px] font-bold tracking-widest uppercase">
                                {selectedOffer.title}
                            </div>
                        </div>

                        <div className="p-8 space-y-8" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {selectedOffer.image && (
                                <div className="w-full h-[200px] rounded-3xl overflow-hidden bg-zinc-100">
                                    <img src={selectedOffer.image} alt={selectedOffer.title} className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#F1EDFF] flex items-center justify-center shrink-0">
                                    <Info className="text-[#866BFF]" size={20} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[12px] text-gray-500 font-bold uppercase tracking-wider">Description</label>
                                    <p className="text-[16px] text-black font-medium mt-1">{selectedOffer.description || 'No description provided.'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#F1EDFF] flex items-center justify-center shrink-0">
                                    <BarChart3 className="text-[#866BFF]" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wider">Offer Summary</p>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                                            <p className="text-[20px] font-bold text-black uppercase">{selectedOffer.applies_to}s</p>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase">Applies To</p>
                                        </div>
                                        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                                            <p className="text-[20px] font-bold text-black">
                                                {selectedOffer.discount_type === 'percent' ? `${selectedOffer.discount_value}%` : `₹${selectedOffer.discount_value}`}
                                            </p>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase">Discount</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#F1EDFF] flex items-center justify-center shrink-0">
                                    <Clock className="text-[#866BFF]" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wider">Validity</p>
                                    <div className="mt-3 flex justify-between items-center text-[14px]">
                                        <span className="text-gray-400 font-medium">Valid Until</span>
                                        <span className="text-black font-bold">{formatFullDate(selectedOffer.valid_until)}</span>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setSelectedOffer(null)} className="w-full h-[56px] bg-black text-white rounded-2xl font-bold text-[16px] transition-all active:scale-[0.98] hover:bg-zinc-800 shadow-xl">
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
