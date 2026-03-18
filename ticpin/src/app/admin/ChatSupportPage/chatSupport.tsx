"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserSession } from "@/lib/auth/user";
import { getOrganizerSession } from "@/lib/auth/organizer";
import { useEffect } from "react";

const ChatSupport = () => {
    const router = useRouter();
    const userSession = useUserSession();
    const organizerSession = getOrganizerSession();

    // Redirect to chat sessions list for admin
    useEffect(() => {
        router.replace('/admin/chat-sessions');
    }, [router]);

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
            id: "play",
            title: "Play support",
            icon: "/admin panel/chatSupport/batmiton-icon.svg",
            width: 62,
            height: 62,
        },
    ];

    const handleCategoryClick = async (category: string, title: string) => {
        try {
            const userType = organizerSession ? "organizer" : "user";
            const userId = organizerSession?.id || userSession?.id;
            
            if (!userId) {
                console.error("No valid session found");
                return;
            }
            
            const userEmail = organizerSession?.email || userSession?.email || "";
            const userName = userSession?.name || (userEmail ? userEmail.split("@")[0] : "User");

            const response = await fetch("/backend/api/chat/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    userId,
                    userEmail,
                    userName,
                    userType,
                    category,
                }),
            });

            if (response.ok) {
                const session = await response.json();
                router.push(`/admin/ChatSupportPage/reply?sessionId=${session.sessionId}&type=${encodeURIComponent(title)}`);
            } else {
                console.error("Failed to create chat session");
            }
        } catch (error) {
            console.error("Error creating chat session:", error);
        }
    };

    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            <header className="w-full h-[75px] bg-white border-b border-[#D9D9D9] flex items-center justify-center relative">
                <Link href="/admin" className="absolute left-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div className="relative w-[159px] h-[40px]">
                    <Image
                        src="/ticpin-logo-black.png"
                        alt="TICPIN Logo"
                        fill
                        className="object-contain"
                    />
                </div>
            </header>

            <main className="max-w-[1440px] mx-auto pt-[25px] px-4 flex flex-col items-center">
                <h1 className="text-[34px] font-semibold leading-[37px] text-black mb-[40px]">
                    Chat with us
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[100px] mb-[100px]">
                    {supportOptions.map((option) => (
                        <div
                            key={option.id}
                            onClick={() => handleCategoryClick(option.id, option.title)}
                            className="w-[193px] h-[210px] bg-[#E1E1E1] rounded-[40px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#D4D4D4] transition-colors"
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
                        </div>
                    ))}
                </div>

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
                        Can't find an option that properly describes your issue? Email{" "}
                        <a href="mailto:support@ticpin.in" className="hover:underline">
                            support@ticpin.in
                        </a>{" "}
                        and we'll assist you.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default ChatSupport;
