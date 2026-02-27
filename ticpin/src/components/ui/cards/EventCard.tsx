'use client';

import { useState } from 'react';
import { MapPin, Calendar, Star } from 'lucide-react';

interface EventCardProps {
    image?: string;
    title?: string;
    location?: string;
    date?: string;
    variant?: 'tall' | 'wide';
    tag?: string;
    subText?: string;
    rating?: number;
}

export default function EventCard({
    image,
    title,
    location,
    date,
    variant = 'wide',
    tag,
    subText,
    rating,
}: EventCardProps) {
    const [imgLoaded, setImgLoaded] = useState(false);

    return (
        <div
            className={`group relative overflow-hidden rounded-[15px] border border-[#686868] bg-white 
                ${variant === 'tall'
                    ? 'h-[408px] w-full'
                    : 'h-[408px] w-full'
                } flex flex-col`}
        >
            {/* Image Placeholder Area */}
            <div className="relative h-[252px] bg-zinc-100 overflow-hidden">
                {image ? (
                    <img
                        src={image}
                        alt={title || 'Event'}
                        className={`h-full w-full object-cover ${imgLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        onLoad={() => setImgLoaded(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-100">
                        <Calendar size={48} className="text-zinc-300" />
                    </div>
                )}
            </div>

            {/* Gradient Strip */}
            <div className="relative h-[32px] bg-gradient-to-r from-[#866BFF] to-[#BDB1F3] flex items-center px-4">
                {tag && (
                    <div className="flex items-center gap-1.5">
                        {/* Tag Icon */}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.3637 1.36513e-05H9.46325C9.35576 -0.000607802 9.2492 0.0199946 9.14969 0.0606394C9.05018 0.101284 8.95968 0.161172 8.88336 0.236869L0.479079 8.61665C0.327204 8.76835 0.20672 8.94851 0.124516 9.14681C0.0423116 9.34511 0 9.55767 0 9.77234C0 9.987 0.0423116 10.1996 0.124516 10.3979C0.20672 10.5962 0.327204 10.7763 0.479079 10.928L5.06917 15.5181C5.3741 15.8249 5.78825 15.9982 6.22078 16C6.43633 16.0002 6.64978 15.9577 6.84883 15.875C7.04788 15.7923 7.22859 15.671 7.38055 15.5181L15.7603 7.10567C15.9112 6.95355 15.9963 6.74822 15.9972 6.53395V1.6335C15.9972 1.20027 15.8251 0.784788 15.5188 0.47845C15.2124 0.172112 14.7969 1.36513e-05 14.3637 1.36513e-05Z" fill="white" />
                        </svg>
                        <svg width="3" height="3" viewBox="0 0 3 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.22511 2.45023C1.90173 2.45023 2.45023 1.90173 2.45023 1.22511C2.45023 0.548502 1.90173 0 1.22511 0C0.548502 0 0 0.548502 0 1.22511C0 1.90173 0.548502 2.45023 1.22511 2.45023Z" fill="#AC9BF7" />
                        </svg>
                        <span className="text-white text-base font-medium">{tag}</span>
                    </div>
                )}
            </div>

            {/* Info Part */}
            <div className="relative h-[124px] bg-white p-5 flex flex-col justify-between">
                <h3 className="text-2xl font-medium text-black mb-2">
                    {title || 'Name'}
                </h3>

                {/* Rating Badge */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] bg-gradient-to-r from-[#866BFF]/50 to-[#BDB1F3]/50">
                        <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.19293 0.345484C4.3426 -0.115171 4.99431 -0.115172 5.14399 0.345483L5.90328 2.68236C5.97022 2.88838 6.1622 3.02786 6.37881 3.02786H8.83595C9.32032 3.02786 9.5217 3.64766 9.12985 3.93236L7.14198 5.37664C6.96673 5.50396 6.8934 5.72964 6.96034 5.93565L7.71964 8.27253C7.86932 8.73319 7.34208 9.11625 6.95022 8.83155L4.96235 7.38728C4.78711 7.25996 4.54981 7.25996 4.37456 7.38728L2.3867 8.83155C1.99484 9.11625 1.4676 8.73319 1.61727 8.27253L2.37657 5.93565C2.44351 5.72964 2.37018 5.50396 2.19494 5.37664L0.207068 3.93236C-0.184789 3.64766 0.0165983 3.02786 0.50096 3.02786H2.9581C3.17471 3.02786 3.36669 2.88838 3.43363 2.68236L4.19293 0.345484Z" fill="#5331EA" />
                        </svg>
                        <span className="text-[10px] font-black text-[#5331EA]">{rating || '4.0'}</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-1.5 h-px bg-[#5331EA] opacity-30"></div>
                        <div className="w-1.5 h-px bg-[#5331EA] opacity-30"></div>
                    </div>
                </div>

                {/* Location and Arrow */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-black flex-shrink-0" />
                        <p className="text-[15px] font-medium text-black">
                            {location || 'Location'}
                        </p>
                    </div>

                    <div className="relative flex-shrink-0 self-center mt-[-30px]">
                        <svg width="40" height="40" viewBox="0 0 51 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 15C0 6.71573 6.71573 0 15 0H36C44.2843 0 51 6.71573 51 15V36C51 44.2843 44.2843 51 36 51H15C6.71573 51 0 44.2843 0 36V15Z" fill="#D9D9D9" />
                        </svg>
                        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" width="16" height="20" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.25 12.7368C2.25 13.7403 2.44687 14.691 2.84062 15.5888C3.23438 16.4865 3.79688 17.2726 4.52812 17.9473C4.50938 17.8509 4.5 17.764 4.5 17.6868V17.4263C4.5 16.8087 4.6125 16.2298 4.8375 15.6895C5.0625 15.1491 5.39062 14.657 5.82187 14.2132L9 11L12.1781 14.2132C12.6094 14.657 12.9375 15.1491 13.1625 15.6895C13.3875 16.2298 13.5 16.8087 13.5 17.4263V17.6868C13.5 17.764 13.4906 17.8509 13.4719 17.9473C14.2031 17.2719 14.7656 16.4858 15.1595 15.5888C15.5532 14.6917 15.75 13.7411 15.75 12.7368C15.75 11.7719 15.5767 10.8599 15.2302 10.0007C14.8837 9.14157 14.382 8.37467 13.725 7.7C13.35 7.95087 12.9563 8.13922 12.5438 8.26505C12.1313 8.39087 11.7094 8.4534 11.2781 8.45263C10.1156 8.45263 9.10763 8.05702 8.25412 7.26579C7.40062 6.47456 6.909 5.5 6.77925 4.34211C6.04725 4.97895 5.4 5.64011 4.8375 6.32559C4.275 7.01105 3.80137 7.70579 3.41663 8.40979C3.03188 9.11379 2.74163 9.83246 2.54588 10.5658C2.35013 11.2991 2.2515 12.0228 2.25 12.7368ZM9 14.2421L7.39688 15.8632C7.19063 16.0754 7.03125 16.3167 6.91875 16.5868C6.80625 16.857 6.75 17.1368 6.75 17.4263C6.75 18.0438 6.97012 18.5746 7.41037 19.0184C7.85063 19.4622 8.3805 19.6843 9 19.6843C9.6195 19.6843 10.149 19.4622 10.5885 19.0184C11.028 18.5746 11.2485 18.0438 11.25 17.4263C11.25 17.1176 11.1937 16.8331 11.0812 16.5729C10.9688 16.3129 10.8094 16.0763 10.6031 15.8632L9 14.2421ZM9 0V3.82105C9 4.47719 9.2205 5.02719 9.6615 5.47105C10.1025 5.91491 10.6414 6.13684 11.2781 6.13684C11.6156 6.13684 11.9299 6.06467 12.2209 5.92032C12.5119 5.77597 12.7695 5.55867 12.9938 5.26843L13.5 4.63157C14.8875 5.44211 15.9843 6.57105 16.7906 8.01843C17.5968 9.46579 18 11.0386 18 12.7368C18 15.3229 17.128 17.5132 15.3843 19.3079C13.6406 21.1027 11.5125 22 9 22C6.4875 22 4.35938 21.1027 2.61562 19.3079C0.871875 17.5132 0 15.3229 0 12.7368C0 10.2474 0.81075 7.88333 2.43225 5.64473C4.05375 3.40614 6.243 1.52456 9 0Z" fill="black" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}