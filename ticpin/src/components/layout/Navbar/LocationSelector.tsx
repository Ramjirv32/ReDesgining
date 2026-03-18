'use client';

import React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

import { LocationData } from '@/lib/hooks/useGeolocation';

interface LocationSelectorProps {
    location: LocationData | null;
    onOpenModal: () => void;
    onClear: () => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ location, onOpenModal, onClear }) => {
    return (
        <div className="hidden lg:flex items-center gap-1 min-w-max">
            <div
                onClick={onOpenModal}
                className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors py-1"
            >
                <div className="w-9 h-9 flex items-center justify-center bg-zinc-50 rounded-full">
                    <Image src="/loc icon.svg" alt="Location" width={18} height={18} className="w-5 h-5 object-contain" />
                </div>
                <div className="flex flex-col -space-y-1">
                    <span className="text-[16px] font-bold text-black max-w-[180px] truncate leading-tight">
                        {location?.name || 'Set Location'}
                    </span>
                    {location && (location.district || location.state) && (
                        <span className="text-[12px] font-medium text-zinc-500 max-w-[180px] truncate leading-tight">
                            {[location.district, location.state].filter(Boolean).join(', ')}
                        </span>
                    )}
                </div>
            </div>
            {location && (
                <button
                    onClick={e => { e.stopPropagation(); onClear(); }}
                    className="ml-1 p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                    aria-label="Clear location"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
};

export default React.memo(LocationSelector);
