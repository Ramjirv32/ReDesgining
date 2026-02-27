"use client";

import Image from "next/image";
import Link from "next/link";

const ChatSupport = () => {
    const supportOptions = [
        {
            id: "dining",
            title: "Dining support",
            icon: "/admin panel/chatSupport/dining-icon.svg",
            width: 64,
            height: 64,
        },
        {
            id: "event",
            title: "Event support",
            icon: "/admin panel/chatSupport/guitar-icon.svg",
            width: 57,
            height: 57,
        },
        {
            id: "play-1",
            title: "Play support",
            icon: "/admin panel/chatSupport/batmiton-icon.svg",
            width: 62,
            height: 62,
        },
        {
            id: "play-2",
            title: "Play support",
            icon: "/admin panel/chatSupport/chat-icon.svg",
            width: 56,
            height: 56,
        },
    ];

    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            {/* Hero section / Header */}
            <header className="w-full h-[75px] bg-white border-b border-[#D9D9D9] flex items-center justify-center relative">
                <div className="relative w-[159px] h-[40px]">
                    <Image
                        src="/ticpin-logo-black.png"
                        alt="TICPIN Logo"
                        fill
                        className="object-contain"
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1440px] mx-auto pt-[25px] px-4 flex flex-col items-center">
                <h1 className="text-[34px] font-semibold leading-[37px] text-black mb-[40px]">
                    Chat with us
                </h1>

                {/* Support Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[100px] mb-[100px]">
                    {supportOptions.map((option) => (
                        <Link
                            key={option.id}
                            href={`/admin/ChatSupportPage/reply?type=${encodeURIComponent(option.title)}`}
                            className="w-[193px] h-[210px] bg-[#E1E1E1] rounded-[40px] flex flex-col items-center justify-center cursor-pointer"
                        >
                            <div className="mb-4">
                                <Image
                                    src={option.icon}
                                    alt={option.title}
                                    width={option.width}
                                    height={option.height}
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-[25px] font-medium leading-[28px] text-black text-center">
                                {option.title}
                            </span>
                        </Link>
                    ))}
                </div>

                {/* Info Banner */}
                <div className="w-full max-w-[740px] h-auto min-h-[38px] bg-[#5331EA26] border border-[#5331EA] rounded-[10px] flex items-center px-4 py-2 gap-3 mb-20">
                    <div className="flex-shrink-0 w-6 h-6">
                        <Image
                            src="/admin panel/chatSupport/info-circle-icon.svg"
                            alt="Info"
                            width={24}
                            height={24}
                        />
                    </div>
                    <p className="text-[15px] font-medium leading-[16px] text-black whitespace-nowrap">
                        Can’t find an option that properly describes your issue? Email{" "}
                        <a href="mailto:support@ticpin.in" className="hover:underline">
                            support@ticpin.in
                        </a>{" "}
                        and we’ll assist you.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default ChatSupport;
