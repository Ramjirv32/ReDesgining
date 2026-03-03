'use client';

import OrganizerOTPForm from '@/components/organizer/OrganizerOTPForm';

export default function AdminVerifyOTPPage() {
    const api = {
        verifyOTP: async (email: string, otp: string) => {
            const res = await fetch('/backend/api/organizer/play/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Verification failed');
            return data;
        },
        resendOTP: async (email: string) => {
            const res = await fetch('/backend/api/organizer/play/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');
            return data;
        }
    };

    return (
        <OrganizerOTPForm
            vertical="play" // The backend uses "play" as a default category for some checks, but for admin it doesn't matter much
            api={api}
            setupPath="/admin" // Admin is already "setup"
            loginPath="/admin/login"
        />
    );
}
