import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white font-[family-name:var(--font-anek-latin)] select-none">
            <p className="text-[120px] font-bold text-black leading-none tracking-tight">404</p>
            <p className="text-2xl font-medium text-[#686868] mt-2 mb-8">This page doesn&apos;t exist</p>
            <Link
                href="/dining"
                className="bg-black text-white px-8 py-3 rounded-[14px] font-medium text-lg hover:opacity-80 transition-opacity"
            >
                Go home
            </Link>
        </div>
    );
}
