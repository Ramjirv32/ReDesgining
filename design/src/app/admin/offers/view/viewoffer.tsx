'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Offer {
    id: number;
    imagePlaceholder: string;
    name: string;
    discount: string;
    validTill: string;
    status: string;
}

export default function ViewOfferForm({ onBack }: { onBack: () => void }) {
    // Mock data based on the screenshot placeholders
    const offers: Offer[] = Array(6).fill({
        imagePlaceholder: '{OFFER IMAGE}\n3:1 aspect ratio',
        name: '{COPOUN NAME}',
        discount: '{DISCOUNT PERCENTAGE}',
        validTill: '{VALID TILL}',
        status: '{STATUS}'
    }).map((o, i) => ({ ...o, id: i + 1 }));

    return (
        <div className="bg-white rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex items-center justify-center gap-12">
            {/* Grid Container with right arrow navigation Centered */}
            <div className="relative w-full max-w-[1050px]">
                {/* 3-column Grid Centered - Balanced gaps */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-2 ">
                    {offers.map((offer) => (
                        <div
                            key={offer.id}
                            className="bg-[#F1EDFF] rounded-[24px] p-5 flex flex-col justify-center"
                            style={{ width: '290px', height: '150px', opacity: 1 }}
                        >
                            <div className="flex items-center gap-4">
                                {/* Offer Token (The Icon) */}
                                <div
                                    className="relative flex items-center justify-center shrink-0"
                                    style={{ width: '110px', height: '50px', opacity: 1 }}
                                >
                                    <div className="absolute inset-0 bg-white rounded-[12px]"></div>
                                    <div className="relative flex flex-col items-center justify-center gap-1">
                                        <span className="text-[8px] font-bold text-black uppercase leading-none text-center tracking-tight px-1" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                            {offer.imagePlaceholder.split('\n')[0]}
                                        </span>
                                        <span className="text-[5.5px] text-[#686868] font-medium uppercase leading-none text-center tracking-tight px-1" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                            {offer.imagePlaceholder.split('\n')[1]}
                                        </span>
                                    </div>
                                </div>

                                {/* Vertical Divider */}
                                <div
                                    className="bg-[#AEAEAE] shrink-0"
                                    style={{ width: '1px', height: '20px'}}
                                ></div>

                                {/* Info Section */}
                                <div className="flex flex-col flex-1 min-w-0" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    <h3 className="text-[14px] font-bold text-black uppercase tracking-tight leading-tight truncate mb-1 mt-10">
                                        {offer.name}
                                    </h3>
                                    <div className="flex flex-col space-y-0.5">
                                        <p className="text-[9px] text-gray-700 font-medium uppercase tracking-tight mt-[-2px]">
                                            {offer.discount}
                                        </p>
                                        <p className="text-[9px] text-gray-700 font-medium uppercase tracking-tight mt-[-2px]">
                                            {offer.validTill}
                                        </p>
                                    </div>

                                    {/* Status Section */}
                                    <div className="mt-3">
                                        <span
                                            className="bg-[#B5E4B8] text-black text-[9px] font-bold flex items-center justify-center rounded-[8px]"
                                            style={{ width: '64px', height: '24px', opacity: 1 }}
                                        >
                                            {offer.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Grid Navigation Arrow (Static) - Positioned accurately */}
                <button className="absolute -right-10 top-1/2 -translate-y-1/2 bg-black text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all hidden lg:flex z-20">
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
