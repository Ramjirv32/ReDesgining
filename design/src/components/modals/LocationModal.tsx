'use client';

import { X, MapPin, Search } from 'lucide-react';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const popularCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad',
    'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'
];

export default function LocationModal({ isOpen, onClose }: LocationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-[970px] bg-white rounded-[43px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 p-10 font-[family-name:var(--font-anek-latin)] relative">
                <button
                    onClick={onClose}
                    className="absolute right-8 top-8 p-2 hover:bg-zinc-100 rounded-full transition-colors text-[#686868]"
                >
                    <X size={24} />
                </button>

                <div className="space-y-8">
                    {/* Header */}
                    <h2 className="text-[30px] font-medium text-[#686868] leading-tight mt-2">
                        Select Location
                    </h2>

                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search city or area"
                            className="w-full h-[77px] px-8 bg-white border border-[#686868] rounded-[15px] text-[28px] font-medium text-black placeholder-[#A8A8A8] focus:outline-none focus:ring-2 focus:ring-[#5331EA]/20 transition-all"
                        />
                    </div>

                    {/* Use Current Location */}
                    <button className="flex items-center gap-3 text-[#5331EA] hover:opacity-80 transition-all group">
                        <div className="relative w-[29px] h-[29px] flex items-center justify-center">
                            <div className="absolute w-full h-full border-2 border-[#5331EA] rounded-full" />
                            <div className="w-[10px] h-[10px] bg-[#5331EA] rounded-full" />
                            <div className="absolute w-[2px] h-[6px] bg-[#5331EA] -top-1 left-1/2 -translate-x-1/2" />
                            <div className="absolute w-[2px] h-[6px] bg-[#5331EA] -bottom-1 left-1/2 -translate-x-1/2" />
                            <div className="absolute h-[2px] w-[6px] bg-[#5331EA] -left-1 top-1/2 -translate-y-1/2" />
                            <div className="absolute h-[2px] w-[6px] bg-[#5331EA] -right-1 top-1/2 -translate-y-1/2" />
                        </div>
                        <span className="text-[20px] font-medium">Use Current Location</span>
                    </button>

                    {/* Popular Cities */}
                    <div className="space-y-6 pt-2">
                        <h3 className="text-[30px] font-medium text-[#686868]">Popular Cities</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                            {popularCities.map((city) => (
                                <button
                                    key={city}
                                    className="aspect-square bg-[rgba(189,177,243,0.30)] rounded-[25px] flex items-center justify-center p-4 hover:bg-[rgba(189,177,243,0.45)] transition-all group active:scale-95"
                                >
                                    <span className="text-[18px] font-semibold text-[#5331EA] uppercase text-center leading-tight group-hover:scale-105 transition-transform">
                                        {city}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
