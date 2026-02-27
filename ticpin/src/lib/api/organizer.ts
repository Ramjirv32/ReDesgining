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

export interface CategoryStatusResponse {
  categoryStatus: Record<string, string>;
}

export interface ExistingSetup {
  pan?: string;
  panName?: string;
  panDOB?: string;
  panCardUrl?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankName?: string;
  accountHolder?: string;
  backupEmail?: string;
  backupPhone?: string;
}

export interface OrganizerProfile {
  id?: string;
  organizerId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  district: string;
  profilePhoto?: string;
}

export const organizerApi = {
  /** GET /api/organizer/me — refreshes session cookie with latest DB data (categoryStatus) */
  getMe: () =>
    request<{ id: string; email: string; categoryStatus: Record<string, string> }>('/organizer/me'),

  /** GET /api/organizer/:id/status — returns categoryStatus map */
  getStatus: (organizerId: string) =>
    request<CategoryStatusResponse>(`/organizer/${organizerId}/status`),

  /** GET /api/organizer/:id/existing-setup — returns PAN+bank from any existing vertical setup */
  getExistingSetup: (organizerId: string) =>
    request<ExistingSetup>(`/organizer/${organizerId}/existing-setup`),

  /** GET /api/organizer/profile/:id — returns organizer profile */
  getProfile: (organizerId: string) =>
    request<OrganizerProfile>(`/organizer/profile/${organizerId}`),

  /** POST /api/organizer/profile — creates a new profile */
  createProfile: (profile: OrganizerProfile) =>
    request<OrganizerProfile>(`/organizer/profile`, {
      method: 'POST',
      body: JSON.stringify(profile),
    }),

  /** PUT /api/organizer/profile/:id — updates an existing profile */
  updateProfile: (organizerId: string, profile: OrganizerProfile) =>
    request<{ message: string }>(`/organizer/profile/${organizerId}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),

  /** POST /api/organizer/upload-pan — multipart upload, returns { url } */
  uploadPAN: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/organizer/upload-pan`, { method: 'POST', body: form, credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Upload failed');
    return data.url as string;
  },

  /** POST /api/organizer/send-backup-otp — sends OTP to the backup email */
  sendBackupOTP: (organizerId: string, email: string, category: string) =>
    request<{ message: string }>('/organizer/send-backup-otp', {
      method: 'POST',
      body: JSON.stringify({ organizerId, email, category }),
    }),

  /** POST /api/organizer/verify-backup-otp — verifies the backup email OTP */
  verifyBackupOTP: (organizerId: string, otp: string) =>
    request<{ message: string }>('/organizer/verify-backup-otp', {
      method: 'POST',
      body: JSON.stringify({ organizerId, otp }),
    }),
};
