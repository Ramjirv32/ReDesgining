import { create } from 'zustand';
import { UserSession, getUserSession, saveUserSession, clearUserSession } from '@/lib/auth/user';
import { OrganizerSession, getOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';

interface IdentityState {
    userSession: UserSession | null;
    organizerSession: OrganizerSession | null;
    isLoading: boolean;

    // Actions
    sync: () => void;
    loginUser: (session: UserSession) => void;
    logoutUser: () => void;
    logoutOrganizer: () => void;
}

export const useIdentityStore = create<IdentityState>((set) => ({
    userSession: null,
    organizerSession: null,
    isLoading: true,

    sync: () => {
        set({
            userSession: getUserSession(),
            organizerSession: getOrganizerSession(),
            isLoading: false
        });
    },

    loginUser: (session) => {
        saveUserSession(session);
        set({ userSession: session, organizerSession: null }); // Typical: login as user clears organizer
    },

    logoutUser: () => {
        clearUserSession();
        set({ userSession: null });
    },

    logoutOrganizer: () => {
        clearOrganizerSession();
        set({ organizerSession: null });
    }
}));
