'use client';

import OrganizerLoginForm from '@/components/organizer/OrganizerLoginForm';
import { eventsApi } from '@/lib/api/events';

export default function LoginPage() {
    return (
        <OrganizerLoginForm
            vertical="events"
            api={eventsApi}
            setupPath="/list-your-events/setup"
            otpPath="/list-your-events/otp"
            signinPath="/list-your-events/Signin"
        />
    );
}
