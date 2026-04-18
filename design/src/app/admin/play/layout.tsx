'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PlayLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    return (
        <div className="min-h-screen bg-[#FFF1A81A] font-sans">
            <main className="px-6 py-6 max-w-[1280px] mx-auto" style={{ fontFamily: 'Anek Latin' }}>
                {/* Admin Panel Header */}
                <div className="mb-4">
                    <h1 className="text-[32px] font-bold text-black leading-tight tracking-tight">Admin Panel</h1>
                    <div className="w-[70px] h-[1.5px] bg-[#686868] mt-2 mb-2"></div>
                </div>

                {/* Sub-header row: Title on left, Tabs centered */}
                <div className="flex items-center justify-between mb-10 relative px-2 ml-[-8px]">
                    {/* Left: Section Title */}
                    <div className="text-[20px] font-medium text-black">
                        Play Details
                    </div>

                    {/* Right spacer for balance */}
                    <div className="w-[150px] hidden md:block"></div>
                </div>

                {/* Main White Content Box */}
                <div className="bg-white rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex flex-col items-center">
                    {/* Tabs Container */}
                    <div className="absolute left-1/2 -translate-x-1/2 bg-[#FFF1A866] rounded-[12px] inline-flex w-full max-w-[500px] overflow-hidden mt-[-40px]">
                        <Link
                            href="/admin/play"
                            className={`flex-1 text-center py-2.5 text-[18px] font-medium transition-all ${isActive('/admin/play')
                                ? 'bg-[#FFF1A8] text-black shadow-inner'
                                : 'text-black opacity-60 hover:opacity-100'
                                }`}
                            style={{ fontFamily: 'Anek Latin' }}
                        >
                            Needs Approval
                        </Link>
                        <Link
                            href="/admin/play/approved"
                            className={`flex-1 text-center py-2.5 text-[18px] font-medium transition-all ${isActive('/admin/play/approved')
                                ? 'bg-[#FFF1A8] text-black shadow-inner'
                                : 'text-black opacity-60 hover:opacity-100'
                                }`}
                            style={{ fontFamily: 'Anek Latin' }}
                        >
                            Approved
                        </Link>
                    </div>

                    {/* Content Area */}
                    <div className="w-full h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
