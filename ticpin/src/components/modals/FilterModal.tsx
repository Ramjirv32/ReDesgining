'use client';
import { X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

type FilterType = 'play' | 'events' | 'dining';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    type?: FilterType;
    onApply?: (filters: Record<string, string[]>) => void;
}

type CategoryId = 'sort' | 'sports' | 'dimension' | 'event_category' | 'venue_type' | 'dining_category' | 'amenities';

const CATEGORIES_CONFIG: Record<FilterType, { id: CategoryId, name: string }[]> = {
    play: [
        { id: 'sort', name: 'Sort By' },
        { id: 'sports', name: 'Sports' },
        { id: 'dimension', name: 'Dimension' },
    ],
    events: [
        { id: 'sort', name: 'Sort By' },
        { id: 'event_category', name: 'Category' },
        { id: 'venue_type', name: 'Venue Type' },
    ],
    dining: [
        { id: 'sort', name: 'Sort By' },
        { id: 'dining_category', name: 'Category' },
        { id: 'amenities', name: 'Amenities' },
    ]
};

const OPTIONS: Record<string, string[]> = {
    sort: [
        'Price : Low to High',
        'Price : High to Low',
        'Rating : High to Low',
        'Distance : Near to Far'
    ],
    sports: [
        'Badminton', 'Basketball', 'Box Cricket', 'Cricket', 'Cricket Nets',
        'Football', 'Padel', 'Pickleball', 'Swimming', 'Table Tennis',
        'Tennis', 'Turf Football'
    ],
    dimension: [
        '10 vs 10', '11 vs 11', '4 vs 4', '5 vs 5', '6 vs 6', '7 vs 7',
        '8 vs 8', '9 vs 9', 'Full court', 'Half court', 'Lane', 'Practice net', 'Standard'
    ],
    event_category: [
        'Music', 'Comedy', 'Workshop', 'Spirituality', 'Kids', 'Conference', 'Exhibition'
    ],
    venue_type: [
        'Indoor', 'Outdoor', 'Stadium', 'Club', 'Theater'
    ],
    dining_category: [
        'Premium Dining', 'Club & Chill', 'Pure Veg', 'Cafe Vibes', 'Family Favourites', 'Bar & Bites'
    ],
    amenities: [
        'WiFi', 'Parking', 'Air Conditioned', 'Live Music', 'Outdoor Seating', 'Pet Friendly'
    ]
};

export default function FilterModal({ isOpen, onClose, type = 'play', onApply }: FilterModalProps) {
    const categories = CATEGORIES_CONFIG[type];
    const [activeCategory, setActiveCategory] = useState<CategoryId>(categories[0].id);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

    // Reset state when type changes or on initial load
    useEffect(() => {
        const initialSelections: Record<string, string[]> = {};
        Object.keys(OPTIONS).forEach(key => {
            initialSelections[key] = key === 'sort' ? [OPTIONS.sort[0]] : [];
        });
        setSelectedOptions(initialSelections);
        setActiveCategory(categories[0].id);
    }, [type, isOpen]);

    if (!isOpen) return null;

    const handleOptionSelect = (option: string) => {
        setSelectedOptions(prev => {
            const current = prev[activeCategory] || [];
            if (activeCategory === 'sort') {
                return { ...prev, [activeCategory]: [option] };
            }
            const updated = current.includes(option)
                ? current.filter(item => item !== option)
                : [...current, option];
            return {
                ...prev,
                [activeCategory]: updated
            };
        });
    };

    const handleClear = () => {
        const reset: Record<string, string[]> = {};
        Object.keys(OPTIONS).forEach(key => {
            reset[key] = key === 'sort' ? [OPTIONS.sort[0]] : [];
        });
        setSelectedOptions(reset);
        if (onApply) onApply(reset);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full md:w-[950px] h-auto md:h-[700px] rounded-[40px] p-8 md:p-14 shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col">
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-8 right-10 p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={24} className="text-gray-400" />
                </button>

                {/* Title */}
                <h2 className="text-[32px] font-bold text-black mb-8 px-4" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                    Filter by
                </h2>

                {/* Content Area */}
                <div className="flex flex-col md:flex-row min-h-[450px]">
                    {/* Left Sidebar */}
                    <div className="w-full md:w-[180px] flex md:flex-col gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full text-left px-6 py-3 text-[20px] font-bold transition-all rounded-l-[12px] ${activeCategory === cat.id
                                    ? 'bg-[#D9D9D9] text-black'
                                    : 'bg-transparent text-black'
                                    }`}
                                style={{ fontFamily: 'var(--font-anek-latin)' }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Right Panel (The Main Gray Box) */}
                    <div className="flex-1 bg-[#D9D9D9] rounded-r-[24px] rounded-bl-[24px] p-10 pt-4 overflow-y-auto scrollbar-hide min-h-[400px]">
                        <div className={`grid ${activeCategory === 'sort' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-x-12 gap-y-6`}>
                            {(OPTIONS[activeCategory] || []).map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handleOptionSelect(option)}
                                    className="flex items-center gap-5 w-full group text-left transition-transform active:scale-[0.98]"
                                >
                                    <div className={`w-8 h-8 rounded-full border-[2.5px] border-black flex items-center justify-center transition-all bg-transparent`}>
                                        {(selectedOptions[activeCategory] || []).includes(option) && (
                                            <div className="w-4.5 h-4.5 rounded-full bg-black"></div>
                                        )}
                                    </div>
                                    <span className={`text-[20px] font-bold text-black`} style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                        {option}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer UI */}
                <div className="mt-10 flex items-center justify-between px-4">
                    <button
                        onClick={handleClear}
                        className="text-[20px] font-bold text-black hover:opacity-70 transition-opacity"
                        style={{ fontFamily: 'var(--font-anek-latin)' }}
                    >
                        Clear filters
                    </button>
                    <button
                        onClick={() => {
                            if (onApply) onApply(selectedOptions);
                            onClose();
                        }}
                        className="px-14 py-4 bg-black text-white text-[20px] font-bold rounded-full hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
                        style={{ fontFamily: 'var(--font-anek-latin)' }}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
