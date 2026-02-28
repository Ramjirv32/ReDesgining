'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User } from 'lucide-react';

import Footer from '../layout/Footer';

interface CardProps {
    title: string;
    iconSrc?: string;
    iconComponent?: React.ReactNode;
    href?: string;
}

const Card = ({ title, iconSrc, iconComponent, href }: CardProps) => {
    const content = (
        <div
            className="w-[193px] h-[210px] rounded-[40px] relative shadow-[0px_10px_30px_rgba(0,0,0,0.05)] border border-[#B0B0B0] overflow-hidden cursor-pointer"
            style={{
                background: 'linear-gradient(105.73deg, #866BFF -160.73%, #FFFFFF 93.19%)'
            }}
        >
            {/* Icon Container */}
            <div className="absolute top-[52px] left-0 right-0">
                <div className="w-[58px] h-[58px] mx-auto flex items-center justify-center">
                    {iconSrc ? (
                        <Image
                            src={iconSrc}
                            alt={title}
                            width={58}
                            height={58}
                            className="object-contain" // Preserves aspect ratio
                        />
                    ) : (
                        <div className="[&>svg]:w-[58px] [&>svg]:h-[58px] [&>svg]:stroke-[1.5] text-[#686868]">
                            {iconComponent}
                        </div>
                    )}
                </div>
            </div>

            {/* Separator Line */}
            <div className="absolute top-[128px] left-0 right-0 mx-auto w-[50px] h-[1px] bg-[#686868]"></div>

            {/* Title */}
            <div className="absolute top-[143px] left-0 right-0 text-center px-2">
                <span className="font-medium text-[20px] leading-[22px] text-black font-sans">
                    {title}
                </span>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
};

export default function AdminPanel() {
    return (
        <div
            className="w-full min-h-[118vh] font-sans bg-white flex flex-col"
            style={{
                background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)',
                backgroundAttachment: 'fixed',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                zoom: '0.85'
            }}
        >
            <div className="flex-1 mx-auto w-full max-w-[1440px] px-6 md:px-[68px] py-12 md:py-20 space-y-12 md:space-y-20">
                {/* Page Title */}
                <div className="space-y-2">
                    <h1 className="text-[32px] md:text-[40px] font-semibold leading-tight text-black">Admin Panel</h1>
                    <div className="w-[80px] md:w-[101px] h-[1.5px] bg-[#686868]"></div>
                </div>

                {/* Grid Container */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 md:gap-x-12 md:gap-y-16">
                    <Card title="User Details" iconSrc="/admin panel/user-settingicon.svg" href="/admin/user-details" />
                    <Card title="Events" iconSrc="/admin panel/event-icon.svg" href="/admin/events" />
                    <Card title="Dining" iconSrc="/admin panel/dining-icon.svg" href="/admin/dining" />
                    <Card title="Play" iconSrc="/admin panel/cricket-icon.svg" href="/admin/play" />
                    <Card title="Chat Support" iconSrc="/admin panel/chat-icon.svg" />
                    <Card title="Push Notification" iconSrc="/admin panel/notification-icon.svg" href="/admin/push-notification" />
                    <Card title="Offers / Coupons" iconSrc="/admin panel/pricetag-icon.svg" href="/admin/offers" />
                    <Card title="Ticket" iconSrc="/admin panel/ticket-icon.svg" />
                    <Card title="Organizer Approval" iconSrc="/admin panel/user-plus-icon.svg" href="/admin/organizer" />
                </div>
            </div>

        </div>
    );
}
