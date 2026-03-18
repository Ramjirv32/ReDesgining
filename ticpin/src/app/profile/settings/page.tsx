'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserSession } from '@/lib/auth/user';
import { ChevronLeft, Save, Camera } from 'lucide-react';
import Image from 'next/image';

export default function ProfileSettings() {
    const router = useRouter();
    const session = useUserSession();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        profilePhoto: ''
    });

    useEffect(() => {
        if (session) {
            setFormData({
                name: session.name || '',
                phone: session.phone || '',
                email: session.email || '',
                profilePhoto: session.profilePhoto || ''
            });
        }
    }, [session]);

    const handleSave = async () => {
        if (!session) return;
        
        setLoading(true);
        setMessage('');
        
        try {
            const response = await fetch('/backend/api/profiles/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }
            
            // Update local session
            const updatedSession = { ...session, ...formData };
            // Note: You'll need to implement updateSession in auth/user.ts
            
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/backend/api/profiles/photo', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload photo');
            }
            
            const data = await response.json();
            setFormData(prev => ({ ...prev, profilePhoto: data.url }));
        } catch (error) {
            setMessage('Failed to upload photo');
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-[#F1F1F1] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please Login</h1>
                    <button 
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-[#866BFF] text-white rounded-lg"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F1F1] font-sans" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
            <header className="bg-white px-4 py-4 flex items-center gap-4 border-b">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100"
                >
                    <ChevronLeft size={20} className="text-black" />
                </button>
                <h1 className="text-xl font-medium">Account Settings</h1>
            </header>

            <div className="p-4 max-w-md mx-auto">
                {message && (
                    <div className={`p-3 rounded-lg mb-4 text-center ${
                        message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {message}
                    </div>
                )}

                {/* Profile Photo */}
                <div className="bg-white rounded-xl p-6 mb-4">
                    <h2 className="text-lg font-medium mb-4">Profile Photo</h2>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                                {formData.profilePhoto ? (
                                    <Image src={formData.profilePhoto} alt="Profile" width={80} height={80} className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-[#866BFF] flex items-center justify-center text-white text-2xl font-bold">
                                        {formData.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#866BFF] rounded-full flex items-center justify-center cursor-pointer">
                                <Camera size={16} className="text-white" />
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Click camera to change photo</p>
                            <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-xl p-6 mb-4">
                    <h2 className="text-lg font-medium mb-4">Personal Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#866BFF]"
                                placeholder="Your name"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#866BFF]"
                                placeholder="Your phone number"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                placeholder="Your email"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-[#866BFF] text-white py-4 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Save size={20} />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
