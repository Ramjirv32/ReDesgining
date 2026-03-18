import ChatSupportClient from './ChatSupportClient';
import { Suspense } from 'react';

export default function ChatSupportPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center font-sans">
                <div className="w-10 h-10 border-4 border-[#5331EA] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ChatSupportClient />
        </Suspense>
    );
}
