'use client';

import React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface LocationSelectorProps {
    location: string;
    onOpenModal: () => void;
    onClear: () => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ location, onOpenModal, onClear }) => {
    return (
        <div className="hidden lg:flex items-center gap-1 min-w-max">
            <div
                onClick={onOpenModal}
                className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
            >
                <Image src="/loc icon.svg" alt="Location" width={18} height={18} className="w-4.5 h-4.5 object-contain" />
                <span className="text-[16px] font-medium text-black">
                    {location || 'Set Location'}
                </span>
            </div>
            {location && (
                <button
                    onClick={e => { e.stopPropagation(); onClear(); }}
                    className="ml-1 p-0.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                    aria-label="Clear location"
                >
                    <X size={13} />
                </button>
            )}
        </div>
    );
};

export default React.memo(LocationSelector);
