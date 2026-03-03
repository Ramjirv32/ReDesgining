'use client';

import OrganizerOTPForm from '@/components/organizer/OrganizerOTPForm';
import { diningApi } from '@/lib/api/dining';

export default function DiningOTPPage() {
    return (
        <OrganizerOTPForm
            vertical="dining"
            api={diningApi}
            setupPath="/list-your-dining/setup"
            loginPath="/list-your-dining/Login"
        />
    );
}
