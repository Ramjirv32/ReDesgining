'use client';

import OrganizerSigninForm from '@/components/organizer/OrganizerSigninForm';
import { eventsApi } from '@/lib/api/events';

export default function SignupPage() {
    return (
        <OrganizerSigninForm
            vertical="events"
            api={eventsApi}
            setupPath="/list-your-events/setup"
            otpPath="/list-your-events/otp"
            loginPath="/list-your-events/Login"
        />
    );
}
