'use client';

/**
 * Storage utility with proper security classification:
 * - Cookies: Important/sensitive data (user session, auth tokens)
 * - sessionStorage: Temporary payment flow data (cleared on tab close)
 * - localStorage: Non-sensitive app data (location, preferences, drafts)
 */

const COOKIE_OPTIONS = '; path=/; SameSite=Lax';
const SECURE_COOKIE_OPTIONS = '; path=/; SameSite=Strict; Secure';

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    return match ? match[1] : null;
}

export function setCookie(name: string, value: string, days: number, secure = false): void {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    const options = secure ? SECURE_COOKIE_OPTIONS : COOKIE_OPTIONS;
    document.cookie = `${name}=${value}; Max-Age=${maxAge}${options}`;
}

export function deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; Max-Age=-1${COOKIE_OPTIONS}`;
}

export const storage = {
    // ─── COOKIES: Important/Sensitive data ─────────────────────────
    // Use for: user session, auth tokens, security-related data
    
    getCookie,
    
    setCookie: (name: string, value: string, days: number) => setCookie(name, value, days, true),
    
    getSecureCookie: (name: string) => getCookie(name),
    
    setSecureCookie: (name: string, value: string, days: number) => setCookie(name, value, days, true),

    // ─── sessionStorage: Temporary payment flow data ───────────────
    // Use for: pending payment data, checkout state (cleared when tab closes)
    
    getSession: (key: string): string | null => {
        if (typeof window === 'undefined') return null;
        return sessionStorage.getItem(key);
    },
    
    setSession: (key: string, value: string): void => {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem(key, value);
    },
    
    removeSession: (key: string): void => {
        if (typeof window === 'undefined') return;
        sessionStorage.removeItem(key);
    },

    // ─── localStorage: Non-sensitive app data ──────────────────────
    // Use for: location, preferences, drafts, UI state
    
    getLocal: (key: string): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(key);
    },
    
    setLocal: (key: string, value: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, value);
    },
    
    removeLocal: (key: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
    },
};
