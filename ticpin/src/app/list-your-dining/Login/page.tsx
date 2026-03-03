'use client';

import OrganizerLoginForm from '@/components/organizer/OrganizerLoginForm';
import { diningApi } from '@/lib/api/dining';

export default function LoginPage() {
    return (
        <OrganizerLoginForm
            vertical="dining"
            api={diningApi}
            setupPath="/list-your-dining/setup"
            otpPath="/list-your-dining/otp"
            signinPath="/list-your-dining/Signin"
        />
    );
}
