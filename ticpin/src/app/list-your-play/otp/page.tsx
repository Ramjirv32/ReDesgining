'use client';

import OrganizerOTPForm from '@/components/organizer/OrganizerOTPForm';
import { playApi } from '@/lib/api/play';

export default function PlayOTPPage() {
    return (
        <OrganizerOTPForm
            vertical="play"
            api={playApi}
            setupPath="/list-your-play/setup"
            loginPath="/list-your-play/Login"
        />
    );
}
