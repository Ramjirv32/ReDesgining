'use client';

import React from 'react';
import Link from 'next/link';
import SetupSidebar from '@/app/list-your-play/list-your-Setups/SetupSidebar';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { organizerApi } from '@/lib/api/organizer';

const STORAGE_KEY = 'setup_play';

export default function GstSelectionPage() {
    const router = useRouter();
    const [selectedGsts, setSelectedGsts] = React.useState<string[]>([]);
    const [manualGst, setManualGst] = React.useState('');
    const [prefilled, setPrefilled] = React.useState(false);
    const [gstList, setGstList] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
        if (saved.gstList && Array.isArray(saved.gstList)) setSelectedGsts(saved.gstList);
        else if (saved.gstNumber) setSelectedGsts([saved.gstNumber]);
        
        if (saved.prefilled) setPrefilled(true);

        if (saved.pan) {
            setLoading(true);
            organizerApi.fetchGST(saved.pan)
                .then(res => {
                    if (res.status === 'SUCCESS' && res.data.gstin_list) {
                        const list = res.data.gstin_list;
                        setGstList(list);
                        // Auto-select if only one GST is found and nothing is selected yet
                        if (list.length === 1 && selectedGsts.length === 0 && !saved.gstList && !saved.gstNumber) {
                            setSelectedGsts([list[0].gstin]);
                        }
                    }
                })
                .catch(err => {
                    console.error('Fetch GST failed', err);
                    setError(err.message || 'Failed to fetch GST details');
                })
                .finally(() => setLoading(false));
        }
    }, [selectedGsts.length]);

    const toggleGst = (gstin: string) => {
        setSelectedGsts(prev => {
            if (prev.includes(gstin)) {
                return prev.filter(g => g !== gstin);
            }
            if (prev.length >= 3) {
                return prev; // Max 3
            }
            return [...prev, gstin];
        });
    };

    const handleManualAdd = () => {
        if (!manualGst) return;
        if (selectedGsts.includes(manualGst)) {
            setManualGst('');
            return;
        }
        if (selectedGsts.length >= 3) {
            alert('Maximum 3 GSTINs can be selected');
            return;
        }
        setSelectedGsts([...selectedGsts, manualGst]);
        setManualGst('');
    };

    const handleContinue = () => {
        if (selectedGsts.length === 0 && !manualGst) {
            setError('Please select or enter at least one GSTIN');
            return;
        }
        
        let finalGsts = [...selectedGsts];
        if (manualGst && !finalGsts.includes(manualGst) && finalGsts.length < 3) {
            finalGsts.push(manualGst);
        }

        const existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ 
            ...existing, 
            gstList: finalGsts,
            gstNumber: finalGsts[0] || '' // Fallback for backward compatibility
        }));
        router.push('/list-your-play/setup/bank');
    };

    return (
        <div className="overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)] h-[calc(100vh-80px)] bg-gradient-to-b from-[#FFFCED] via-white to-white">
            <main className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-14 lg:px-32 py-10 md:py-16">
                <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
                    <aside className="w-fit pt-32 hidden lg:block">
                        <SetupSidebar currentStep="02" completedSteps={['01']} category="play" />
                    </aside>

                    <div className="flex-1 flex flex-col pt-4 mt-[-75px]">
                        <div className="mb-12">
                            <p className="text-[14px] font-medium text-black opacity-80" style={{ fontFamily: 'Anek Latin' }}>
                                GST DETAILS
                            </p>
                            <div className="w-[120px] h-[1px] bg-zinc-300 mt-6" />
                        </div>

                        <div className="lg:hidden mb-12">
                            <SetupSidebar currentStep="02" completedSteps={['01']} category="play" />
                        </div>

                        <div className="space-y-10 mt-[-15px]">
                            <h1 className="text-[32px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>
                                GST selection
                            </h1>

                            <div className="space-y-6 max-w-2xl">
                                {loading ? (
                                    <div className="animate-pulse flex items-center gap-2 text-[14px] font-medium text-[#5331EA]">
                                        <div className="w-4 h-4 border-2 border-t-transparent border-[#5331EA] rounded-full animate-spin" />
                                        Fetching GSTINs associated with your PAN...
                                    </div>
                                ) : (
                                    <>
                                        {gstList.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <label className="text-[14px] font-medium text-[#686868]">Select GSTIN(s) associated with your PAN (Max 3)</label>
                                                    <span className="text-[12px] font-semibold text-[#5331EA]">{selectedGsts.length}/3 selected</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {gstList.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => toggleGst(item.gstin)}
                                                            className={`p-4 rounded-[18px] border cursor-pointer transition-all ${selectedGsts.includes(item.gstin) ? 'bg-[#5331EA]/5 border-[#5331EA]' : 'bg-white border-black/10 hover:border-black/30'}`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${item.status === 'ACTIVE' || item.status === 'Regular' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {item.status}
                                                                </span>
                                                                <span className="text-[12px] text-[#686868] uppercase font-bold">{item.state}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-[15px] font-bold text-black font-mono">{item.gstin}</p>
                                                                {selectedGsts.includes(item.gstin) && (
                                                                    <div className="w-5 h-5 bg-[#5331EA] rounded-full flex items-center justify-center">
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-8 pt-4">
                                            <div className="flex flex-col gap-3">
                                                <label className="text-[14px] font-medium text-[#686868]">Enter GSTIN Manually (if not in the list)</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="eg. 22AAAAA0000A1Z5"
                                                        value={manualGst}
                                                        onChange={(e) => setManualGst(e.target.value.toUpperCase())}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
                                                        className="flex-1 h-12 px-4 border border-[#AEAEAE] rounded-[14px] text-[15px] font-medium focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400 text-zinc-800 font-mono"
                                                    />
                                                    <button 
                                                        onClick={handleManualAdd}
                                                        className="px-4 h-12 bg-zinc-100 border border-zinc-200 rounded-[14px] text-[14px] font-semibold hover:bg-zinc-200 transition-colors"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {selectedGsts.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedGsts.map(gst => (
                                                        <div key={gst} className="bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-full flex items-center gap-2 group">
                                                            <span className="text-[13px] font-bold font-mono">{gst}</span>
                                                            <button onClick={() => toggleGst(gst)} className="text-zinc-400 hover:text-red-500">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <p className="text-[13px] text-[#686868] font-medium leading-relaxed">
                                                Please note, we only support Regular and Active GSTs to onboard as partners.
                                            </p>
                                        </div>
                                    </>
                                )}

                                {error && <p className="text-red-500 text-[14px] font-medium">{error}</p>}
                            </div>

                            <div className="pt-2 flex justify-center md:justify-start">
                                <button
                                    onClick={handleContinue}
                                    className="bg-black text-white w-full max-w-[110px] h-[48px] rounded-[15px] flex items-center justify-center gap-2 text-[15px] font-medium transition-all group active:scale-95"
                                >
                                    Continue<ChevronRight size={18} className="transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
