'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getOrganizerSession } from '@/lib/auth/organizer';
import { organizerApi, OrganizerProfile } from '@/lib/api/organizer';
import { ChevronRight, Save, User, Mail, Phone, MapPin, Globe } from 'lucide-react';

function ProfileContent() {
    const router = useRouter();
    const session = getOrganizerSession();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isNewProfile, setIsNewProfile] = useState(true);

    const [formData, setFormData] = useState<OrganizerProfile>({
        organizerId: session?.id ?? '',
        name: '',
        email: session?.email ?? '',
        phone: '',
        address: '',
        country: 'India',
        state: '',
        district: '',
    });

    useEffect(() => {
        if (!session) {
            router.replace('/');
            return;
        }

        const fetchProfile = async () => {
            try {
                const profile = await organizerApi.getProfile(session.id);
                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        ...profile,
                        name: profile.name || prev.name,
                        phone: profile.phone || prev.phone,
                        address: profile.address || prev.address,
                        state: profile.state || prev.state,
                        district: profile.district || prev.district,
                    }));
                    setIsNewProfile(false);
                }
            } catch (err) {
                // profile not found — new user
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [session?.id, router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            if (isNewProfile) {
                await organizerApi.createProfile(formData);
                setIsNewProfile(false);
            } else {
                await organizerApi.updateProfile(session.id, formData);
            }
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5331EA]"></div>
            </div>
        );
    }

    const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'];
    // Simplified states for example
    const states = ['Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi', 'Kerala', 'Gujarat', 'Punjab'];

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#F8F9FA] font-[family-name:var(--font-anek-latin)] py-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-[24px] shadow-sm border border-zinc-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#5331EA] px-8 py-10 text-white">
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <User size={32} />
                            Organizer Profile
                        </h1>
                        <p className="mt-2 text-white/80">Manage your business information and contact details</p>
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-8">
                        {/* Basic Info Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[16px] font-semibold text-[#686868]">
                                    <User size={18} /> Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter your full name"
                                    className="w-full h-14 px-5 rounded-[16px] border border-zinc-200 focus:outline-none focus:border-[#5331EA] transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[16px] font-semibold text-[#686868]">
                                    <Mail size={18} /> Email Address
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    value={formData.email}
                                    className="w-full h-14 px-5 rounded-[16px] border border-zinc-100 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[16px] font-semibold text-[#686868]">
                                    <Phone size={18} /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+91 00000 00000"
                                    className="w-full h-14 px-5 rounded-[16px] border border-zinc-200 focus:outline-none focus:border-[#5331EA] transition-all"
                                />
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="pt-4 border-t border-zinc-100">
                            <h2 className="text-[20px] font-bold text-black mb-6 flex items-center gap-2">
                                <MapPin size={22} className="text-[#5331EA]" /> Location Details
                            </h2>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[16px] font-semibold text-[#686868]">Complete Address</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={formData.address}
                                        onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="Enter your business or residential address"
                                        className="w-full p-5 rounded-[16px] border border-zinc-200 focus:outline-none focus:border-[#5331EA] transition-all resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[16px] font-semibold text-[#686868]">
                                            <Globe size={18} /> Country
                                        </label>
                                        <select
                                            value={formData.country}
                                            onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                            className="w-full h-14 px-5 rounded-[16px] border border-zinc-200 focus:outline-none focus:border-[#5331EA] transition-all appearance-none bg-white"
                                        >
                                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[16px] font-semibold text-[#686868]">State</label>
                                        <select
                                            required
                                            value={formData.state}
                                            onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                            className="w-full h-14 px-5 rounded-[16px] border border-zinc-200 focus:outline-none focus:border-[#5331EA] transition-all appearance-none bg-white"
                                        >
                                            <option value="" disabled>Select State</option>
                                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[16px] font-semibold text-[#686868]">District</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.district}
                                            onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
                                            placeholder="Enter District"
                                            className="w-full h-14 px-5 rounded-[16px] border border-zinc-200 focus:outline-none focus:border-[#5331EA] transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Messages */}
                        {error && <div className="p-4 bg-red-50 text-red-600 rounded-[12px] text-sm font-medium">{error}</div>}
                        {success && <div className="p-4 bg-green-50 text-green-600 rounded-[12px] text-sm font-medium">{success}</div>}

                        {/* Actions */}
                        <div className="pt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-[#5331EA] text-white px-10 h-14 rounded-[16px] font-bold flex items-center gap-3 hover:bg-[#4325C7] transition-all active:scale-95 disabled:opacity-70"
                            >
                                {saving ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={20} />
                                )}
                                Save Profile Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function OrganizerProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <ProfileContent />
        </Suspense>
    );
}
