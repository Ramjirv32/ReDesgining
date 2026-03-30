'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, AlertTriangle, Clock, CheckCircle, Upload, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';

interface Organizer {
    id: string;
    name: string;
    email: string;
    pan_card_public_id?: string;
    pan_card_uploaded_at?: string;
    pan_card_status?: string;
    panCardUrl?: string;
}

export default function PANCardPage() {
    const params = useParams();
    const router = useRouter();
    const organizerId = params.id as string;
    
    const [organizer, setOrganizer] = useState<Organizer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [panUrl, setPanUrl] = useState('');
    const [urlLoading, setUrlLoading] = useState(false);
    const [urlError, setUrlError] = useState('');
    const [showImage, setShowImage] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        if (!organizerId) {
            setError('Organizer ID is required');
            setLoading(false);
            return;
        }

        loadOrganizer();
    }, [organizerId]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const loadOrganizer = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/backend/api/admin/organizers/${organizerId}`);
            if (!response.ok) {
                throw new Error('Failed to load organizer');
            }
            const data = await response.json();
            setOrganizer(data.organizer || data); // Wrapper fallback if already unwrapped
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load organizer');
        } finally {
            setLoading(false);
        }
    };

    const generateSignedUrl = async () => {
        try {
            setUrlLoading(true);
            setUrlError('');
            setShowImage(false);
            
            const response = await fetch(`/backend/api/admin/organizers/${organizerId}/pan-card`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate URL');
            }
            
            const data = await response.json();
            setPanUrl(data.url);
            setTimeLeft(data.expires_in);
            setShowImage(true);
        } catch (err) {
            setUrlError(err instanceof Error ? err.message : 'Failed to generate URL');
        } finally {
            setUrlLoading(false);
        }
    };

    const formatTimeLeft = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only JPG, PNG, and PDF files are allowed');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('pan_card', file);

            const response = await fetch(`/backend/api/admin/organizers/${organizerId}/pan-card`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            await loadOrganizer(); // Reload organizer data
            setError('');
            alert('PAN card uploaded successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this PAN card? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/backend/api/admin/organizers/${organizerId}/pan-card`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Delete failed');
            }

            await loadOrganizer(); // Reload organizer data
            setPanUrl('');
            setShowImage(false);
            setError('');
            alert('PAN card deleted successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
        }
    };

    const secureLegacyRecord = async () => {
        if (!confirm('This will move the legacy public PAN card to secure authenticated storage. Continue?')) {
            return;
        }

        try {
            setUrlLoading(true);
            const response = await fetch(`/backend/api/admin/organizers/${organizerId}/pan-card/secure`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Security upgrade failed');
            }

            alert('PAN card migrated to secure storage successfully!');
            await loadOrganizer();
            setPanUrl('');
            setShowImage(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Security upgrade failed');
        } finally {
            setUrlLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading organizer...</p>
                </div>
            </div>
        );
    }

    if (error && !organizer) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="h-6 w-6 text-blue-600" />
                                PAN Card Management
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Organizer: {organizer?.name} ({organizer?.email})
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/admin/organizers')}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                            ← Back to Organizers
                        </button>
                    </div>
                </div>

                {/* PAN Card Status */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">PAN Card Status</h2>
                        {organizer?.pan_card_status && (
                            <div className="flex items-center gap-2">
                                {!organizer.pan_card_public_id && organizer.panCardUrl && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                        LEGACY URL
                                    </span>
                                )}
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    organizer.pan_card_status === 'uploaded' 
                                        ? 'bg-green-100 text-green-800'
                                        : organizer.pan_card_status === 'deleted'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {organizer.pan_card_status.charAt(0).toUpperCase() + organizer.pan_card_status.slice(1)}
                                </span>
                            </div>
                        )}
                    </div>

                    {organizer?.pan_card_uploaded_at || organizer?.panCardUrl ? (
                        <div className="flex flex-col gap-2">
                            {organizer?.pan_card_uploaded_at && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    Uploaded on: {new Date(organizer.pan_card_uploaded_at).toLocaleString()}
                                </div>
                            )}
                            {!organizer?.pan_card_public_id && organizer?.panCardUrl && (
                                <p className="text-xs text-gray-400 italic">
                                    Note: This PAN card was uploaded using an older system. Secure features like 5-minute expiry may not apply.
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500">No PAN card uploaded</p>
                    )}
                </div>

                {/* Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Generate Signed URL */}
                        <button
                            onClick={generateSignedUrl}
                            disabled={(!organizer?.pan_card_public_id && !organizer?.panCardUrl) || urlLoading}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Eye className="h-4 w-4" />
                            {urlLoading ? 'Generating...' : 'View PAN Card'}
                        </button>

                        {/* Upload PAN Card */}
                        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                            <Upload className="h-4 w-4" />
                            Upload PAN Card
                            <input
                                type="file"
                                accept="image/jpeg,image/png,application/pdf"
                                onChange={handleUpload}
                                className="hidden"
                            />
                        </label>

                        {/* Delete PAN Card */}
                        <button
                            onClick={handleDelete}
                            disabled={!organizer?.pan_card_public_id && !organizer?.panCardUrl}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete PAN Card
                        </button>
                    </div>

                    {/* Security Upgrade for Legacy Records */}
                    {!organizer?.pan_card_public_id && organizer?.panCardUrl && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Shield className="h-5 w-5 text-blue-600 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-blue-900">Security Upgrade Available</h3>
                                    <p className="text-sm text-blue-700 mt-1">
                                        This record uses a public URL. Upgrade now to move it to secure, authenticated storage with time-limited links.
                                    </p>
                                    <button
                                        onClick={secureLegacyRecord}
                                        disabled={urlLoading}
                                        className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Upgrade to Secure Storage
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* URL Timer */}
                    {timeLeft > 0 && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-800">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Secure URL expires in: {formatTimeLeft(timeLeft)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                </div>

                {/* PAN Card Preview */}
                {showImage && panUrl && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">PAN Card Preview</h2>
                            <button
                                onClick={() => setShowImage(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <EyeOff className="h-4 w-4" />
                            </button>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            {panUrl.endsWith('.pdf') ? (
                                <iframe
                                    src={panUrl}
                                    className="w-full h-96"
                                    title="PAN Card PDF"
                                />
                            ) : (
                                <img
                                    src={panUrl}
                                    alt="PAN Card"
                                    className="w-full h-auto max-h-96 object-contain"
                                />
                            )}
                        </div>
                        
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                            <Shield className="h-4 w-4" />
                            <span>This is a secure, time-limited URL. Do not share.</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
