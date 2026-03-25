'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getOrganizerSession } from '@/lib/auth/organizer';
import { organizerApi, OrganizerProfile, GPS, NotificationPreferences } from '@/lib/api/organizer';
import { 
    ChevronLeft, Save, User, Mail, Phone, MapPin, Globe, 
    Calendar, UserCircle, Bell, Languages, Camera, Map,
    CheckCircle2, AlertCircle, X, Shield, Lock
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';

function EditProfileContent() {
    const router = useRouter();
    const [session, setSession] = useState<ReturnType<typeof getOrganizerSession>>(null);
    const [hasCheckedSession, setHasCheckedSession] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isNewProfile, setIsNewProfile] = useState(true);

    useEffect(() => {
        const s = getOrganizerSession();
        setSession(s);
        setHasCheckedSession(true);
        
        if (!s) {
            router.replace('/');
            return;
        }
        setFormData(prev => ({
            ...prev,
            organizerId: s.id,
            email: s.email
        }));
    }, [router]);
    const [verifyingEmail, setVerifyingEmail] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [emailVerified, setEmailVerified] = useState(true); // Default to true if not changing
    const [originalEmail, setOriginalEmail] = useState('');

    const [formData, setFormData] = useState<OrganizerProfile>({
        organizerId: session?.id ?? '',
        name: '',
        email: session?.email ?? '',
        phone: '',
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

    // Fetch profile after session is loaded
    useEffect(() => {
        if (!session || !hasCheckedSession) return;

        let isMounted = true;
        
        const fetchProfile = async () => {
            try {
                const profile = await organizerApi.getProfile(session.id);
                if (profile && isMounted) {
                    setFormData(prev => ({
                        ...prev,
                        ...profile,
                        notificationPreferences: profile.notificationPreferences || prev.notificationPreferences,
                        gps: profile.gps || prev.gps
                    }));
                    setOriginalEmail(profile.email);
                    setIsNewProfile(false);
                }
            } catch (err) {
                // profile not found — try to get PAN name from setup
                try {
                    const setup = await organizerApi.getExistingSetup('dining');
                    if (setup.panName && isMounted) {
                        setFormData(prev => ({ ...prev, name: setup.panName || '' }));
                    }
                } catch (setupErr) {
                    // ignore setup fetch error
                }
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
    }, [session?.id, hasCheckedSession]);

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
            await fetch('/backend/api/organizer/send-otp', {
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
            const res = await fetch('/backend/api/organizer/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp })
            });
            if (res.ok) {
                setEmailVerified(true);
                setOtpSent(false);
                setSuccess('Email verified successfully');
                setOriginalEmail(formData.email);
            } else {
                throw new Error('Invalid OTP');
            }
        } catch (err: any) {
            setError(err.message || 'OTP verification failed');
        } finally {
            setVerifyingEmail(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;
        if (!emailVerified) {
            setError('Please verify your email first');
            return;
        }

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
            setTimeout(() => {
                setSuccess('');
                router.push('/organizer/profile');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setSaving(true);
        setSuccess('');
        setError('');
        
        try {
            // Upload photo using existing uploadPAN API (reusing for profile photo)
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/backend/api/organizer/upload-profile-photo', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload photo');
            }
            
            const data = await response.json();
            setFormData(prev => ({ ...prev, profilePhoto: data.url }));
            setSuccess('Profile photo uploaded successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload photo');
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

    const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'];
    const languages = ['English', 'Tamil', 'Hindi', 'Malayalam', 'Kannada', 'Telugu', 'French', 'Spanish'];
    const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-[family-name:var(--font-anek-latin)] py-8 px-4 md:px-8 pb-24">
            <div className="max-w-4xl mx-auto">
                {/* Navigation Header */}
                <div className="mb-8 flex items-center justify-between">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors font-semibold"
                    >
                        <ChevronLeft size={20} />
                        Back to Profile
                    </button>
                    <h1 className="text-2xl font-bold text-zinc-900">Edit Profile</h1>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* Profile Photo Section */}
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
                                className="absolute bottom-0 right-0 bg-[#5331EA] text-white p-2.5 rounded-full border-4 border-white shadow-lg hover:scale-110 transition-transform active:scale-95"
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
                            <h2 className="text-xl font-bold text-zinc-900">Profile Photo</h2>
                            <p className="text-zinc-500 text-sm max-w-xs">
                                Upload a clear professional photo. Recommended size: 400x400px.
                            </p>
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-8">
                        <div className="flex items-center gap-3 border-b border-zinc-100 pb-6">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <UserCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900">Basic Information</h3>
                                <p className="text-sm text-zinc-500">Your personal and contact details</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="John Doe"
                                        className="w-full h-14 pl-12 pr-5 rounded-[18px] border border-zinc-200 focus:border-[#5331EA] focus:ring-4 focus:ring-[#5331EA]/10 transition-all outline-none font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+91 98765 43210"
                                        className="w-full h-14 pl-12 pr-5 rounded-[18px] border border-zinc-200 focus:border-[#5331EA] focus:ring-4 focus:ring-[#5331EA]/10 transition-all outline-none font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1 flex justify-between">
                                    Email Address
                                    {emailVerified ? (
                                        <span className="text-green-600 flex items-center gap-1 text-xs uppercase tracking-wider">
                                            <CheckCircle2 size={12} /> Verified
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 flex items-center gap-1 text-xs uppercase tracking-wider">
                                            <AlertCircle size={12} /> Pending Verification
                                        </span>
                                    )}
                                </label>
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => handleEmailChange(e.target.value)}
                                            placeholder="john@example.com"
                                            className={`w-full h-14 pl-12 pr-5 rounded-[18px] border transition-all outline-none font-medium ${
                                                emailVerified ? 'border-zinc-200 bg-zinc-50' : 'border-amber-200 bg-amber-50/30'
                                            }`}
                                        />
                                    </div>
                                    {!emailVerified && !otpSent && (
                                        <button 
                                            type="button"
                                            onClick={handleSendOTP}
                                            disabled={verifyingEmail}
                                            className="h-14 px-8 rounded-[18px] bg-[#5331EA] text-white font-bold hover:bg-[#4325C7] transition-all disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {verifyingEmail ? 'Sending...' : 'Verify Email'}
                                        </button>
                                    )}
                                </div>

                                {otpSent && (
                                    <div className="mt-4 p-6 bg-[#5331EA]/5 rounded-[24px] border border-[#5331EA]/10 animate-in fade-in slide-in-from-top-4">
                                        <div className="flex flex-col md:flex-row items-center gap-4">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-[#5331EA] mb-2">Enter the 6-digit OTP sent to your email</p>
                                                <input 
                                                    type="text"
                                                    maxLength={6}
                                                    value={otp}
                                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                                    className="w-full h-12 px-5 text-center text-xl tracking-[1em] font-bold rounded-xl border-2 border-[#5331EA]/20 focus:border-[#5331EA] outline-none"
                                                    placeholder="000000"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={handleVerifyOTP}
                                                    className="h-12 px-6 rounded-xl bg-[#5331EA] text-white font-bold"
                                                >
                                                    Confirm
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setOtpSent(false)}
                                                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-600"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Date of Birth</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <input
                                        type="date"
                                        value={formData.dob}
                                        onChange={e => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                                        className="w-full h-14 pl-12 pr-5 rounded-[18px] border border-zinc-200 focus:border-[#5331EA] focus:ring-4 focus:ring-[#5331EA]/10 transition-all outline-none font-medium appearance-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Gender</label>
                                <select
                                    value={formData.gender}
                                    onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                    className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-[#5331EA] focus:ring-4 focus:ring-[#5331EA]/10 transition-all outline-none font-medium appearance-none bg-white"
                                >
                                    <option value="">Select Gender</option>
                                    {genders.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Address & Location */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-8">
                        <div className="flex items-center gap-3 border-b border-zinc-100 pb-6">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900">Address & Location</h3>
                                <p className="text-sm text-zinc-500">Enable location finding for better visibility</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">Street / House Details</label>
                                    <input
                                        type="text"
                                        value={formData.street}
                                        onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
                                        placeholder="Flat 102, Green Apartments"
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-[#5331EA] focus:ring-4 focus:ring-[#5331EA]/10 transition-all outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        placeholder="Chennai"
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-[#5331EA] focus:ring-4 focus:ring-[#5331EA]/10 transition-all outline-none font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Complete Address</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.address}
                                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Enter full address details here..."
                                    className="w-full p-5 rounded-[24px] border border-zinc-200 focus:border-[#5331EA] focus:ring-4 focus:ring-[#5331EA]/10 transition-all outline-none font-medium resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">Country</label>
                                    <select
                                        value={formData.country}
                                        onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-[#5331EA] outline-none font-medium appearance-none bg-white"
                                    >
                                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">State</label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                        placeholder="Tamil Nadu"
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-[#5331EA] outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">District</label>
                                    <input
                                        type="text"
                                        value={formData.district}
                                        onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
                                        placeholder="Chennai"
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-[#5331EA] outline-none font-medium"
                                    />
                                </div>
                            </div>

                            {/* GPS Map Pin Toggle */}
                            <div className="pt-4">
                                <button 
                                    type="button"
                                    onClick={() => toast.info('GPS Map integration coming soon')}
                                    className="w-full flex items-center justify-between p-6 bg-zinc-50 rounded-[28px] border border-dashed border-zinc-300 hover:bg-zinc-100 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm text-[#5331EA]">
                                            <Map size={24} />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-bold text-zinc-900 group-hover:text-[#5331EA] transition-colors">Select Location on Map</h4>
                                            <p className="text-sm text-zinc-500">Pick precise GPS coordinates for your location</p>
                                        </div>
                                    </div>
                                    <div className="text-[12px] font-bold bg-[#5331EA]/10 text-[#5331EA] px-3 py-1 rounded-full uppercase tracking-wider">
                                        Pin on Map
                                    </div>
                                </button>
                                {formData.gps && formData.gps.lat !== 0 && (
                                    <p className="mt-3 ml-2 text-xs font-bold text-zinc-400 flex items-center gap-1">
                                        <CheckCircle2 size={12} className="text-green-500" /> 
                                        Coordinates Set: {formData.gps.lat.toFixed(4)}, {formData.gps.lng.toFixed(4)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-8">
                        <div className="flex items-center gap-3 border-b border-zinc-100 pb-6">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900">App Preferences</h3>
                                <p className="text-sm text-zinc-500">How you'd like to use Ticpin</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-zinc-700 ml-1 flex items-center gap-2">
                                    <Languages size={18} className="text-zinc-400" /> Preferred Language
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {languages.slice(0, 4).map(lang => (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, preferredLanguage: lang }))}
                                            className={`h-12 rounded-xl font-bold transition-all border ${
                                                formData.preferredLanguage === lang 
                                                ? 'bg-[#5331EA] text-white border-[#5331EA] shadow-lg shadow-[#5331EA]/20' 
                                                : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                                            }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Notification Preferences</label>
                                <div className="space-y-3">
                                    {Object.entries(formData.notificationPreferences || {}).map(([key, val]) => (
                                        <label key={key} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl cursor-pointer hover:bg-zinc-100 transition-colors">
                                            <span className="font-bold text-zinc-700 capitalize">{key} Notifications</span>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={val}
                                                    onChange={() => setFormData(prev => ({
                                                        ...prev,
                                                        notificationPreferences: {
                                                            ...(prev.notificationPreferences || {email: true, push: true, sms: false}),
                                                            [key]: !val
                                                        }
                                                    }))}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5331EA]"></div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Messages */}
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-shake">
                            <AlertCircle size={20} /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-green-50 text-green-600 rounded-2xl text-sm font-bold border border-green-100 flex items-center gap-3 animate-in zoom-in-95">
                            <CheckCircle2 size={20} /> {success}
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-white/80 backdrop-blur-md border-t border-zinc-100 flex justify-center z-50">
                        <div className="max-w-4xl w-full flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 h-14 rounded-2xl font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-[2] h-14 rounded-2xl font-bold bg-[#5331EA] text-white shadow-xl shadow-[#5331EA]/30 hover:bg-[#4325C7] transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
                            >
                                {saving ? (
                                    <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={20} />
                                )}
                                Save Profile Changes
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            
            {/* Design accents */}
            <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-blue-400/5 blur-[120px] rounded-full" />
            <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-purple-400/5 blur-[120px] rounded-full" />
        </div>
    );
}

export default function EditOrganizerProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <EditProfileContent />
        </Suspense>
    );
}
