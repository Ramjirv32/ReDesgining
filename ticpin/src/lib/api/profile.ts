import { UserSession } from "@/lib/auth/user";

const BASE = '/backend/api';

export interface UserProfile {
    id?: string;
    userId: string;
    phone: string;
    name: string;
    address?: string;
    country?: string;
    state?: string;
    district?: string;
    profilePhoto?: string;
    email?: string;
}

export const profileApi = {
    getProfile: async (userId: string): Promise<UserProfile | null> => {
        try {
            const res = await fetch(`${BASE}/profiles/${userId}`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            return null;
        }
    },

    updateProfile: async (userId: string, profile: Partial<UserProfile>): Promise<UserProfile> => {
        const res = await fetch(`${BASE}/profiles/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(profile)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update profile');
        return data as UserProfile;
    },

    createProfile: async (profile: UserProfile): Promise<UserProfile> => {
        const res = await fetch(`${BASE}/profiles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(profile)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create profile');
        return data as UserProfile;
    },

    uploadPhoto: async (userId: string, file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('photo', file);

        const res = await fetch(`${BASE}/profiles/${userId}/photo`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload photo');
        return data as { url: string };
    }
};
