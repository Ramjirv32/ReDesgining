'use client';

import OrganizerSigninForm from '@/components/organizer/OrganizerSigninForm';
import { diningApi } from '@/lib/api/dining';

export default function SignupPage() {
    return (
        <OrganizerSigninForm
            vertical="dining"
            api={diningApi}
            setupPath="/list-your-dining/setup"
            otpPath="/list-your-dining/otp"
            loginPath="/list-your-dining/Login"
            signinTitle="Create Business account"
            passwordPlaceholder="Password (min 8 chars)"
            passwordHint="Min 8 characters with uppercase, lowercase, number and special character."
        />
    );
}
