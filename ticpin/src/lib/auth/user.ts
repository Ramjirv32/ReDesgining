import { useState, useEffect } from 'react';

// ─── User Session ──────────────────────────────────────────────────

export interface UserSession {
    id: string;
    phone: string;
    name?: string;
}

function getCookieRaw(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(
        new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
    );
    return match ? match[1] : null;
}

function setCookieRaw(name: string, value: string, days: number) {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value}; path=/; SameSite=Lax; Max-Age=${maxAge}`;
}

function deleteCookie(name: string) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; path=/; SameSite=Lax; Max-Age=-1`;
}

/** Read user session from ticpin_user_session cookie */
export function getUserSession(): UserSession | null {
    const raw = getCookieRaw('ticpin_user_session');
    if (!raw) return null;
    try {
        const json = atob(raw);
        return JSON.parse(json) as UserSession;
    } catch {
        return null;
    }
}

/** Save user session to cookie */
export function saveUserSession(session: UserSession): void {
    if (typeof window === 'undefined') return;
    const encoded = btoa(JSON.stringify(session));
    setCookieRaw('ticpin_user_session', encoded, 30);
    window.dispatchEvent(new Event('user-auth-change'));
}

/** Clear user session */
export function clearUserSession(): void {
    if (typeof window === 'undefined') return;
    deleteCookie('ticpin_user_session');
    window.dispatchEvent(new Event('user-auth-change'));
}

/** React hook to get and track user session */
export function useUserSession() {
    const [session, setSession] = useState<UserSession | null>(null);

    useEffect(() => {
        const load = () => setSession(getUserSession());
        load();
        window.addEventListener('user-auth-change', load);
        return () => window.removeEventListener('user-auth-change', load);
    }, []);

    return session;
}
