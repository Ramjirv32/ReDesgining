'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useIdentityStore } from '@/store/useIdentityStore';
import { ChevronLeft, Plus, Send, Info } from 'lucide-react';

interface SupportOption {
    id: string;
    title: string;
    category: string;
    icon: string;
    width: number;
    height: number;
}

const supportOptions: SupportOption[] = [
    {
        id: "dining",
        title: "Dining support",
        category: "dining",
        icon: "/admin panel/chatSupport/dining-icon.svg",
        width: 64,
        height: 64,
    },
    {
        id: "event",
        title: "Event support",
        category: "event",
        icon: "/admin panel/chatSupport/guitar-icon.svg",
        width: 57,
        height: 57,
    },
    {
        id: "play-1",
        title: "Play support",
        category: "play",
        icon: "/admin panel/chatSupport/batmiton-icon.svg",
        width: 62,
        height: 62,
    },
    {
        id: "play-2",
        title: "Play support",
        category: "play",
        icon: "/admin panel/chatSupport/chat-icon.svg",
        width: 56,
        height: 56,
    },
];

interface ChatMessage {
    sessionId: string;
    userId: string;
    message: string;
    sender: 'user' | 'admin';
    createdAt: string;
}

interface ChatSession {
    sessionId: string;
    userId: string;
    userName: string;
    userEmail: string;
    category: string;
    lastMessage: string;
    updatedAt: string;
    unreadCount?: number;
}

