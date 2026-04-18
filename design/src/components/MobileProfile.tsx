'use client';

import { ChevronLeft, ChevronRight, Pencil, MessageCircle, HelpCircle, User, Info, LogOut, Music, Utensils, PlayCircle, List, Bell } from 'lucide-react';

interface MobileProfileProps {
    onBack?: () => void;
}

export default function MobileProfile({ onBack }: MobileProfileProps) {
    const name = "{NAME}";
    const number = "{NUMBER}";

    const menuGroups = [
        {
            items: [
                { icon: <img src="/mobile_icons/profile_page/Vector 1.svg" alt="ticklist" className="w-6 h-6 object-contain" />, label: "Ticlists" },
                { icon: <img src="/mobile_icons/profile_page/dining-table.svg" alt="Dining" className="w-6 h-6 object-contain" />, label: "Dining reminders" },
                { icon: <img src="/mobile_icons/profile_page/guitar.svg" alt="Dining" className="w-6 h-6 object-contain" />, label: "Event reminders" },
                { icon: <PlayCircle size={22} className="text-[#686868]" />, label: "Play reminders" },
            ]
        },
        {
            items: [
                { icon: <img src="/mobile_icons/profile_page/support.svg" alt="support" className="w-6 h-6 object-contain" />, label: "Frequently asked questions" },
                { icon: <img src="/mobile_icons/profile_page/chat.svg" alt="support" className="w-6 h-6 object-contain" />, label: "Chat with us" },
            ]
        },
        {
            items: [
                { icon: <img src="/mobile_icons/profile_page/profile.svg" alt="support" className="w-6 h-6 object-contain" />, label: "Account settings" },
                { icon: <img src="/mobile_icons/profile_page/info.svg" alt="support" className="w-6 h-6 object-contain" />, label: "About us" },
            ]
        },
        {
            items: [
                { icon: <img src="/mobile_icons/profile_page/logout.svg" alt="support" className="w-6 h-6 object-contain" />, label: "Logout" },
            ]
        }
    ];

    return (
        <div className="md:hidden min-h-screen w-full bg-[#F1F1F1] font-sans selection:bg-[#866BFF]/20 px-[15px] py-6 overflow-y-auto" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
            {/* 1. Header Section */}
            <header className="flex items-center gap-[10px] mb-[45px]">
                <button
                    onClick={onBack}
                    className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center"
                >
                    <ChevronLeft size={20} className="text-black" />
                </button>
                <h1 className="text-[18px] font-medium text-black">
                    Profile
                </h1>
            </header>

            {/* 2. User Info Section */}
            <div className="flex items-center justify-between mb-[26px]">
                <div className="flex items-center gap-[14px]">
                    <div className="w-[70px] h-[70px] bg-[#D9D9D9] rounded-full flex-shrink-0" />
                    <div className="flex flex-col">
                        <h2 className="text-[18px] font-medium text-black leading-none mb-1">
                            {name}
                        </h2>
                        <p className="text-[15px] font-normal text-black leading-none">
                            {number}
                        </p>
                    </div>
                </div>
                <button className="p-2">
                    <Pencil size={18} className="text-[#212121]" />
                </button>
            </div>

            {/* 3. Ticpin Pass Banner */}
            <div className="w-full h-[57px] bg-white bg-opacity-60 rounded-[15px] flex items-center justify-center mb-[20px] border border-[#D0D0D0]">
                <span className="text-[18px] font-medium text-black">
                    Ticpin Pass Banner
                </span>
            </div>

            {/* 4. Your Bookings Section */}
            <div className="mb-[35px]">
                <h3 className="text-[18px] font-medium text-black mb-[15px]">
                    Your bookings
                </h3>
                <div className="flex gap-[15px] overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { icon: <img src="/mobile_icons/profile_page/dining-table.svg" alt="Dining" className="w-8 h-8 object-contain" />, label: "Dining bookings" },
                        { icon: <img src="/mobile_icons/profile_page/guitar.svg" alt="Events" className="w-8 h-8 object-contain" />, label: "Event tickets" },
                        { icon: <PlayCircle size={32} className="text-black" />, label: "Play bookings" }
                    ].map((item, i) => (
                        <div key={i} className="flex-shrink-0 w-[134px] h-[92px] bg-white border border-[#D0D0D0] rounded-[25px] flex flex-col items-center justify-center gap-[6px]">
                            {item.icon}
                            <span className="text-[15px] font-medium text-black text-center leading-none">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. Menu Groups */}
            <div className="space-y-[15px]">
                {menuGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="bg-white rounded-[22px] border border-[#D0D0D0] overflow-hidden">
                        {group.items.map((item, itemIdx) => (
                            <div key={itemIdx}>
                                <button className="w-full flex items-center justify-between px-5 h-[57px] active:bg-zinc-50 transition-colors">
                                    <div className="flex items-center gap-[21px]">
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            {item.icon}
                                        </div>
                                        <span className="text-[15px] font-medium text-black">
                                            {item.label}
                                        </span>
                                    </div>
                                    <ChevronRight size={18} className="text-black" />
                                </button>
                                {itemIdx < group.items.length - 1 && (
                                    <div className="mx-5 border-b border-[#686868] opacity-50" />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* 6. Footer Spacing */}
            <div className="h-20" />
        </div>
    );
}
