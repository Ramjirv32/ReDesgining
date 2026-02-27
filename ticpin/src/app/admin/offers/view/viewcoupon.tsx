'use client';

import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { adminApi, CouponRecord } from '@/lib/api/admin';

export default function ViewCouponForm({ onBack }: { onBack: () => void }) {
    const [coupons, setCoupons] = useState<CouponRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        adminApi.listCoupons()
            .then(setCoupons)
            .catch(() => setError('Failed to load coupons'))
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (iso: string) => {
        try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return iso; }
    };

    return (
        <div className="bg-white rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex items-center justify-center gap-12">
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
                                className="bg-[#F1EDFF] rounded-[24px] p-5 flex flex-col justify-center"
                                style={{ width: '290px', height: '150px', opacity: 1 }}
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
        </div>
    );
}
