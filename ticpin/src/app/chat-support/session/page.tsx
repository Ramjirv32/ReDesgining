'use client';

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import { useUserSession } from "@/lib/auth/user";
import { getOrganizerSession } from "@/lib/auth/organizer";
import { ChevronLeft, Phone, Send } from "lucide-react";

interface Message {
    id: string;
    message: string;
    sender: string;
    userEmail?: string;
    createdAt: string;
}

interface Session {
    sessionId: string;
    userName: string;
    userEmail: string;
    userType: string;
    category: string;
    status: string;
}

const ChatSessionContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get("sessionId") || "";
    const supportType = searchParams.get("type") || "Support";
    const category = searchParams.get("category") || "";
    const isAdmin = searchParams.get("admin") === "true";
    
    const userSession = useUserSession();
    const organizerSession = getOrganizerSession();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const userType = organizerSession ? "organizer" : "user";
    const userId = organizerSession?.id || userSession?.id || "";
    const userEmail = organizerSession?.email || userSession?.email || "";

    // Fetch messages and session - ensure users can only access their own sessions
    useEffect(() => {
        const fetchData = async () => {
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                // For users, include their userId to verify they own this session
                const fetchUrl = isAdmin 
                    ? `/backend/api/chat/sessions/${sessionId}/messages`
                    : `/backend/api/chat/sessions/${sessionId}/messages?userId=${userId}`;
                    
                // Fetch messages
                const messagesRes = await fetch(fetchUrl);
                if (messagesRes.ok) {
                    const mData = await messagesRes.json();
                    setMessages(mData);
                } else if (messagesRes.status === 403) {
                    // Not authorized - redirect
                    router.push('/chat-support');
                    return;
                }

                // Fetch session details
                const sessionsRes = await fetch(`/backend/api/chat/sessions?userId=${userId}&userType=${userType}`);
                if (sessionsRes.ok) {
                    const sessions = await sessionsRes.json();
                    const currentSession = sessions.find((s: Session) => s.sessionId === sessionId);
                    if (currentSession) {
                        setSession(currentSession);
                    } else if (!isAdmin) {
                        // Session not found for this user
                        router.push('/chat-support');
                        return;
                    }
                }

                // If no messages, add welcome message
                if (messages.length === 0) {
                    const welcomeMsg: Message = {
                        id: "welcome",
                        message: `Hi ${userEmail.split("@")[0] || "there"}! Welcome to ${supportType}. Our team typically responds within 1-2 hours. For urgent queries, please call us at +91 78456 13278. How can we help you today?`,
                        sender: "admin",
                        createdAt: new Date().toISOString(),
                    };
                    setMessages([welcomeMsg]);
                }
            } catch (error) {
                console.error("Error fetching chat data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
        // Poll for new messages every 5 seconds
        const interval = setInterval(async () => {
            if (sessionId) {
                try {
                    const messagesRes = await fetch(`/backend/api/chat/sessions/${sessionId}/messages`);
                    if (messagesRes.ok) {
                        const mData = await messagesRes.json();
                        setMessages(mData);
                    }
                } catch (error) {
                    console.error("Error polling messages:", error);
                }
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [sessionId, supportType, userEmail, userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !sessionId || sending) return;

        setSending(true);
        try {
            const response = await fetch(`/backend/api/chat/sessions/${sessionId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    userId,
                    userEmail,
                    userType,
                    message: inputMessage,
                    sender: isAdmin ? "admin" : "user",
                }),
            });

            if (response.ok) {
                const newMessage = await response.json();
                setMessages(prev => [...prev, newMessage]);
                setInputMessage("");
                
                // Mark as read
                await fetch(`/backend/api/chat/sessions/${sessionId}/read`, {
                    method: "PUT",
                    credentials: "include",
                });
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-pulse text-[#5331EA]">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <header className="w-full h-[75px] bg-white border-b border-[#D9D9D9] flex items-center justify-between px-4 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2">
                        <ChevronLeft size={24} className="text-black" />
                    </button>
                    <div>
                        <h1 className="text-[18px] font-semibold text-black">{supportType}</h1>
                        {isAdmin && session && (
                            <p className="text-[12px] text-[#686868]">{session.userEmail}</p>
                        )}
                    </div>
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

            {/* Chat Area */}
            <div className="flex-1 bg-[#F5F5F5] overflow-hidden flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div
                            key={msg.id || index}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {msg.sender === "admin" && (
                                <div className="w-[36px] h-[36px] bg-[#5331EA] rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                    <span className="text-white text-[12px] font-bold">T</span>
                                </div>
                            )}
                            <div
                                className={`max-w-[75%] p-3 rounded-2xl ${
                                    msg.sender === "user"
                                        ? "bg-[#5331EA] text-white rounded-br-none"
                                        : "bg-white text-black rounded-bl-none shadow-sm"
                                }`}
                            >
                                <p className="text-[14px] leading-[1.4]">{msg.message}</p>
                                <p className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-white/70" : "text-[#999]"}`}>
                                    {formatTime(msg.createdAt)}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white p-4 border-t border-[#E5E5E5]">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="flex-1 h-[44px] bg-[#F5F5F5] border-none rounded-full px-4 text-[14px] text-black placeholder-[#999] outline-none"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={sending || !inputMessage.trim()}
                            className="w-[44px] h-[44px] bg-[#5331EA] rounded-full flex items-center justify-center disabled:opacity-50"
                        >
                            <Send size={20} className="text-white" />
                        </button>
                    </div>
                    <p className="text-center text-[12px] text-[#999] mt-2">
                        We typically respond within 1 hour
                    </p>
                </div>
            </div>

            {/* Call Support Button (Mobile) */}
            <a 
                href="tel:+917845613278"
                className="md:hidden fixed bottom-[100px] right-4 w-[50px] h-[50px] bg-[#5331EA] rounded-full flex items-center justify-center shadow-lg z-40"
            >
                <Phone size={24} className="text-white" />
            </a>
        </div>
    );
};

export default function ChatSessionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
            <ChatSessionContent />
        </Suspense>
    );
}
