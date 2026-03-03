'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-zinc-900">Something went wrong</h1>
                    <p className="text-zinc-500">We encountered an unexpected error. Our team has been notified.</p>
                </div>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-2 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50 transition-colors"
                    >
                        Go Home
                    </button>
                    <button
                        onClick={() => reset()}
                        className="px-6 py-2 rounded-xl bg-[#5331EA] text-white font-medium hover:bg-[#4326C5] transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
}
