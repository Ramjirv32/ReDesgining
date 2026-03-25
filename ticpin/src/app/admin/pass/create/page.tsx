'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toast';
import { User, Calendar, CreditCard, Search, Loader2, Check, ChevronDown } from 'lucide-react';

export default function AdminCreatePass() {
    const router = useRouter();
    const [users, setUsers] = useState<Array<{ id: string, name: string, phone: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [duration, setDuration] = useState(3);
    const [price, setPrice] = useState(799);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setLoading(true);
        adminApi.listEligiblePassUsers()
            .then(setUsers)
            .finally(() => setLoading(false));
    }, []);

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.phone.includes(searchQuery)
    );

    const handleCreate = async () => {
        if (!selectedUserId) {
            toast.error('Please select a user');
            return;
        }

        setIsSubmitting(true);
        try {
            await adminApi.createAdminPass({
                user_id: selectedUserId,
                duration_months: duration,
                price: price
            });
            toast.success('Ticpin Pass activated successfully');
            router.push('/admin/pass/view');
        } catch (err: any) {
            toast.error(err.message || 'Failed to create pass');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm min-h-[500px]">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-black">Create Ticpin Pass</h2>
                    <p className="text-gray-500">Manually assign a membership pass to a user</p>
                </div>

                {/* User Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Select User</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-medium"
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-2xl bg-gray-50/50 p-2 space-y-1 custom-scrollbar">
                        {loading ? (
                            <div className="py-8 flex justify-center">
                                <Loader2 className="animate-spin text-purple-500" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 italic">No eligible users found</div>
                        ) : (
                            filteredUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => setSelectedUserId(u.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                                        selectedUserId === u.id 
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 scale-[1.01]' 
                                        : 'bg-white hover:bg-purple-50 text-gray-900 border border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedUserId === u.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                                            <User size={18} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold">{u.name}</div>
                                            <div className={`text-xs ${selectedUserId === u.id ? 'text-purple-100' : 'text-gray-500'}`}>{u.phone}</div>
                                        </div>
                                    </div>
                                    {selectedUserId === u.id && <Check size={20} />}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Duration Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Duration</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[3, 6].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setDuration(m)}
                                    className={`h-14 rounded-2xl border-2 font-bold transition-all ${
                                        duration === m 
                                        ? 'border-purple-600 bg-purple-50 text-purple-700 ring-4 ring-purple-50' 
                                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                    }`}
                                >
                                    {m} Months
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Manual Price (₹)</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <CreditCard size={18} />
                            </div>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-50 outline-none transition-all font-bold text-xl"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                    <button
                        onClick={handleCreate}
                        disabled={isSubmitting || !selectedUserId}
                        className="w-full h-16 bg-black text-white rounded-2xl font-bold text-xl uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-xl"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Activate Pass Now'}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
