'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, MapPin, Utensils, PlayCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api/events';
import { playApi } from '@/lib/api/play';
import { diningApi } from '@/lib/api/dining';

interface SearchInputProps {
    isVisible: boolean;
    isPlayPage: boolean;
    onClose: () => void;
}

interface SearchResult {
    id: string;
    name: string;
    type: 'event' | 'play' | 'dining';
    category?: string;
    location?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ isVisible, isPlayPage, onClose }) => {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const allData = useRef<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isVisible) {
            fetchData();
            inputRef.current?.focus();
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            setQuery('');
            setResults([]);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isVisible]);

    const fetchData = async () => {
        if (allData.current.length > 0) return;
        setIsLoading(true);
        try {
            const [events, plays, dinings] = await Promise.all([
                eventsApi.publicList().catch(() => ({ data: [] })),
                playApi.publicList().catch(() => ({ data: [] })),
                diningApi.publicList().catch(() => ({ data: [] }))
            ]);

            const combined: SearchResult[] = [
                ...(events.data || []).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    type: 'event' as const,
                    category: item.category,
                    location: item.venue_name || item.city
                })),
                ...(plays.data || []).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    type: 'play' as const,
                    category: item.category,
                    location: item.city
                })),
                ...(dinings.data || []).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    type: 'dining' as const,
                    category: item.category,
                    location: item.city
                }))
            ];
            allData.current = combined;
        } catch (error) {
            console.error('Failed to fetch search data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);

        if (val.trim().length > 0) {
            const filtered = allData.current.filter(item =>
                item.name.toLowerCase().includes(val.toLowerCase()) ||
                item.category?.toLowerCase().includes(val.toLowerCase()) ||
                item.location?.toLowerCase().includes(val.toLowerCase())
            ).slice(0, 8);
            setResults(filtered);
        } else {
            setResults([]);
        }
    };

    const handleResultClick = (result: SearchResult) => {
        const path = result.type === 'event'
            ? `/events/${result.id}`
            : result.type === 'play'
                ? `/play/${encodeURIComponent(result.name)}`
                : `/dining/venue/${result.id}`;

        router.push(path);
        onClose();
    };

    if (!isVisible) return null;

    return (
        <div ref={containerRef} className="relative flex-1 max-w-md animate-in slide-in-from-right-4 duration-300">
            <div className="relative z-50">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                        <div className="w-5 h-5" style={{
                            backgroundColor: isPlayPage ? '#E7C200' : '#5331EA',
                            maskImage: 'url(/search.svg)',
                            WebkitMaskImage: 'url(/search.svg)',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            WebkitMaskPosition: 'center',
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain'
                        }} />
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleSearch}
                    placeholder="Search for events, plays and restaurants"
                    className="w-full h-10 pl-12 pr-10 border border-[#686868] rounded-[9px] text-sm font-medium focus:outline-none focus:border-[#5331EA] transition-all font-[family-name:var(--font-anek-latin)] bg-white"
                />
                <button
                    onClick={onClose}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#686868] hover:text-black"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Results Dropdown */}
            {query.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#686868] rounded-[15px] shadow-xl overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
                    {results.length > 0 ? (
                        <div className="py-2">
                            {results.map((result) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleResultClick(result)}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                                >
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                        {result.type === 'event' && <Calendar size={16} />}
                                        {result.type === 'play' && <PlayCircle size={16} />}
                                        {result.type === 'dining' && <Utensils size={16} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-black truncate uppercase tracking-tight">
                                            {result.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-500 uppercase tracking-wider font-medium">
                                            <span>{result.type}</span>
                                            {result.location && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <span className="flex items-center gap-0.5 truncate">
                                                        <MapPin size={10} />
                                                        {result.location}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm text-gray-500 font-medium font-[family-name:var(--font-anek-latin)]">
                                No results found for "{query}"
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(SearchInput);
