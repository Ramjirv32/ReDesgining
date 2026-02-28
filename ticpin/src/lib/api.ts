// Base URL — all API calls go through Next.js rewrite proxy to localhost:9000
const BASE = '/backend/api';

// ─── Generic fetch wrapper ─────────────────────────────────────────
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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

  list: () =>
    request(`/organizer/dining/list`),

  update: (id: string, payload: Record<string, unknown>) =>
    request(`/organizer/dining/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request(`/organizer/dining/${id}`, {
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

  list: () =>
    request(`/organizer/events/list`),

  update: (id: string, payload: Record<string, unknown>) =>
    request(`/organizer/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request(`/organizer/events/${id}`, {
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

  list: () =>
    request(`/organizer/play/list`),

  update: (id: string, payload: Record<string, unknown>) =>
    request(`/organizer/play/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request(`/organizer/play/${id}`, {
      method: 'DELETE',
    }),
};
