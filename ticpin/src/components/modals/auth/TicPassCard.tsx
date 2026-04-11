'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TicPassCardProps {
    pass: any;
    onClose: () => void;
}

const TicPassCard: React.FC<TicPassCardProps> = ({ pass, onClose }) => {
    const router = useRouter();

    if (!pass) return null;

    return (
        <div className="rounded-[40px] p-8 text-white shadow-2xl shadow-purple-500/20 relative overflow-hidden bg-gradient-to-br from-[#7B2FF7] to-[#3A1A8C] mx-2">
            <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                    <p className="text-white/60 text-[12px] uppercase font-black tracking-widest leading-none mb-3">Ticpin Pass</p>
                    <p className="text-3xl font-black">{pass.name || 'Member'}</p>
                </div>
                <div className="text-right">
                    <p className="text-white/60 text-[12px] uppercase font-black tracking-widest leading-none mb-3">Valid Till</p>
                    <p className="font-bold text-lg">{new Date(pass.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
            </div>
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10">
                    <CheckCircle2 size={18} className="text-green-300" />
                    <span className="text-[12px] font-black uppercase tracking-widest leading-none mt-0.5">Active Member</span>
                </div>
                <button
                    onClick={() => { router.push('/pass'); onClose(); }}
                    className="text-[13px] font-black uppercase tracking-wider bg-white text-[#7B2FF7] hover:bg-zinc-100 px-6 py-3 rounded-2xl transition-all shadow-lg active:scale-95"
                >
                    Manage Pass
                </button>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl" />
        </div>
    );
};

export default TicPassCard;
