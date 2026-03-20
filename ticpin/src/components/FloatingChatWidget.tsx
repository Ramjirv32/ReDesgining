'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Square, Maximize2 } from 'lucide-react';

import { useIdentityStore } from '@/store/useIdentityStore';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'support';
    time: string;
}

interface FloatingChatWidgetProps {
    onOpenFullChat?: () => void;
}

export default function FloatingChatWidget({ onOpenFullChat }: FloatingChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { userSession, organizerSession } = useIdentityStore();
    const effectiveSession = organizerSession || userSession;

    // Load history or initialize session
    useEffect(() => {
        const initializeSession = async () => {
            const savedSessionId = sessionStorage.getItem('ticpin_chat_session_id');
            const savedHistory = sessionStorage.getItem('ticpin_chat_history');

            if (savedHistory) {
                setMessages(JSON.parse(savedHistory));
            } else {
                setMessages([
                    { id: 1, text: "Hi! I'm your Ticpin Assistant. How can I help you today?", sender: 'support', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                ]);
            }

            if (savedSessionId) {
                setSessionId(savedSessionId);
            } else {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/sessions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: effectiveSession?.id || 'guest',
                            userEmail: effectiveSession?.email || 'guest@ticpin.in',
                            userName: (effectiveSession as any)?.name || 'Guest',
                            userType: organizerSession ? 'organizer' : 'user',
                            category: 'general'
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setSessionId(data.sessionId);
                        sessionStorage.setItem('ticpin_chat_session_id', data.sessionId);
                    }
                } catch (e) {
                    console.error('Failed to create chat session:', e);
                }
            }
        };

        if (isOpen) initializeSession();
    }, [isOpen, effectiveSession]);

    // Save history to session storage
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem('ticpin_chat_history', JSON.stringify(messages));
        }
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleOpenFullChat = () => {
        window.location.href = '/chat-support';
    };

    const stopChat = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsTyping(false);
        }
    };

    const handleSendMessage = async (textOverride?: string) => {
        const msgToSend = textOverride || message;
        if (!msgToSend.trim() || isTyping) return;

        const userMessage: Message = {
            id: Date.now(),
            text: msgToSend,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        if (!textOverride) setMessage('');
        setIsTyping(true);

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const response = await fetch('/api/chat/groq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortController.signal,
                body: JSON.stringify({
                    message: msgToSend,
                    conversationHistory: messages.slice(-10),
                    sessionId: sessionId,
                    userData: {
                        id: effectiveSession?.id,
                        email: effectiveSession?.email,
                        type: organizerSession ? 'organizer' : 'user'
                    }
                })
            });
            // ,

            if (!response.ok) throw new Error('Failed to get response');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            if (reader) {
                const assistantMessageId = Date.now() + 1;
                setMessages(prev => [...prev, {
                    id: assistantMessageId,
                    text: '',
                    sender: 'support',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;
                            
                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content || '';
                                if (content) {
                                    fullResponse += content;
                                    // Faster updates by direct mapping
                                    setMessages(prev => prev.map(msg => 
                                        msg.id === assistantMessageId ? { ...msg, text: fullResponse } : msg
                                    ));
                                }
                            } catch (e) {}
                        }
                    }
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted');
            } else {
                console.error('Chat error:', error);
                setMessages(prev => [...prev, {
                    id: Date.now() + 2,
                    text: "Sorry, I lost connection. Please check your internet and try again.",
                    sender: 'support',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }
        } finally {
            setIsTyping(false);
            abortControllerRef.current = null;
        }
    };

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group relative ring-4 ring-black/5"
                >
                    <MessageCircle size={28} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                        How can I help you?
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-[350px] h-[550px] bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border border-zinc-100 animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-black text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center ring-1 ring-white/20">
                        <MessageCircle size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[16px]">Ticpin AI</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <p className="text-[11px] font-medium opacity-70">Always Online</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleOpenFullChat} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="Full screen">
                        <Maximize2 size={18} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-[#FAFAFA] scroll-smooth">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                            <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                                msg.sender === 'user' 
                                    ? 'bg-black text-white rounded-br-none font-medium' 
                                    : 'bg-white text-zinc-800 rounded-bl-none border border-zinc-100'
                            }`}>
                                {msg.text === '' && msg.sender === 'support' ? (
                                    <div className="flex gap-1 py-1">
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                                    </div>
                                ) : msg.text}
                            </div>
                            <div className={`text-[10px] text-zinc-400 mt-1.5 font-bold uppercase tracking-wider ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                {msg.time}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-5 bg-white border-t border-zinc-100">
                {isTyping && (
                    <button 
                        onClick={stopChat}
                        className="mb-4 mx-auto flex items-center gap-2 px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full text-[11px] font-bold transition-all active:scale-95"
                    >
                        <Square size={10} fill="currentColor" /> Stop Generating
                    </button>
                )}
                
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 h-12 px-5 bg-zinc-100 rounded-2xl text-[14px] outline-none focus:ring-2 focus:ring-black/5 border-none font-medium placeholder:text-zinc-400"
                        disabled={isTyping}
                    />
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={!message.trim() || isTyping}
                        className="w-12 h-12 bg-black hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl transition-all flex items-center justify-center shadow-lg shadow-black/10 active:scale-90"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
