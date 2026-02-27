// Base URL — all API calls go through Next.js rewrite proxy to localhost:9000
const BASE = '/backend/api';

// ─── Storage helpers ──────────────────────────────────────────────
export const saveAuth = (organizerId: string, email: string, vertical: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('organizerId', organizerId);
  localStorage.setItem('organizerEmail', email);
  localStorage.setItem('organizerVertical', vertical);
};

export const getOrganizerId = (): string =>
  typeof window !== 'undefined' ? localStorage.getItem('organizerId') ?? '' : '';

export const getOrganizerEmail = (): string =>
  typeof window !== 'undefined' ? localStorage.getItem('organizerEmail') ?? '' : '';

export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('organizerId');
  localStorage.removeItem('organizerEmail');
  localStorage.removeItem('organizerVertical');
};

// ─── Generic fetch wrapper ─────────────────────────────────────────
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
  return data as T;
}

// ─── Auth – shared shape ───────────────────────────────────────────
export interface LoginResponse {
  message: string;
  organizerId: string;
}

export interface VerifyResponse {
  id: string;
  email: string;
  [key: string]: unknown;
}

// ─── Dining ───────────────────────────────────────────────────────
export const diningApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/organizer/dining/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyOTP: (email: string, otp: string) =>
    request<VerifyResponse>('/organizer/dining/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  submitVerification: (payload: Record<string, unknown>) =>
    request('/organizer/dining/submit-verification', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  create: (payload: Record<string, unknown>) =>
    request('/organizer/dining/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  list: (organizerId: string) =>
    request(`/organizer/dining/${organizerId}/list`),

  update: (id: string, organizerId: string, payload: Record<string, unknown>) =>
    request(`/organizer/dining/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ organizer_id: organizerId, ...payload }),
    }),

  delete: (id: string, organizerId: string) =>
    request(`/organizer/dining/${id}?organizer_id=${organizerId}`, {
      method: 'DELETE',
    }),
};

// ─── Events ───────────────────────────────────────────────────────
export const eventsApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/organizer/events/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyOTP: (email: string, otp: string) =>
    request<VerifyResponse>('/organizer/events/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  submitVerification: (payload: Record<string, unknown>) =>
    request('/organizer/events/submit-verification', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  create: (payload: Record<string, unknown>) =>
    request('/organizer/events/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  list: (organizerId: string) =>
    request(`/organizer/events/${organizerId}/list`),

  update: (id: string, organizerId: string, payload: Record<string, unknown>) =>
    request(`/organizer/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ organizer_id: organizerId, ...payload }),
    }),

  delete: (id: string, organizerId: string) =>
    request(`/organizer/events/${id}?organizer_id=${organizerId}`, {
      method: 'DELETE',
    }),
};

// ─── Play ─────────────────────────────────────────────────────────
export const playApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/organizer/play/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyOTP: (email: string, otp: string) =>
    request<VerifyResponse>('/organizer/play/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  submitVerification: (payload: Record<string, unknown>) =>
    request('/organizer/play/submit-verification', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  create: (payload: Record<string, unknown>) =>
    request('/organizer/play/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  list: (organizerId: string) =>
    request(`/organizer/play/${organizerId}/list`),

  update: (id: string, organizerId: string, payload: Record<string, unknown>) =>
    request(`/organizer/play/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ organizer_id: organizerId, ...payload }),
    }),

  delete: (id: string, organizerId: string) =>
    request(`/organizer/play/${id}?organizer_id=${organizerId}`, {
      method: 'DELETE',
    }),
};
