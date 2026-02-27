'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SetupSidebar from '@/app/list-your-dining/list-your-Setups/SetupSidebar';
import { ChevronDown, ChevronRight, Check, Lock } from 'lucide-react';
import { getOrganizerSession } from '@/lib/auth/organizer';
import { organizerApi } from '@/lib/api/organizer';

const categories = [
    { id: 'individual', label: 'Individual' },
    { id: 'creator', label: 'Creator' },
    { id: 'company', label: 'Company' },
    { id: 'non-profit', label: 'Non-profit Organization' },
];

const STORAGE_KEY = 'setup_dining';

function AccountSetupContent() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState('individual');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [pan, setPan] = useState('');
    const [panName, setPanName] = useState('');
    const [panDOB, setPanDOB] = useState('');
    const [panCardUrl, setPanCardUrl] = useState('');
    const [panFileName, setPanFileName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [prefilled, setPrefilled] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Only restore orgType selection (non-sensitive, no security concern)
        const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
        if (saved.orgType) setSelectedCategory(saved.orgType);

        const session = getOrganizerSession();
        if (!session) {
            router.replace('/list-your-dining/Login');
            return;
        }

        // Fetch PAN and bank prefill exclusively from the backend DB
        if (session.id) {
            organizerApi.getExistingSetup(session.id)
                .then(setup => {
                    if (setup?.pan) {
                        setPan(setup.pan); setPanName(setup.panName ?? '');
                        setPanDOB(setup.panDOB ?? ''); setPanCardUrl(setup.panCardUrl ?? '');
                        setPanFileName('(pre-filled from existing verification)');
                        setPrefilled(true);
                        // Write to sessionStorage so downstream pages (bank/backup/agreement) can read
                        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                            prefilled: true,
                            orgType: saved.orgType ?? 'individual',
                            pan: setup.pan, panName: setup.panName ?? '', panDOB: setup.panDOB ?? '',
                            panCardUrl: setup.panCardUrl ?? '', panFileName: '(pre-filled)',
                            bankAccountNo: setup.bankAccountNo ?? '', bankIfsc: setup.bankIfsc ?? '',
                            bankName: setup.bankName ?? '', accountHolder: setup.accountHolder ?? '',
                            backupEmail: setup.backupEmail ?? '', backupPhone: setup.backupPhone ?? '',
                        }));
                    }
                })
                .catch(() => { })
                .finally(() => setPageLoading(false));
        } else { setPageLoading(false); }
    }, [router]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadError(''); setUploading(true);
        try {
            const url = await organizerApi.uploadPAN(file);
            setPanCardUrl(url); setPanFileName(file.name);
        } catch (err: unknown) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed');
        } finally { setUploading(false); }
    };

    const handleContinue = () => {
        const existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, orgType: selectedCategory, pan, panName, panDOB, panCardUrl, panFileName }));
        router.push('/list-your-dining/setup/gst');
    };

    const canContinue = !!(pan && panName && panDOB && (panCardUrl || prefilled) && !uploading);

    if (pageLoading) return <div className="h-[calc(100vh-80px)] animate-pulse bg-zinc-50" />;

    return (
        <div className="overflow-hidden flex flex-col font-[family-name:var(--font-anek-latin)] h-[calc(100vh-80px)]" style={{ background: 'rgba(211, 203, 245, 0.1)' }}>
            <main className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-14 lg:px-32 py-10 md:py-16">
                <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
                    <aside className="w-fit pt-36 hidden lg:block">
                        <SetupSidebar currentStep="01" />
                    </aside>
                    <div className="flex-1 flex flex-col pt-4">
                        <div className="mb-12 mt-[-75px]">
                            <h1 className="text-[32px] md:text-[36px] font-medium text-black mb-2" style={{ fontFamily: 'Anek Latin' }}>Set up your Ticpin account</h1>
                            <div className="w-[180px] h-[1px] bg-zinc-300 mt-8" />
                        </div>
                        <div className="lg:hidden mb-12"><SetupSidebar currentStep="01" /></div>

                        {prefilled && (
                            <div className="mb-6 bg-[#5331EA]/10 border border-[#5331EA]/30 rounded-[14px] px-5 py-3 flex items-center gap-3">
                                <Lock size={16} className="text-[#5331EA] flex-shrink-0" />
                                <p className="text-[14px] text-[#5331EA] font-medium">PAN details pre-filled from your existing verification. Only backup contact can be changed.</p>
                            </div>
                        )}

                        <div className="space-y-5 mt-[-15px]">
                            <h2 className="text-[26px] font-medium text-black" style={{ fontFamily: 'Anek Latin' }}>Organization details</h2>
                            <div className="space-y-8">
                                {/* Category */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-[16px] font-medium text-[#686868]">Category</label>
                                    <div className="relative max-w-sm">
                                        <div onClick={() => !prefilled && setIsCategoryOpen(v => !v)}
                                            className={`w-full h-12 px-4 border border-zinc-200 rounded-[15px] flex items-center justify-between transition-colors ${prefilled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-zinc-500'}`}>
                                            <span className="text-[15px] font-medium text-zinc-800">{categories.find(c => c.id === selectedCategory)?.label ?? 'Choose Category'}</span>
                                            <ChevronDown size={18} className={`text-zinc-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                        {isCategoryOpen && !prefilled && (
                                            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#D9D9D9] border border-zinc-200 rounded-[15px] shadow-lg z-50 overflow-hidden">
                                                {categories.map(cat => (
                                                    <div key={cat.id} onClick={() => { setSelectedCategory(cat.id); setIsCategoryOpen(false); }}
                                                        className="px-4 py-3 text-[15px] font-medium hover:bg-black/10 cursor-pointer transition-colors">{cat.label}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* PAN fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[16px] font-medium text-[#686868]">PAN card number</label>
                                        <input type="text" placeholder="ABCDE1234F" value={pan}
                                            onChange={e => setPan(e.target.value.toUpperCase())} disabled={prefilled}
                                            className={`w-full h-12 px-4 border border-[#AEAEAE] rounded-[14px] text-[15px] font-medium focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400 ${prefilled ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'text-zinc-800'}`} />
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[16px] font-medium text-[#686868]">Name on PAN card</label>
                                        <input type="text" placeholder="Name as on PAN card" value={panName}
                                            onChange={e => setPanName(e.target.value)} disabled={prefilled}
                                            className={`w-full h-12 px-4 border border-[#AEAEAE] rounded-[14px] text-[15px] font-medium focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400 ${prefilled ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'text-zinc-800'}`} />
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[16px] font-medium text-[#686868]">Date of birth (as on PAN card)</label>
                                        <input type="date" value={panDOB} onChange={e => setPanDOB(e.target.value)} disabled={prefilled}
                                            className={`w-full h-12 px-4 border border-[#AEAEAE] rounded-[14px] text-[15px] font-medium focus:outline-none focus:border-zinc-500 transition-colors ${prefilled ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'text-zinc-800'}`} />
                                    </div>
                                </div>

                                {/* Upload PAN */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-[16px] font-medium text-[#686868]">Upload your PAN card</label>
                                    <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} disabled={prefilled} />
                                    <button type="button" onClick={() => !prefilled && !uploading && fileRef.current?.click()} disabled={uploading || prefilled}
                                        className={`w-full max-w-sm h-[72px] border border-zinc-200 rounded-[20px] flex items-center px-6 gap-4 transition-colors ${prefilled ? 'opacity-60 cursor-not-allowed' : 'hover:border-zinc-500 cursor-pointer'}`}>
                                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                                            {uploading ? <div className="w-5 h-5 border-2 border-zinc-400 border-t-black rounded-full animate-spin" />
                                                : panCardUrl ? <Check size={22} className="text-green-600" />
                                                    : <img src="/list your events/doc icon.svg" alt="doc" className="w-6 h-6 object-contain" />}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[15px] font-medium text-black truncate max-w-[220px]">{uploading ? 'Uploading…' : panFileName || 'Upload document'}</p>
                                            <p className="text-[12px] text-[#686868]">Max 5MB • JPEG, JPG, PNG, PDF</p>
                                        </div>
                                    </button>
                                    {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
                                </div>
                            </div>

                            <div className="pt-2 flex justify-center md:justify-start">
                                <button onClick={handleContinue} disabled={!canContinue}
                                    className="bg-black text-white h-[48px] px-8 rounded-[15px] flex items-center justify-center gap-2 text-[15px] font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Continue<ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function AccountSetupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <AccountSetupContent />
        </Suspense>
    );
}
