'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Sub-components
import LoginView from '@/components/modals/auth/LoginView';
import ProfileHeader from '@/components/modals/auth/ProfileHeader';
import ProfileInfo from '@/components/modals/auth/ProfileInfo';
import TicPassCard from '@/components/modals/auth/TicPassCard';
import RecentBookings from '@/components/modals/auth/RecentBookings';
import MenuGrid from '@/components/modals/auth/MenuGrid';

import { useIdentityStore } from '@/store/useIdentityStore';
import { useProfile, useUpdateProfile, useUploadPhoto } from '@/lib/hooks/useProfile';
import { useUserBookings, useCancelBooking } from '@/lib/hooks/useBookings';
import { getOrganizerSession } from '@/lib/auth/organizer';



interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialView?: 'number' | 'otp' | 'profile' | 'location' | 'bookings';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialView = 'number' }: AuthModalProps) {
    const router = useRouter();
    const { userSession, loginUser, logoutUser } = useIdentityStore();

    const [view, setView] = useState<'number' | 'otp' | 'profile' | 'location' | 'bookings'>(initialView);
    const [number, setNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    
    // TanStack Query Hooks
    const { data: profile, isLoading: isProfileLoading } = useProfile(userSession?.id);
    const { data: bookings = [], isLoading: bookingsLoading } = useUserBookings(profile?.email, userSession?.phone, userSession?.id);
    const updateProfileMutation = useUpdateProfile();
    const uploadPhotoMutation = useUploadPhoto();
    const cancelBookingMutation = useCancelBooking();

    // Pass state (Keeping as local for now, can move to query later)
    const [pass, setPass] = useState<any>(null);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedEmail, setEditedEmail] = useState('');
    const [activeTab, setActiveTab] = useState<'events' | 'dining' | 'play'>('events');

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const photoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            const organizer = getOrganizerSession();
            if (!userSession && !organizer && (initialView === 'profile' || initialView === 'bookings')) {
                setView('number');
            } else {
                setView(initialView);
            }
        }
    }, [isOpen, initialView, userSession]);

    useEffect(() => {
        if (profile) {
            setEditedName(profile.name || '');
            setEditedEmail(profile.email || '');
        }
    }, [profile]);

    // Fetch pass manually for now
    useEffect(() => {
        if (userSession?.id && (view === 'profile')) {
            fetch(`/backend/api/pass/user/${userSession.id}`, { credentials: 'include' })
                .then(r => r.ok ? r.json() : null)
                .then(d => setPass(d));
        }
    }, [userSession?.id, view]);

    const handleUpdateProfile = async () => {
        if (!userSession?.id) return;
        updateProfileMutation.mutate({
            userId: userSession.id,
            data: { name: editedName, email: editedEmail }
        }, {
            onSuccess: () => setIsEditingProfile(false)
        });
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userSession?.id) return;
        uploadPhotoMutation.mutate({ userId: userSession.id, file });
    };

    const handleCancelBooking = (id: string, category: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        cancelBookingMutation.mutate({ id, category });
    };

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (number.length !== 10) {
            setError('Please enter a valid 10-digit number');
            return;
        }
        setLoading(true);
        setError('');

        setTimeout(() => {
            setLoading(false);
            setView('otp');
        }, 1000);
    };

    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === 'Enter') handleOtpSubmit();
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!data) return;
        const next = [...otp];
        data.split('').forEach((char, i) => { next[i] = char; });
        setOtp(next);
        otpRefs.current[Math.min(data.length, 5)]?.focus();
    };

    const handleOtpSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/backend/api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ phone: number }),
            });
            
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Login failed');
                setLoading(false);
                return;
            }
            
            loginUser({ id: data.id || data._id || number, phone: number, name: data.name || '' });

            if (onSuccess) {
                onClose();
                onSuccess();
            } else {
                setView('profile');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;
    const organizerSession = getOrganizerSession();
    const isAdmin = organizerSession?.isAdmin === true;

    return (
        <div
            className={`fixed inset-0 z-[10000] flex transition-all duration-500 ${view === 'profile' || view === 'bookings' ? 'justify-end pointer-events-none' : 'items-center justify-center p-4'}`}
            style={{ fontFamily: 'var(--font-anek-latin)' }}
        >
            <div onClick={onClose} className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`} />

            <div
                className={`bg-white relative shadow-2xl transition-all duration-500 flex flex-col pointer-events-auto z-10 overflow-hidden ${view === 'profile' || view === 'bookings'
                    ? 'h-full w-full max-w-[750px] rounded-l-[60px] translate-x-0'
                    : 'rounded-[35px] animate-in zoom-in duration-300'
                    }`}
                style={view !== 'profile' && view !== 'bookings' ? { width: '850px', height: '700px' } : {}}
            >
                {view === 'number' || view === 'otp' ? (
                    <LoginView
                        view={view} number={number} setNumber={setNumber} otp={otp}
                        handleOtpChange={handleOtpChange} handleKeyDown={handleKeyDown} handleOtpPaste={handleOtpPaste}
                        otpRefs={otpRefs} loading={loading} error={error}
                        handleSendOtp={handleLogin} handleVerifyOtp={handleOtpSubmit} handleResend={handleLogin}
                        onClose={onClose}
                        onNumberChange={() => { setView('number'); setOtp(['', '', '', '', '', '']); setError(''); }}
                    />
                ) : (
                    <div className="min-h-full flex flex-col bg-[#F6F6F6] animate-in slide-in-from-right duration-500">
                        {showLogoutConfirm && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-6 animate-in fade-in duration-200">
                                <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center text-center space-y-8 animate-in zoom-in duration-300">
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                                        <Loader2 size={40} className="rotate-90" />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl text-zinc-900 font-bold">Log Out?</h3>
                                        <p className="text-zinc-500 font-medium">Are you sure you want to log out of your account?</p>
                                    </div>
                                    <div className="flex gap-4 w-full">
                                        <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-bold">Cancel</button>
                                        <button
                                            onClick={() => { setShowLogoutConfirm(false); logoutUser(); setView('number'); setNumber(''); setOtp(['', '', '', '', '', '']); }}
                                            className="flex-1 py-4 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/30 font-bold"
                                        >
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <ProfileHeader
                            title={view === 'bookings' ? 'My Bookings' : 'Profile'}
                            onBack={() => setView('profile')}
                            showBackButton={view === 'bookings'}
                            onClose={onClose}
                        />

                        <div className="flex-1 px-8 py-8 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
                            {view === 'profile' ? (
                                <>
                                    <ProfileInfo
                                        profile={profile ?? null} isAdmin={isAdmin} userPhone={userSession?.phone || ''}
                                        isEditing={isEditingProfile} editedName={editedName} editedEmail={editedEmail}
                                        updating={updateProfileMutation.isPending || uploadPhotoMutation.isPending}
                                        setEditedName={setEditedName} setEditedEmail={setEditedEmail}
                                        setIsEditing={setIsEditingProfile} handleUpdate={handleUpdateProfile}
                                        handlePhotoUpload={handlePhotoUpload} photoInputRef={photoInputRef}
                                    />
                                    {pass && <TicPassCard pass={pass} onClose={onClose} />}
                                    <MenuGrid
                                        isAdmin={isAdmin} isOrganizer={!!organizerSession}
                                        onViewBookings={() => { router.push('/profile/bookings/events'); onClose(); }}
                                        onViewDiningBookings={() => { router.push('/profile/bookings/dining'); onClose(); }}
                                        onViewEventTickets={() => { router.push('/profile/bookings/events'); onClose(); }}
                                        onViewPlayBookings={() => { router.push('/profile/bookings/play'); onClose(); }}
                                        onEditProfile={() => { 
    if (userSession?.id) { 
        router.push('/profile/edit'); 
        onClose(); 
    } else if (organizerSession?.id) {
        router.push('/organizer/profile/edit');
        onClose();
    }
} }
                                        onLogout={() => setShowLogoutConfirm(true)}
                                        onClose={onClose}
                                    />
                                </>
                            ) : (
                                <RecentBookings
                                    bookings={bookings} loading={bookingsLoading} activeTab={activeTab} setActiveTab={setActiveTab}
                                    hasProfileDetails={!!(profile?.email || userSession?.phone)}
                                    handleCancel={handleCancelBooking} onClose={onClose}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
