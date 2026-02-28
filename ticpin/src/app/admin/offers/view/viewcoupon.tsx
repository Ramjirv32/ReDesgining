'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, X, User, BarChart3, Clock, Pencil, Trash2 } from 'lucide-react';
import { adminApi, CouponRecord, UserRecord } from '@/lib/api/admin';
import CreateCouponPage from '../create/createcoupon';

export default function ViewCouponForm({ onBack }: { onBack: () => void }) {
    const [coupons, setCoupons] = useState<CouponRecord[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [selectedCoupon, setSelectedCoupon] = useState<CouponRecord | null>(null);
    const [editingCoupon, setEditingCoupon] = useState<CouponRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [couponData, userData] = await Promise.all([
                adminApi.listCoupons(),
                adminApi.listUsers().catch(() => [])
            ]);
            setCoupons(couponData);
            setUsers(userData);
        } catch (err) {
            setError('Failed to load coupon data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await adminApi.deleteCoupon(id);
            setCoupons(prev => prev.filter(c => c.id !== id));
            setSelectedCoupon(null);
        } catch (err) {
            alert('Failed to delete coupon');
        }
    };

    const handleEdit = (coupon: CouponRecord) => {
        setEditingCoupon(coupon);
        setSelectedCoupon(null);
    };

    const formatDate = (iso: string) => {
        try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return iso; }
    };

    const formatFullDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch { return iso; }
    };

    const getUserName = (coupon?: CouponRecord) => {
        if (!coupon) return 'Global (All Users)';

        // Try single user_id field first
        let primaryId = coupon.user_id;

        // If not found, try user_ids array
        if (!primaryId && coupon.user_ids && coupon.user_ids.length > 0) {
            const first = coupon.user_ids[0];
            primaryId = typeof first === 'string' ? first : (first as any).$oid;
        }

        if (!primaryId) return 'Global (All Users)';

        const user = users.find(u => u.id === primaryId);
        return user ? user.name : `User (${primaryId})`;
    };

    if (editingCoupon) {
        return <CreateCouponPage onBack={() => { setEditingCoupon(null); fetchData(); }} editData={editingCoupon || undefined} />;
    }

    return (
        <div className="bg-white rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex items-center justify-center gap-12 relative">
            <div className="relative w-full max-w-[1050px]">
                {loading ? (
                    <div className="text-center py-20 text-gray-400 text-[16px]">Loading coupons...</div>
                ) : error ? (
                    <div className="text-center py-20 text-red-400 text-[16px]">{error}</div>
                ) : coupons.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 text-[16px]">No coupons created yet.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-2">
                        {coupons.map((coupon) => (
                            <div
                                key={coupon.id}
                                onClick={() => setSelectedCoupon(coupon)}
                                className="bg-[#F1EDFF] rounded-[24px] p-5 flex flex-col justify-center cursor-pointer hover:shadow-lg transition-all active:scale-95 group border border-transparent hover:border-[#866BFF]/30"
                                style={{ width: '290px', height: '150px' }}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Coupon Token */}
                                    <div className="relative flex items-center justify-center shrink-0" style={{ width: '110px', height: '50px' }}>
                                        <svg className="absolute inset-0 w-full h-full object-contain" viewBox="0 0 121 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M41.5938 7.83871C46.9993 7.83871 51.5218 5.22598 52.6608 1.72835C52.9533 0.830556 53.0993 0.381659 53.4447 0.19083C53.7899 8.27139e-07 54.346 0 55.4583 0H81.9271C99.7174 0 108.613 -1.4385e-06 114.377 3.60999C114.866 3.91631 115.333 4.239 115.776 4.57702C121 8.55996 121 14.7066 121 27C121 39.2934 121 45.44 115.776 49.423C115.333 49.761 114.866 50.0837 114.377 50.39C108.613 54 99.7174 54 81.9271 54H55.4583C54.346 54 53.7899 54 53.4447 53.8092C53.0993 53.6183 52.9533 53.1694 52.6608 52.2717C51.5218 48.774 46.9993 46.1613 41.5938 46.1613C36.2069 46.1613 31.6968 48.756 30.5385 52.2355C30.2369 53.1416 30.0861 53.5947 29.7325 53.7849C29.3788 53.9751 28.8204 53.9666 27.7037 53.9498C17.1864 53.7913 11.0018 53.1321 6.62362 50.39C6.13445 50.0837 5.66746 49.761 5.22418 49.423C0 45.44 0 39.2934 0 27C0 14.7066 0 8.55996 5.22418 4.57702C5.66746 4.239 6.13445 3.91631 6.62362 3.60999C11.0018 0.867918 17.1864 0.208682 27.7037 0.0501661C28.8204 0.0333564 29.3788 0.0249111 29.7325 0.21513C30.0861 0.40535 30.2369 0.858427 30.5385 1.7645C31.6968 5.24401 36.2069 7.83871 41.5938 7.83871Z" fill="url(#paint0_linear_coupon)" />
                                            <defs>
                                                <linearGradient id="paint0_linear_coupon" x1="-157.667" y1="-145.106" x2="123.919" y2="32.6477" gradientUnits="userSpaceOnUse">
                                                    <stop stopColor="#866BFF" />
                                                    <stop offset="1" stopColor="#BDB1F3" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center text-white overflow-hidden pb-1">
                                            <div className="w-full flex flex-col items-center justify-center">
                                                <span className="text-[7.5px] font-bold uppercase leading-none text-center tracking-tight px-1.5" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                                    {coupon.code}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="bg-[#AEAEAE] shrink-0" style={{ width: '1px', height: '40px' }} />

                                    {/* Info */}
                                    <div className="flex flex-col flex-1 min-w-0" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                        <h3 className="text-[14px] font-bold text-black uppercase tracking-tight leading-tight truncate mb-1 mt-10">
                                            {coupon.code}
                                        </h3>
                                        <div className="flex flex-col space-y-0.5">
                                            <p className="text-[9px] text-gray-700 font-medium uppercase tracking-tight mt-[-2px]">
                                                {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                                            </p>
                                            <p className="text-[9px] text-gray-700 font-medium uppercase tracking-tight mt-[-2px]">
                                                Till {formatDate(coupon.valid_until)}
                                            </p>
                                        </div>
                                        <div className="mt-3">
                                            <span
                                                className={`text-black text-[9px] font-bold flex items-center justify-center rounded-[8px] ${coupon.is_active ? 'bg-[#B5E4B8]' : 'bg-[#FFCDD2]'}`}
                                                style={{ width: '64px', height: '24px' }}
                                            >
                                                {coupon.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button className="absolute -right-10 top-1/2 -translate-y-1/2 bg-black text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all hidden lg:flex z-20">
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Modal Overlay */}
            {selectedCoupon && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white w-full max-w-[500px] rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        {/* Header */}
                        <div className="bg-[#866BFF] p-8 text-white relative">
                            <button
                                onClick={() => setSelectedCoupon(null)}
                                className="absolute right-8 top-8 p-1 hover:bg-white/20 rounded-full transition-all"
                            >
                                <X size={24} />
                            </button>
                            <div className="flex items-center justify-between mr-8">
                                <h2 className="text-[24px] font-bold" style={{ fontFamily: 'var(--font-anek-latin)' }}>Coupon Details</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(selectedCoupon)}
                                        className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                                        title="Edit Coupon"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedCoupon.id)}
                                        className="p-2 bg-red-500/80 hover:bg-red-500 rounded-xl transition-all"
                                        title="Delete Coupon"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2 inline-block px-3 py-1 bg-white/20 rounded-lg text-[14px] font-bold tracking-widest uppercase">
                                {selectedCoupon.code}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-8" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {/* Description */}
                            {selectedCoupon.description && (
                                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                                    <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wider mb-1">Description</p>
                                    <p className="text-[15px] text-black font-medium">{selectedCoupon.description}</p>
                                </div>
                            )}

                            {/* User Allocation */}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#F1EDFF] flex items-center justify-center shrink-0">
                                    <User className="text-[#866BFF]" size={20} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[12px] text-gray-500 font-bold uppercase tracking-wider">Allocated User</label>
                                    <p className="text-[18px] text-black font-bold mt-1">
                                        {getUserName(selectedCoupon)}
                                    </p>
                                </div>
                            </div>

                            {/* Usage Stats */}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#F1EDFF] flex items-center justify-center shrink-0">
                                    <BarChart3 className="text-[#866BFF]" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wider">Usage Statistics</p>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                                            <p className="text-[22px] font-bold text-black">{selectedCoupon.used_count}</p>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase">Total Used</p>
                                        </div>
                                        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                                            <p className="text-[22px] font-bold text-black">
                                                {selectedCoupon.max_uses === 0 ? '∞' : selectedCoupon.max_uses}
                                            </p>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase">Usable Times</p>
                                        </div>
                                    </div>
                                    {selectedCoupon.max_uses > 0 && (
                                        <div className="mt-4 bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-[#866BFF] h-full transition-all duration-1000"
                                                style={{ width: `${Math.min(100, (selectedCoupon.used_count / selectedCoupon.max_uses) * 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Validity */}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#F1EDFF] flex items-center justify-center shrink-0">
                                    <Clock className="text-[#866BFF]" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wider">Validity period</p>
                                    <div className="mt-3 space-y-2">
                                        <div className="flex justify-between items-center text-[14px]">
                                            <span className="text-gray-400 font-medium">Valid From</span>
                                            <span className="text-black font-bold">{formatFullDate(selectedCoupon.valid_from)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[14px]">
                                            <span className="text-gray-400 font-medium">Valid Until</span>
                                            <span className="text-black font-bold">{formatFullDate(selectedCoupon.valid_until)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Action */}
                            <button
                                onClick={() => setSelectedCoupon(null)}
                                className="w-full h-[56px] bg-black text-white rounded-2xl font-bold text-[16px] transition-all active:scale-[0.98] hover:bg-zinc-800 shadow-xl"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
