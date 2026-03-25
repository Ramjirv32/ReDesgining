'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useIdentityStore } from '@/store/useIdentityStore';
import { toast } from '@/components/ui/Toast';

import { ChevronLeft, Plus, Send, Info, Paperclip, X, FileText, Image as ImageIcon, Mic } from 'lucide-react';

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
    fileUrl?: string;
    fileType?: 'image' | 'pdf';
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
    status?: 'pending' | 'active' | 'closed';
}

export default function ChatSupportClient() {
    const router = useRouter();
    const { userSession, organizerSession, sync } = useIdentityStore();
    const effectiveSession = organizerSession || userSession;
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    const [isTyping, setIsTyping] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [sessionStatus, setSessionStatus] = useState<'pending' | 'active' | 'closed'>('pending');
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [confirmingCategory, setConfirmingCategory] = useState<SupportOption | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [userExistingSessions, setUserExistingSessions] = useState<Map<string, ChatSession>>(new Map());
    const [isListening, setIsListening] = useState(false);

    const isAdmin = userSession?.phone === '6383667872' || (organizerSession?.isAdmin === true);

    // Fetch all existing sessions for the user on mount
    useEffect(() => {
        if (effectiveSession?.id && !isAdmin) {
            const categories = ['dining', 'event', 'play'];
            const sessionMap = new Map<string, ChatSession>();

            Promise.all(
                categories.map(category =>
                    fetch(`/backend/api/chat/sessions?userId=${effectiveSession.id}&category=${category}`, { credentials: 'include' })
                        .then(res => res.json())
                        .then(data => {
                            if (data.sessions && data.sessions.length > 0) {
                                const existingSession = data.sessions.find((s: ChatSession) =>
                                    s.status === 'pending' || s.status === 'active'
                                );
                                if (existingSession) {
                                    sessionMap.set(category, existingSession);
                                }
                            }
                        })
                        .catch(err => console.error(`Failed to check existing sessions for ${category}:`, err))
                )
            ).then(() => {
                setUserExistingSessions(sessionMap);
            });
        }
    }, [effectiveSession?.id, isAdmin]);

    useEffect(() => {
        if (selectedCategory) {
            fetch(`/backend/api/chat/questions?category=${selectedCategory}`)
                .then(r => r.json())
                .then(d => setQuestions(Array.isArray(d) ? d : []));

            // Check for existing session for this category
            if (effectiveSession?.id) {
                fetch(`/backend/api/chat/sessions?userId=${effectiveSession.id}&category=${selectedCategory}`, { credentials: 'include' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.sessions && data.sessions.length > 0) {
                            const existingSession = data.sessions.find((s: ChatSession) =>
                                s.status === 'pending' || s.status === 'active'
                            );
                            if (existingSession) {
                                setActiveSession(existingSession);
                                setSessionStatus(existingSession.status);
                                fetchMessages(existingSession.sessionId);
                            }
                        }
                    })
                    .catch(err => console.error('Failed to check existing sessions:', err));
            }
        }
    }, [selectedCategory, effectiveSession?.id]);

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
        if (!effectiveSession?.id) {
            console.error('Session not found');
            return;
        }

        // Double check if user already has an active session in this category
        const existingSession = userExistingSessions.get(category);
        if (existingSession) {
            // Redirect to existing session instead of creating new one
            setActiveSession(existingSession);
            setSessionStatus(existingSession.status || 'pending');
            fetchMessages(existingSession.sessionId);
            return;
        }

        console.log('Starting chat with category:', category);
        setLoading(true);
        try {
            const res = await fetch('/backend/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: effectiveSession?.id,
                    userName: (effectiveSession as any)?.name || (effectiveSession?.email ? effectiveSession.email.split('@')[0] : 'User'),
                    userEmail: effectiveSession?.email || (effectiveSession as any)?.phone || '',
                    userType: organizerSession ? 'organizer' : 'user',
                    category: category
                }),
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setActiveSession(data);
                setSessionStatus(data.status || 'pending');

                // Update the userExistingSessions map to include the new session
                setUserExistingSessions(prev => new Map(prev).set(category, data));

                if (data.status === 'active') {
                    // Only simulate typing for active sessions
                    setIsTyping(true);
                    setTimeout(() => {
                        setIsTyping(false);
                        fetchMessages(data.sessionId);
                    }, 1500);
                } else {
                    // Fetch messages immediately for pending sessions
                    fetchMessages(data.sessionId);
                }
            }
        } catch (error) {
            console.error('Failed to start chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (sessionId: string) => {
        if (!effectiveSession?.id) {
            console.error('Session not found');
            return;
        }

        try {
            const res = await fetch(`/backend/api/chat/sessions/${sessionId}/messages?admin=${isAdmin}&userId=${effectiveSession.id}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();

                // Check if session has been terminated
                if (Array.isArray(data) && data.length > 0) {
                    const lastMessage = data[data.length - 1];
                    if (lastMessage.sender === 'system' && (lastMessage.message.includes('ended by') || lastMessage.message.includes('closed by'))) {
                        // Session ended - disable input and show terminated message
                        setMessages(data);
                        setSessionStatus('closed');

                        // Remove from existing sessions map since it's now closed
                        if (activeSession && selectedCategory) {
                            setUserExistingSessions(prev => {
                                const newMap = new Map(prev);
                                newMap.delete(selectedCategory);
                                return newMap;
                            });
                        }
                        return;
                    }
                }

                if (Array.isArray(data)) {
                    setMessages(data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    // Auto-poll for new messages every 15 seconds
    useEffect(() => {
        if (!activeSession?.sessionId) return;

        const interval = setInterval(() => {
            fetchMessages(activeSession.sessionId);
        }, 15000); // Poll every 15 seconds instead of 5

        return () => clearInterval(interval);
    }, [activeSession?.sessionId, effectiveSession?.id]);

    const handleSendMessageWithContent = async (content: string, previewUrl?: string, fileType?: string, filesToUpload: File[] = []) => {
        if (!content.trim() && filesToUpload.length === 0) return;
        if (!activeSession || !effectiveSession?.id) return;

        // Optimistic update
        const userMsg = {
            message: content,
            sender: isAdmin ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
            fileUrl: previewUrl,
            fileType: fileType
        };
        setMessages(prev => [...prev, userMsg]);

        setUploadingFiles(true);
        try {
            const formData = new FormData();
            formData.append('userId', effectiveSession.id);
            formData.append('userEmail', effectiveSession.email || (effectiveSession as any).phone || '');
            formData.append('userType', organizerSession ? 'organizer' : 'user');
            formData.append('message', content);
            formData.append('sender', isAdmin ? 'admin' : 'user');

            // Add file if any
            if (filesToUpload.length > 0) {
                formData.append('file0', filesToUpload[0]);
            }

            const res = await fetch(`/backend/api/chat/sessions/${activeSession.sessionId}/messages`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (res.ok) {
                // Refresh messages after sending to get permanent URLs
                fetchMessages(activeSession.sessionId);
            }

            // Update status message after sending
            if (sessionStatus === 'pending') {
                setSessionStatus('pending');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setUploadingFiles(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() && attachedFiles.length === 0) return;

        const file = attachedFiles.length > 0 ? attachedFiles[0] : null;
        const fileUrl = file ? URL.createObjectURL(file) : undefined;
        const fileType = file ? (file.type.startsWith('image/') ? 'image' : 'pdf') : undefined;

        const currentMessage = inputValue;
        const currentFiles = [...attachedFiles];

        setInputValue('');
        setAttachedFiles([]);
        setFilePreview(null);

        await handleSendMessageWithContent(currentMessage, fileUrl, fileType, currentFiles);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const file = files[0];
        const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
        const isValidSize = file.size <= 10 * 1024 * 1024;

        if (isValidType && isValidSize) {
            setAttachedFiles([file]);
            if (file.type.startsWith('image/')) {
                setFilePreview(URL.createObjectURL(file));
            } else {
                setFilePreview(null);
            }
        } else {
            toast.warning('Invalid file type or size. Please upload images or PDFs up to 10MB.');
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
        setFilePreview(null);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.warning("Speech recognition is not supported in this browser. Please try Chrome, Safari, or Brave.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                setInputValue(transcript);
                // Auto send voice message
                handleSendMessageWithContent(transcript);
            }
        };

        recognition.start();
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
                                    if (isAdmin) {
                                        setSelectedCategory(option.category);
                                        fetchAdminSessions(option.category);
                                    } else {
                                        // Check if user already has an active session in this category
                                        const existingSession = userExistingSessions.get(option.category);
                                        if (existingSession) {
                                            // Redirect to existing session instead of creating new one
                                            setSelectedCategory(option.category);
                                            setActiveSession(existingSession);
                                            setSessionStatus(existingSession.status || 'pending');
                                            fetchMessages(existingSession.sessionId);
                                        } else {
                                            setConfirmingCategory(option);
                                        }
                                    }
                                }}
                                className={`w-[193px] h-[210px] rounded-[40px] flex flex-col items-center justify-center transition-colors ${isAdmin ? 'bg-[#E1E1E1] cursor-pointer hover:bg-zinc-200' :
                                        userExistingSessions.has(option.category) ? 'bg-[#5331EA20] cursor-not-allowed opacity-60' : 'bg-[#E1E1E1] cursor-pointer hover:bg-zinc-200'
                                    }`}
                            >
                                <div className="mb-4">
                                    <Image src={option.icon} alt={option.title} width={option.width} height={option.height} className="object-contain" />
                                </div>
                                <span className="text-[25px] font-medium text-black text-center px-4 leading-tight">{option.title}</span>
                                {!isAdmin && userExistingSessions.has(option.category) && (
                                    <div className="mt-2 px-3 py-1 bg-[#5331EA] text-white text-[10px] rounded-full font-medium">
                                        Active Ticket
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Confirmation Modal */}
                    {confirmingCategory && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                            <div className="bg-white rounded-[30px] p-8 max-w-[400px] w-full shadow-2xl animate-in zoom-in-95 duration-200">
                                <div className="w-16 h-16 bg-[#5331EA10] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Image src={confirmingCategory.icon} alt={confirmingCategory.title} width={32} height={32} />
                                </div>
                                <h3 className="text-[22px] font-bold text-center mb-2">Raise a ticket?</h3>
                                <p className="text-zinc-500 text-center mb-8">
                                    Do you want to raise a {confirmingCategory.title.toLowerCase()} ticket and speak with our team?
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            setSelectedCategory(confirmingCategory.category);
                                            startUserChat(confirmingCategory.category);
                                            setConfirmingCategory(null);
                                        }}
                                        className="w-full h-[54px] bg-[#5331EA] text-white rounded-full font-bold hover:bg-[#4529c9] transition-colors shadow-md shadow-[#5331EA20]"
                                    >
                                        Yes, confirm
                                    </button>
                                    <button
                                        onClick={() => setConfirmingCategory(null)}
                                        className="w-full h-[54px] bg-white border border-[#D9D9D9] text-black rounded-full font-bold hover:bg-zinc-50 transition-colors"
                                    >
                                        No, go back
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info message about existing tickets */}
                    {!isAdmin && userExistingSessions.size > 0 && (
                        <div className="w-full max-w-[740px] bg-blue-50 border border-blue-200 rounded-[10px] flex items-center px-4 py-3 mb-4">
                            <Info className="text-blue-600" size={20} />
                            <p className="text-[14px] font-medium text-blue-800 ml-3">
                                You already have active tickets. Click on a category with an "Active Ticket" badge to continue your conversation.
                            </p>
                        </div>
                    )}

                    <div className="w-full max-w-[740px] bg-[#5331EA15] border border-[#5331EA] rounded-[10px] flex items-center px-4 py-3 gap-3">
                        <Info className="text-[#5331EA]" size={24} />
                        <p className="text-[15px] font-medium text-black">
                            Can't find an option that properly describes your issue? Email <a href="mailto:support@ticpin.in" className="hover:underline">support@ticpin.in</a> and we'll assist you.
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
                        {Array.isArray(messages) && messages.map((msg, idx) => (
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
                                        {msg.message && <p className="text-sm mb-2">{msg.message}</p>}

                                        {/* Display file attachment */}
                                        {msg.fileUrl && (
                                            <div className="mt-1">
                                                {msg.fileType === 'image' ? (
                                                    <div className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-white/30 shadow-md bg-zinc-900 flex items-center justify-center min-h-[180px] w-full max-w-[320px]"
                                                        onClick={() => {
                                                            const fullUrl = msg.fileUrl?.startsWith('blob:') ? msg.fileUrl : msg.fileUrl?.startsWith('http') ? msg.fileUrl : `/backend${msg.fileUrl}`;
                                                            setLightboxImage(fullUrl);
                                                        }}>
                                                        <img
                                                            src={msg.fileUrl?.startsWith('blob:') ? msg.fileUrl : msg.fileUrl?.startsWith('http') ? msg.fileUrl : `/backend${msg.fileUrl}`}
                                                            alt="Shared image"
                                                            className="max-w-full max-h-[250px] object-cover transition-all duration-500 group-hover:scale-105"
                                                            onLoad={(e) => {
                                                                const img = e.target as HTMLImageElement;
                                                                img.style.opacity = '1';
                                                            }}
                                                            style={{ opacity: 0 }}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                            }}
                                                        />
                                                        {/* Preview Overlay */}
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-[12px] font-medium flex items-center gap-2 border border-white/20">
                                                                <ImageIcon size={14} /> View Full
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 cursor-pointer hover:bg-white/20 transition-all shadow-sm w-full max-w-[280px]"
                                                        onClick={() => window.open(msg.fileUrl?.startsWith('blob:') ? msg.fileUrl : msg.fileUrl?.startsWith('http') ? msg.fileUrl : `/backend${msg.fileUrl}`, '_blank')}>
                                                        <div className="w-9 h-9 bg-red-500/80 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs font-bold block truncate">PDF Document</span>
                                                            <span className="text-[10px] opacity-70">Tap to open</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-start gap-4 justify-start">
                                <div className="w-[38px] h-[38px] bg-[#E5E0FC] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <Image src="/admin panel/chatSupport/Ellipse 29.svg" alt="Support" width={38} height={38} />
                                </div>
                                <div className="bg-[#D8D3EF] p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 min-w-[70px]">
                                    <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}

                        {messages.length < 3 && !isAdmin && questions.length > 0 && (
                            <div className="ml-[54px] w-[220px] bg-white border border-[#5331EA]/40 rounded-[10px] overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2">
                                <div className="bg-[#D8D3EF] p-3 text-[12px] text-black">Please select the issue that you need support with:</div>
                                <div className="flex flex-col">
                                    {questions.slice(0, 2).map((q, i) => (
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

                    {/* Attached Files Preview */}
                    {attachedFiles.length > 0 && (
                        <div className="px-10 pb-4">
                            <div className="flex flex-wrap gap-2 justify-end">
                                {attachedFiles.map((file, index) => (
                                    <div key={index} className="flex flex-col gap-2 bg-white border border-[#5331EA]/30 rounded-2xl p-3 shadow-lg animate-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-3">
                                            {file.type.startsWith('image/') ? (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-100 flex-shrink-0">
                                                    {filePreview && <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />}
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <FileText size={24} className="text-red-500" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0 pr-8 relative">
                                                <p className="text-[13px] font-bold text-black truncate">{file.name}</p>
                                                <p className="text-[11px] text-zinc-500">{formatFileSize(file.size)}</p>
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                                                    title="Remove file"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-8 pb-10 flex items-center gap-5 justify-center bg-zinc-50/50">
                        {sessionStatus === 'pending' ? (
                            <>
                                <div className="text-center mb-4">
                                    <span className="text-[15px] font-medium text-[#5331EA]">
                                        {messages.length > 1 ? 'Ticket raised and sent for approval...' : 'Ticket raised. Waiting for admin approval...'}
                                    </span>
                                    <p className="text-[13px] text-[#686868] mt-2">Please describe your issue in detail below. Our team will respond within 2-3 hours.</p>
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-zinc-400 hover:text-black cursor-pointer transition-colors mr-3"
                                    title="Attach file (images or PDFs, max 10MB)"
                                >
                                    <Paperclip size={24} />
                                </button>
                                <button
                                    onClick={startListening}
                                    className={`cursor-pointer transition-all mr-3 ${isListening ? 'text-red-500 animate-pulse scale-110' : 'text-zinc-400 hover:text-[#5331EA]'}`}
                                    title="Voice message (Speech to Text)"
                                >
                                    <Mic size={24} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <div className="flex-1 max-w-[1080px] h-[50px] bg-white border border-[#5331EA] rounded-full px-6 flex items-center shadow-sm">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Describe your issue in detail..."
                                        className="w-full bg-transparent border-none outline-none text-[15px] text-black"
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={(!inputValue.trim() && attachedFiles.length === 0) || uploadingFiles}
                                    className="w-[50px] h-[50px] bg-[#5331EA] text-white rounded-full flex items-center justify-center transition-all hover:bg-[#4227c0] active:scale-95 disabled:opacity-50"
                                    title={attachedFiles.length > 0 ? `Send ${attachedFiles[0].name}` : "Send your query"}
                                >
                                    {uploadingFiles ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Send size={24} />
                                    )}
                                </button>
                            </>
                        ) : sessionStatus === 'closed' ? (
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[15px] font-medium text-zinc-500">This conversation has ended</span>
                                <button
                                    onClick={() => {
                                        setActiveSession(null);
                                        setSelectedCategory(null);
                                        setMessages([]);
                                        setSessionStatus('pending');
                                    }}
                                    className="px-6 py-2 bg-[#5331EA] text-white rounded-full text-[14px] font-medium hover:bg-[#4529c9] transition-colors"
                                >
                                    Raise New Ticket
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-zinc-400 hover:text-black cursor-pointer transition-colors"
                                    title="Attach file (images or PDFs, max 10MB)"
                                >
                                    <Paperclip size={24} />
                                </button>
                                <button
                                    onClick={startListening}
                                    className={`cursor-pointer transition-all ml-4 ${isListening ? 'text-red-500 animate-pulse scale-110' : 'text-zinc-400 hover:text-[#5331EA]'}`}
                                    title="Voice message (Speech to Text)"
                                >
                                    <Mic size={24} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
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
                                    disabled={(!inputValue.trim() && attachedFiles.length === 0) || uploadingFiles}
                                    className="w-[50px] h-[50px] bg-[#5331EA] text-white rounded-full flex items-center justify-center transition-all hover:bg-[#4227c0] active:scale-95 disabled:opacity-50"
                                    title={attachedFiles.length > 0 ? `Send ${attachedFiles[0].name}` : "Send message"}
                                >
                                    {uploadingFiles ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Send size={24} />
                                    )}
                                </button>
                            </>
                        )}
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
                            <X size={32} />
                        </button>
                        <img
                            src={lightboxImage || ''}
                            alt="Full size"
                            className="max-w-[95vw] max-h-[90vh] object-contain shadow-2xl animate-in zoom-in-95 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

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
