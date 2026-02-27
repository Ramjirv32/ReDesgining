// ─── Organizer Session ────────────────────────────────────────────
// Session is stored in TWO cookies set by the backend on VerifyOTP:
//   ticpin_token   — HttpOnly JWT (not readable by JS, protects against XSS)
//   ticpin_session — base64 JSON  (readable by JS for UI; non-sensitive identity info)
//
// The frontend reads/writes ticpin_session for UI state.
// clearOrganizerSession() calls the logout endpoint to clear the HttpOnly cookie too.

export interface OrganizerSession {
  id: string;
  email: string;
  /** 'dining' | 'events' | 'play' | 'admin' */
  vertical: string;
  isAdmin: boolean;
  /** Per-category status: "pending" | "approved" | "rejected" */
  categoryStatus?: Record<string, string>;
}

// ── Cookie helpers ─────────────────────────────────────────────────

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

// ── Public API ─────────────────────────────────────────────────────

/** Read session from ticpin_session cookie (set by backend or saveOrganizerSession). */
export function getOrganizerSession(): OrganizerSession | null {
  const raw = getCookieRaw('ticpin_session');
  if (!raw) return null;
  try {
    // Backend uses base64.StdEncoding; atob handles standard base64
    const json = atob(raw);
    return JSON.parse(json) as OrganizerSession;
  } catch {
    return null;
  }
}

/**
 * Write the session info cookie.
 * Called by OTP pages after verifyOTP (backend also sets it, but we need the
 * organizer-auth-change event to fire so Navbar re-renders immediately).
 */
export function saveOrganizerSession(session: OrganizerSession): void {
  if (typeof window === 'undefined') return;
  const encoded = btoa(JSON.stringify(session));
  setCookieRaw('ticpin_session', encoded, 7);
  window.dispatchEvent(new Event('organizer-auth-change'));
}

/** Clear both cookies and sessionStorage. Fires backend logout to clear HttpOnly cookie. */
export function clearOrganizerSession(): void {
  if (typeof window === 'undefined') return;
  // Fire-and-forget — clears the HttpOnly ticpin_token on the server
  fetch('/backend/api/organizer/logout', { method: 'POST', credentials: 'include' }).catch(() => { });
  deleteCookie('ticpin_session');
  deleteCookie('ticpin_token');
  // Wipe all multi-step setup form data
  const setupKeys = [
    'setup_dining', 'setup_events', 'setup_play',
    'setup_dining_KEY', 'setup_events_KEY', 'setup_play_KEY',
  ];
  setupKeys.forEach(k => sessionStorage.removeItem(k));
  window.dispatchEvent(new Event('organizer-auth-change'));
}

/** Updates a single category status inside the stored session cookie */
export function updateSessionCategoryStatus(category: string, status: string): void {
  const session = getOrganizerSession();
  if (!session) return;
  saveOrganizerSession({
    ...session,
    categoryStatus: { ...(session.categoryStatus ?? {}), [category]: status },
  });
}
