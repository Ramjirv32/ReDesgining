'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserSession } from '@/lib/auth/user';
import { profileApi, UserProfile } from '@/lib/api/profile';
import { 
    Edit3, User, Mail, Phone, MapPin, Globe, 
    Calendar, UserCircle, Bell, Languages, Map,
    CheckCircle2, ArrowLeft, Shield, Ticket, Star
} from 'lucide-react';

function UserProfileContent() {
    const router = useRouter();
    const userSession = useUserSession();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [hasCheckedSession, setHasCheckedSession] = useState(false);

    useEffect(() => {
        // Wait for session to load first
        const timer = setTimeout(() => {
            setHasCheckedSession(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!hasCheckedSession) return;
        
        if (!userSession) {
            router.replace('/');
            return;
        }

        const fetchProfile = async () => {
            try {
                const data = await profileApi.getProfile(userSession.id);
                if (data) {
                    setProfile(data);
                } else {
                    // Create minimal profile if not exists
                    const newP = { userId: userSession.id, phone: userSession.phone, name: userSession.name || 'Member' };
                    const created = await profileApi.createProfile(newP);
                    setProfile(created);
                }
            } catch (err) {
                console.error('Failed to fetch user profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userSession?.id, hasCheckedSession, router]);

    if (loading || !hasCheckedSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5331EA]"></div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-[family-name:var(--font-anek-latin)] py-8 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-zinc-100 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/5 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                        <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-zinc-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-zinc-300">
                            {profile.profilePhoto ? (
                                <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle size={72} />
                            )}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                            <h1 className="text-3xl font-black text-zinc-900">{profile.name}</h1>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-zinc-500 font-medium justify-center md:justify-start">
                                <span className="flex items-center gap-1.5 justify-center md:justify-start">
                                    <Phone size={14} /> {profile.phone}
                                </span>
                                {profile.email && (
                                    <span className="flex items-center gap-1.5 justify-center md:justify-start">
                                        <Mail size={14} /> {profile.email}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                                <div className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-2">
                                    <Star size={12} fill="currentColor" /> Premium Member
                                </div>
                                <div className="px-4 py-1.5 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-200">
                                    Joined {new Date().getFullYear()}
                                </div>
                            </div>

                            <div className="pt-4">
                                <Link 
                                    href="/profile/edit"
                                    className="inline-flex items-center gap-3 bg-zinc-900 text-white px-8 h-12 rounded-2xl font-bold hover:bg-black transition-all hover:scale-105 active:scale-95"
                                >
                                    <Edit3 size={18} />
                                    Edit Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Personal Details */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-6">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <User size={20} />
                            </div>
                            Personal Details
                        </h3>
                        <div className="space-y-4">
                            <DetailRow icon={<Calendar size={18} />} label="Date of Birth" value={profile.dob || 'Not specified'} />
                            <DetailRow icon={<UserCircle size={18} />} label="Gender" value={profile.gender || 'Not specified'} />
                            <DetailRow icon={<Languages size={18} />} label="Preferred Language" value={profile.preferredLanguage || 'English'} />
                        </div>
                    </div>

                    {/* Location Details */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-6">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <MapPin size={20} />
                            </div>
                            Home Address
                        </h3>
                        <div className="space-y-4">
                            <DetailRow icon={<Globe size={18} />} label="Country" value={profile.country || 'India'} />
                            <DetailRow icon={<Map size={18} />} label="City / State" value={`${profile.city || profile.district || 'Not set'}, ${profile.state || ''}`} />
                            <div className="pt-2">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Full Address</p>
                                <p className="text-zinc-600 font-medium leading-relaxed">{profile.address || 'Specify your address in edit profile'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Notification Preferences */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-6 md:col-span-2">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <Bell size={20} />
                            </div>
                            Notification Preferences
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <PreferenceCard active={profile.notificationPreferences?.email} label="Email Alerts" />
                            <PreferenceCard active={profile.notificationPreferences?.push} label="Push Notifications" />
                            <PreferenceCard active={profile.notificationPreferences?.sms} label="SMS Updates" />
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

export default function UserProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <UserProfileContent />
        </Suspense>
    );
}
