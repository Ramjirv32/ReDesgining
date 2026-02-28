'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function OffersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[#f3eefe] font-sans">
            <main className="px-6 py-6 max-w-[1280px] mx-auto" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                {/* Admin Panel Header */}
                <div className="mb-4">
                    <h1 className="text-[32px] font-bold text-black leading-tight tracking-tight">Admin Panel</h1>
                    <div className="w-[70px] h-[1.5px] bg-gray-400 mt-2 mb-2"></div>
                </div>

                {/* Sub-header row: Title on left, Tabs centered */}
                <div className="flex items-center justify-between mb-6 relative px-2 ml-[-8px]">
                    {/* Left: Section Title */}
                    <div className="text-[20px] font-medium text-black">
                        {pathname.includes('/viewoffer') ? 'View Offer' :
                            pathname.includes('/viewcoupon') ? 'View Coupon' :
                                pathname.includes('/createoffer') ? 'Create Offer' :
                                    pathname.includes('/createcoupon') ? 'Create Coupon' :
                                        'Offers / Coupons'}
                    </div>

                    {/* Center: Tabs */}
                    <div className="absolute left-1/2 -translate-x-1/2 bg-[#DCD2F2] rounded-[12px] inline-flex w-full max-w-[500px] overflow-hidden">
                        <Link
                            href="/admin/offers/create"
                            className={`flex-1 text-center py-2.5 text-[18px] font-medium transition-all ${pathname.includes('/create')
                                    ? 'bg-[#C4B5FD] text-black'
                                : 'text-black'
                                }`}
                            style={{ fontFamily: 'Anek Latin' }}
                        >
                            Create
                        </Link>
                        <Link
                            href="/admin/offers/view"
                            className={`flex-1 text-center py-2.5 text-[18px] font-medium transition-all ${pathname.includes('/view')
                                    ? 'bg-[#C4B5FD] text-black'
                                : 'text-black'
                                }`}
                            style={{ fontFamily: 'Anek Latin' }}
                        >
                            View
                        </Link>
                    </div>

                    {/* Right spacer for balance */}
                    <div className="w-[150px] hidden md:block"></div>
                </div>

                {/* Content Area */}
                <div className="w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
