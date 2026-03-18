import { getOrganizerSession, clearOrganizerSession } from './organizer';
import { OrganizerSession } from './organizer';
import { clearAllData } from './clearAll';

export interface AdminSession extends OrganizerSession {
    isAdmin: true;
}

// Admin uses same session as organizer with isAdmin flag
export function getAdminSession(): AdminSession | null {
    const session = getOrganizerSession();
    return session?.isAdmin ? session as AdminSession : null;
}

// Admin logout uses same clear function as organizer
export function clearAdminSession(): void {
    // Call backend logout first
    fetch('/backend/api/organizer/logout', { method: 'POST', credentials: 'include' }).catch(() => { });
    
    // Clear everything
    clearAllData();
}
