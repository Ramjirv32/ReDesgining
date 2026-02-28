'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';

interface User {
    id: string;
    name: string;
    phone: string;
    createdAt: string;
}

export default function UserDetails() {
    const [users, setUsers] = useState<User[]>([]);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');

    useEffect(() => {
        fetch('/backend/api/admin/users', { credentials: 'include' })
            .then(r => r.json())
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, []);

    function openEdit(u: User) {
        setEditUser(u);
        setEditName(u.name);
        setEditPhone(u.phone);
    }

    async function saveEdit() {
        if (!editUser) return;
        await fetch(`/backend/api/admin/users/${editUser.id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editName, phone: editPhone }),
        });
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, name: editName, phone: editPhone } : u));
        setEditUser(null);
    }

    async function deleteUser(id: string) {
        if (!confirm('Delete this user?')) return;
        await fetch(`/backend/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' });
        setUsers(prev => prev.filter(u => u.id !== id));
    }

    return (
        <div className="min-h-screen relative overflow-x-hidden flex flex-col" style={{ background: 'rgba(255, 241, 168, 0.1)', zoom: 0.85 }}>
            <header className="w-full h-[114px] bg-white border-b border-zinc-100 flex items-center justify-between px-[37px] sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-[159px] h-[40px] flex items-center font-bold text-2xl tracking-tighter cursor-pointer" onClick={() => window.location.href = '/admin'}>TICPIN</div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="w-[51px] h-[51px] bg-[#E1E1E1] rounded-full flex items-center justify-center cursor-pointer">
                        <img src="/profile icon.svg" alt="User" className="w-6 h-6 object-contain" />
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1440px] mx-auto w-full px-[37px] py-[66px]">
                <h1 className="text-[40px] font-semibold text-black leading-none" style={{ fontFamily: 'var(--font-anek-latin)' }}>Admin Panel</h1>
                <div className="w-[101px] h-[1.5px] bg-[#686868] mt-[24px] mb-[24px]"></div>
                <h2 className="text-[25px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>User Details</h2>

                <div className="bg-white rounded-[30px] shadow-sm mt-[33px] p-20 min-h-[600px] flex flex-col relative">
                    <div className="pl-[31px]">
                        {users.map(u => (
                            <div key={u.id} className="w-[750px] h-[110px] bg-white rounded-[31px] relative flex items-center px-[34px] shadow-sm mb-[30px] cursor-pointer"
                                onClick={() => { window.location.href = `/admin/user-details-view?id=${u.id}`; }}>
                                <div className="w-[73px] h-[73px] bg-[rgba(189,177,243,0.3)] rounded-full shrink-0"></div>
                                <div className="ml-[52px] flex flex-col gap-1">
                                    <h3 className="text-[17px] leading-[22px] font-medium text-black ml-[25px]">{u.name}</h3>
                                    <div className="flex items-center gap-[7px]">
                                        <Image src="/admin panel/userdetials icons/phone-icon.svg" alt="Phone" width={15} height={15} />
                                        <span className="text-[17px] leading-[22px] font-medium text-[#6B7280]">{u.phone}</span>
                                    </div>
                                </div>
                                <div className="absolute right-[80px] flex gap-[12px]" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => openEdit(u)} className="w-[36px] h-[36px] rounded-full bg-[rgba(83,49,234,0.1)] flex items-center justify-center">
                                        <Pencil className="w-4 h-4 text-[#5331EA]" />
                                    </button>
                                    <button onClick={() => deleteUser(u.id)} className="w-[36px] h-[36px] rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                                <div className="absolute right-[44px]">
                                    <ChevronRight className="w-6 h-6 text-[#686868]" />
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && (
                            <p className="text-[20px] text-[#686868]">No users found.</p>
                        )}
                    </div>
                </div>
            </main>

            {editUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditUser(null)}>
                    <div className="bg-white rounded-[24px] p-[40px] w-[420px] flex flex-col gap-[20px]" onClick={e => e.stopPropagation()}>
                        <h3 className="text-[22px] font-semibold text-black">Edit User</h3>
                        <div className="flex flex-col gap-[8px]">
                            <label className="text-[14px] text-[#686868]">Name</label>
                            <input value={editName} onChange={e => setEditName(e.target.value)}
                                className="border border-[#D9D9D9] rounded-[10px] px-[14px] py-[10px] text-[16px] outline-none focus:border-[#5331EA]" />
                        </div>
                        <div className="flex flex-col gap-[8px]">
                            <label className="text-[14px] text-[#686868]">Phone</label>
                            <input value={editPhone} onChange={e => setEditPhone(e.target.value)}
                                className="border border-[#D9D9D9] rounded-[10px] px-[14px] py-[10px] text-[16px] outline-none focus:border-[#5331EA]" />
                        </div>
                        <div className="flex gap-[12px] justify-end">
                            <button onClick={() => setEditUser(null)} className="px-[20px] py-[10px] rounded-[10px] border border-[#D9D9D9] text-[16px]">Cancel</button>
                            <button onClick={saveEdit} className="px-[20px] py-[10px] rounded-[10px] bg-black text-white text-[16px]">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
