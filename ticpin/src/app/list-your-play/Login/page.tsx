'use client';

import OrganizerLoginForm from '@/components/organizer/OrganizerLoginForm';
import { playApi } from '@/lib/api/play';

export default function LoginPage() {
    return (
        <OrganizerLoginForm
            vertical="play"
            api={playApi}
            setupPath="/list-your-play/setup"
            otpPath="/list-your-play/otp"
            signinPath="/list-your-play/Signin"
        />
    );
}
