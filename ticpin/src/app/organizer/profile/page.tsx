'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrganizerSession } from '@/lib/auth/organizer';
import { organizerApi, OrganizerProfile } from '@/lib/api/organizer';
import { 
    Edit3, User, Mail, Phone, MapPin, Globe, 
    Calendar, UserCircle, Bell, Languages, Map,
    CheckCircle2, ArrowLeft, MoreVertical, Shield, ExternalLink
} from 'lucide-react';

function ProfileContent() {
    const router = useRouter();
    const [session, setSession] = useState<ReturnType<typeof getOrganizerSession>>(null);
    const [hasCheckedSession, setHasCheckedSession] = useState(false);

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<OrganizerProfile | null>(null);

    useEffect(() => {
        const s = getOrganizerSession();
        setSession(s);
        setHasCheckedSession(true);
        
        if (!s) {
            router.replace('/');
            return;
        }
    }, [router]);

    useEffect(() => {
        if (!session || !hasCheckedSession) return;

        const fetchProfile = async () => {
            try {
                const data = await organizerApi.getProfile(session.id);
                if (data) {
                    setProfile(data);
                }
            } catch (err) {
                // Profile might not exist yet
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [session?.id, hasCheckedSession]);

    if (loading || !hasCheckedSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5331EA]"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-6 text-center">
                <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mb-6">
                    <User size={48} />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">No Profile Found</h2>
                <p className="text-zinc-500 mb-8 max-w-sm">You haven't set up your organizer profile yet. Let's get started!</p>
                <Link 
                    href="/organizer/profile/edit"
                    className="bg-[#5331EA] text-white px-10 h-14 rounded-2xl font-bold flex items-center gap-3 hover:bg-[#4325C7] transition-all"
                >
                    Create Profile
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-[family-name:var(--font-anek-latin)] py-8 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-zinc-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#5331EA]/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] bg-zinc-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-zinc-300">
                            {profile.profilePhoto ? (
                                <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle size={80} />
                            )}
                        </div>
                        
                        <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                                <h1 className="text-3xl md:text-4xl font-black text-zinc-900">{profile.name || 'Organizer'}</h1>
                                <p className="text-zinc-500 font-medium flex items-center justify-center md:justify-start gap-2">
                                    <Mail size={16} /> {profile.email || session?.email}
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <div className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase tracking-widest border border-green-100 flex items-center gap-2">
                                    <Shield size={14} /> Verified Organizer
                                </div>
                                <div className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100">
                                    {profile.country}
                                </div>
                            </div>

                            <Link 
                                href="/organizer/profile/edit"
                                className="inline-flex items-center gap-3 bg-[#5331EA] text-white px-8 h-14 rounded-2xl font-bold hover:bg-[#4325C7] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#5331EA]/25"
                            >
                                <Edit3 size={20} />
                                Edit Profile
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Contact Info */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-6">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <User size={20} />
                            </div>
                            Contact Details
                        </h3>
                        <div className="space-y-4">
                            <DetailRow icon={<Phone size={18} />} label="Phone" value={profile.phone} />
                            <DetailRow icon={<Calendar size={18} />} label="DOB" value={profile.dob || 'Not specified'} />
                            <DetailRow icon={<UserCircle size={18} />} label="Gender" value={profile.gender || 'Not specified'} />
                            <DetailRow icon={<Languages size={18} />} label="Preferred Language" value={profile.preferredLanguage || 'English'} />
                        </div>
                    </div>

                    {/* Location Info */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-6">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <MapPin size={20} />
                            </div>
                            Location Details
                        </h3>
                        <div className="space-y-4">
                            <DetailRow icon={<Globe size={18} />} label="Country / State" value={`${profile.country}, ${profile.state}`} />
                            <DetailRow icon={<Map size={18} />} label="City / District" value={`${profile.city || profile.district}`} />
                            <div className="pt-2">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Street Address</p>
                                <p className="text-zinc-600 font-medium leading-relaxed">{profile.address}</p>
                            </div>
                            {profile.gps && (
                                <div className="p-4 bg-zinc-50 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-green-500">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <p className="text-sm font-bold text-zinc-600">GPS Coordinates Pinnded</p>
                                    </div>
                                    <button className="text-[#5331EA] text-xs font-bold hover:underline">View on Map</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-6 md:col-span-2">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <Bell size={20} />
                            </div>
                            Notification Preferences
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <PreferenceCard active={profile.notificationPreferences?.email} label="Email Notifications" />
                            <PreferenceCard active={profile.notificationPreferences?.push} label="Push Notifications" />
                            <PreferenceCard active={profile.notificationPreferences?.sms} label="SMS Notifications" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className="text-zinc-400">{icon}</div>
            <div className="flex-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
                <p className="text-zinc-800 font-bold">{value}</p>
            </div>
        </div>
    );
}

function PreferenceCard({ active, label }: { active?: boolean, label: string }) {
    return (
        <div className={`p-5 rounded-2xl border flex items-center justify-between ${
            active ? 'bg-green-50 border-green-100 text-green-700' : 'bg-zinc-50 border-zinc-100 text-zinc-400'
        }`}>
            <span className="font-bold">{label}</span>
            {active ? <CheckCircle2 size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-zinc-300" />}
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
