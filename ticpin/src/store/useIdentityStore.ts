import { create } from 'zustand';
import { UserSession, getUserSession, saveUserSession, clearUserSession } from '@/lib/auth/user';
import { OrganizerSession, getOrganizerSession, saveOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';

interface IdentityState {
    userSession: UserSession | null;
    organizerSession: OrganizerSession | null;
    isLoading: boolean;

    // Actions
    sync: () => void;
    loginUser: (session: UserSession) => void;
    loginOrganizer: (session: OrganizerSession) => void;
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

    loginOrganizer: (session) => {
        saveOrganizerSession(session);
        set({ organizerSession: session, userSession: null }); // Typical: login as org clears user
    },

    logoutUser: () => {
        clearUserSession();
        set({ userSession: null });
    },

    logoutOrganizer: () => {
        clearOrganizerSession(); // this calls backend logout + clears cookies + sessionStorage keys
        set({ organizerSession: null, userSession: null });
    }
}));
