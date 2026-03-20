'use client';

import { X, LogOut, User } from 'lucide-react';

interface OrganizerLogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    organizerName?: string;
}

export default function OrganizerLogoutModal({ isOpen, onClose, onConfirm, organizerName }: OrganizerLogoutModalProps) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onClose();
        onConfirm();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] w-full max-w-md mx-auto shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <LogOut className="w-5 h-5 text-orange-600" />
                        </div>
                        <h2 className="text-[18px] font-semibold text-black">Switch to User Account</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-zinc-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-4">
                        <p className="text-[15px] text-zinc-700 leading-relaxed">
                            You're currently logged in as an organizer. To make a booking, you need to switch to a user account.
                        </p>
                        
                        {organizerName && (
                            <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-zinc-500" />
                                    <span className="text-zinc-600">Current account:</span>
                                    <span className="font-medium text-zinc-900">{organizerName}</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>What happens:</strong> You'll be logged out as organizer and can login as a regular user to complete your booking.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 h-[48px] bg-white border border-zinc-300 text-zinc-700 rounded-[12px] font-medium text-[15px] hover:bg-zinc-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 h-[48px] bg-black text-white rounded-[12px] font-medium text-[15px] hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Continue as User
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
