import React from 'react';
import Image from 'next/image';
import { Camera, Loader2, Edit2, User } from 'lucide-react';
import { UserProfile } from '@/lib/api/profile';

interface ProfileInfoProps {
    profile: UserProfile | null;
    isAdmin: boolean;
    userPhone: string;
    isEditing: boolean;
    editedName: string;
    editedEmail: string;
    updating: boolean;
    setEditedName: (val: string) => void;
    setEditedEmail: (val: string) => void;
    setIsEditing: (val: boolean) => void;
    handleUpdate: () => void;
    handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    photoInputRef: React.RefObject<HTMLInputElement | null>;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
    profile,
    isAdmin,
    userPhone,
    isEditing,
    editedName,
    editedEmail,
    updating,
    setEditedName,
    setEditedEmail,
    setIsEditing,
    handleUpdate,
    handlePhotoUpload,
    photoInputRef
}) => {
    return (
        <div className="flex items-center gap-6 px-2 py-4 relative group">
            <div className="relative w-24 h-24 shrink-0">
                <div className="w-full h-full bg-zinc-200 rounded-full overflow-hidden flex items-center justify-center border-4 border-white shadow-lg">
                    {profile?.profilePhoto ? (
                        <Image src={profile.profilePhoto} alt="Profile" fill className="object-cover" />
                    ) : (
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    )}
                </div>
                <button
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
                >
                    <Camera size={14} />
                </button>
                <input
                    type="file"
                    ref={photoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                />
                {updating && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center rounded-full z-20">
                        <Loader2 size={24} className="animate-spin text-black" />
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-1">
                {isEditing ? (
                    <div className="space-y-4">
                        <input
                            autoFocus
                            type="text"
                            value={editedName}
                            onChange={e => setEditedName(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black text-xl font-bold"
                            placeholder="Enter full name"
                        />
                        <input
                            type="email"
                            value={editedEmail}
                            onChange={e => setEditedEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black text-sm"
                            placeholder="Enter email address"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleUpdate}
                                disabled={updating}
                                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold disabled:opacity-50"
                            >
                                {updating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <h4
                                style={{ fontSize: '36px', fontWeight: 500, lineHeight: '100%', fontFamily: 'var(--font-anek-latin)' }}
                                className="text-zinc-900"
                            >
                                {profile?.name || (isAdmin ? 'Admin' : 'Member')}
                            </h4>
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setEditedName(profile?.name || '');
                                    setEditedEmail(profile?.email || '');
                                }}
                                className="p-2 text-zinc-400 hover:text-black transition-colors"
                            >
                                <Edit2 size={18} />
                            </button>
                        </div>
                        <p className="text-lg text-zinc-500 font-medium tracking-tight uppercase">
                            {userPhone ? `+91 ${userPhone}` : '{ NUMBER }'}
                        </p>
                        {profile?.email && (
                            <p className="text-sm text-zinc-400 font-medium">{profile.email}</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfileInfo;
