'use client';

import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { adminApi, OfferRecord } from '@/lib/api/admin';

export default function ViewOfferForm({ onBack }: { onBack: () => void }) {
    const [offers, setOffers] = useState<OfferRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        adminApi.listOffers()
            .then(setOffers)
            .catch(() => setError('Failed to load offers'))
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (iso: string) => {
        try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return iso; }
    };

    return (
        <div className="bg-white rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex items-center justify-center gap-12">
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
                                className="bg-[#F1EDFF] rounded-[24px] p-5 flex flex-col justify-center"
                                style={{ width: '290px', height: '150px', opacity: 1 }}
                            >
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
        </div>
    );
}
