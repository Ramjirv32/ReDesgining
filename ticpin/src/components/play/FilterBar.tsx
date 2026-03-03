'use client';
import { useState } from 'react';
import Image from 'next/image';
import FilterModal from '../modals/FilterModal';

interface FilterBarProps {
    filters: string[];
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    onApply?: (filters: Record<string, string[]>) => void;
    type?: 'play' | 'events' | 'dining';
}

export default function FilterBar({ filters, activeFilter, onFilterChange, onApply, type = 'play' }: FilterBarProps) {
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    return (
        <div className="flex flex-wrap gap-3 px-2 font-[family-name:var(--font-anek-latin)]">
            {/* Filters Button */}
            <button
                onClick={() => setIsFilterModalOpen(true)}
                className={`px-6 py-3 text-base font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${isFilterModalOpen
                    ? 'bg-[#d9d9d9] text-black shadow-inner'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                style={{
                    border: '1px solid #a4a4a4',
                    borderRadius: '22px'
                }}
            >
                <Image src="/filter 1.png" alt="Filter" width={18} height={18} className="object-contain" />
                <span>Filters</span>
                <Image src="/filter arrow.svg" alt="arrow" width={10} height={6} className={`ml-1 transition-transform ${isFilterModalOpen ? 'rotate-180' : ''}`} />
            </button>

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                type={type}
                onApply={onApply}
            />

            {/* Other Filter Buttons */}
            {filters.map((filter, i) => (
                <button
                    key={i}
                    onClick={() => onFilterChange(filter)}
                    className={`px-6 py-3 text-base font-medium transition-all duration-300 whitespace-nowrap uppercase ${activeFilter === filter
                        ? 'bg-[#d9d9d9] text-black shadow-inner'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    style={{
                        border: '1px solid #a4a4a4',
                        borderRadius: '22px'
                    }}
                >
                    {filter}
                </button>
            ))}
        </div>
    );
}
