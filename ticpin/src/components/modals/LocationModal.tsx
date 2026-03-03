'use client';

import { X, MapPin, Search, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (city: string) => void;
}

interface GeoResult {
    id: number;
    name: string;
    country: string;
    admin1?: string;
    latitude: number;
    longitude: number;
}

const popularCities = [
    { name: 'Mumbai',    country: 'India' },
    { name: 'Delhi',     country: 'India' },
    { name: 'Bangalore', country: 'India' },
    { name: 'Hyderabad', country: 'India' },
    { name: 'Ahmedabad', country: 'India' },
    { name: 'Chennai',   country: 'India' },
    { name: 'Kolkata',   country: 'India' },
    { name: 'Surat',     country: 'India' },
    { name: 'Pune',      country: 'India' },
    { name: 'Jaipur',    country: 'India' },
];

function cityImageUrl(cityName: string) {
    return `https://source.unsplash.com/featured/400x280/?${encodeURIComponent(cityName)}+city+skyline`;
}

export default function LocationModal({ isOpen, onClose, onSelect }: LocationModalProps) {
    const [search, setSearch]           = useState('');
    const [results, setResults]         = useState<GeoResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [gpsLoading, setGpsLoading]   = useState(false);
    const [gpsError, setGpsError]       = useState('');
    const abortRef                      = useRef<AbortController | null>(null);
    const inputRef                      = useRef<HTMLInputElement>(null);

    // Focus input and reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setSearch('');
            setResults([]);
            setGpsError('');
        }
    }, [isOpen]);

    // Debounced world-city autocomplete via Open-Meteo Geocoding API (free, no key)
    useEffect(() => {
        const query = search.trim();
        if (!query) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=en&format=json`,
                    { signal: abortRef.current!.signal }
                );
                const data = await res.json();
                setResults(data.results ?? []);
            } catch (err: unknown) {
                if ((err as { name?: string })?.name !== 'AbortError') setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 350);

        return () => {
            clearTimeout(timer);
            abortRef.current?.abort();
        };
    }, [search]);

    if (!isOpen) return null;

    const handleSelect = (label: string) => {
        onSelect?.(label);
        onClose();
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) { setGpsError('Geolocation not supported'); return; }
        setGpsLoading(true);
        setGpsError('');
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const data = await res.json();
                    const city  = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
                    const state = data.address?.state || '';
                    const label = city && state ? `${city}, ${state}` : city || state || '';
                    if (label) handleSelect(label);
                    else setGpsError('Could not detect city');
                } catch {
                    setGpsError('Failed to fetch location');
                } finally {
                    setGpsLoading(false);
                }
            },
            () => { setGpsError('Permission denied'); setGpsLoading(false); }
        );
    };

    const showResults = search.trim().length > 0;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-[970px] bg-white rounded-[43px] shadow-2xl animate-in fade-in zoom-in duration-300 font-[family-name:var(--font-anek-latin)] relative flex flex-col max-h-[90vh]">

                {/* ── Fixed Header ── */}
                <div className="px-10 pt-10 pb-4 flex-shrink-0">
                    <button
                        onClick={onClose}
                        title="Close"
                        className="absolute right-8 top-8 p-2 hover:bg-zinc-100 rounded-full transition-colors text-[#686868]"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-[30px] font-medium text-[#686868] leading-tight mt-2 mb-6">
                        Select Location
                    </h2>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A8A8A8] pointer-events-none" size={22} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search city or area"
                            className="w-full h-[64px] pl-14 pr-12 bg-white border border-[#686868] rounded-[15px] text-[20px] font-medium text-black placeholder-[#A8A8A8] focus:outline-none focus:ring-2 focus:ring-[#5331EA]/30 transition-all"
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 text-[#5331EA] animate-spin pointer-events-none" size={20} />
                        )}
                        {search && !isSearching && (
                            <button
                                onClick={() => setSearch('')}
                                title="Clear search"
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#A8A8A8] hover:text-black"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* Use Current Location */}
                    <div className="mt-5 space-y-1">
                        <button
                            onClick={handleCurrentLocation}
                            disabled={gpsLoading}
                            className="flex items-center gap-3 text-[#5331EA] hover:opacity-80 transition-all disabled:opacity-50"
                        >
                            <div className="relative w-[27px] h-[27px] flex items-center justify-center flex-shrink-0">
                                <div className="absolute w-full h-full border-2 border-[#5331EA] rounded-full" />
                                <div className="w-[9px] h-[9px] bg-[#5331EA] rounded-full" />
                                <div className="absolute w-[2px] h-[5px] bg-[#5331EA] -top-1 left-1/2 -translate-x-1/2" />
                                <div className="absolute w-[2px] h-[5px] bg-[#5331EA] -bottom-1 left-1/2 -translate-x-1/2" />
                                <div className="absolute h-[2px] w-[5px] bg-[#5331EA] -left-1 top-1/2 -translate-y-1/2" />
                                <div className="absolute h-[2px] w-[5px] bg-[#5331EA] -right-1 top-1/2 -translate-y-1/2" />
                            </div>
                            <span className="text-[18px] font-medium">
                                {gpsLoading ? 'Detecting…' : 'Use Current Location'}
                            </span>
                        </button>
                        {gpsError && <p className="text-red-500 text-sm pl-1">{gpsError}</p>}
                    </div>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="overflow-y-auto px-10 pb-8 flex-1 space-y-6 mt-2">

                    {/* ── Live Search Results ── */}
                    {showResults && (
                        <div className="space-y-4">
                            <h3 className="text-[22px] font-medium text-[#686868]">
                                {isSearching
                                    ? 'Searching…'
                                    : results.length > 0
                                        ? `Results for "${search.trim()}"`
                                        : `No cities found for "${search.trim()}"`
                                }
                            </h3>

                            {results.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {results.map(city => {
                                        const label = city.admin1
                                            ? `${city.name}, ${city.admin1}, ${city.country}`
                                            : `${city.name}, ${city.country}`;
                                        return (
                                            <button
                                                key={city.id}
                                                onClick={() => handleSelect(label)}
                                                title={label}
                                                className="group flex flex-col rounded-[18px] overflow-hidden border border-zinc-100 hover:border-[#5331EA]/50 hover:shadow-lg transition-all active:scale-95 text-left"
                                            >
                                                <div className="relative w-full aspect-[4/3] bg-zinc-100 overflow-hidden">
                                                    <Image
                                                        src={cityImageUrl(city.name)}
                                                        alt={city.name}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        unoptimized
                                                    />
                                                </div>
                                                <div className="px-3 py-2 bg-white">
                                                    <p className="text-[14px] font-semibold text-black leading-tight truncate">
                                                        {city.admin1 ? `${city.name}, ${city.admin1}` : city.name}
                                                    </p>
                                                    <p className="text-[12px] text-zinc-400 leading-tight">{city.country}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Popular Cities (shown when search is empty) ── */}
                    {!showResults && (
                        <div className="space-y-5">
                            <h3 className="text-[28px] font-medium text-[#686868]">Popular Cities</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {popularCities.map(city => (
                                    <button
                                        key={city.name}
                                        onClick={() => handleSelect(`${city.name}, ${city.country}`)}
                                        className="group flex flex-col rounded-[18px] overflow-hidden border border-zinc-100 hover:border-[#5331EA]/50 hover:shadow-lg transition-all active:scale-95"
                                    >
                                        <div className="relative w-full aspect-[4/3] bg-[rgba(189,177,243,0.20)] overflow-hidden">
                                            <Image
                                                src={cityImageUrl(city.name)}
                                                alt={city.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                unoptimized
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                                            <span className="absolute bottom-2 left-0 right-0 text-center text-[12px] font-bold text-white uppercase tracking-wide drop-shadow px-1">
                                                {city.name}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Attribution */}
                    <div className="flex items-center gap-1 text-zinc-300 text-[11px]">
                        <MapPin size={11} />
                        <span>City search · Open-Meteo Geocoding · Photos · Unsplash</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
