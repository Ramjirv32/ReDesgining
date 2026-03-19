"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import { useUserSession } from "@/lib/auth/user";
import { getOrganizerSession } from "@/lib/auth/organizer";

interface Question {
    question: string;
    answer: string;
}

interface Message {
    id: string;
    message: string;
    sender: string;
    createdAt: string;
}

const ChatSupportReplyContent = () => {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("sessionId") || "";
    const supportType = searchParams.get("type") || "General";
    
    const userSession = useUserSession();
    const organizerSession = getOrganizerSession();
    
    const [questions, setQuestions] = useState<Question[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const userType = organizerSession ? "organizer" : "user";
    const userId = organizerSession?.id || userSession?.id;
    const userEmail = organizerSession?.email || userSession?.email || "";

    if (!userId) {
        return <div className="p-6 text-red-500">No valid session found. Please login again.</div>;
    }

    useEffect(() => {
        const fetchData = async () => {
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                // Fetch questions
                const category = supportType.toLowerCase().includes("dining") ? "dining" : 
                               supportType.toLowerCase().includes("event") ? "event" : "play";
                
                const questionsRes = await fetch(`/backend/api/chat/questions?category=${category}`);
                if (questionsRes.ok) {
                    const qData = await questionsRes.json();
                    setQuestions(qData);
                }

                // Fetch messages
                const messagesRes = await fetch(`/backend/api/chat/sessions/${sessionId}/messages`);
                if (messagesRes.ok) {
                    const mData = await messagesRes.json();
                    setMessages(mData);
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
    }, [sessionId, supportType]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !sessionId || sending) return;

        // Optimistic update
        const userMsg: Message = {
            id: Date.now().toString(),
            message: inputMessage,
            sender: "admin",
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);
        const currentMsg = inputMessage;
        setInputMessage("");

        setSending(true);
        try {
            const response = await fetch(`/backend/api/chat/sessions/${sessionId}/messages?admin=true`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    userId,
                    userEmail,
                    userType: "admin",
                    message: currentMsg,
                    sender: "admin",
                }),
            });

            if (!response.ok) {
                console.error("Failed to send message: server error");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleQuestionClick = async (question: string, answer: string) => {
        // Add user's question to messages
        const userMsg: Message = {
            id: Date.now().toString(),
            message: question,
            sender: "user",
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);

        // Send to backend
        if (sessionId) {
            try {
                await fetch(`/backend/api/chat/sessions/${sessionId}/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        userId,
                        userEmail,
                        userType,
                        message: question,
                        sender: "user",
                    }),
                });
            } catch (error) {
                console.error("Error saving question:", error);
            }
        }

        // Show answer after a short delay
        setTimeout(() => {
            const adminMsg: Message = {
                id: (Date.now() + 1).toString(),
                message: answer,
                sender: "admin",
                createdAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, adminMsg]);
        }, 500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const userName = userEmail.split("@")[0] || "User";

    if (loading) {
        return (
            <div className="w-full h-screen bg-white flex items-center justify-center">
                <div className="animate-pulse text-[#5331EA]">Loading...</div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-white relative overflow-hidden font-[family-name:var(--font-anek-latin)] flex flex-col">
            <header className="w-full h-[75px] bg-white border-b border-[#D9D9D9] flex items-center justify-between px-4 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link href="/admin/chat-sessions" className="p-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-[18px] font-semibold text-black">{supportType}</h1>
                        <p className="text-[12px] text-[#686868]">User: {searchParams.get("userEmail") || "Unknown"}</p>
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

            <div className="flex-1 overflow-hidden flex flex-col pt-[75px]">
                <div className="flex-1 max-w-[1440px] mx-auto w-full p-4 flex flex-col">
                    <h1 className="text-[34px] font-semibold leading-[37px] text-black mb-2">
                        Chat with us
                    </h1>
                    <p className="text-[20px] font-medium leading-[22px] text-[#5331EA] mb-4">
                        {supportType}
                    </p>

                    {/* Chat Area */}
                    <div className="flex-1 bg-[#F0F0F0] rounded-[30px] p-6 flex flex-col overflow-hidden">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                            {(messages || []).map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.sender === "admin" && (
                                        <div className="w-[38px] h-[38px] bg-[#E5E0FC] rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                            <Image src="/admin panel/chatSupport/Ellipse 29.svg" alt="" width={38} height={38} className="rounded-full" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[70%] p-3 rounded-lg ${
                                            msg.sender === "user"
                                                ? "bg-[#5331EA] text-white"
                                                : "bg-[#D8D3EF] text-black"
                                        }`}
                                    >
                                        <p className="text-[14px]">{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Questions (if no messages yet) */}
                        {(messages || []).length === 0 && (questions || []).length > 0 && (
                            <div className="mb-4">
                                <p className="text-[14px] text-[#686868] mb-2">Select a question:</p>
                                <div className="flex flex-wrap gap-2">
                                    {(questions || []).map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleQuestionClick(q.question, q.answer)}
                                            className="px-4 py-2 bg-white border border-[#5331EA] rounded-full text-[12px] text-[#5331EA] hover:bg-[#5331EA] hover:text-white transition-colors"
                                        >
                                            {q.question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="flex items-center gap-3">
                            <div className="w-[18px] h-[18px] flex items-center justify-center cursor-pointer transform rotate-90 relative">
                                <Image
                                    src="/admin panel/chatSupport/plus-icon.svg"
                                    alt="Add"
                                    width={18}
                                    height={18}
                                />
                            </div>
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message here"
                                className="flex-1 h-[44px] bg-white border border-[#5331EA] rounded-[24px] px-5 text-[15px] text-[#5331EA] placeholder-[#5331EA] outline-none"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={sending || !inputMessage.trim()}
                                className="w-[44px] h-[44px] bg-[#5331EA] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#4529c9] transition-colors disabled:opacity-50"
                            >
                                <Image
                                    src="/admin panel/chatSupport/send-icon.svg"
                                    alt="Send"
                                    width={20}
                                    height={20}
                                />
                            </button>
                        </div>
                    </div>
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
