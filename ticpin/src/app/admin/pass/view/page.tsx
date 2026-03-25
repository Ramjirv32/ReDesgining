'use client';

import { useState, useEffect } from 'react';
import { adminApi, PassRecord } from '@/lib/api/admin';
import { toast } from '@/components/ui/Toast';
import { 
    Search, User, Calendar, CreditCard, 
    Trash2, Edit3, MoreVertical, 
    RefreshCcw, AlertTriangle, CheckCircle2,
    ShieldCheck, Clock, ArrowUpDown, ChevronDown,
    X, Check, Loader2
} from 'lucide-react';

export default function AdminViewPasses() {
    const [passes, setPasses] = useState<PassRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'active' | 'expired' | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingPass, setEditingPass] = useState<PassRecord | null>(null);
    const [newExpiryDate, setNewExpiryDate] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const fetchPasses = async () => {
        setLoading(true);
        try {
            const data = await adminApi.listPasses(filterStatus === 'all' ? undefined : filterStatus);
            setPasses(data);
        } catch (err: any) {
            toast.error('Failed to load passes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPasses();
    }, [filterStatus]);

    const filteredPasses = passes.filter(p => 
        (p.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.user_phone?.includes(searchQuery))
    );

    const handleUpdate = async () => {
        if (!editingPass) return;
        setIsUpdating(true);
        try {
            await adminApi.updateAdminPass(editingPass.id, {
                end_date: newExpiryDate ? new Date(newExpiryDate).toISOString() : undefined,
                status: editingPass.status
            });
            toast.success('Pass updated successfully');
            setEditingPass(null);
            fetchPasses();
        } catch (err: any) {
            toast.error(err.message || 'Update failed');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRenew = async (passId: string, duration: number) => {
        try {
            await adminApi.renewAdminPass(passId, duration);
            toast.success(`Pass renewed for ${duration} months`);
            fetchPasses();
        } catch (err: any) {
            toast.error(err.message || 'Renewal failed');
        }
    };

    const handleDelete = async (passId: string) => {
        try {
            await adminApi.deleteAdminPass(passId);
            toast.success('Pass deleted');
            setConfirmDelete(null);
            fetchPasses();
        } catch (err: any) {
            toast.error(err.message || 'Delete failed');
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters Header */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto">
                    {(['all', 'active', 'expired'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`flex-1 px-6 py-2.5 rounded-xl font-bold text-sm uppercase transition-all ${
                                filterStatus === s 
                                ? 'bg-white text-purple-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-50 outline-none transition-all font-medium"
                    />
                </div>
            </div>

            {/* Passes Table */}
            <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-gray-50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-5 text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">User</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">Status</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">Validity</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">Benefits Used</th>
                                <th className="px-8 py-5 text-right text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Loader2 className="animate-spin text-purple-600 mx-auto" size={40} />
                                    </td>
                                </tr>
                            ) : filteredPasses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic font-medium">
                                        No pass records found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredPasses.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 ring-2 ring-white">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{p.user_name || 'Anonymous'}</div>
                                                    <div className="text-xs text-gray-500 font-medium">{p.user_phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-bold">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider ${
                                                p.status === 'active' && new Date(p.end_date) > new Date()
                                                ? 'bg-green-50 text-green-600' 
                                                : 'bg-red-50 text-red-600'
                                            }`}>
                                                {p.status === 'active' && new Date(p.end_date) > new Date() ? (
                                                    <><CheckCircle2 size={12} /> Active</>
                                                ) : (
                                                    <><Clock size={12} /> Expired</>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-sm font-bold text-gray-900">
                                                {new Date(p.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] text-gray-400 uppercase font-black tracking-tight">{p.payment_id}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-1.5 font-bold text-xs uppercase tracking-tight">
                                                <div className="text-blue-600">Turf: {p.benefits.turf_bookings.used}/{p.benefits.turf_bookings.total}</div>
                                                <div className="text-orange-600">Dining: {p.benefits.dining_vouchers.used}/{p.benefits.dining_vouchers.total}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {p.status !== 'active' || new Date(p.end_date) <= new Date() ? (
                                                    <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-xl">
                                                        <button 
                                                            onClick={() => handleRenew(p.id, 3)}
                                                            className="px-3 py-1.5 bg-white text-purple-700 text-[10px] font-black rounded-lg hover:shadow-sm border border-purple-100"
                                                        >
                                                            3M
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRenew(p.id, 6)}
                                                            className="px-3 py-1.5 bg-white text-purple-700 text-[10px] font-black rounded-lg hover:shadow-sm border border-purple-100"
                                                        >
                                                            6M
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => {
                                                            setEditingPass(p);
                                                            setNewExpiryDate(new Date(p.end_date).toISOString().slice(0, 16));
                                                        }}
                                                        className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-2xl transition-all"
                                                    >
                                                        <Edit3 size={20} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => setConfirmDelete(p.id)}
                                                    className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingPass && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                <ShieldCheck className="text-purple-600" />
                                Edit Membership
                            </h3>
                            <button onClick={() => setEditingPass(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-3xl space-y-1">
                                <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Subscriber</p>
                                <p className="text-xl font-black text-gray-900">{editingPass.user_name}</p>
                                <p className="text-sm font-bold text-gray-500">{editingPass.user_phone}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Update Expiry Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="datetime-local"
                                        value={newExpiryDate}
                                        onChange={(e) => setNewExpiryDate(e.target.value)}
                                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-purple-400 outline-none font-bold text-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="w-full h-16 bg-black text-white rounded-2xl font-bold text-lg uppercase tracking-wider hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
                            >
                                {isUpdating ? <Loader2 className="animate-spin" /> : 'Update Membership'}
                            </button>
                            <button
                                onClick={() => setEditingPass(null)}
                                className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Revoke Membership?</h3>
                        <p className="text-gray-500 leading-relaxed font-bold">This will permanently delete the membership record for this user. This action cannot be undone.</p>
                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={() => handleDelete(confirmDelete)}
                                className="w-full h-16 bg-red-600 text-white rounded-2xl font-bold text-lg uppercase tracking-wider hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-100"
                            >
                                Delete Permanently
                            </button>
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                            >
                                Keep Membership
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
