'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, OrganizerListItem, OrganizerDetail } from '@/lib/api/admin';
import { CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, ExternalLink, User, Search } from 'lucide-react';
import { getOrganizerSession } from '@/lib/auth/organizer';

const STATUS_COLORS: Record<string, string> = {
    approved: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-orange-100 text-orange-700 border-orange-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    approved: <CheckCircle size={14} />,
    pending: <Clock size={14} />,
    rejected: <XCircle size={14} />,
};

function OrganizerDetailModal({
    organizerId,
    onClose,
    onStatusChange,
}: {
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
            // Update local state
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

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-[24px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b border-zinc-100 px-8 py-5 flex items-center justify-between rounded-t-[24px]">
                    <h2 className="text-[22px] font-bold text-black">Organizer Detail</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-black transition-colors">✕</button>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-zinc-400">Loading...</div>
                ) : !detail ? (
                    <div className="p-12 text-center text-red-400">Failed to load organizer details.</div>
                ) : (
                    <div className="p-8 space-y-8">
                        {/* Basic Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#5331EA]/10 rounded-full flex items-center justify-center">
                                <User size={28} className="text-[#5331EA]" />
                            </div>
                            <div>
                                <p className="text-[20px] font-semibold text-black">{detail.organizer.email}</p>
                                <p className="text-[14px] text-zinc-500">ID: {detail.organizer.id}</p>
                            </div>
                        </div>

                        {/* Setups */}
                        {detail.setups.length === 0 ? (
                            <p className="text-zinc-400 italic">No setup submitted yet.</p>
                        ) : (
                            detail.setups.map(setup => {
                                const currentStatus = detail.organizer.categoryStatus?.[setup.category] ?? 'pending';
                                return (
                                    <div key={setup.id} className="border border-zinc-200 rounded-[16px] p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[18px] font-bold capitalize text-black">{setup.category} Setup</h3>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium border ${STATUS_COLORS[currentStatus] ?? 'bg-zinc-100 text-zinc-600'}`}>
                                                {STATUS_ICONS[currentStatus]}
                                                {currentStatus}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-[14px]">
                                            <div><span className="text-zinc-500">Org Type:</span> <strong>{setup.orgType}</strong></div>
                                            <div><span className="text-zinc-500">PAN:</span> <strong>{setup.pan || 'N/A'}</strong></div>
                                            <div><span className="text-zinc-500">Name on PAN:</span> <strong>{setup.panName || 'N/A'}</strong></div>
                                            <div><span className="text-zinc-500">DOB on PAN:</span> <strong>{setup.panDOB || 'N/A'}</strong></div>
                                            <div><span className="text-zinc-500">Bank Account:</span> <strong>{setup.bankAccountNo || 'N/A'}</strong></div>
                                            <div><span className="text-zinc-500">IFSC:</span> <strong>{setup.bankIfsc || 'N/A'}</strong></div>
                                            <div><span className="text-zinc-500">Bank Name:</span> <strong>{setup.bankName || 'N/A'}</strong></div>
                                            <div><span className="text-zinc-500">Account Holder:</span> <strong>{setup.accountHolder || 'N/A'}</strong></div>
                                            <div><span className="text-zinc-500">Backup Email:</span> <strong>{setup.backupEmail || 'N/A'}</strong></div>
                                            <div><span className="text-zinc-500">Backup Phone:</span> <strong>{setup.backupPhone || 'N/A'}</strong></div>
                                        </div>

                                        {setup.panCardUrl && (
                                            <a
                                                href={setup.panCardUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-[#5331EA] text-[14px] font-medium hover:underline"
                                            >
                                                View PAN Card <ExternalLink size={14} />
                                            </a>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-3 pt-2">
                                            <button
                                                disabled={updating === setup.category}
                                                onClick={() => handleStatusUpdate(setup.category, 'approved')}
                                                className={`flex items-center gap-2 px-5 h-10 rounded-[10px] text-[14px] font-medium transition-colors ${currentStatus === 'approved' ? 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                            >
                                                <CheckCircle size={16} /> {currentStatus === 'approved' ? 'Approved' : 'Approve'}
                                            </button>

                                            {showRejectInput === setup.category ? (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input
                                                        type="text"
                                                        value={rejectionReason}
                                                        onChange={e => setRejectionReason(e.target.value)}
                                                        placeholder="Reason for rejection (optional)"
                                                        className="flex-1 h-10 px-4 border border-zinc-300 rounded-[10px] text-[14px] focus:outline-none focus:border-red-400"
                                                    />
                                                    <button
                                                        onClick={() => handleStatusUpdate(setup.category, 'rejected')}
                                                        disabled={updating === setup.category}
                                                        className="bg-red-500 text-white px-5 h-10 rounded-[10px] text-[14px] font-medium hover:bg-red-600 disabled:opacity-40 transition-colors"
                                                    >
                                                        {updating === setup.category ? 'Rejecting...' : 'Confirm Reject'}
                                                    </button>
                                                    <button
                                                        onClick={() => { setShowRejectInput(null); setRejectionReason(''); }}
                                                        className="text-zinc-500 px-3 h-10 text-[14px] hover:text-black"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        disabled={updating === setup.category}
                                                        onClick={() => setShowRejectInput(setup.category)}
                                                        className={`flex items-center gap-2 px-5 h-10 rounded-[10px] text-[14px] font-medium transition-colors ${currentStatus === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
                                                    >
                                                        <XCircle size={16} /> {currentStatus === 'rejected' ? 'Rejected' : 'Reject'}
                                                    </button>

                                                    {currentStatus !== 'pending' && (
                                                        <button
                                                            disabled={updating === setup.category}
                                                            onClick={() => handleStatusUpdate(setup.category, 'pending')}
                                                            className="text-zinc-500 border border-zinc-300 px-5 h-10 rounded-[10px] text-[14px] font-medium hover:bg-zinc-50 transition-colors"
                                                        >
                                                            Reset to Pending
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
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
    const [search, setSearch] = useState('');
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

    const fetchOrganizers = async (p = 1) => {
        setLoading(true);
        try {
            const data = await adminApi.listOrganizers(p, 20);
            setOrganizers(data.organizers);
            setTotalPages(data.pages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`Are you sure you want to delete organizer ${email}? This cannot be undone.`)) return;
        try {
            await adminApi.deleteOrganizer(id);
            alert('Organizer deleted successfully');
            fetchOrganizers(page);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete organizer');
        }
    };

    useEffect(() => { if (authChecked) fetchOrganizers(page); }, [page, authChecked]);

    if (!authChecked) return <div className="min-h-screen animate-pulse bg-zinc-50" />;

    const filtered = organizers.filter(o =>
        search ? o.email.toLowerCase().includes(search.toLowerCase()) : true
    );

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-[family-name:var(--font-anek-latin)] py-10 px-4 md:px-10">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-[32px] font-bold text-black">Organizer Moderation</h1>
                    <p className="text-[#686868] mt-1">Review and approve organizer applications across all verticals.</p>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by email..."
                        className="w-full h-12 pl-11 pr-4 rounded-[14px] border border-zinc-200 focus:outline-none focus:border-[#5331EA] bg-white text-[15px]"
                    />
                </div>

                {loading ? (
                    <div className="grid gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-20 bg-white rounded-[16px] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[20px] border border-zinc-200 overflow-hidden shadow-sm">
                        <table className="w-full text-[14px]">
                            <thead className="bg-zinc-50 border-b border-zinc-100">
                                <tr>
                                    <th className="text-left px-6 py-4 font-semibold text-zinc-500">Email</th>
                                    <th className="text-left px-6 py-4 font-semibold text-zinc-500">Dining</th>
                                    <th className="text-left px-6 py-4 font-semibold text-zinc-500">Events</th>
                                    <th className="text-left px-6 py-4 font-semibold text-zinc-500">Play</th>
                                    <th className="text-left px-6 py-4 font-semibold text-zinc-500">Joined</th>
                                    <th className="px-6 py-4" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-zinc-400">No organizers found.</td></tr>
                                ) : filtered.map(org => {
                                    const categories = ['dining', 'events', 'play'];
                                    return (
                                        <tr key={org.id} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-black">{org.email}</td>
                                            {categories.map(cat => {
                                                const status = org.categoryStatus?.[cat];
                                                return (
                                                    <td key={cat} className="px-6 py-4">
                                                        {status ? (
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium border ${STATUS_COLORS[status]}`}>
                                                                {STATUS_ICONS[status]}
                                                                {status}
                                                            </span>
                                                        ) : (
                                                            <span className="text-zinc-300 text-[12px]">—</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-6 py-4 text-zinc-400">
                                                {org.createdAt ? new Date(org.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button
                                                    onClick={() => setSelectedId(org.id)}
                                                    className="bg-[#5331EA] text-white px-4 h-9 rounded-[10px] text-[13px] font-medium hover:bg-[#4325C7] transition-colors"
                                                >
                                                    Review
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(org.id, org.email)}
                                                    className="bg-white border border-red-200 text-red-500 px-4 h-9 rounded-[10px] text-[13px] font-medium hover:bg-red-50 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100">
                                <span className="text-[13px] text-zinc-500">Page {page} of {totalPages}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="h-8 w-8 flex items-center justify-center rounded-[8px] border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="h-8 w-8 flex items-center justify-center rounded-[8px] border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedId && (
                <OrganizerDetailModal
                    organizerId={selectedId}
                    onClose={() => setSelectedId(null)}
                    onStatusChange={() => fetchOrganizers(page)}
                />
            )}
        </div>
    );
}

export default function OrganizerModerationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <OrganizerModerationContent />
        </Suspense>
    );
}
