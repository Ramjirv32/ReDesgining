'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useUserSession, saveUserSession, clearUserSession } from '@/lib/auth/user';
import { profileApi, type UserProfile } from '@/lib/api/profile';
import { bookingApi } from '@/lib/api/booking';

// Sub-components
import LoginView from '@/components/modals/auth/LoginView';
import ProfileHeader from '@/components/modals/auth/ProfileHeader';
import ProfileInfo from '@/components/modals/auth/ProfileInfo';
import TicPassCard from '@/components/modals/auth/TicPassCard';
import RecentBookings from '@/components/modals/auth/RecentBookings';
import MenuGrid from '@/components/modals/auth/MenuGrid';

const ADMIN_PHONE = '6383667872';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialView?: 'number' | 'otp' | 'profile' | 'location' | 'bookings';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialView = 'number' }: AuthModalProps) {
    const router = useRouter();
    const userSession = useUserSession();

    const [view, setView] = useState<'number' | 'otp' | 'profile' | 'location' | 'bookings'>(initialView);
    const [number, setNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    // Profile state
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedEmail, setEditedEmail] = useState('');
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // Bookings state
    const [bookings, setBookings] = useState<any[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'events' | 'dining' | 'play'>('events');

    // Pass state
    const [pass, setPass] = useState<any>(null);
    const [passLoading, setPassLoading] = useState(false);

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setView(initialView);
        }
    }, [isOpen, initialView]);

    // Fetch profile, bookings, and pass when needed
    useEffect(() => {
        if (isOpen && (view === 'profile' || view === 'bookings') && userSession?.id) {
            fetchProfile();
            fetchPass();
            fetchBookings();
        }
    }, [isOpen, view, userSession?.id, profile?.email]);

    const fetchProfile = async () => {
        if (!userSession?.id) return;
        const p = await profileApi.getProfile(userSession.id);
        if (p) {
            setProfile(p);
            setEditedName(p.name || '');
            setEditedEmail(p.email || '');
            saveUserSession({ ...userSession, name: p.name, profilePhoto: p.profilePhoto });
        } else {
            const newP = { userId: userSession.id, phone: userSession.phone, name: userSession.name || 'Member' };
            try {
                const created = await profileApi.createProfile(newP);
                setProfile(created);
                setEditedName(created.name);
            } catch (e) {
                console.error('Profile creation failed:', e);
            }
        }
    };

    const handleUpdateProfile = async () => {
        if (!userSession?.id) return;
        setUpdatingProfile(true);
        try {
            const updated = await profileApi.updateProfile(userSession.id, {
                name: editedName,
                email: editedEmail
            });
            setProfile(updated);
            saveUserSession({ ...userSession, name: updated.name, profilePhoto: updated.profilePhoto });
            setIsEditingProfile(false);
        } catch {
            setError('Failed to update profile');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userSession?.id) return;

        setUpdatingProfile(true);
        try {
            const { url } = await profileApi.uploadPhoto(userSession.id, file);
            setProfile(prev => prev ? { ...prev, profilePhoto: url } : null);
            saveUserSession({ ...userSession, profilePhoto: url });
        } catch {
            setError('Failed to upload photo');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const fetchBookings = async () => {
        const identifier = profile?.email || userSession?.phone;
        if (!userSession?.id || !identifier) return;
        setBookingsLoading(true);
        try {
            const data = await bookingApi.getUserBookings(identifier);
            setBookings(data || []);
        } catch (e) {
            console.error('Failed to fetch bookings:', e);
        } finally {
            setBookingsLoading(false);
        }
    };

    const handleCancelBooking = async (id: string, category: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await bookingApi.cancelBooking(id, category);
            fetchBookings();
        } catch (e: any) {
            alert(e.message || 'Failed to cancel booking');
        }
    };

    const fetchPass = async () => {
        if (!userSession?.id) return;
        setPassLoading(true);
        try {
            const res = await fetch(`/backend/api/pass/user/${userSession.id}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setPass(data);
            }
        } catch (e) {
            console.error('Failed to fetch pass:', e);
        } finally {
            setPassLoading(false);
        }
    };

    useEffect(() => {
        const identifier = profile?.email || userSession?.phone;
        if (view === 'bookings' && identifier) {
            fetchBookings();
        }
    }, [view, profile?.email, userSession?.phone]);

    useEffect(() => {
        if (view === 'otp') otpRefs.current[0]?.focus();
    }, [view]);

    const setupRecaptcha = () => {
        if (recaptchaVerifierRef.current) return;
        recaptchaVerifierRef.current = new RecaptchaVerifier((window as any).firebaseAuth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => { }
        });
    };
    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        const isAdminUser = number === ADMIN_PHONE;
        if (isAdminUser) {
            saveUserSession({ id: number, phone: number, name: 'Admin' });
            router.push('/admin');
            onClose();
            setLoading(false);
            return;
        }
        try {
            setupRecaptcha();
            const res = await fetch('/backend/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ phone: number })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            const verifier = recaptchaVerifierRef.current;
            if (!verifier) throw new Error('Recaptcha failed');
            const result = await signInWithPhoneNumber((window as any).firebaseAuth, `+91${number}`, verifier);
            setConfirmationResult(result);
            setView('otp');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
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
        if (!confirmationResult) { setError('Please request OTP first'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await confirmationResult.confirm(otp.join(''));
            const user = res.user;
            saveUserSession({ id: user.uid, phone: number, name: '' });
            if (onSuccess) {
                onClose();
                onSuccess();
            } else {
                setView('profile');
            }
        } catch {
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isAdmin = userSession?.phone === ADMIN_PHONE;

    return (
        <div
            className={`fixed inset-0 z-[10000] flex transition-all duration-500 ${view === 'profile' || view === 'bookings' ? 'justify-end pointer-events-none' : 'items-center justify-center p-4'
                }`}
            style={{ fontFamily: 'var(--font-anek-latin)' }}
        >
            {/* Invisible recaptcha anchor */}
            <div id="recaptcha-container" />

            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
            />

            <div
                className={`bg-white relative shadow-2xl transition-all duration-500 flex flex-col pointer-events-auto z-10 overflow-hidden ${view === 'profile' || view === 'bookings'
                    ? 'h-full w-full max-w-[750px] rounded-l-[60px] translate-x-0'
                    : 'rounded-[35px] animate-in zoom-in duration-300'
                    }`}
                style={view !== 'profile' && view !== 'bookings' ? { width: '850px', height: '700px' } : {}}
            >
                {view === 'number' || view === 'otp' ? (
                    <LoginView
                        view={view}
                        number={number}
                        setNumber={setNumber}
                        otp={otp}
                        handleOtpChange={handleOtpChange}
                        handleKeyDown={handleKeyDown}
                        handleOtpPaste={handleOtpPaste}
                        otpRefs={otpRefs}
                        loading={loading}
                        error={error}
                        handleSendOtp={handleLogin}
                        handleVerifyOtp={handleOtpSubmit}
                        handleResend={handleLogin}
                        onClose={onClose}
                        onNumberChange={() => { setView('number'); setOtp(['', '', '', '', '', '']); setError(''); }}
                    />
                ) : (
                    <div className="min-h-full flex flex-col bg-[#F6F6F6] animate-in slide-in-from-right duration-500">
                        {showLogoutConfirm && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-6 animate-in fade-in duration-200">
                                <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center text-center space-y-8 animate-in zoom-in duration-300">
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                                        <Loader2 size={40} className="rotate-90" /> {/* Using Loader2 as a placeholder for LogOut icon */}
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl text-zinc-900 font-bold">Log Out?</h3>
                                        <p className="text-zinc-500 font-medium">Are you sure you want to log out of your account?</p>
                                    </div>
                                    <div className="flex gap-4 w-full">
                                        <button
                                            onClick={() => setShowLogoutConfirm(false)}
                                            className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl hover:bg-zinc-200 transition-colors font-bold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowLogoutConfirm(false);
                                                clearUserSession();
                                                setView('number');
                                                setNumber('');
                                                setOtp(['', '', '', '', '', '']);
                                            }}
                                            className="flex-1 py-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 font-bold"
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
                                        profile={profile}
                                        isAdmin={isAdmin}
                                        userPhone={userSession?.phone || ''}
                                        isEditing={isEditingProfile}
                                        editedName={editedName}
                                        editedEmail={editedEmail}
                                        updating={updatingProfile}
                                        setEditedName={setEditedName}
                                        setEditedEmail={setEditedEmail}
                                        setIsEditing={setIsEditingProfile}
                                        handleUpdate={handleUpdateProfile}
                                        handlePhotoUpload={handlePhotoUpload}
                                        photoInputRef={photoInputRef}
                                    />

                                    {pass && <TicPassCard pass={pass} onClose={onClose} />}

                                    <MenuGrid
                                        isAdmin={isAdmin}
                                        onViewBookings={() => setView('bookings')}
                                        onLogout={() => setShowLogoutConfirm(true)}
                                        onClose={onClose}
                                    />
                                </>
                            ) : (
                                <RecentBookings
                                    bookings={bookings}
                                    loading={bookingsLoading}
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    hasProfileDetails={!!(profile?.email || userSession?.phone)}
                                    handleCancel={handleCancelBooking}
                                    onClose={onClose}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
