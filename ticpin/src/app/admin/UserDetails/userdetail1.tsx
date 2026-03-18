'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, Pencil, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import { adminApi, UserRecord } from '@/lib/api/admin';

export default function UserDetails() {
    const router = useRouter();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
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

    const filteredUsers = users.filter(u => 
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div
            className="w-full min-h-screen font-sans"
            style={{
                background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)'
            }}
        >
            <div className="px-[37px] pt-[60px] pb-[80px] ml-[70px]">
                {/* Page Title */}
                <div className="mb-[32px]">
                    <h1 className="text-[40px] font-semibold leading-[44px] text-black">Admin Panel</h1>
                    <div className="w-[101px] h-[1.5px] bg-[#686868] mt-2"></div>
                </div>

                {/* User Details Subtitle */}
                <div className="mb-[40px]">
                    <h2 className="text-[25px] font-medium leading-[28px] text-black">User Details</h2>
                </div>

                {/* Search Bar */}
                <div className="mb-[40px] relative w-[400px]">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Search className="w-5 h-5 text-[#686868]" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-[50px] pl-12 pr-4 bg-white rounded-[15px] border border-[#E5E5E5] text-[16px] outline-none focus:border-[#5331EA]"
                    />
                </div>

                {/* Users List Container */}
                <div className="pl-[31px]">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className="group relative">
                            <Link href={`/admin/user-details-view?id=${user.id}`}>
                                <div className="w-[750px] h-[110px] bg-white rounded-[31px] relative flex items-center px-[34px] shadow-sm mb-[30px] cursor-pointer hover:shadow-md transition-shadow">
                                    {/* Profile Circle */}
                                    <div className="w-[73px] h-[73px] bg-[rgba(189,177,243,0.3)] rounded-full shrink-0 flex items-center justify-center text-[#5331EA] text-[24px] font-semibold">
                                        {user.name?.[0] || user.phone?.[0] || '?'}
                                    </div>

                                    {/* Details Container */}
                                    <div className="ml-[52px] flex flex-col gap-1">
                                        <h3 className="text-[17px] leading-[22px] font-medium text-black ml-[+25px]">{user.name || 'Anonymous'}</h3>

                                        <div className="flex items-center gap-[7px]">
                                            <Image src="/admin panel/userdetials icons/email-icon.svg" alt="Email" width={18} height={18} />
                                            <span className="text-[17px] leading-[22px] font-medium text-[#6B7280]">{user.phone || 'No phone'}</span>
                                        </div>

                                        <div className="flex items-center gap-[7px]">
                                            <Image src="/admin panel/userdetials icons/phone-icon.svg" alt="Phone" width={15} height={15} />
                                            <span className="text-[17px] leading-[22px] font-medium text-[#6B7280]">{user.id.slice(-8)}</span>
                                        </div>
                                    </div>

                                    {/* Arrow Icon */}
                                    <div className="absolute right-[44px]">
                                        <ChevronRight className="w-6 h-6 text-[#686868]" />
                                    </div>
                                </div>
                            </Link>

                            {/* Action Buttons */}
                            <div className="absolute right-[100px] top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.preventDefault(); openEdit(user); }}
                                    className="p-2 bg-white rounded-full shadow-sm hover:bg-blue-50 text-[#5331EA]"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={(e) => { e.preventDefault(); deleteUser(user.id); }}
                                    className="p-2 bg-white rounded-full shadow-sm hover:bg-red-50 text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredUsers.length === 0 && (
                        <div className="w-[750px] h-[110px] bg-white rounded-[31px] flex items-center justify-center shadow-sm mb-[30px]">
                            <p className="text-[17px] text-[#6B7280]">No users found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white w-full max-w-[400px] rounded-[30px] p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Edit User</h2>
                            <button onClick={() => setEditUser(null)} className="p-1 hover:bg-zinc-100 rounded-full">
                                <span className="text-zinc-400 text-xl">&times;</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-zinc-400 uppercase mb-2 block">Name</label>
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full h-12 px-4 border border-zinc-200 rounded-xl outline-none focus:border-[#5331EA]"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-zinc-400 uppercase mb-2 block">Phone</label>
                                <input
                                    value={editPhone}
                                    onChange={e => setEditPhone(e.target.value)}
                                    className="w-full h-12 px-4 border border-zinc-200 rounded-xl outline-none focus:border-[#5331EA]"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setEditUser(null)}
                                    className="flex-1 h-12 border border-zinc-200 rounded-xl font-bold hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveEdit}
                                    className="flex-1 h-12 bg-[#5331EA] text-white rounded-xl font-bold hover:shadow-lg"
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
