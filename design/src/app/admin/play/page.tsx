'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function PlayAdminPage() {
    return (
        <div className="w-full h-full flex items-center justify-center">
            {/* List Item Container */}
            <div className="w-full max-w-[850px] relative px-4 mx-auto">
                {/* Play Item Card (Rectangle 39) */}
                <div
                    className="w-full min-h-[250px] lg:h-[305px] rounded-[19px] flex flex-col lg:flex-row items-center px-6 lg:px-[63px] py-8 lg:py-0 gap-8 lg:gap-12 mt-[40px]"
                    style={{ background: 'rgba(255, 241, 168, 0.3)' }}
                >
                    {/* Image Placeholder (Rectangle 131) */}
                    <div className="w-[265px] h-[149px] bg-white rounded-[15px] flex flex-col items-center justify-center text-center p-4">
                        <span className="text-[17px] font-medium block text-black" style={{ fontFamily: 'Anek Latin' }}>{`{PLAY IMAGE}`}</span>
                        <span className="text-[12px] font-medium mt-1 text-black" style={{ fontFamily: 'Anek Latin' }}>16:9 aspect ratio</span>
                    </div>

                    {/* Vertical Divider (Line 25) */}
                    <div className="hidden lg:block w-[1.5px] h-[86px] bg-[#AEAEAE]"></div>

                    {/* Info Text Area */}
                    <div className="flex flex-col gap-1 lg:gap-2 text-center lg:text-left">
                        <h3 className="text-[20px] lg:text-[25px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>{`{PLAY NAME}`}</h3>
                        <p className="text-[20px] lg:text-[25px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>{`{BUSINESS OWNER NAME}`}</p>
                    </div>

                    {/* Pending Status Tag (Rectangle 132) */}
                    <div
                        className="lg:absolute bottom-6 lg:bottom-[35px] right-6 lg:right-[35px] w-[99px] h-[45px] rounded-[16px] flex items-center justify-center"
                        style={{ background: '#F9C9A9' }}
                    >
                        <span className="text-[18px] lg:text-[20px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>Pending</span>
                    </div>
                </div>

                {/* Navigation Next Button (Ellipse 24) */}
                <button
                    className="hidden xl:flex absolute -right-[100px] top-1/2 -translate-y-1/2 w-[57px] h-[57px] bg-black rounded-full items-center justify-center text-white z-20"
                    aria-label="Next Item"
                >
                    <ChevronRight size={32} />
                </button>
            </div>
        </div>
    );
}
