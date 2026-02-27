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

export const eventsApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/organizer/events/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signin: (email: string, password: string) =>
    request<LoginResponse>('/organizer/events/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyOTP: (email: string, otp: string) =>
    request<VerifyResponse>('/organizer/events/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  /** Resend OTP without password */
  resendOTP: (email: string) =>
    request<{ message: string }>('/organizer/events/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  setup: (payload: SetupPayload) =>
    request<{ message: string; status: string }>('/organizer/events/setup', {
      method: 'POST',
      body: JSON.stringify(payload),
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

  getById: async (organizerId: string, id: string) => {
    const items = await request<Record<string, unknown>[]>(`/organizer/events/${organizerId}/list`);
    const found = Array.isArray(items) ? items.find((i) => i.id === id) : null;
    if (!found) throw new Error('Event not found');
    return found;
  },

  /** Fetch a single event by ID via the public endpoint (no auth required) */
  getEventDirect: (id: string) =>
    request<Record<string, unknown>>(`/events/${id}`),

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
