import type { LoginResponse, VerifyResponse, SetupPayload } from './dining';
export type { LoginResponse, VerifyResponse, SetupPayload };

const BASE = '/backend/api';

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

export const playApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/organizer/play/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signin: (email: string, password: string) =>
    request<LoginResponse>('/organizer/play/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyOTP: (email: string, otp: string) =>
    request<VerifyResponse>('/organizer/play/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  /** Resend OTP without password */
  resendOTP: (email: string) =>
    request<{ message: string }>('/organizer/play/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  setup: (payload: SetupPayload) =>
    request<{ message: string; status: string }>('/organizer/play/setup', {
      method: 'POST',
      body: JSON.stringify(payload),
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

  getById: async (organizerId: string, id: string) => {
    const items = await request<Record<string, unknown>[]>(`/organizer/play/${organizerId}/list`);
    const found = Array.isArray(items) ? items.find((i) => i.id === id) : null;
    if (!found) throw new Error('Play listing not found');
    return found;
  },

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
