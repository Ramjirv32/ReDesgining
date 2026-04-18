'use client';

import { MapPin, Calendar, Star } from 'lucide-react';

interface EventCardProps {
    image?: string;
    title?: string;
    location?: string;
    date?: string;
    variant?: 'tall' | 'wide';
    tag?: string;
    subText?: string;
    width?: string;
    height?: string;
}

export default function EventCard({
    image,
    title,
    location,
    date,
    variant = 'wide',
    tag,
    subText,
    width,
    height,
}: EventCardProps) {
    const cardWidth = width || (variant === 'tall' ? '140px' : '300px');
    const cardHeight = height || (variant === 'tall' ? '280px' : '250px');

    return (
        <div
            className="group relative overflow-hidden bg-white shadow-sm flex flex-col"
            style={{ borderRadius: '15px', border: '1px solid #5331EA', width: cardWidth, height: cardHeight }}
        >
            {/* Image Part */}
            <div className="relative w-full overflow-hidden flex items-center justify-center border-b border-zinc-100" style={{ flex: '1', borderTopLeftRadius: '14px', borderTopRightRadius: '14px', backgroundColor: '#f4f4f5' }}>
                {tag && (
                    <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                        {tag}
                    </div>
                )}

                {image ? (
                    <img 
                        src={image} 
                        alt={title || 'Event'} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-300">
                        <Star size={32} strokeWidth={1} className="text-primary/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No Image</span>
                    </div>
                )}
            </div>

            {/* Info Part */}
            <div className="w-full bg-white p-3 md:p-5 flex flex-col justify-center gap-1 border-t border-zinc-50" style={{ borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px' }}>
                <div className="flex justify-between items-start">
                    <div className="space-y-0.5 max-w-[80%]">
                        <h3 className="line-clamp-1 text-sm md:text-base font-black text-zinc-900">
                            {title || 'Event Name'}
                        </h3>
                        <p className="text-[9px] md:text-[11px] font-normal text-zinc-500 uppercase tracking-wider line-clamp-1">
                            {location || 'Location'}
                        </p>
                    </div>
                    <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                        <svg width="12" height="12" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-secondary text-primary text-[9px] font-black rounded uppercase">
                        {date || subText || 'Details'}
                    </span>
                </div>
            </div>
        </div>
    );
}
