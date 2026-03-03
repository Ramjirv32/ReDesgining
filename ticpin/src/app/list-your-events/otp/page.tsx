'use client';

import OrganizerOTPForm from '@/components/organizer/OrganizerOTPForm';
import { eventsApi } from '@/lib/api/events';

export default function EventsOTPPage() {
    return (
        <OrganizerOTPForm
            vertical="events"
            api={eventsApi}
            setupPath="/list-your-events/setup"
            loginPath="/list-your-events/Login"
        />
    );
}
