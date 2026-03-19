'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserSession } from '@/lib/auth/user';
import { useIdentityStore } from '@/store/useIdentityStore';
import { profileApi, UserProfile, GPS, NotificationPreferences } from '@/lib/api/profile';
import { useUpdateProfile } from '@/lib/hooks/useProfile';
import { 
    ChevronLeft, Save, User, Mail, Phone, MapPin, Globe, 
    Calendar, UserCircle, Bell, Languages, Camera, Map,
    CheckCircle2, AlertCircle, X, Shield
} from 'lucide-react';
function EditUserProfileContent() {
    const router = useRouter();
    const userSession = useUserSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hasCheckedSession, setHasCheckedSession] = useState(false);
    const [verifyingEmail, setVerifyingEmail] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [emailVerified, setEmailVerified] = useState(true); 
    const [originalEmail, setOriginalEmail] = useState('');
    const [formData, setFormData] = useState<UserProfile>({
        userId: userSession?.id ?? '',
        phone: userSession?.phone ?? '',
        name: userSession?.name ?? '',
        email: '',
        address: '',
        street: '',
        city: '',
        country: 'India',
        state: '',
        district: '',
        dob: '',
        gender: '',
        preferredLanguage: 'English',
        notificationPreferences: {
            email: true,
            push: true,
            sms: false
        },
        gps: { lat: 0, lng: 0 }
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        // Wait for session to load - don't redirect immediately
        const timer = setTimeout(() => {
            setHasCheckedSession(true);
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Only check session after we've checked once
        if (!hasCheckedSession) return;
        
        if (!userSession) {
            router.replace('/');
            return;
        }
        
        // Fetch profile in background but don't block UI
        let isMounted = true;
        
        const fetchProfile = async () => {
            try {
                const profile = await profileApi.getProfile(userSession.id);
                if (profile && isMounted) {
                    setFormData(prev => ({
                        ...prev,
                        ...profile,
                        notificationPreferences: profile.notificationPreferences || prev.notificationPreferences,
                        gps: profile.gps || prev.gps
                    }));
                    setOriginalEmail(profile.email || '');
                    setEmailVerified(!!profile.email);
                }
            } catch (err) {
                console.error('Failed to fetch user profile:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProfile();
        
        return () => {
            isMounted = false;
        };
    }, [userSession, hasCheckedSession, router]);

    const handleEmailChange = (newEmail: string) => {
        setFormData(prev => ({ ...prev, email: newEmail }));
        if (newEmail !== originalEmail) {
            setEmailVerified(false);
            setOtpSent(false);
        } else {
            setEmailVerified(true);
        }
    };

    const handleSendOTP = async () => {
        if (!formData.email) return;
        setVerifyingEmail(true);
        try {
            await fetch('/backend/api/user/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            setOtpSent(true);
            setSuccess('OTP sent to your email');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to send OTP');
        } finally {
            setVerifyingEmail(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) return;
        setVerifyingEmail(true);
        try {
            const res = await fetch('/backend/api/user/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp })
            });
            if (res.ok) {
                setEmailVerified(true);
                setOtpSent(false);
                setSuccess('Email verified successfully');
                setOriginalEmail(formData.email || '');
            } else {
                throw new Error('Invalid OTP');
            }
        } catch (err: any) {
            setError(err.message || 'OTP verification failed');
        } finally {
            setVerifyingEmail(false);
        }
    };

    const { loginUser } = useIdentityStore();
    const updateProfile = useUpdateProfile();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userSession) return;
        if (formData.email && !emailVerified) {
            setError('Please verify your email first');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await updateProfile.mutateAsync({
                userId: userSession.id,
                data: formData
            });

            // Update global session as well
            loginUser({
                ...userSession,
                name: formData.name,
                profilePhoto: formData.profilePhoto
            });

            setSuccess('Profile updated successfully!');
            setTimeout(() => {
                setSuccess('');
                router.push('/profile');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userSession) return;
        
        setSaving(true);
        try {
            const { url } = await profileApi.uploadPhoto(userSession.id, file);
            setFormData(prev => ({ ...prev, profilePhoto: url }));
            
            // Sync navbar immediately
            loginUser({
                ...userSession,
                profilePhoto: url
            });

            setSuccess('Photo uploaded successfully');
        } catch (err) {
            setError('Photo upload failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !hasCheckedSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5331EA]"></div>
            </div>
        );
    }

    // After loading, check if user is logged in
    if (!userSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5331EA]"></div>
            </div>
        );
    }

    const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'];
    const languages = ['English', 'Tamil', 'Hindi', 'Malayalam', 'Kannada', 'Telugu'];
    const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-[family-name:var(--font-anek-latin)] py-8 px-4 md:px-8 pb-24">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors font-semibold"
                    >
                        <ChevronLeft size={20} />
                        Back to Profile
                    </button>
                    <h1 className="text-2xl font-bold text-zinc-900">Edit {formData.name || 'Your'} Profile</h1>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* Photo Section */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-zinc-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-zinc-300">
                                {formData.profilePhoto ? (
                                    <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} />
                                )}
                            </div>
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-zinc-900 text-white p-2.5 rounded-full border-4 border-white shadow-lg hover:scale-110 transition-transform active:scale-95"
                            >
                                <Camera size={18} />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handlePhotoUpload} 
                                className="hidden" 
                                accept="image/*"
                            />
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-xl font-bold text-zinc-900">Your Avatar</h2>
                            <p className="text-zinc-500 text-sm max-w-xs">
                                Choose a photo that represents you. This will be visible on your passes.
                            </p>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-8">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-3 border-b border-zinc-50 pb-6">
                            Personal Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Your name"
                                    className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Phone (Protected)</label>
                                <input
                                    type="tel"
                                    disabled
                                    value={formData.phone}
                                    className="w-full h-14 px-5 rounded-[18px] border border-zinc-100 bg-zinc-50 text-zinc-400 font-medium cursor-not-allowed"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1 flex justify-between">
                                    Email Address
                                    {formData.email && (emailVerified ? (
                                        <span className="text-green-600 flex items-center gap-1 text-[10px] font-black uppercase">
                                            <CheckCircle2 size={12} /> Verified
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 flex items-center gap-1 text-[10px] font-black uppercase">
                                            <AlertCircle size={12} /> Pending
                                        </span>
                                    ))}
                                </label>
                                <div className="flex flex-col md:flex-row gap-3">
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => handleEmailChange(e.target.value)}
                                        placeholder="Add your email"
                                        className="flex-1 h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                    />
                                    {formData.email && !emailVerified && !otpSent && (
                                        <button 
                                            type="button"
                                            onClick={handleSendOTP}
                                            disabled={verifyingEmail}
                                            className="h-14 px-8 rounded-[18px] bg-zinc-900 text-white font-bold hover:bg-black transition-all disabled:opacity-50"
                                        >
                                            Verify
                                        </button>
                                    )}
                                </div>

                                {otpSent && (
                                    <div className="mt-4 p-5 bg-zinc-50 rounded-[22px] border border-zinc-100">
                                        <div className="flex flex-col md:flex-row items-center gap-4">
                                            <input 
                                                type="text"
                                                maxLength={6}
                                                value={otp}
                                                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                                className="flex-1 h-12 px-5 text-center text-xl tracking-[0.5em] font-bold rounded-xl border border-zinc-200 outline-none focus:border-zinc-900"
                                                placeholder="OTP"
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleVerifyOTP}
                                                className="h-12 px-8 rounded-xl bg-green-600 text-white font-bold"
                                            >
                                                Confirm
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={formData.dob}
                                    onChange={e => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                                    className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Gender</label>
                                <select
                                    value={formData.gender}
                                    onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                    className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium appearance-none bg-white"
                                >
                                    <option value="">Select</option>
                                    {genders.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-8">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-3 border-b border-zinc-50 pb-6">
                            Address & Map Pin
                        </h3>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">Street / Apartment</label>
                                    <input
                                        type="text"
                                        value={formData.street}
                                        onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
                                        placeholder="Street name"
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">District / Area</label>
                                    <input
                                        type="text"
                                        value={formData.district}
                                        onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
                                        placeholder="District"
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        placeholder="City"
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">State</label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                        placeholder="State"
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">Country</label>
                                    <select
                                        value={formData.country}
                                        onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium appearance-none bg-white"
                                    >
                                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Residential Address</label>
                                <textarea
                                    rows={2}
                                    value={formData.address}
                                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Enter your local address"
                                    className="w-full p-5 rounded-[22px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                />
                            </div>

                            <button 
                                type="button"
                                onClick={() => alert('GPS Picker placeholder')}
                                className="w-full p-5 bg-zinc-50 rounded-[22px] border border-dashed border-zinc-300 flex items-center justify-between hover:bg-zinc-100 transition-all font-bold text-zinc-600"
                            >
                                <span className="flex items-center gap-3"><MapPin size={20} className="text-zinc-400" /> Pin current location</span>
                                <span className="text-[10px] bg-zinc-200 px-2.5 py-1 rounded-full uppercase tracking-widest">Open Map</span>
                            </button>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-zinc-100 flex justify-center z-50">
                        <div className="max-w-4xl w-full flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/profile')}
                                className="flex-1 h-14 rounded-2xl font-bold bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-all"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-[2] h-14 rounded-2xl font-bold bg-zinc-900 text-white shadow-xl shadow-zinc-900/10 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
                            >
                                {saving ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                Save Profile
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function EditUserProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <EditUserProfileContent />
        </Suspense>
    );
}
