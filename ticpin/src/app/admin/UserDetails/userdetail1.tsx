'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { adminApi, UserRecord } from '@/lib/api/admin';

export default function UserDetails() {
    const router = useRouter();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [editUser, setEditUser] = useState<UserRecord | null>(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');

    useEffect(() => {
        adminApi.listUsers()
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, []);

    function openEdit(u: UserRecord) {
        setEditUser(u);
        setEditName(u.name || '');
        setEditPhone(u.phone || '');
    }

    async function saveEdit() {
        if (!editUser) return;
        try {
            await adminApi.updateUser(editUser.id, { name: editName, phone: editPhone });
            setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, name: editName, phone: editPhone } : u));
            setEditUser(null);
        } catch (e) {
            alert('Failed to update user');
        }
    }

    async function deleteUser(id: string) {
        if (!confirm('Delete this user?')) return;
        try {
            await adminApi.deleteUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (e) {
            alert('Failed to delete user');
        }
    }

    return (
        <div className="min-h-screen relative overflow-x-hidden flex flex-col" style={{ background: 'rgba(255, 241, 168, 0.1)', zoom: 0.85 }}>
            <header className="w-full h-[114px] bg-white border-b border-zinc-100 flex items-center justify-between px-[37px] sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-[159px] h-[40px] flex items-center font-bold text-2xl tracking-tighter cursor-pointer" onClick={() => router.push('/admin')}>TICPIN</div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="w-[51px] h-[51px] bg-[#E1E1E1] rounded-full flex items-center justify-center cursor-pointer">
                        <div className="w-full h-full rounded-full overflow-hidden relative">
                            <Image src="/admin panel/Ellipse 2.svg" alt="Profile" fill className="object-cover" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-12 max-w-[1440px] mx-auto w-full">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-[40px] font-semibold text-black mb-2">User Details</h1>
                        <div className="w-[101px] h-[1.5px] bg-[#686868]"></div>
                    </div>
                </div>

                <div className="bg-white rounded-[30px] border border-white shadow-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-100">
                                <th className="px-8 py-6 text-[14px] font-bold text-zinc-400 uppercase tracking-wider">User ID</th>
                                <th className="px-8 py-6 text-[14px] font-bold text-zinc-400 uppercase tracking-wider">Name</th>
                                <th className="px-8 py-6 text-[14px] font-bold text-zinc-400 uppercase tracking-wider">Phone</th>
                                <th className="px-8 py-6 text-[14px] font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors group">
                                    <td className="px-8 py-6 font-medium text-zinc-500 text-[16px]">#{user.id.slice(-6)}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                                {user.name?.[0] || '?'}
                                            </div>
                                            <span className="text-[18px] font-semibold text-black">{user.name || 'Anonymous'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-[16px] text-zinc-500 font-medium">{user.phone}</td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(user)}
                                                className="p-2 hover:bg-white rounded-lg transition-all text-zinc-400 hover:text-blue-500 hover:shadow-sm"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteUser(user.id)}
                                                className="p-2 hover:bg-white rounded-lg transition-all text-zinc-400 hover:text-red-500 hover:shadow-sm"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-zinc-400 font-medium">
                                        No users found in the database.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Edit Modal */}
            {editUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white w-full max-w-[400px] rounded-[30px] p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Edit User</h2>
                            <button onClick={() => setEditUser(null)} className="p-1 hover:bg-zinc-100 rounded-full transition-all">
                                <Trash2 size={20} className="text-zinc-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-zinc-400 uppercase mb-2 block">Name</label>
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full h-12 px-4 border border-zinc-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-zinc-400 uppercase mb-2 block">Phone</label>
                                <input
                                    value={editPhone}
                                    onChange={e => setEditPhone(e.target.value)}
                                    className="w-full h-12 px-4 border border-zinc-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setEditUser(null)}
                                    className="flex-1 h-12 border border-zinc-200 rounded-xl font-bold hover:bg-zinc-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveEdit}
                                    className="flex-1 h-12 bg-black text-white rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
