'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, MessageCircle, User } from "lucide-react";
import { getOrganizerSession } from "@/lib/auth/organizer";

interface ChatSession {
    id: string;
    sessionId: string;
    userName: string;
    userEmail: string;
    userType: string;
    category: string;
    status: string;
    lastMessage: string;
    createdAt: string;
    updatedAt: string;
    unreadCount?: number;
}

const categories = [
    { id: "dining", title: "Dining Support", icon: "/admin panel/chatSupport/dining-icon.svg" },
    { id: "event", title: "Event Support", icon: "/admin panel/chatSupport/guitar-icon.svg" },
    { id: "play", title: "Play Support", icon: "/admin panel/chatSupport/batmiton-icon.svg" },
];

export default function AdminChatSessionsPage() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("dining");
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        // Reset check for admin
        const session = getOrganizerSession();
        if (!session || !session.isAdmin) {
            router.replace('/admin/login');
            return;
        }
        setAuthorized(true);
    }, [router]);

    useEffect(() => {
        if (authorized) {
            fetchSessions(1);
            setPage(1);
        }
    }, [activeCategory, authorized]);

    const fetchSessions = async (pageNum: number = page) => {
        setLoading(true);
        try {
            const res = await fetch(`/backend/api/chat/sessions?category=${activeCategory}&admin=true&limit=10&page=${pageNum}`);
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
                setTotalPages(data.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            fetchSessions(newPage);
        }
    };

    const handleSessionClick = (session: ChatSession) => {
        const categoryTitle = categories.find(c => c.id === session.category)?.title || "Support";
        router.push(`/admin/ChatSupportPage/reply?sessionId=${session.sessionId}&type=${encodeURIComponent(categoryTitle)}&admin=true&userEmail=${encodeURIComponent(session.userEmail)}`);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (hours < 1) return "Just now";
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-[#F5F5F5] font-[family-name:var(--font-anek-latin)]">
            {/* Header */}
            <header className="w-full h-[75px] bg-white border-b border-[#D9D9D9] flex items-center justify-between px-4 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link href="/admin" className="p-2">
                        <ChevronLeft size={24} className="text-black" />
                    </Link>
                    <h1 className="text-[20px] font-semibold text-black">Chat Support</h1>
                </div>
                <div className="relative w-[120px] h-[30px]">
                    <Image
                        src="/ticpin-logo-black.png"
                        alt="TICPIN"
                        fill
                        className="object-contain"
                    />
                </div>
            </header>

            {/* Category Tabs */}
            <div className="bg-white border-b border-[#E5E5E5]">
                <div className="max-w-[1440px] mx-auto flex">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition-colors ${
                                activeCategory === cat.id
                                    ? "border-[#5331EA] text-[#5331EA] bg-[#5331EA]/5"
                                    : "border-transparent text-[#686868] hover:bg-[#F5F5F5]"
                            }`}
                        >
                            <Image src={cat.icon} alt={cat.title} width={24} height={24} />
                            <span className="text-[14px] font-medium">{cat.title}</span>
                            {(sessions || []).filter(s => s.category === cat.id && s.status === "active").length > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-[#5331EA] text-white text-[10px] rounded-full">
                                    {(sessions || []).filter(s => s.category === cat.id && s.status === "active").length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sessions List */}
            <div className="max-w-[1440px] mx-auto p-4 pb-20">
                {loading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <div className="animate-pulse text-[#5331EA]">Loading...</div>
                    </div>
                ) : (sessions || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center">
                        <MessageCircle size={48} className="text-[#D9D9D9] mb-4" />
                        <p className="text-[18px] text-[#686868]">No active chats in this category</p>
                        <p className="text-[14px] text-[#999] mt-2">When users send messages, they will appear here</p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-3">
                            {(sessions || []).map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => handleSessionClick(session)}
                                    className="bg-white rounded-[16px] p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow border border-[#E5E5E5]"
                                >
                                    {/* User Avatar */}
                                    <div className="w-[50px] h-[50px] bg-[#5331EA]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User size={24} className="text-[#5331EA]" />
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-[16px] font-semibold text-black truncate">
                                                {session.userName || session.userEmail.split("@")[0]}
                                            </h3>
                                            <span className={`px-2 py-0.5 text-[10px] rounded-full ${
                                                session.userType === "organizer" 
                                                    ? "bg-[#FFD9B7] text-[#8B4D1A]" 
                                                    : "bg-[#D1FAE5] text-[#065F46]"
                                            }`}>
                                                {session.userType}
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-[#686868] truncate">{session.userEmail}</p>
                                        <p className="text-[13px] text-[#999] mt-1 truncate">
                                            {session.lastMessage || "No messages yet"}
                                        </p>
                                    </div>

                                    {/* Time & Unread */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-[12px] text-[#999]">{formatTime(session.updatedAt)}</p>
                                        {session.unreadCount && session.unreadCount > 0 && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-[#5331EA] text-white text-[10px] rounded-full">
                                                {session.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-white border border-[#E5E5E5] rounded-lg text-[14px] font-medium disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="text-[14px] text-[#686868]">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-white border border-[#E5E5E5] rounded-lg text-[14px] font-medium disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
