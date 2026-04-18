'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function ApprovedPlayPage() {
    const approvedItems = Array(6).fill(null); // Just for demonstration to show the 3x2 grid

    return (
        <div className="w-full flex justify-center py-6">
            {/* Grid Container with right arrow navigation Centered */}
            <div className="relative w-full max-w-[1050px]">
                {/* 3-column Grid Centered - Balanced gaps */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-2 justify-items-center">
                    {approvedItems.map((_, index) => (
                        <div
                            key={index}
                            className="bg-[#FFF1A84D] rounded-[24px] p-5 flex flex-col justify-center"
                            style={{ width: '290px', height: '150px' }}
                        >
                            <div className="flex items-center gap-4">
                                {/* Image Placeholder */}
                                <div className="w-[110px] h-[62px] bg-white rounded-[10px] flex flex-col items-center justify-center text-center p-1 shrink-0">
                                    <span className="text-[10px] font-medium text-black leading-tight" style={{ fontFamily: 'Anek Latin' }}>{`{PLAY IMAGE}`}</span>
                                    <span className="text-[7px] font-medium text-black mt-1" style={{ fontFamily: 'Anek Latin' }}>16:9 aspect ratio</span>
                                </div>

                                {/* Vertical Divider */}
                                <div className="w-[1px] h-[50px] bg-[#AEAEAE] opacity-50"></div>

                                {/* Info Section */}
                                <div className="flex flex-col flex-1 min-w-0" style={{ fontFamily: 'Anek Latin' }}>
                                    <h3 className="text-[14px] font-bold text-black uppercase tracking-tight leading-tight truncate mb-1">
                                        {`{PLAY NAME}`}
                                    </h3>
                                    <p className="text-[10px] text-gray-700 font-medium uppercase tracking-tight mb-3">
                                        {`{BUSINESS OWNER NAME}`}
                                    </p>

                                    {/* Status Section */}
                                    <span
                                        className="bg-[#B5E4B8] text-black text-[10px] font-bold flex items-center justify-center rounded-[8px]"
                                        style={{ width: '68px', height: '26px' }}
                                    >
                                        Approved
                                    </span>
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
