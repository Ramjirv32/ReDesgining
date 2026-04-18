'use client';

import React, { useState } from 'react';
import { MessageCircle, X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useIdentityStore } from '@/store/useIdentityStore';
import { toast } from '@/components/ui/Toast';

export default function FloatingChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const { userSession, organizerSession, sync } = useIdentityStore();
    const effectiveSession = organizerSession || userSession;
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Sync session on mount
    React.useEffect(() => {
        sync();
    }, [sync]);

    const [formData, setFormData] = useState({
        name: (effectiveSession as any)?.name || '',
        email: effectiveSession?.email || '',
        phone: (effectiveSession as any)?.phone || '',
        message: '',
        category: 'event' as 'dining' | 'event' | 'play'
    });

    // Update form when session is sync'd
    React.useEffect(() => {
        if (effectiveSession) {
            setFormData(prev => ({
                ...prev,
                name: prev.name || (effectiveSession as any)?.name || '',
                email: prev.email || effectiveSession?.email || '',
                phone: prev.phone || (effectiveSession as any)?.phone || ''
            }));
        }
    }, [effectiveSession]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            // Use a stable identifier for guest if not logged in
            const userId = effectiveSession?.id || `guest-${formData.email.replace(/[^a-zA-Z0-9]/g, '')}`;

            // Start a chat session (Raise a ticket)
            const sessionRes = await fetch('/backend/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    userName: formData.name,
                    userEmail: formData.email,
                    userType: organizerSession ? 'organizer' : 'user',
                    category: formData.category
                }),
                credentials: 'include'
            });

            if (!sessionRes.ok) {
                const errData = await sessionRes.json();
                throw new Error(errData.error || 'Failed to raise ticket session');
            }
            const sessionData = await sessionRes.json();

            // Send the initial message
            const messageFormData = new FormData();
            messageFormData.append('userId', userId);
            messageFormData.append('userEmail', formData.email);
            messageFormData.append('userType', organizerSession ? 'organizer' : 'user');
            messageFormData.append('message', formData.message);
            messageFormData.append('sender', 'user');

            const messageRes = await fetch(`/backend/api/chat/sessions/${sessionData.sessionId}/messages`, {
                method: 'POST',
                body: messageFormData,
                credentials: 'include'
            });

            if (!messageRes.ok) throw new Error('Failed to send support message');
            
            setSubmitted(true);
            toast.success('Support ticket raised successfully!');
            
            // Auto close after 3 seconds
            setTimeout(() => {
                setIsOpen(false);
                setSubmitted(false);
                setFormData(prev => ({ ...prev, message: '' }));
            }, 3000);
        } catch (error: any) {
            console.error('Support ticket error:', error);
            toast.error(error.message || 'Failed to raise ticket. Please try again.');
        } finally {
            setLoading(false);
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
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-[350px] overflow-hidden border border-zinc-100 animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-black text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center ring-1 ring-white/20">
                        <MessageCircle size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[16px]">Support Ticket</h3>
                        <p className="text-[11px] opacity-70">We'll get back to you soon</p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="p-6 bg-[#FAFAFA]">
                {submitted ? (
                    <div className="py-10 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={32} />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-zinc-900">Ticket Raised!</h4>
                            <p className="text-zinc-500 text-sm mt-1">Our team has been notified and will reach out to you shortly via email.</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full h-12 px-4 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="Your Name"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full h-12 px-4 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="Email Address"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full h-12 px-4 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="Contact Number (Optional)"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Category *</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['dining', 'event', 'play'] as const).map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, category: cat })}
                                        className={`h-10 rounded-xl text-xs font-bold capitalize transition-all border ${
                                            formData.category === cat 
                                                ? 'bg-black text-white border-black' 
                                                : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Message *</label>
                            <textarea
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[100px] resize-none"
                                placeholder="How can we help?"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : (
                                <>
                                    <span>Submit Ticket</span>
                                    <Send size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
