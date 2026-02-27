'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, OrganizerListItem, OrganizerDetail, ListingStatus } from '@/lib/api/admin';
import {
    CheckCircle, XCircle, Clock, ChevronRight, X, User,
    ExternalLink, RefreshCw, Trash2, Calendar, Mail, Phone, CreditCard, Hash, ArrowLeft
} from 'lucide-react';
import { getOrganizerSession } from '@/lib/auth/organizer';

type Tab = 'pending' | 'approved' | 'all';

function OrganizerDetailView({ organizerId, onClose, onStatusChange }: {
    organizerId: string;
    onClose: () => void;
    onStatusChange: () => void;
}) {
    const [detail, setDetail] = useState<OrganizerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

    useEffect(() => {
        adminApi.getOrganizerDetail(organizerId)
            .then(setDetail)
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

    if (loading) {
        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#F3F0FF]">
                <RefreshCw className="animate-spin text-[#AC9BF7]" size={48} />
            </div>
        );
    }

    if (!detail) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-[#F3F0FF] h-screen overflow-hidden flex flex-col">
            <div className="max-w-[1800px] mx-auto w-full h-full flex flex-col p-8">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-4">
                            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                                <ArrowLeft size={32} />
                            </button>
                            <h1 className="text-[40px] font-semibold text-black leading-tight" style={{ fontFamily: 'var(--font-anek-latin)' }}>Admin Panel</h1>
                        </div>
                        <div className="w-16 h-1 bg-black mt-2 ml-14"></div>
                        <h2 className="text-[28px] font-medium text-black mt-3 ml-14" style={{ fontFamily: 'var(--font-anek-latin)' }}>Organizer Moderation</h2>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-[40px] shadow-sm p-12 flex gap-10 overflow-hidden">
                    {/* Left: Identity */}
                    <div className="w-1/4 flex flex-col">
                        <div className="bg-[#EEEDFC] rounded-[30px] flex-1 flex flex-col items-center justify-center p-10 shadow-inner">
                            <div className="w-36 h-36 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
                                <User size={72} className="text-[#AC9BF7]" />
                            </div>
                            <h3 className="text-[24px] font-bold text-black text-center break-all px-4 leading-tight">
                                {detail.organizer.email}
                            </h3>
                            <p className="text-[18px] text-[#686868] mt-2 font-medium">ID: {detail.organizer.id.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Right: Setup Details */}
                    <div className="w-3/4 flex flex-col overflow-y-auto px-4 custom-scrollbar">
                        {detail.setups && detail.setups.length > 0 ? (
                            detail.setups.map((setup, idx) => (
                                <div key={setup.id} className={idx > 0 ? 'mt-10 pt-10 border-t-2 border-dashed border-[#EEEDFC]' : ''}>
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-[22px] font-bold text-black uppercase tracking-wider">{setup.category} Setup Details</h4>
                                        <span className={`px-5 py-1.5 rounded-full text-[16px] font-bold border-2 ${detail.organizer.categoryStatus?.[setup.category] === 'approved' ? 'bg-[#D1FAE5] text-[#065F46] border-[#065F46]/20' :
                                                detail.organizer.categoryStatus?.[setup.category] === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-[#FFD9B7] text-[#8B4D1A] border-orange-200/20'
                                            }`}>
                                            {detail.organizer.categoryStatus?.[setup.category]?.toUpperCase() || 'PENDING'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                                        {[
                                            { label: 'Org Type', value: setup.orgType },
                                            { label: 'PAN Card', value: setup.pan },
                                            { label: 'PAN Name', value: setup.panName },
                                            { label: 'DOB', value: setup.panDOB },
                                            { label: 'Bank Acc', value: setup.bankAccountNo },
                                            { label: 'Bank Name', value: setup.bankName },
                                            { label: 'IFSC', value: setup.bankIfsc },
                                            { label: 'Holder', value: setup.accountHolder },
                                            { label: 'Backup Email', value: setup.backupEmail },
                                            { label: 'Backup Phone', value: setup.backupPhone },
                                        ].map((row, i) => (
                                            <div key={i} className="flex flex-col border-b border-[#AEAEAE] pb-1.5">
                                                <span className="text-[16px] font-medium text-[#686868]">{row.label}</span>
                                                <span className="text-[18px] font-bold text-black mt-0.5">{"{"}{row.value || 'N/A'}{"}"}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Documents */}
                                    {setup.panCardUrl && (
                                        <div className="mt-6">
                                            <a
                                                href={setup.panCardUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-[#5331EA] font-bold text-[18px] bg-[#EEEDFC] px-6 py-2.5 rounded-[12px] hover:bg-[#AC9BF7] hover:text-white transition-all shadow-sm"
                                            >
                                                <ExternalLink size={20} /> View PAN Document
                                            </a>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="mt-8 flex gap-4 justify-end">
                                        {showRejectInput === setup.id ? (
                                            <div className="flex flex-1 gap-3 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Reason..."
                                                    className="flex-1 h-12 px-5 rounded-[12px] border-2 border-red-100 focus:border-red-400 focus:outline-none text-[16px]"
                                                    value={rejectionReason}
                                                    onChange={e => setRejectionReason(e.target.value)}
                                                />
                                                <button
                                                    onClick={() => handleStatusUpdate(setup.category, 'rejected')}
                                                    className="h-12 px-6 rounded-[12px] bg-red-600 text-white font-bold text-[16px] hover:scale-105 transition-transform shadow-md"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => { setShowRejectInput(null); setRejectionReason(''); }}
                                                    className="text-[#686868] font-bold hover:text-black px-2"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(setup.category, 'approved')}
                                                    disabled={detail.organizer.categoryStatus?.[setup.category] === 'approved' || updating === setup.category}
                                                    className="px-8 py-2.5 rounded-[12px] bg-[#D1FAE5] text-[#065F46] text-[18px] font-bold transition-all hover:scale-105 disabled:opacity-50 shadow-sm"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => setShowRejectInput(setup.id)}
                                                    disabled={detail.organizer.categoryStatus?.[setup.category] === 'rejected' || updating === setup.category}
                                                    className="px-8 py-2.5 rounded-[12px] bg-red-50 text-red-700 text-[18px] font-bold transition-all hover:scale-105 disabled:opacity-50 shadow-sm"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(setup.category, 'pending')}
                                                    className="px-8 py-2.5 rounded-[12px] bg-[#EEEDFC] text-black border border-[#AC9BF7]/30 text-[18px] font-bold transition-all hover:scale-105 shadow-sm"
                                                >
                                                    Pending
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex items-center justify-center flex-col opacity-40">
                                <Clock size={64} className="mb-4" />
                                <p className="text-[24px] font-bold">No application setups submitted yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
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

    useEffect(() => {
        const session = getOrganizerSession();
        if (!session?.isAdmin) {
            router.replace('/list-your-events/Login');
        } else {
            setAuthChecked(true);
        }
    }, [router]);

    const fetchOrganizers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.listOrganizers(page, 50);
            setOrganizers(data.organizers);
            setTotalPages(data.pages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { if (authChecked) fetchOrganizers(); }, [fetchOrganizers, authChecked]);

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this organizer?')) return;
        try {
            await adminApi.deleteOrganizer(id);
            fetchOrganizers();
        } catch (err) {
            alert('Delete failed');
        }
    };

    if (!authChecked) return null;

    const filtered = organizers.filter(org => {
        const statuses = Object.entries(org.categoryStatus || {});
        if (activeTab === 'all') return true;

        // Hide organizers with NO APPLICATIONS if in Pending or Approved tabs
        if (statuses.length === 0) return false;

        if (activeTab === 'pending') return statuses.some(([_, s]) => s === 'pending');
        if (activeTab === 'approved') return statuses.some(([_, s]) => s === 'approved');
        return true;
    });

    return (
        <div className="min-h-screen bg-[#F3F0FF] p-8">
            <div className="max-w-[1700px] mx-auto" style={{ zoom: 0.9 }}>
                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div className="flex flex-col">
                        <h1 className="text-[40px] font-semibold text-black leading-tight" style={{ fontFamily: 'var(--font-anek-latin)' }}>Admin Panel</h1>
                        <div className="w-16 h-1 bg-black mt-1.5 mb-5"></div>
                        <h2 className="text-[28px] font-medium text-black mt-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>Organizer Management</h2>
                    </div>
                    <button onClick={() => fetchOrganizers()} className="mt-6 flex items-center gap-2 text-[16px] font-bold text-[#686868] hover:text-black transition-all">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh List
                    </button>
                </div>

                {/* List Content */}
                <div className="bg-white rounded-[35px] shadow-sm p-12 min-h-[700px]">
                    {/* Tabs */}
                    <div className="flex justify-center mb-12">
                        <div className="bg-[#E7E2FA] rounded-[15px] flex w-[600px] h-[52px] overflow-hidden shadow-inner">
                            {[
                                { key: 'pending', label: 'Needs Approval' },
                                { key: 'approved', label: 'Approved' },
                                { key: 'all', label: 'View All' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as Tab)}
                                    className={`flex-1 text-[20px] font-bold transition-all ${activeTab === tab.key ? 'bg-[#D3CBF5] text-black shadow-sm' : 'text-[#686868] hover:text-black'}`}
                                    style={{ fontFamily: 'var(--font-anek-latin)' }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-32 opacity-20"><RefreshCw size={48} className="animate-spin text-[#AC9BF7]" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-32 text-[#686868] text-[24px] font-bold italic opacity-40">
                            No organizers found for this filter
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 px-8">
                            {filtered.map(org => {
                                const id = org.id;
                                const verticals = Object.entries(org.categoryStatus || {});

                                return (
                                    <div key={id} className="relative group">
                                        <div
                                            onClick={() => setSelectedId(id)}
                                            className="bg-[#EEEDFC] rounded-[24px] p-6 flex items-center gap-10 cursor-pointer transition-all hover:bg-[#E7E5FB] hover:shadow-lg border border-transparent hover:border-[#AC9BF7]/50"
                                        >
                                            {/* Mini Icon */}
                                            <div className="w-[100px] h-[100px] rounded-[18px] bg-white flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-95">
                                                <User size={48} className="text-[#AC9BF7] opacity-50" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 flex flex-col justify-center min-w-0">
                                                <div className="pl-8 border-l-[3px] border-[#AC9BF7] flex flex-col">
                                                    <h3 className="text-[26px] font-bold text-black truncate leading-tight uppercase tracking-tight">
                                                        {org.email}
                                                    </h3>
                                                    <p className="text-[18px] font-semibold text-[#686868] mt-0.5 opacity-80">
                                                        Joined: {org.createdAt ? new Date(org.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    </p>
                                                </div>

                                                {/* Verticals Status */}
                                                <div className="flex flex-wrap gap-3 mt-4">
                                                    {verticals.map(([cat, status]) => (
                                                        <span key={cat} className={`px-4 py-1 rounded-[10px] text-[14px] font-bold border-2 transition-all ${status === 'approved' ? 'bg-[#D1FAE5] text-[#065F46] border-[#065F46]/10' :
                                                                status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-[#FFD9B7] text-[#8B4D1A] border-orange-200/20'
                                                            }`}>
                                                            {cat.toUpperCase()}: {status.toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(org.id); }}
                                                    className="p-3.5 rounded-full text-red-300 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                                >
                                                    <Trash2 size={24} />
                                                </button>

                                                {/* Chevron */}
                                                <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white shadow-xl transition-transform active:scale-90">
                                                    <ChevronRight size={32} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-6 mt-12 pt-8 border-t border-[#EEEDFC]">
                            <button
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className="px-6 py-2 rounded-[12px] border-2 border-[#AC9BF7]/50 text-[#5331EA] font-bold text-[16px] disabled:opacity-20 hover:bg-[#EEEDFC]"
                            >
                                Previous
                            </button>
                            <span className="flex items-center text-[18px] font-bold">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages}
                                className="px-6 py-2 rounded-[12px] border-2 border-[#AC9BF7]/50 text-[#5331EA] font-bold text-[16px] disabled:opacity-20 hover:bg-[#EEEDFC]"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Full Page Detail View Overlay */}
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
