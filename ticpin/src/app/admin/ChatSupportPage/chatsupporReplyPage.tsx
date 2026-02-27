"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ChatSupportReplyContent = () => {
    const searchParams = useSearchParams();
    const supportType = searchParams.get("type") || "General";

    const questions = [
        "{QUESTION 1}",
        "{QUESTION 2}",
        "{QUESTION 3}",
        "{QUESTION 4}",
        "{QUESTION 5}",
    ];

    return (
        <div className="w-full h-screen bg-white relative overflow-hidden font-[family-name:var(--font-anek-latin)] flex flex-col items-center">
            {/* Hero section / Header spanning full width */}
            <header className="absolute top-0 left-0 w-screen h-[75px] bg-white border-b border-[#D9D9D9] z-50 flex items-center justify-center">
                <div className="relative w-[159px] h-[40px]">
                    <Image
                        src="/ticpin-logo-black.png"
                        alt="TICPIN Logo"
                        fill
                        className="object-contain"
                    />
                </div>
            </header>

            {/* Main Wrapper to maintain 1440px design while being responsive */}
            <div className="w-[1440px] h-screen relative shrink-0">

                {/* Chat with us title */}
                <h1 className="absolute top-[100px] left-1/2 -translate-x-1/2 text-[34px] font-semibold leading-[37px] text-black">
                    Chat with us
                </h1>

                {/* Today text */}
                <div className="absolute top-[185px] left-1/2 -translate-x-1/2 text-[20px] font-medium leading-[22px] text-[#5331EA] z-20">
                    Today
                </div>

                {/* Main Chat Area (Rectangle 125) - Increased height (breadth) to 510px */}
                <div className="absolute top-[155px] left-[39px] w-[1363px] h-[510px] bg-[#F0F0F0] rounded-[30px]">

                    {/* Assistant Avatar Background (Ellipse 29) */}
                    <div className="absolute left-[94px] top-[72px] w-[38px] h-[38px] bg-[#E5E0FC] rounded-full flex items-center justify-center overflow-hidden">
                        <img src="/admin panel/chatSupport/Ellipse 29.svg" alt="" className="w-full h-full object-cover" />
                    </div>

                    {/* Message Bubble Container - Aligned to match the 188px selection box below */}
                    <div className="absolute left-[138px] top-[72px] flex items-stretch">
                        {/* Bubble Left Part (The Tail/Tip) */}
                        <div className="relative w-[13px] flex flex-col items-end">
                            <img
                                src="/admin panel/chatSupport/bubble-whole-left-icon.svg"
                                alt=""
                                className="w-[13px] h-full object-cover"
                            />
                        </div>

                        {/* Bubble Right Part (The Body) - Aligned with selection box */}
                        <div className="bg-[#D8D3EF] rounded-r-[5.222px] rounded-br-[5.222px] p-0 flex flex-col w-[188px] ml-[-1px] relative z-10" style={{ minHeight: '59px' }}>
                            <div className="flex items-center gap-2 px-[12px] pt-[5px]">
                                <span className="text-[12px] font-semibold text-black leading-[13px]">Ticpin</span>
                                <span className="text-[7px] font-normal text-[#686868] leading-[8px]">Interactive Assistant</span>
                            </div>
                            <p className="text-[12px] font-normal text-black leading-[13px] px-[12px] pb-[10px] mt-[5px]">
                                Hi {"{USER NAME}"}<br />
                                Welcome to {supportType} chat support.
                            </p>
                        </div>
                    </div>

                    {/* Question Selection Box (Rectangle 283) - Added gap from bubble */}
                    <div className="absolute left-[150px] top-[155px] w-[188px] bg-white border border-[rgba(83,49,234,0.4)] rounded-[10px] overflow-hidden">
                        {/* Header of Selection (Rectangle 282) */}
                        <div className="bg-[#D8D3EF] h-[42px] px-[12px] flex items-center">
                            <span className="text-[12px] font-normal text-black leading-[13px]">
                                Please select the issue that you need support with:
                            </span>
                        </div>
                        {/* Selection Items */}
                        <div className="flex flex-col">
                            {questions.map((q, i) => (
                                <div key={i} className="flex flex-col">
                                    <button className="h-[33px] px-[12px] flex items-center text-[12px] font-normal text-black hover:bg-[#5331EA10] text-left">
                                        {q}
                                    </button>
                                    {i < questions.length - 1 && (
                                        <div className="h-[0.5px] w-full bg-[rgba(83,49,234,0.4)]" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Input Area Group (Rectangle 284) - Shifted down for the taller container */}
                    <div className="absolute left-[120px] top-[440px] flex items-center gap-[18px]">
                        {/* Plus Icon Container (x in CSS) */}
                        <div className="w-[18px] h-[18px] flex items-center justify-center cursor-pointer transform rotate-90">
                            <img
                                src="/admin panel/chatSupport/plus-icon.svg"
                                alt="Add"
                                className="w-full h-full"
                            />
                        </div>

                        {/* Input Bar (Rectangle 284) */}
                        <div className="w-[1080px] h-[44px] bg-white border border-[#5331EA] rounded-[24px] px-[20px] flex items-center">
                            <input
                                type="text"
                                placeholder="Type your message here"
                                className="w-full bg-transparent border-none outline-none text-[15px] font-normal text-[#5331EA] placeholder-[#5331EA]"
                            />
                        </div>

                        {/* Send Button (Ellipse 30 & send) */}
                        <div className="w-[44px] h-[44px] bg-[#D9D9D9] rounded-full flex items-center justify-center cursor-pointer hover:bg-zinc-300 transition-colors">
                            <img
                                src="/admin panel/chatSupport/send-icon.svg"
                                alt="Send"
                                className="w-[24px] h-[24px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Info Banner (Rectangle 211) - Balanced position at top-[700px] */}
                <div className="absolute top-[700px] left-1/2 -translate-x-1/2 w-[760px] h-[38px] bg-[rgba(83,49,234,0.15)] border border-[#5331EA] rounded-[10px] flex items-center px-[16px] gap-[10px]">
                    <img
                        src="/admin panel/chatSupport/info-circle-icon.svg"
                        alt=""
                        className="w-[24px] h-[24px]"
                    />
                    <p className="text-[15px] font-medium leading-[16px] text-black whitespace-nowrap">
                        Can’t find an option that properly describes your issue? Email{" "}
                        <a href="mailto:support@ticpin.in" className="font-medium hover:underline">support@ticpin.in</a> and we’ll assist you.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default function ChatSupportReplyPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center font-[family-name:var(--font-anek-latin)]">Loading...</div>}>
            <ChatSupportReplyContent />
        </Suspense>
    );
}
