'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { adminApi, OrganizerListItem, OrganizerDetail, ListingStatus } from '@/lib/api/admin';
import {
    CheckCircle, XCircle, Clock, ChevronRight, X, User,
    ExternalLink, RefreshCw, Trash2, Calendar, Mail, Phone,
    CreditCard, Hash, ArrowLeft, Edit3, Save, XCircle as DiscardIcon, Check
} from 'lucide-react';
import { getOrganizerSession } from '@/lib/auth/organizer';

type Tab = 'pending' | 'approved' | 'all';

function OrganizerDetailView({ organizerId, onClose, onStatusChange }: {
    organizerId: string;
    onClose: () => void;
    onStatusChange: () => void;
}) {
    const [detail, setDetail] = useState<OrganizerDetail | null>(null);
    const [editedDetail, setEditedDetail] = useState<OrganizerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);
    const [panViewerUrl, setPanViewerUrl] = useState<string | null>(null);

    useEffect(() => {
        adminApi.getOrganizerDetail(organizerId)
            .then(d => { setDetail(d); setEditedDetail(d); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [organizerId]);

    const handleStatusUpdate = async (category: string, status: 'approved' | 'rejected' | 'pending') => {
        if (!detail) return;
        setUpdating(category);
        try {
            await adminApi.updateCategoryStatus(organizerId, category, status, rejectionReason || undefined);
            setDetail(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    organizer: {
                        ...prev.organizer,
                        categoryStatus: { ...prev.organizer.categoryStatus, [category]: status },
                    },
                };
            });
            setShowRejectInput(null);
            setRejectionReason('');
            onStatusChange();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    const handleFieldChange = (path: string, value: string) => {
        setEditedDetail(prev => {
            if (!prev) return prev;
            const keys = path.split('.');
            const newObj = structuredClone(prev) as any;
            let cur = newObj;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!cur[keys[i]]) cur[keys[i]] = {};
                cur = cur[keys[i]];
            }
            cur[keys[keys.length - 1]] = value;
            return newObj;
        });
    };

    const handleSave = async () => {
        if (!editedDetail) return;
        setIsSaving(true);
        try {
            await adminApi.updateOrganizer(organizerId, editedDetail);
            setDetail(editedDetail);
            setIsEditMode(false);
            setSavedOk(true);
            setTimeout(() => setSavedOk(false), 2500);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        setEditedDetail(detail);
        setIsEditMode(false);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#F3F0FF]">
                <RefreshCw className="animate-spin text-[#AC9BF7]" size={48} />
            </div>
        );
    }

    if (!detail || !editedDetail) return null;
    const org = editedDetail.organizer;
    const profile = editedDetail.profile;

    // All organizer fields to display/edit
    const orgFields = [
        { label: 'Email', path: 'organizer.email', value: org.email || '' },
        { label: 'Created At', value: org.createdAt ? new Date(org.createdAt).toLocaleString('en-IN') : 'N/A', readOnly: true },
        { label: 'Profile Name', path: 'profile.name', value: profile?.name || '' },
        { label: 'Phone', path: 'profile.phone', value: profile?.phone || '' },
        { label: 'DOB', path: 'profile.dob', value: (profile as any)?.dob || '' },
        { label: 'Gender', path: 'profile.gender', value: (profile as any)?.gender || '' },
        { label: 'Address', path: 'profile.address', value: profile?.address || '' },
        { label: 'City / District', path: 'profile.district', value: profile?.district || '' },
        { label: 'State', path: 'profile.state', value: profile?.state || '' },
        { label: 'Country', path: 'profile.country', value: profile?.country || '' },
        { label: 'Preferred Language', path: 'profile.preferredLanguage', value: (profile as any)?.preferredLanguage || '' },
    ];

    const renderField = (row: { label: string; path?: string; value: string; readOnly?: boolean }) => {
        if (row.readOnly || !isEditMode) {
            return (
                <span className={`text-[16px] font-semibold ${row.value ? 'text-black' : 'text-zinc-400'} break-all text-right max-w-[240px]`}>
                    {row.value || '—'}
                </span>
            );
        }
        return (
            <input
                value={row.value}
                onChange={e => row.path && handleFieldChange(row.path, e.target.value)}
                className="text-[15px] font-semibold bg-[#F3F0FF] border border-[#AC9BF7]/50 rounded-lg px-2 py-0.5 focus:outline-none focus:border-[#5331EA] text-right w-full"
                placeholder={row.label}
            />
        );
    };

    return (
        <>
            <div className="fixed inset-0 z-[70] bg-[#F3F0FF] h-screen overflow-hidden flex flex-col">
                <div className="max-w-[1800px] mx-auto w-full h-full flex flex-col p-8">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-start">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-4">
                                <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                                    <ArrowLeft size={32} />
                                </button>
                                <h1 className="text-[40px] font-semibold text-black leading-tight" style={{ fontFamily: 'var(--font-anek-latin)' }}>Admin Panel</h1>
                            </div>
                            <div className="w-16 h-1 bg-black mt-2 ml-14" />
                            <h2 className="text-[28px] font-medium text-black mt-3 ml-14" style={{ fontFamily: 'var(--font-anek-latin)' }}>Organizer Moderation</h2>
                        </div>

                        {/* Edit Toggle */}
                        <div className="flex items-center gap-3 mt-2">
                            {savedOk && (
                                <span className="flex items-center gap-1.5 text-green-600 font-bold text-[15px] bg-green-50 px-4 py-2 rounded-xl">
                                    <Check size={18} /> Saved!
                                </span>
                            )}
                            {!isEditMode ? (
                                <button
                                    onClick={() => setIsEditMode(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5331EA] text-white font-bold hover:bg-[#4020C9] transition-all shadow-sm"
                                >
                                    <Edit3 size={18} /> Edit Details
                                </button>
                            ) : (
                                <>
                                    <button onClick={handleDiscard}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-600 font-bold hover:bg-white transition-all">
                                        <DiscardIcon size={18} /> Discard
                                    </button>
                                    <button onClick={handleSave} disabled={isSaving}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 transition-all disabled:opacity-50">
                                        <Save size={18} /> {isSaving ? 'Saving…' : 'Save'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-white rounded-[40px] shadow-sm p-12 flex gap-10 overflow-hidden">
                        {/* Left: Identity */}
                        <div className="w-1/4 flex flex-col">
                            <div className="bg-[#EEEDFC] rounded-[30px] flex-1 flex flex-col items-center p-10 shadow-inner overflow-y-auto">
                                <div className="w-36 h-36 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 overflow-hidden flex-shrink-0 relative">
                                    {profile?.profilePhoto ? (
                                        <Image src={profile.profilePhoto} alt="Profile" fill className="object-cover" />
                                    ) : (
                                        <User size={72} className="text-[#AC9BF7]" />
                                    )}
                                </div>
                                <h3 className="text-[22px] font-bold text-black text-center break-words w-full leading-tight">
                                    {profile?.name || 'NAME NOT SET'}
                                </h3>
                                <p className="text-[16px] text-[#686868] mt-1 break-all text-center w-full">{org.email}</p>
                                <p className="text-[12px] text-[#686868] mt-2 font-mono bg-white/50 px-3 py-1 rounded-full border border-[#AC9BF7]/20 break-all text-center">
                                    ID: {org.id}
                                </p>

                                {/* Category Status Badges */}
                                <div className="mt-6 pt-6 border-t border-black/10 w-full space-y-3">
                                    <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Category Status</p>
                                    {Object.entries(org.categoryStatus || {}).map(([cat, status]) => (
                                        <div key={cat} className={`flex items-center justify-between px-4 py-2 rounded-xl text-[14px] font-bold border-2
                                            ${status === 'approved' ? 'bg-[#D1FAE5] text-[#065F46] border-[#065F46]/10'
                                                : status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100'
                                                    : 'bg-[#FFD9B7] text-[#8B4D1A] border-orange-200/20'}`}>
                                            <span className="uppercase tracking-widest text-[11px]">{cat}</span>
                                            <span>{(status as string).toUpperCase()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: All Fields + Setup Details */}
                        <div className="w-3/4 flex flex-col overflow-y-auto px-4">

                            {/* --- Organizer & Profile Fields --- */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[20px] font-bold text-black uppercase tracking-wider">Account Details</h4>
                                    {isEditMode && <span className="text-[12px] text-[#5331EA] bg-[#EEEDFC] px-3 py-1 rounded-full font-bold">✏ Edit mode on</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                                    {orgFields.map((row, i) => (
                                        <div key={i} className={`flex flex-col border-b pb-1.5 ${isEditMode && !row.readOnly ? 'border-[#AC9BF7]/50' : 'border-[#AEAEAE]'}`}>
                                            <span className="text-[14px] font-medium text-[#686868]">{row.label}</span>
                                            <div className="mt-0.5 flex justify-between items-center">
                                                {renderField(row)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* --- Setup Details per category --- */}
                            {detail.setups && detail.setups.length > 0 ? (
                                detail.setups.map((setup, idx) => (
                                    <div key={setup.id} className={`${idx > 0 ? 'mt-10 pt-10 border-t-2 border-dashed border-[#EEEDFC]' : ''}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[20px] font-bold text-black uppercase tracking-wider">{setup.category} Application</h4>
                                            <span className={`px-5 py-1.5 rounded-full text-[14px] font-bold border-2 ${detail.organizer.categoryStatus?.[setup.category] === 'approved' ? 'bg-[#D1FAE5] text-[#065F46] border-[#065F46]/20' :
                                                detail.organizer.categoryStatus?.[setup.category] === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-[#FFD9B7] text-[#8B4D1A] border-orange-200/20'
                                                }`}>
                                                {detail.organizer.categoryStatus?.[setup.category]?.toUpperCase() || 'PENDING'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                                            {[
                                                { label: 'Organisation Type', path: `setups.${idx}.orgType`, value: setup.orgType },
                                                { label: 'Phone', path: `setups.${idx}.phone`, value: setup.phone },
                                                { label: 'GST Number', path: `setups.${idx}.gstNumber`, value: setup.gstNumber },
                                                { label: 'PAN Card No.', path: `setups.${idx}.pan`, value: setup.pan },
                                                { label: 'PAN Name', path: `setups.${idx}.panName`, value: setup.panName },
                                                { label: 'Date of Birth', path: `setups.${idx}.panDOB`, value: setup.panDOB },
                                                { label: 'Bank Account No.', path: `setups.${idx}.bankAccountNo`, value: setup.bankAccountNo },
                                                { label: 'Bank Name', path: `setups.${idx}.bankName`, value: setup.bankName },
                                                { label: 'IFSC Code', path: `setups.${idx}.bankIfsc`, value: setup.bankIfsc },
                                                { label: 'Account Holder', path: `setups.${idx}.accountHolder`, value: setup.accountHolder },
                                                { label: 'Backup Email', path: `setups.${idx}.backupEmail`, value: setup.backupEmail },
                                                { label: 'Backup Phone', path: `setups.${idx}.backupPhone`, value: setup.backupPhone },
                                            ].map((row, i) => (
                                                <div key={i} className={`flex flex-col border-b pb-1.5 ${isEditMode ? 'border-[#AC9BF7]/50' : 'border-[#AEAEAE]'}`}>
                                                    <span className="text-[14px] font-medium text-[#686868]">{row.label}</span>
                                                    <div className="mt-0.5 flex justify-between items-center">
                                                        {renderField(row)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* PAN Document Viewer Trigger */}
                                        {setup.panCardUrl && (
                                            <div className="mt-5 flex gap-3 flex-wrap">
                                                <button
                                                    onClick={() => setPanViewerUrl(setup.panCardUrl)}
                                                    className="inline-flex items-center gap-2 text-[#5331EA] font-bold text-[16px] bg-[#EEEDFC] px-6 py-2.5 rounded-[12px] hover:bg-[#AC9BF7] hover:text-white transition-all shadow-sm"
                                                >
                                                    <ExternalLink size={18} /> View PAN Document
                                                </button>
                                                <a
                                                    href={setup.panCardUrl}
                                                    download
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 text-zinc-600 font-bold text-[16px] bg-zinc-100 px-6 py-2.5 rounded-[12px] hover:bg-zinc-200 transition-all shadow-sm"
                                                >
                                                    ↓ Download
                                                </a>
                                            </div>
                                        )}

                                        {/* Approval Actions */}
                                        <div className="mt-6 flex gap-4 justify-end">
                                            {showRejectInput === setup.id ? (
                                                <div className="flex flex-1 gap-3 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Rejection reason…"
                                                        className="flex-1 h-12 px-5 rounded-[12px] border-2 border-red-100 focus:border-red-400 focus:outline-none text-[16px]"
                                                        value={rejectionReason}
                                                        onChange={e => setRejectionReason(e.target.value)}
                                                    />
                                                    <button onClick={() => handleStatusUpdate(setup.category, 'rejected')}
                                                        className="h-12 px-6 rounded-[12px] bg-red-600 text-white font-bold text-[16px] hover:scale-105 transition-transform shadow-md">
                                                        Confirm
                                                    </button>
                                                    <button onClick={() => { setShowRejectInput(null); setRejectionReason(''); }}
                                                        className="text-[#686868] font-bold hover:text-black px-2">
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleStatusUpdate(setup.category, 'approved')}
                                                        disabled={detail.organizer.categoryStatus?.[setup.category] === 'approved' || updating === setup.category}
                                                        className="px-8 py-2.5 rounded-[12px] bg-[#D1FAE5] text-[#065F46] text-[16px] font-bold transition-all hover:scale-105 disabled:opacity-50 shadow-sm">
                                                        ✓ Approve
                                                    </button>
                                                    <button onClick={() => setShowRejectInput(setup.id)}
                                                        disabled={detail.organizer.categoryStatus?.[setup.category] === 'rejected' || updating === setup.category}
                                                        className="px-8 py-2.5 rounded-[12px] bg-red-50 text-red-700 text-[16px] font-bold transition-all hover:scale-105 disabled:opacity-50 shadow-sm">
                                                        ✗ Reject
                                                    </button>
                                                    <button onClick={() => handleStatusUpdate(setup.category, 'pending')}
                                                        className="px-8 py-2.5 rounded-[12px] bg-[#EEEDFC] text-black border border-[#AC9BF7]/30 text-[16px] font-bold transition-all hover:scale-105 shadow-sm">
                                                        ⟳ Pending
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex-1 flex items-center justify-center flex-col opacity-40 mt-10">
                                    <Clock size={64} className="mb-4" />
                                    <p className="text-[22px] font-bold">No application setups submitted yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PAN Document Modal Overlay */}
            {panViewerUrl && (
                <div
                    className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
                    onClick={() => setPanViewerUrl(null)}
                >
                    <div
                        className="relative bg-white rounded-[20px] overflow-hidden shadow-2xl w-full max-w-5xl"
                        style={{ height: '90vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-3 bg-[#EEEDFC] border-b border-[#AC9BF7]/30">
                            <span className="text-[16px] font-bold text-[#5331EA]">PAN Document Viewer</span>
                            <div className="flex items-center gap-3">
                                <a
                                    href={panViewerUrl ?? '#'}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[13px] font-semibold text-[#5331EA] bg-white px-4 py-1.5 rounded-lg hover:bg-[#5331EA] hover:text-white transition-all"
                                >
                                    ↓ Download
                                </a>
                                <a
                                    href={panViewerUrl ?? '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[13px] font-semibold text-zinc-600 bg-white px-4 py-1.5 rounded-lg hover:bg-zinc-100 transition-all"
                                >
                                    Open in Tab ↗
                                </a>
                                <button
                                    onClick={() => setPanViewerUrl(null)}
                                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all text-zinc-500"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* PDF iframe Viewer */}
                        {panViewerUrl && (
                            <iframe
                                key={panViewerUrl}
                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(panViewerUrl)}&embedded=true`}
                                className="w-full"
                                style={{ height: 'calc(90vh - 56px)', border: 'none' }}
                                title="PAN Document"
                                allow="fullscreen"
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function OrganizerModerationContent() {
    const router = useRouter();
    const [organizers, setOrganizers] = useState<OrganizerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab, setActiveTab] = useState<Tab>('pending');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [hasCheckedSession, setHasCheckedSession] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setHasCheckedSession(true), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!hasCheckedSession) return;
        const session = getOrganizerSession();
        if (!session?.isAdmin) {
            router.replace('/list-your-events/Login');
        } else {
            setAuthChecked(true);
        }
    }, [hasCheckedSession, router]);

    const fetchOrganizers = useCallback(async () => {
        setLoading(true);
        try {
            const statusFilter = activeTab === 'all' ? undefined : activeTab;
            const data = await adminApi.listOrganizers(page, 50, statusFilter);
            setOrganizers(data.organizers || []);
            setTotalPages(data.pages || 1);
        } catch (err) { } finally {
            setLoading(false);
        }
    }, [page, activeTab]);

    useEffect(() => { if (authChecked) fetchOrganizers(); }, [fetchOrganizers, authChecked]);

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this organizer?')) return;
        try {
            await adminApi.deleteOrganizer(id);
            fetchOrganizers();
        } catch { alert('Delete failed'); }
    };

    if (!authChecked) return null;
    const filtered = organizers || [];

    return (
        <div className="min-h-screen relative overflow-x-hidden flex flex-col" style={{ background: 'rgba(255, 241, 168, 0.1)', zoom: 0.85 }}>
            <header className="w-full h-[114px] bg-white border-b border-zinc-100 flex items-center justify-between px-[37px] sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-[159px] h-[40px] flex items-center font-bold text-2xl tracking-tighter cursor-pointer" onClick={() => router.push('/admin')}>TICPIN</div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                        <User size={23} className="text-[#E7C200]" />
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1440px] mx-auto w-full px-[37px] py-[66px]">
                <h1 className="text-[40px] font-semibold text-black leading-none" style={{ fontFamily: 'var(--font-anek-latin)' }}>Admin Panel</h1>
                <div className="w-[101px] h-[1.5px] bg-[#686868] mt-[24px] mb-[24px]" />
                <h2 className="text-[25px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Organizer Management</h2>

                <div className="bg-white rounded-[30px] shadow-sm mt-[33px] p-20 min-h-[600px] flex flex-col relative">
                    {/* Tabs */}
                    <div className="flex justify-center mb-12">
                        <div className="bg-[#E7E2FA] rounded-[15px] flex w-[600px] h-[52px] overflow-hidden shadow-inner">
                            {[
                                { key: 'pending', label: 'Needs Approval' },
                                { key: 'approved', label: 'Approved' },
                                { key: 'all', label: 'View All' }
                            ].map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key as Tab)}
                                    className={`flex-1 text-[20px] font-bold transition-all ${activeTab === tab.key ? 'bg-[#D3CBF5] text-black shadow-sm' : 'text-[#686868] hover:text-black'}`}
                                    style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-32 opacity-20"><RefreshCw size={48} className="animate-spin text-[#AC9BF7]" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-32 text-[#686868] text-[24px] font-bold italic opacity-40">No organizers found for this filter</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 px-8">
                            {filtered.map(org => {
                                const id = org.id;
                                const verticals = Object.entries(org.categoryStatus || {});
                                return (
                                    <div key={id} className="relative group">
                                        <div className="bg-[#EEEDFC] rounded-[24px] p-6 flex items-center gap-10 transition-all hover:bg-[#E7E5FB] hover:shadow-lg border border-transparent hover:border-[#AC9BF7]/50">
                                            <div className="w-[100px] h-[100px] rounded-[18px] bg-white flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-95">
                                                <User size={48} className="text-[#AC9BF7] opacity-50" />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center min-w-0">
                                                <div className="pl-8 border-l-[3px] border-[#AC9BF7] flex flex-col">
                                                    <h3 className="text-[24px] font-bold text-black truncate leading-tight uppercase tracking-tight">
                                                        {org.email}
                                                    </h3>
                                                    <p className="text-[16px] font-semibold text-[#686868] mt-0.5 opacity-80">
                                                        Joined: {org.createdAt ? new Date(org.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-3 mt-3">
                                                    {verticals.map(([cat, status]) => (
                                                        <span key={cat} className={`px-4 py-1 rounded-[10px] text-[13px] font-bold border-2 transition-all ${status === 'approved' ? 'bg-[#D1FAE5] text-[#065F46] border-[#065F46]/10' :
                                                            status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-[#FFD9B7] text-[#8B4D1A] border-orange-200/20'
                                                            }`}>
                                                            {cat.toUpperCase()}: {(status as string).toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <button onClick={e => { e.stopPropagation(); handleDelete(org.id); }}
                                                    className="p-3.5 rounded-full text-red-300 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                                                    <Trash2 size={24} />
                                                </button>
                                                <button onClick={e => { e.stopPropagation(); setSelectedId(id); }}
                                                    className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white shadow-xl transition-transform active:scale-90">
                                                    <ChevronRight size={32} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-6 mt-12 pt-8 border-t border-[#EEEDFC]">
                            <button onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1}
                                className="px-6 py-2 rounded-[12px] border-2 border-[#AC9BF7]/50 text-[#5331EA] font-bold text-[16px] disabled:opacity-20 hover:bg-[#EEEDFC]">
                                Previous
                            </button>
                            <span className="flex items-center text-[18px] font-bold">Page {page} of {totalPages}</span>
                            <button onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} disabled={page === totalPages}
                                className="px-6 py-2 rounded-[12px] border-2 border-[#AC9BF7]/50 text-[#5331EA] font-bold text-[16px] disabled:opacity-20 hover:bg-[#EEEDFC]">
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {selectedId && (
                <OrganizerDetailView
                    organizerId={selectedId}
                    onClose={() => setSelectedId(null)}
                    onStatusChange={() => fetchOrganizers()}
                />
            )}
        </div>
    );
}

export default function OrganizerModerationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F3F0FF] flex justify-center items-center"><RefreshCw size={48} className="animate-spin text-[#AC9BF7]" /></div>}>
            <OrganizerModerationContent />
        </Suspense>
    );
}