export default function ChatSupportClient() {
    const router = useRouter();
    const { userSession, sync } = useIdentityStore();
    
    // Sync session on mount
    useEffect(() => {
        sync();
    }, [sync]);
    
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
    const [adminSessions, setAdminSessions] = useState<ChatSession[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    
    const isAdmin = userSession?.phone === '6383667872';

    useEffect(() => {
        if (selectedCategory) {
            fetch(`/backend/api/chat/questions?category=${selectedCategory}`)
                .then(r => r.json())
                .then(d => setQuestions(Array.isArray(d) ? d : []));
        }
    }, [selectedCategory]);

    const fetchAdminSessions = async (category: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/backend/api/chat/sessions?admin=true&category=${category}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setAdminSessions(data);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const startUserChat = async (category: string) => {
        if (!userSession?.id) {
            console.error('User session not found');
            return;
        }
        
        setLoading(true);
        try {
            const res = await fetch('/backend/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userSession.id,
                    userName: userSession.name,
                    userEmail: userSession.email || userSession.phone,
                    userType: 'user',
                    category: category
                }),
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setActiveSession(data);
                fetchMessages(data.sessionId);
            }
        } catch (error) {
            console.error('Failed to start chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (sessionId: string) => {
        if (!userSession?.id) {
            console.error('User session not found');
            return;
        }
        
        try {
            const res = await fetch(`/backend/api/chat/sessions/${sessionId}/messages?admin=${isAdmin}&userId=${userSession.id}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleSendMessageWithContent = async (content: string) => {
        if (!content.trim() || !activeSession || !userSession?.id) return;
        try {
            await fetch(`/backend/api/chat/sessions/${activeSession.sessionId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userSession.id,
                    message: content,
                    sender: isAdmin ? 'admin' : 'user'
                }),
                credentials: 'include'
            });
            fetchMessages(activeSession.sessionId);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleSendMessage = () => {
        handleSendMessageWithContent(inputValue);
        setInputValue('');
    };

    if (!selectedCategory) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center">
                <header className="w-full h-[75px] bg-white border-b border-[#D9D9D9] flex items-center justify-center relative">
                    <div className="relative w-[159px] h-[40px]">
                        <Image src="/ticpin-logo-black.png" alt="TICPIN Logo" fill className="object-contain" />
                    </div>
                </header>
                <main className="max-w-[1440px] w-full pt-[25px] px-4 flex flex-col items-center">
                    <h1 className="text-[34px] font-semibold text-black mb-[40px]">Chat with us</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-[100px] mb-[100px]">
                        {supportOptions.map((option) => (
                            <div
                                key={option.id}
                                onClick={() => {
                                    setSelectedCategory(option.category);
                                    if (isAdmin) fetchAdminSessions(option.category);
                                    else startUserChat(option.category);
                                }}
                                className="w-[193px] h-[210px] bg-[#E1E1E1] rounded-[40px] flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-200 transition-colors"
                            >
                                <div className="mb-4">
                                    <Image src={option.icon} alt={option.title} width={option.width} height={option.height} className="object-contain" />
                                </div>
                                <span className="text-[25px] font-medium text-black text-center px-4 leading-tight">{option.title}</span>
                            </div>
                        ))}
                    </div>
                    <div className="w-full max-w-[740px] bg-[#5331EA15] border border-[#5331EA] rounded-[10px] flex items-center px-4 py-3 gap-3">
                        <Info className="text-[#5331EA]" size={24} />
                        <p className="text-[15px] font-medium text-black">
                            Can’t find an option that properly describes your issue? Email <a href="mailto:support@ticpin.in" className="hover:underline">support@ticpin.in</a> and we’ll assist you.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (isAdmin && !activeSession) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <header className="w-full h-[75px] bg-white border-b border-[#D0D0D0] flex items-center justify-between px-6">
                    <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 text-zinc-600">
                        <ChevronLeft size={24} /> Back to Categories
                    </button>
                    <Image src="/ticpin-logo-black.png" alt="TICPIN Logo" width={120} height={30} className="object-contain" />
                    <div className="w-24" />
                </header>
                <main className="max-w-4xl mx-auto w-full py-10 px-4">
                    <h1 className="text-2xl font-bold mb-6 capitalize">{selectedCategory} Support Chats</h1>
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#5331EA] border-t-transparent rounded-full animate-spin" /></div>
                    ) : adminSessions.length === 0 ? (
                        <div className="text-center py-20 text-zinc-400">No active chats in this category.</div>
                    ) : (
                        <div className="space-y-4">
                            {adminSessions.map((session) => (
                                <div
                                    key={session.sessionId}
                                    onClick={() => {
                                        setActiveSession(session);
                                        fetchMessages(session.sessionId);
                                    }}
                                    className="bg-zinc-50 border border-zinc-200 p-5 rounded-2xl cursor-pointer hover:border-[#5331EA] transition-all flex justify-between items-center"
                                >
                                    <div>
                                        <h3 className="font-bold text-lg">{session.userName}</h3>
                                        <p className="text-sm text-zinc-500">{session.userEmail}</p>
                                        <p className="text-sm text-[#5331EA] mt-1 italic">"{session.lastMessage}"</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2 text-xs text-zinc-400">
                                        <span>{new Date(session.updatedAt).toLocaleTimeString()}</span>
                                        {session.unreadCount && (
                                            <span className="bg-[#5331EA] text-white w-5 h-5 flex items-center justify-center rounded-full mt-1">
                                                {session.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center">
            <header className="w-full h-[75px] bg-white border-b border-[#D9D9D9] flex items-center justify-center relative z-50">
                <div className="absolute left-6">
                    <button onClick={() => { if (isAdmin) setActiveSession(null); else setSelectedCategory(null); }} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                </div>
                <div className="relative w-[159px] h-[40px]">
                    <Image src="/ticpin-logo-black.png" alt="TICPIN Logo" fill className="object-contain" />
                </div>
            </header>

            <main className="max-w-[1440px] w-full h-[calc(100vh-75px)] p-10 flex flex-col items-center">
                <h1 className="text-[34px] font-semibold text-black mb-6">Chat with us</h1>
                <div className="text-xl font-medium text-[#5331EA] mb-4">Today</div>

                <div className="w-full max-w-[1363px] h-[510px] bg-[#F0F0F0] rounded-[30px] relative overflow-hidden flex flex-col shadow-inner">
                    <div className="flex-1 p-10 overflow-y-auto space-y-6 scrollbar-hide">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex items-start gap-4 ${msg.sender === 'admin' ? 'justify-start' : 'justify-end'}`}>
                                {msg.sender === 'admin' && (
                                    <div className="w-[38px] h-[38px] bg-[#E5E0FC] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                        <Image src="/admin panel/chatSupport/Ellipse 29.svg" alt="Support" width={38} height={38} />
                                    </div>
                                )}
                                <div className={`max-w-[70%] flex flex-col ${msg.sender === 'admin' ? 'items-start' : 'items-end'}`}>
                                    <div className={`p-4 rounded-2xl relative ${msg.sender === 'admin' ? 'bg-[#D8D3EF] text-black rounded-tl-none' : 'bg-[#5331EA] text-white rounded-tr-none shadow-md'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[12px] font-bold">{msg.sender === 'admin' ? 'Ticpin' : 'You'}</span>
                                            {msg.sender === 'admin' && <span className="text-[8px] opacity-60">Interactive Assistant</span>}
                                        </div>
                                        <p className="text-sm">{msg.message}</p>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ))}
                        
                        {messages.length < 3 && !isAdmin && questions.length > 0 && (
                            <div className="ml-[54px] w-[220px] bg-white border border-[#5331EA]/40 rounded-[10px] overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2">
                                <div className="bg-[#D8D3EF] p-3 text-[12px] text-black">Please select the issue that you need support with:</div>
                                <div className="flex flex-col">
                                    {questions.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendMessageWithContent(q.question)}
                                            className="px-3 py-2 text-[12px] text-black text-left hover:bg-[#5331EA10] transition-colors border-t border-[#5331EA]/10"
                                        >
                                            {q.question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 pb-10 flex items-center gap-5 justify-center bg-zinc-50/50">
                        <Plus className="text-zinc-400 hover:text-black cursor-pointer rotate-90" size={24} />
                        <div className="flex-1 max-w-[1080px] h-[50px] bg-white border border-[#5331EA] rounded-full px-6 flex items-center shadow-sm">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type your message here"
                                className="w-full bg-transparent border-none outline-none text-[15px] text-black"
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim()}
                            className="w-[50px] h-[50px] bg-[#5331EA] text-white rounded-full flex items-center justify-center transition-all hover:bg-[#4227c0] active:scale-95 disabled:opacity-50"
                        >
                            <Send size={24} />
                        </button>
                    </div>
                </div>

                <div className="mt-8 w-full max-w-[760px] bg-[#5331EA15] border border-[#5331EA] rounded-[10px] flex items-center px-4 py-2 gap-3">
                    <Info className="text-[#5331EA]" size={24} />
                    <p className="text-[15px] font-medium text-black">
                        Can’t find an option that properly describes your issue? Email <a href="mailto:support@ticpin.in" className="hover:underline">support@ticpin.in</a> and we’ll assist you.
                    </p>
                </div>
            </main>
        </div>
    );
}
