'use client';

import React from 'react';
import { ChevronLeft, ArrowLeft } from 'lucide-react';

interface ProfileHeaderProps {
    title: string;
    onBack: () => void;
    showBackButton?: boolean;
    onClose: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ title, onBack, showBackButton = true }) => {
    return (
        <div className="flex items-center gap-6 px-8 pt-10 pb-6 bg-white shrink-0">
            {showBackButton && (
                <button onClick={onBack} className="p-2 -ml-2 text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
                    {title === 'Profile' ? (
                        <ChevronLeft size={32} strokeWidth={2.5} />
                    ) : (
                        <ArrowLeft size={32} strokeWidth={2.5} />
                    )}
                </button>
            )}
            <h3 className="text-[32px] text-zinc-900 font-bold tracking-tight">{title}</h3>
        </div>
    );
};

export default ProfileHeader;
