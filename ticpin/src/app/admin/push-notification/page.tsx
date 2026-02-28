'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { adminApi, NotificationRecord, UserRecord, OrganizerListItem, uploadMedia } from '@/lib/api/admin';
import { ChevronDown, X, Trash2, Clock, Users, UserPlus, Check } from 'lucide-react';

type TargetType = 'all_users' | 'all_organizers' | 'selected_users' | 'selected_organizers' | 'both';

export default function PushNotification() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState('');
    const [targetType, setTargetType] = useState<TargetType>('all_users');
    const [showTargetDropdown, setShowTargetDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<NotificationRecord[]>([]);

    // Selection lists
    const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
    const [allOrganizers, setAllOrganizers] = useState<OrganizerListItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadHistory();
        loadLists();
    }, []);

    useEffect(() => {
        if (showSelectionModal) {
            loadLists();
            setSearchTerm('');
        }
    }, [showSelectionModal]);

    const loadHistory = async () => {
        try {
            const data = await adminApi.listNotifications();
            setHistory(Array.isArray(data) ? data : []);
        } catch (e) {
            setHistory([]);
        }
    };

    const loadLists = async () => {
        try {
            const [users, orgs] = await Promise.all([
                adminApi.listUsers(),
                adminApi.listOrganizers(1, 1000).then(res => res.organizers)
            ]);
            setAllUsers(Array.isArray(users) ? users : []);
            setAllOrganizers(Array.isArray(orgs) ? orgs : []);
        } catch (e) {
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleSend = async () => {
        if (!title.trim() || !description.trim()) {
            alert('Please enter title and description');
            return;
        }

        setLoading(true);
        try {
            let finalImageUrl = '';
            if (image) {
                finalImageUrl = await uploadMedia(image);
            }

            const payload: Partial<NotificationRecord> = {
                title,
                description,
                image_url: finalImageUrl,
                target_type: targetType,
                recipient_ids: (targetType === 'selected_users' || targetType === 'selected_organizers') ? selectedIds : []
            };

            await adminApi.sendNotification(payload);
            alert('Notification sent and saved');

            // Reset form
            setTitle('');
            setDescription('');
            setImage(null);
            setSelectedIds([]);
            loadHistory();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to send notification');
        } finally {
            setLoading(false);
        }
    };

    const targetLabel = {
        all_users: 'All Users',
        all_organizers: 'All Organizers',
        selected_users: 'Selected Users',
        selected_organizers: 'Selected Organizers',
        both: 'Both (All Users & Organizers)'
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="w-full min-h-screen font-sans relative flex flex-col items-center bg-[#ECE8FD]"
            style={{ zoom: '90%' }}>

            <div className="w-full max-w-[1440px] px-[37px] py-[60px] space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-[40px] font-semibold text-black">Admin Panel</h1>
                    <div className="w-[101px] h-[1.5px] bg-[#686868]"></div>
                    <h2 className="text-[25px] font-medium text-black">Push Notification</h2>
                </div>

                {/* Main Card */}
                <div className="w-full bg-white rounded-[30px] p-12 shadow-sm grid grid-cols-2 gap-x-20 gap-y-10 relative">

                    {/* Title */}
                    <div className="space-y-3">
                        <label className="text-[20px] font-medium text-[#686868]">Title</label>
                        <div className="w-full h-[65px] border-[1.5px] border-[#AEAEAE] rounded-[20px] px-6 flex items-center">
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                type="text"
                                placeholder="Enter notification title"
                                className="w-full bg-transparent outline-none text-[20px]"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <label className="text-[20px] font-medium text-[#686868]">Description</label>
                        <div className="w-full h-[65px] border-[1.5px] border-[#AEAEAE] rounded-[20px] px-6 flex items-center">
                            <input
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                type="text"
                                placeholder="Enter description here"
                                className="w-full bg-transparent outline-none text-[20px]"
                            />
                        </div>
                    </div>

                    {/* Target Selection */}
                    <div className="space-y-3 relative">
                        <label className="text-[20px] font-medium text-[#686868]">Send To</label>
                        <div
                            onClick={() => setShowTargetDropdown(!showTargetDropdown)}
                            className="w-full h-[65px] border-[1.5px] border-[#AEAEAE] rounded-[20px] px-6 flex items-center justify-between cursor-pointer hover:border-black transition-colors"
                        >
                            <span className="text-[20px] font-medium text-black">{targetLabel[targetType]}</span>
                            <ChevronDown className={`text-[#686868] transition-transform ${showTargetDropdown ? 'rotate-180' : ''}`} />
                        </div>

                        {showTargetDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 rounded-[20px] shadow-xl z-10 overflow-hidden">
                                {Object.entries(targetLabel).map(([key, label]) => (
                                    <div
                                        key={key}
                                        onClick={() => {
                                            setTargetType(key as TargetType);
                                            setShowTargetDropdown(false);
                                            setSelectedIds([]);
                                        }}
                                        className="px-6 py-4 hover:bg-zinc-50 cursor-pointer text-[18px] transition-colors border-b border-zinc-50 last:border-0"
                                    >
                                        {label}
                                    </div>
                                ))}
                            </div>
                        )}

                        {(targetType === 'selected_users' || targetType === 'selected_organizers') && (
                            <button
                                onClick={() => setShowSelectionModal(true)}
                                className="mt-4 text-[#5331EA] font-semibold flex items-center gap-2 hover:underline"
                            >
                                <UserPlus size={18} />
                                Select {targetType === 'selected_users' ? 'Users' : 'Organizers'} ({selectedIds.length} selected)
                            </button>
                        )}
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-3">
                        <label className="text-[20px] font-medium text-[#686868]">Image</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-[105px] border-[1.5px] border-[#AEAEAE] border-dashed rounded-[20px] px-6 flex items-center gap-6 cursor-pointer hover:bg-zinc-50 transition-all group"
                        >
                            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-black transition-colors">
                                <Image src="/list your events/doc icon.svg" alt="Upload" width={24} height={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[18px] font-semibold truncate max-w-[300px]">
                                    {image ? image.name : 'Click to upload image'}
                                </span>
                                <span className="text-[14px] text-[#686868]">JPEG, JPG, PNG • Max 50MB</span>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>

                    {/* Send Button */}
                    <div className="col-span-2 flex justify-end mt-4">
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="bg-black text-white px-10 py-4 rounded-[16px] text-[20px] font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send Notification'}
                        </button>
                    </div>
                </div>

                {/* History Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-[25px] font-medium text-black">Notification History</h2>
                        <div className="flex-1 h-[1px] bg-zinc-200"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {history.length === 0 ? (
                            <div className="bg-white/50 border border-zinc-200 rounded-[20px] p-12 text-center text-zinc-500 font-medium">
                                No notification history found.
                            </div>
                        ) : history.map(item => (
                            <div key={item.id} className="bg-white rounded-[25px] p-8 border border-white shadow-sm hover:shadow-md transition-shadow flex gap-8">
                                {item.image_url && (
                                    <div className="w-[120px] h-[120px] rounded-[15px] overflow-hidden flex-shrink-0 border border-zinc-100">
                                        <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-[22px] font-bold text-black">{item.title}</h3>
                                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                            <Clock size={16} />
                                            {new Date(item.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <p className="text-zinc-600 mt-2 line-clamp-2 text-[18px]">{item.description}</p>

                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <div className="bg-[#ECE8FD] text-[#5331EA] px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 capitalize">
                                            <Users size={14} />
                                            Target: {targetLabel[item.target_type]}
                                        </div>
                                        {item.recipient_ids && item.recipient_ids.length > 0 && (
                                            <div className="bg-zinc-100 text-zinc-600 px-4 py-1.5 rounded-full text-sm font-bold">
                                                {item.recipient_ids.length} Recipients Selected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Selection Modal */}
            {showSelectionModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-white w-full max-w-2xl rounded-[30px] flex flex-col max-h-[80vh] overflow-hidden">
                        <div className="p-8 border-b border-zinc-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold">Select {targetType === 'selected_users' ? 'Users' : 'Organizers'}</h3>
                                <p className="text-zinc-500">{selectedIds.length} selected</p>
                            </div>
                            <button onClick={() => setShowSelectionModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                                <X size={28} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="px-8 pt-6 pb-2">
                            <div className="w-full h-[50px] border border-zinc-200 rounded-xl px-4 flex items-center bg-zinc-50 focus-within:bg-white focus-within:border-[#5331EA] transition-all">
                                <input
                                    type="text"
                                    placeholder={`Search by name, ${targetType === 'selected_users' ? 'phone' : 'email'}...`}
                                    className="w-full bg-transparent outline-none text-md"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-2">
                            {targetType === 'selected_users' ? (
                                allUsers
                                    .filter(u =>
                                        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (u.phone || '').includes(searchTerm)
                                    )
                                    .map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => toggleSelection(u.id)}
                                            className={`p-4 rounded-[15px] border-[1.5px] cursor-pointer flex justify-between items-center transition-all ${selectedIds.includes(u.id) ? 'border-[#5331EA] bg-[#ECE8FD]' : 'border-zinc-100 hover:border-zinc-300'}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-bold">{u.name || 'No Name'}</span>
                                                <span className="text-sm text-zinc-500">{u.phone}</span>
                                            </div>
                                            {selectedIds.includes(u.id) && <Check className="text-[#5331EA]" />}
                                        </div>
                                    ))
                            ) : (
                                allOrganizers
                                    .filter(o =>
                                        (o.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (o.email || '').toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map(o => (
                                        <div
                                            key={o.id}
                                            onClick={() => toggleSelection(o.id)}
                                            className={`p-4 rounded-[15px] border-[1.5px] cursor-pointer flex justify-between items-center transition-all ${selectedIds.includes(o.id) ? 'border-[#5331EA] bg-[#ECE8FD]' : 'border-zinc-100 hover:border-zinc-300'}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-bold">{o.name || 'No Name'}</span>
                                                <span className="text-sm text-zinc-500">{o.email}</span>
                                            </div>
                                            {selectedIds.includes(o.id) && <Check className="text-[#5331EA]" />}
                                        </div>
                                    ))
                            )}
                            {((targetType === 'selected_users' ? allUsers : allOrganizers).length === 0) && (
                                <div className="text-center py-12 text-zinc-400">
                                    No records found in the database.
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-zinc-100 flex justify-end">
                            <button
                                onClick={() => setShowSelectionModal(false)}
                                className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all text-xl"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}