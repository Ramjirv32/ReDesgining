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

export interface LoginResponse {
  message: string;
  organizerId: string;
}

export interface VerifyResponse {
  _id?: string;
  id?: string;
  email: string;
  categoryStatus?: Record<string, string>;
  [key: string]: unknown;
}

export interface SetupPayload {
  organizerId: string;
  orgType: string;
  phone: string;
  pan?: string;
  panName?: string;
  panDOB?: string;
  panCardUrl?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankName?: string;
  accountHolder?: string;
  gstNumber?: string;
  backupEmail?: string;
  backupPhone?: string;
}

export const diningApi = {
  /** Login only — returns 404 with error "user_not_found" if email unknown */
  login: (email: string, password: string) =>
    request<LoginResponse>('/organizer/dining/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** Signup (create account) — returns 400 with error "email_exists" if already registered */
  signin: (email: string, password: string) =>
    request<LoginResponse>('/organizer/dining/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyOTP: (email: string, otp: string) =>
    request<VerifyResponse>('/organizer/dining/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  /** Resend OTP without password — uses dedicated backend endpoint */
  resendOTP: (email: string) =>
    request<{ message: string }>('/organizer/dining/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** Submit onboarding setup details — sets dining status to "pending" */
  setup: (payload: SetupPayload) =>
    request<{ message: string; status: string }>('/organizer/dining/setup', {
      method: 'POST',
      body: JSON.stringify(payload),
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

  getById: async (id: string) => {
    const items = await request<Record<string, unknown>[]>(`/organizer/dining/list`);
    const found = Array.isArray(items) ? items.find((i) => i.id === id) : null;
    if (!found) throw new Error('Dining listing not found');
    return found;
  },

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
