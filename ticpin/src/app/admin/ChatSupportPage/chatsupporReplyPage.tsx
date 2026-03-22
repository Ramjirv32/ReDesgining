"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import { useUserSession } from "@/lib/auth/user";
import { getOrganizerSession } from "@/lib/auth/organizer";
import { FileText } from "lucide-react";

interface Question {
    question: string;
    answer: string;
}

interface Message {
    id: string;
    message: string;
    sender: string;
    createdAt: string;
    fileUrl?: string;
    fileType?: string;
}

interface ChatSession {
    sessionId: string;
    status: 'pending' | 'active' | 'closed';
    userEmail: string;
    category: string;
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
    const [sessionStatus, setSessionStatus] = useState<'pending' | 'active' | 'closed'>('pending');
    const [accepting, setAccepting] = useState(false);
    const [ending, setEnding] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
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

                // Fetch session details to get status
                const sessionsRes = await fetch(`/backend/api/chat/sessions?admin=true`);
                if (sessionsRes.ok) {
                    const sessionsData = await sessionsRes.json();
                    const currentSession = sessionsData.sessions?.find((s: any) => s.sessionId === sessionId || s.session_id === sessionId);
                    if (currentSession) {
                        setSessionStatus(currentSession.status);
                    }
                }
            } catch (error) {
                console.error("Error fetching chat data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Poll for new messages every 15 seconds
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
        }, 15000);

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

    const handleAcceptTicket = async () => {
        if (!sessionId || accepting) return;
        setAccepting(true);
        try {
            const response = await fetch(`/backend/api/chat/sessions/${sessionId}/accept`, {
                method: 'POST',
                credentials: 'include',
            });
            if (response.ok) {
                setSessionStatus('active');
                // Refresh messages to show welcome message
                const messagesRes = await fetch(`/backend/api/chat/sessions/${sessionId}/messages`);
                if (messagesRes.ok) {
                    const mData = await messagesRes.json();
                    setMessages(mData);
                }
            }
        } catch (error) {
            console.error('Error accepting ticket:', error);
        } finally {
            setAccepting(false);
        }
    };

    const handleEndChat = async () => {
        if (!sessionId || ending) return;
        setEnding(true);
        try {
            const response = await fetch(`/backend/api/chat/sessions/${sessionId}/end`, {
                method: 'POST',
                credentials: 'include',
            });
            if (response.ok) {
                setSessionStatus('closed');
                // Refresh messages to show system message
                const messagesRes = await fetch(`/backend/api/chat/sessions/${sessionId}/messages`);
                if (messagesRes.ok) {
                    const mData = await messagesRes.json();
                    setMessages(mData);
                }
            }
        } catch (error) {
            console.error('Error ending chat:', error);
        } finally {
            setEnding(false);
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
                <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${
                        sessionStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        sessionStatus === 'active' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                        {sessionStatus === 'pending' ? 'Pending' : 
                         sessionStatus === 'active' ? 'Active' : 'Closed'}
                    </span>
                    
                    {/* Accept Ticket Button - Only for pending */}
                    {sessionStatus === 'pending' && (
                        <button
                            onClick={handleAcceptTicket}
                            disabled={accepting}
                            className="px-4 py-2 bg-[#5331EA] text-white rounded-full text-[13px] font-medium hover:bg-[#4529c9] transition-colors disabled:opacity-50"
                        >
                            {accepting ? 'Accepting...' : 'Accept Ticket'}
                        </button>
                    )}
                    
                    {/* End Chat Button - Only for active */}
                    {sessionStatus === 'active' && (
                        <button
                            onClick={handleEndChat}
                            disabled={ending}
                            className="px-4 py-2 bg-red-500 text-white rounded-full text-[13px] font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                            {ending ? 'Ending...' : 'End Chat'}
                        </button>
                    )}
                    
                    <div className="relative w-[120px] h-[30px]">
                        <Image
                            src="/ticpin-logo-black.png"
                            alt="TICPIN"
                            fill
                            className="object-contain"
                        />
                    </div>
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
                                        className={`max-w-[70%] p-3 rounded-lg ${msg.sender === "user"
                                                ? "bg-[#5331EA] text-white"
                                                : "bg-[#D8D3EF] text-black"
                                            }`}
                                    >
                                        <p className="text-[14px]">{msg.message}</p>
                                        
                                        {/* Display file attachment */}
                                        {msg.fileUrl && (
                                            <div className="mt-1">
                                                {msg.fileType === 'image' ? (
                                                    <div className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-white/30 shadow-md bg-zinc-900 flex items-center justify-center min-h-[150px] w-full max-w-[280px]"
                                                         onClick={() => setLightboxImage(msg.fileUrl?.startsWith('blob:') ? msg.fileUrl : msg.fileUrl?.startsWith('http') ? msg.fileUrl : `/backend${msg.fileUrl}`)}>
                                                        <img 
                                                            src={msg.fileUrl?.startsWith('blob:') ? msg.fileUrl : msg.fileUrl?.startsWith('http') ? msg.fileUrl : `/backend${msg.fileUrl}`} 
                                                            alt="Shared image" 
                                                            className="max-w-full max-h-[220px] object-cover transition-all duration-300 group-hover:scale-105"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] border border-white/20">
                                                                View Full
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-all shadow-sm max-w-[250px]"
                                                         onClick={() => window.open(msg.fileUrl?.startsWith('blob:') ? msg.fileUrl : msg.fileUrl?.startsWith('http') ? msg.fileUrl : `/backend${msg.fileUrl}`, '_blank')}>
                                                        <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-[11px] font-bold block truncate">PDF Document</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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

                        {/* Input - Disabled if not active */}
                        {sessionStatus === 'active' ? (
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
                        ) : (
                        <div className="flex items-center justify-center py-4">
                            <p className="text-[14px] text-[#686868]">
                                {sessionStatus === 'pending' 
                                    ? 'Accept this ticket to start chatting' 
                                    : 'This chat has been ended'}
                            </p>
                        </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center animate-in fade-in duration-300"
                     onClick={() => setLightboxImage(null)}>
                    <button 
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={() => setLightboxImage(null)}
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                    <img 
                        src={lightboxImage || ''} 
                        alt="Full size" 
                        className="max-w-[95vw] max-h-[90vh] object-contain shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
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
