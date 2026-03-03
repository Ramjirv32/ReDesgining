'use client';

import OrganizerSigninForm from '@/components/organizer/OrganizerSigninForm';
import { playApi } from '@/lib/api/play';

export default function SignupPage() {
    return (
        <OrganizerSigninForm
            vertical="play"
            api={playApi}
            setupPath="/list-your-play/setup"
            otpPath="/list-your-play/otp"
            loginPath="/list-your-play/Login"
        />
    );
}
