'use client';

import Link from 'next/link';
import CreateOfferForm from './createoffer';
import CreateCouponForm from './createcoupon';

export default function CreateOfferPage() {
    return (
        <div className="bg-white rounded-[32px] p-10 md:p-12 lg:p-14 min-h-[480px] flex items-center justify-center gap-12">
            {/* Create Offer Card */}
            <Link
                href="/admin/offers/createoffer"
                className="w-[170px] h-[190px] rounded-[32px] flex flex-col items-center justify-center shadow-sm"
                style={{
                    background: 'linear-gradient(180deg, #E0D4FC 0%, #FFFFFF 100%) padding-box, linear-gradient(180deg, #686868 0%, #CECECE 100%) border-box',
                    border: '1px solid transparent'
                }}
            >
                <img src="/admin panel/pricetagicon1.svg" alt="Offer" className="w-12 h-12 mb-4 opacity-80" />
                <div className="w-14 h-[2px] bg-[#686868] mb-3"></div>
                <span className="text-black font-medium text-[18px] text-center">Create Offer</span>
            </Link>

            {/* Vertical Divider */}
            <div className="bg-gray-400 shrink-0" style={{ width: '1px', height: '40px', opacity: 1 }}></div>

            {/* Create Coupon Card */}
            <Link
                href="/admin/offers/createcoupon"
                className="w-[170px] h-[190px] rounded-[32px] flex flex-col items-center justify-center shadow-sm"
                style={{
                    background: 'linear-gradient(180deg, #E0D4FC 0%, #FFFFFF 100%) padding-box, linear-gradient(180deg, #686868 0%, #CECECE 100%) border-box',
                    border: '1px solid transparent'
                }}
            >
                <img src="/admin panel/pricetagicon1.svg" alt="Coupon" className="w-12 h-12 mb-4 opacity-80" />
                <div className="w-14 h-[2px] bg-[#686868] mb-3"></div>
                <span className="text-black font-medium text-[18px] text-center">Create Coupon</span>
            </Link>
        </div>
    );
}
