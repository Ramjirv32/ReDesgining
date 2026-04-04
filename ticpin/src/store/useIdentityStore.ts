import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSession, getUserSession, saveUserSession, clearUserSession } from '@/lib/auth/user';
import { OrganizerSession, getOrganizerSession, saveOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';

export interface BillingDetails {
    name: string;
    phone: string;
    nationality: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
}

interface IdentityState {
    userSession: UserSession | null;
    organizerSession: OrganizerSession | null;
    isLoading: boolean;
    rememberedEmail: string;
    rememberedBilling: BillingDetails | null;

    // Actions
    sync: () => void;
    setRememberedEmail: (email: string) => void;
    setRememberedBilling: (billing: BillingDetails) => void;
    loginUser: (session: UserSession) => void;
    loginOrganizer: (session: OrganizerSession) => void;
    logoutUser: () => void;
    logoutOrganizer: () => void;
}

export const useIdentityStore = create<IdentityState>()(
    persist(
        (set) => ({
            rememberedEmail: '',
            rememberedBilling: null,
            setRememberedEmail: (email) => set({ rememberedEmail: email }),
            setRememberedBilling: (billing) => set({ rememberedBilling: billing }),
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
        }),
        {
            name: 'identity-storage',
            partialize: (state) => ({ rememberedEmail: state.rememberedEmail, rememberedBilling: state.rememberedBilling }),
        }
    )
);
