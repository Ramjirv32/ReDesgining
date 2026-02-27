'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();

    const getListYourLink = () => {
        if (pathname.startsWith('/dining')) {
            return {
                name: 'List your dining',
                href: '/list-your-dining'
            };
        } else if (pathname.startsWith('/play')) {
            return {
                name: 'List your play/courts',
                href: '/list-your-play'
            };
        } else {
            return {
                name: 'List your events',
                href: '/list-your-events'
            };
        }
    };

    const dynamicLink = getListYourLink();

    return (
        <footer className="bg-[#212121] text-white border-t border-zinc-800/50">
            <div className="mx-auto max-w-[1440px] px-6 md:px-[68px] min-h-[200px] flex flex-col justify-center py-8 md:py-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-8 mb-8 md:mb-8">
                    {/* Brand Logo */}
                    <div className="flex-shrink-0">
                        <img
                            src="/ticpin-logo-black.png"
                            alt="TICPIN"
                            className="h-6 md:h-8 w-auto invert brightness-0"
                        />
                    </div>

                    <div className="flex flex-wrap justify-center items-center gap-x-6 md:gap-x-12 gap-y-3 font-[family-name:var(--font-anek-latin)]">
                        {[
                            { name: 'Terms & Services', href: '/terms' },
                            { name: 'Privacy Policy', href: '/privacy' },
                            { name: 'Refund & Cancellation', href: '/refund' },
                            { name: 'Contact Us', href: '/contact' }
                        ].map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-[16px] font-semibold text-white hover:opacity-70 transition-opacity whitespace-nowrap"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link
                            href={dynamicLink.href}
                            className="text-[16px] font-semibold text-white hover:opacity-70 transition-opacity whitespace-nowrap"
                        >
                            {dynamicLink.name}
                        </Link>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="flex-shrink-0">
                        <div className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] bg-[#D9D9D9] rounded-[20px] flex items-center justify-center shadow-lg">
                            <span className="text-2xl md:text-3xl font-bold text-black tracking-tight">QR</span>
                        </div>
                    </div>
                </div>

                {/* Divider Line */}
                <div className="w-full h-px bg-zinc-700/50 mb-6 md:mb-6"></div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 font-[family-name:var(--font-anek-latin)]">
                    <p className="text-[12px] md:text-[14px] font-medium text-[#686868] max-w-[850px] leading-relaxed text-center md:text-left">
                        By accessing this page, you confirm that you have read, understood, and agreed to our Terms of Service, Cookie Policy, Privacy Policy, and Content Guidelines. All rights reserved.
                    </p>

                    <div className="flex-shrink-0 flex items-center gap-4">
                        {[
                            {
                                name: 'WhatsApp',
                                href: 'https://whatsapp.com/channel/0029Vb8KoCH3mFY1M9gR4412',
                                icon: <img src="/social icons/whatsapp.svg" alt="WhatsApp" className="w-8 h-8" />
                            },
                            {
                                name: 'Facebook',
                                href: 'https://www.facebook.com/profile.php?id=61579518933930#',
                                icon: <img src="/social icons/facebook.svg" alt="Facebook" className="w-8 h-8" />
                            },
                            {
                                name: 'Instagram',
                                href: 'https://www.instagram.com/ticpinindia/',
                                icon: <img src="/social icons/instagram.svg" alt="Instagram" className="w-8 h-8" />
                            },
                            {
                                name: 'X',
                                href: 'https://x.com/ticpin',
                                icon: <img src="/social icons/x.svg" alt="X" className="w-8 h-8" />
                            },
                            {
                                name: 'YouTube',
                                href: 'https://www.youtube.com/channel/UCrGSN3cv3q1x3yI5q7LILtw',
                                icon: <img src="/social icons/youtube.svg" alt="YouTube" className="w-8 h-8" />
                            }
                        ].map((social) => (
                            <Link
                                key={social.name}
                                href={social.href}
                                className="text-white hover:opacity-80 transition-opacity"
                                aria-label={social.name}
                            >
                                {social.icon}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}