'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi, AdminListing, ListingStatus, uploadMedia } from '@/lib/api/admin';
import {
  X, RefreshCw, Trash2, ChevronRight, Search, User, Edit3, Save, 
  ImageOff, Check, Plus, Minus, Youtube, Instagram, ArrowLeft,
  ChevronDown, ChevronUp, PlusCircle, Upload, MapPin
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';


const CATEGORIES = ["Music", "Comedy", "Workshop", "Festival", "Meetup", "Exhibition"];
const CITIES = ["Chennai", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Coimbatore", "Salem", "Tiruppur"];
const CATEGORY_DATA: Record<string, string[]> = {
    "Music": ["Concert", "Club Gig", "Open Mic"],
    "Comedy": ["Standup", "Improv", "Special"],
    "Workshop": ["Art", "Tech", "Business"],
    "Festival": ["Food", "Cultural", "Music"],
    "Meetup": ["Networking", "Hobby", "Support"],
    "Exhibition": ["Art", "Trade", "Museum"]
};

// --- Detail View (Organizer Style matching Play) ---
function AdminEventDetailView({ ev, onStatus, onUpdate, onDelete, onBack }: {
  ev: AdminListing;
  onStatus: (id: string, status: ListingStatus) => void;
  onUpdate: (id: string, payload: Partial<AdminListing>) => Promise<void>;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
    const id = ev._id || ev.id || '';
    const editorRef = useRef<HTMLDivElement>(null);

    // --- State Management ---
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    // Form Fields
    const [eventName, setEventName] = useState(ev.name || '');
    const [venueName, setVenueName] = useState(ev.venue_name || '');
    const [venueAddress, setVenueAddress] = useState(ev.venue_address || ev.address || '');
    const [instagramLink, setInstagramLink] = useState(ev.instagram_link || '');
    const [googleMapLink, setGoogleMapLink] = useState(ev.google_map_link || '');
    
    // Date & Time
    const [eventDate, setEventDate] = useState(ev.date ? new Date(ev.date).toISOString().split('T')[0] : '');
    const [eventTime, setEventTime] = useState(ev.time || ''); 
    const [duration, setDuration] = useState(ev.duration || '');
    
    // Images
    const [portraitUrl, setPortraitUrl] = useState(ev.portrait_image_url || '');
    const [landscapeUrl, setLandscapeUrl] = useState(ev.landscape_image_url || '');
    const [secondaryBannerUrl, setSecondaryBannerUrl] = useState(ev.secondary_banner_url || '');
    const [videoUrl, setVideoUrl] = useState(ev.card_video_url || '');
    const [galleryUrls, setGalleryUrls] = useState<string[]>(ev.gallery_urls || []);

    // Guide
    const [facilities, setFacilities] = useState((ev.guide?.facilities || [])[0] || '');
    const [petFriendly, setPetFriendly] = useState(ev.guide?.is_pet_friendly ? 'Yes' : 'No');
    const [eventInstructions, setEventInstructions] = useState(ev.event_instructions || '');
    const [youtubeVideoUrl, setYoutubeVideoUrl] = useState(ev.youtube_video_url || '');

    // Payment
    const [payment, setPayment] = useState({
        organizerName: ev.payment?.organizer_name || '',
        gstin: ev.payment?.gstin || '',
        accountNumber: ev.payment?.account_number || '',
        ifsc: ev.payment?.ifsc || '',
        accountType: ev.payment?.account_type || '',
    });

    // Lists
    const [pocs, setPocs] = useState(ev.points_of_contact || []);
    const [salesNotifs, setSalesNotifs] = useState(ev.sales_notifications || []);
    const [prohibitedItems, setProhibitedItems] = useState<string[]>(ev.prohibited_items || []);
    const [faqs, setFaqs] = useState(ev.faqs || []);
    const [artists, setArtists] = useState(ev.artists || []);
    const [ticketCategories, setTicketCategories] = useState((ev.ticket_categories || []).map((t: any) => ({
      ...t, price: String(t.price || ''), capacity: String(t.capacity || '')
    })));

    // Add New Item States
    const [newPoc, setNewPoc] = useState({ name: '', email: '', mobile: '' });
    const [newSales, setNewSales] = useState({ email: '', mobile: '' });
    const [newArtist, setNewArtist] = useState({ name: '', description: '', image_url: '' });
    const [newTicket, setNewTicket] = useState({ name: '', price: '', capacity: '', image_url: '' });
    const [newProhibitedItem, setNewProhibitedItem] = useState('');
    const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

    // Inline Edit States
    const [editFaqIndex, setEditFaqIndex] = useState<number | null>(null);
    const [editFaqData, setEditFaqData] = useState({ question: '', answer: '' });

    const [editPocIndex, setEditPocIndex] = useState<number | null>(null);
    const [editPocData, setEditPocData] = useState({ name: '', email: '', mobile: '' });

    const [editSalesIndex, setEditSalesIndex] = useState<number | null>(null);
    const [editSalesData, setEditSalesData] = useState({ email: '', mobile: '' });

    const [editArtistIndex, setEditArtistIndex] = useState<number | null>(null);
    const [editArtistData, setEditArtistData] = useState({ name: '', description: '', image_url: '' });

    const [editTicketIndex, setEditTicketIndex] = useState<number | null>(null);
    const [editTicketData, setEditTicketData] = useState({ name: '', price: '', capacity: '', image_url: '' });

    // UI Toggles
    const [showInstructions, setShowInstructions] = useState(!!ev.event_instructions);
    const [showYoutube, setShowYoutube] = useState(!!ev.youtube_video_url);
    const [showProhibited, setShowProhibited] = useState((ev.prohibited_items || []).length > 0);
    const [showFaqs, setShowFaqs] = useState((ev.faqs || []).length > 0);

    // Dropdowns
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [dropdownSearch, setDropdownSearch] = useState({ city: '' });
    const [selections, setSelections] = useState({
        category: ev.category || 'Select Category',
        subCategory: ev.sub_category || 'Select Sub-Category',
        city: ev.city || 'Select City'
    });

    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitMsg, setSubmitMsg] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    const accentColor = '#5331EA';

    // Initialize Rich Text
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = ev.description || '';
            setHasContent(!!ev.description);
        }
    }, [ev.description]);

    // Check if any changes have been made
    const checkChanges = useCallback(() => {
        const originalData = {
            name: ev.name || '',
            venue_name: ev.venue_name || '',
            venue_address: ev.venue_address || ev.address || '',
            instagram_link: ev.instagram_link || '',
            google_map_link: ev.google_map_link || '',
            date: ev.date ? new Date(ev.date).toISOString().split('T')[0] : '',
            time: ev.time || '',
            duration: ev.duration || '',
            portrait_image_url: ev.portrait_image_url || '',
            landscape_image_url: ev.landscape_image_url || '',
            secondary_banner_url: ev.secondary_banner_url || '',
            card_video_url: ev.card_video_url || '',
            event_instructions: ev.event_instructions || '',
            youtube_video_url: ev.youtube_video_url || '',
            category: ev.category || 'Select Category',
            sub_category: ev.sub_category || 'Select Sub-Category',
            city: ev.city || 'Select City',
            description: ev.description || ''
        };

        const currentData = {
            name: eventName,
            venue_name: venueName,
            venue_address: venueAddress,
            instagram_link: instagramLink,
            google_map_link: googleMapLink,
            date: eventDate,
            time: eventTime,
            duration: duration,
            portrait_image_url: portraitUrl,
            landscape_image_url: landscapeUrl,
            secondary_banner_url: secondaryBannerUrl,
            card_video_url: videoUrl,
            event_instructions: eventInstructions,
            youtube_video_url: youtubeVideoUrl,
            category: selections.category,
            sub_category: selections.subCategory,
            city: selections.city,
            description: editorRef.current?.innerHTML || ''
        };

        const hasFieldChanges = JSON.stringify(originalData) !== JSON.stringify(currentData);
        const hasListChanges = 
            JSON.stringify(ev.points_of_contact || []) !== JSON.stringify(pocs) ||
            JSON.stringify(ev.sales_notifications || []) !== JSON.stringify(salesNotifs) ||
            JSON.stringify(ev.prohibited_items || []) !== JSON.stringify(prohibitedItems) ||
            JSON.stringify(ev.faqs || []) !== JSON.stringify(faqs) ||
            JSON.stringify(ev.artists || []) !== JSON.stringify(artists) ||
            JSON.stringify(ev.ticket_categories || []) !== JSON.stringify(ticketCategories);

        setHasChanges(hasFieldChanges || hasListChanges);
    }, [ev, eventName, venueName, venueAddress, instagramLink, googleMapLink, eventDate, eventTime, duration, 
        portraitUrl, landscapeUrl, secondaryBannerUrl, videoUrl, eventInstructions, youtubeVideoUrl, 
        selections, pocs, salesNotifs, prohibitedItems, faqs, artists, ticketCategories]);

    // Update hasChanges whenever any field changes
    useEffect(() => {
        checkChanges();
    }, [checkChanges]);

    // --- Handlers ---
    const handleUpload = async (key: string, file: File, multi = false) => {
        setUploading(u => ({ ...u, [key]: true }));
        try {
            const url = await uploadMedia(file);
            if (multi && key === 'gallery') setGalleryUrls(prev => [...prev, url]);
            else if (key === 'portrait') setPortraitUrl(url);
            else if (key === 'landscape') setLandscapeUrl(url);
            else if (key === 'secondary_banner') setSecondaryBannerUrl(url);
            else if (key === 'video') setVideoUrl(url);
            else if (key === 'artist_image') setNewArtist(prev => ({ ...prev, image_url: url }));
            else if (key === 'edit_artist_image') setEditArtistData(prev => ({ ...prev, image_url: url }));
            else if (key === 'ticket_image') setNewTicket(prev => ({ ...prev, image_url: url }));
            else if (key === 'edit_ticket_image') setEditTicketData(prev => ({ ...prev, image_url: url }));
        } catch { toast.error('Upload failed. Try again.'); }
        finally { setUploading(u => ({ ...u, [key]: false })); }
    };

    const makeUploadInput = (key: string, accept: string, multi = false) => (
        <input type="file" accept={accept} className="hidden" id={`upload-${key}`}
            onChange={e => { const f = e.target.files?.[0]; if (f) { handleUpload(key, f, multi); e.target.value = ''; } }} />
    );

    const handleSave = async () => {
        if (!eventName.trim()) { toast.error('Event name is required.'); return; }
        setSubmitLoading(true); 
        setSubmitMsg('');
        try {
            await onUpdate(id, {
                name: eventName.trim(),
                description: editorRef.current?.innerHTML ?? '',
                category: selections.category,
                sub_category: selections.subCategory === 'Select Sub-Category' ? '' : selections.subCategory,
                city: selections.city === 'Select City' ? '' : selections.city,
                date: eventDate ? `${eventDate}T00:00:00Z` : undefined,
                time: eventTime,
                duration: duration,
                venue_name: venueName.trim(),
                venue_address: venueAddress,
                google_map_link: googleMapLink,
                instagram_link: instagramLink,
                portrait_image_url: portraitUrl,
                landscape_image_url: landscapeUrl,
                secondary_banner_url: secondaryBannerUrl,
                card_video_url: videoUrl,
                gallery_urls: galleryUrls,
                guide: {
                    ...ev.guide,
                    facilities: facilities ? [facilities] : [],
                    is_pet_friendly: petFriendly === 'Yes',
                },
                event_instructions: eventInstructions,
                youtube_video_url: youtubeVideoUrl,
                prohibited_items: prohibitedItems,
                faqs,
                payment: {
                    organizer_name: payment.organizerName,
                    gstin: payment.gstin,
                    account_number: payment.accountNumber,
                    ifsc: payment.ifsc,
                    account_type: payment.accountType,
                },
                artists,
                ticket_categories: ticketCategories.map(t => ({
                    ...t,
                    price: Number(t.price),
                    capacity: Number(t.capacity)
                })),
                points_of_contact: pocs,
                sales_notifications: salesNotifs,
            });
            setSubmitMsg('✅ Updated successfully!');
            setTimeout(() => setSubmitMsg(''), 3000);
        } catch (err) {
            setSubmitMsg(err instanceof Error ? err.message : 'Update failed.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const toggleDropdown = (name: string) => {
        if (openDropdown === name) setOpenDropdown(null);
        else {
            setOpenDropdown(name);
            setDropdownSearch(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSelect = (name: string, value: string) => {
        setSelections(prev => {
            const n = { ...prev, [name]: value };
            if (name === 'category') n.subCategory = 'Select Sub-Category';
            return n;
        });
        setOpenDropdown(null);
    };

    const handleFormat = (command: string) => {
        document.execCommand(command, false);
        if (command === 'bold') setIsBold(!isBold);
        if (command === 'italic') setIsItalic(!isItalic);
        if (command === 'underline') setIsUnderline(!isUnderline);
        editorRef.current?.focus();
    };

    // --- Render ---

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F3F0FF] via-white to-white overflow-x-hidden">
             {/* Admin Actions Bar (Sticky) */}
             <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100 px-10 py-4 flex items-center justify-between shadow-sm">
                <button onClick={onBack} className="flex items-center gap-2 text-[16px] text-zinc-500 hover:text-black font-medium">
                    <ArrowLeft size={20} /> Back to List
                </button>
                
                <div className="flex items-center gap-4">
                    <span className={`px-4 py-1 rounded-full text-sm font-bold uppercase ${ev.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : ev.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                        Current Status: {ev.status}
                    </span>
                    <div className="h-6 w-[1px] bg-zinc-300 mx-2"></div>
                    <button onClick={() => onStatus(id, 'approved')} disabled={ev.status === 'approved' || isEditMode} className="px-6 py-2 rounded-lg bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        Approve
                    </button>
                    <button onClick={() => onStatus(id, 'rejected')} disabled={ev.status === 'rejected' || isEditMode} className="px-6 py-2 rounded-lg bg-red-500 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        Reject
                    </button>
                    <button 
                        onClick={() => setIsEditMode(!isEditMode)} 
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${isEditMode ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200'}`}
                    >
                        {isEditMode ? <><Check size={16} /> Finish Editing</> : <><Edit3 size={16} /> Edit Details</>}
                    </button>
                    <button onClick={() => { if(confirm('Delete permanently?')) onDelete(id); }} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="w-full" style={{ zoom: '0.70' }}>
                <div className="max-w-[1920px] mx-auto px-10 pt-10">
                    
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-[40px] font-medium leading-[44px] text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            Edit Event (Admin Mode)
                        </h1>
                        <p className="text-[25px] font-medium text-[#686868] mt-2">Edit details directly to fix issues or update listing.</p>
                    </div>
                    <div className="w-[1800px] h-[1.5px] bg-gray-400 ml-[25px] mb-6" />

                    {/* Hidden Inputs for File Upload */}
                    {makeUploadInput('portrait', 'image/*')}
                    {makeUploadInput('landscape', 'image/*')}
                    {makeUploadInput('secondary_banner', 'image/*')}
                    {makeUploadInput('video', 'video/*')}
                    {makeUploadInput('gallery', 'image/*,video/*', true)}
                    {makeUploadInput('artist_image', 'image/*')}
                    {makeUploadInput('edit_artist_image', 'image/*')}
                    {makeUploadInput('ticket_image', 'image/*')}
                    {makeUploadInput('edit_ticket_image', 'image/*')}

                    {/* Event Name */}
                    <div className="mb-12">
                        <label className="block text-[24px] font-medium mb-2 text-black mt-[20px]">Event name</label>
                        <input type="text" placeholder="Your event's name" value={eventName} onChange={e => setEventName(e.target.value)}
                            disabled={!isEditMode}
                            className={`w-full text-[30px] font-medium text-black placeholder-[#AEAEAE] bg-transparent border-none outline-none mt-[-10px] ${!isEditMode ? 'cursor-default' : ''}`} />
                        <div className="w-full h-[1px] bg-[#AEAEAE] mt-2" />
                    </div>

                    <div className="space-y-10 mt-[-30px]">
                        
                        {/* Description */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                            <h2 className="text-[30px] font-medium text-black mb-6">Event Description <span style={{ color: accentColor }}>*</span></h2>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-6" />
                            <div className="flex gap-1 mb-4">
                                <button onClick={() => handleFormat('bold')} className={`p-2 rounded ${isBold ? 'bg-gray-200' : ''}`}><span className="text-2xl font-bold">B</span></button>
                                <button onClick={() => handleFormat('italic')} className={`p-2 rounded ${isItalic ? 'bg-gray-200' : ''}`}><span className="text-2xl italic">I</span></button>
                                <button onClick={() => handleFormat('underline')} className={`p-2 rounded ${isUnderline ? 'bg-gray-200' : ''}`}><span className="text-2xl underline">U</span></button>
                            </div>
                            <div className="border border-[#AEAEAE] rounded-[10px] p-6 min-h-[260px] relative">
                                <div ref={editorRef} contentEditable={isEditMode} onInput={e => setHasContent(e.currentTarget.innerText.length > 0)}
                                    className={`w-full h-full text-[30px] font-medium text-black outline-none min-h-[210px] ${!isEditMode ? 'cursor-default' : ''}`} />
                                {!hasContent && <div className="absolute top-6 left-6 text-[#AEAEAE] text-[25px] font-medium pointer-events-none">Event description</div>}
                            </div>
                        </section>

                        {/* Category */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                            <h2 className="text-[30px] font-medium text-black mb-6">Event type <span style={{ color: accentColor }}>*</span></h2>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8" />
                            <div className="grid grid-cols-2 gap-12">
                                {[{ key: 'category', label: 'Category' }, { key: 'subCategory', label: 'Sub-Category' }].map(({ key, label }) => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">{label} <span style={{ color: accentColor }}>*</span></label>
                                        <div className="relative w-full">
                                            <div onClick={() => isEditMode && toggleDropdown(key)} className={`relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[8px] ${isEditMode ? 'cursor-pointer' : 'cursor-default bg-zinc-50/50'}`}>
                                                <span className={`text-[20px] ${selections[key as 'category' | 'subCategory'].startsWith('Select') ? 'text-[#686868]' : 'text-black'}`}>{selections[key as 'category' | 'subCategory']}</span>
                                                {openDropdown === key ? <ChevronUp className="absolute right-6" size={24} /> : <ChevronDown className="absolute right-6" size={24} />}
                                            </div>
                                            {openDropdown === key && (
                                                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-[#686868] rounded-[10px] mt-1 max-h-[300px] overflow-y-auto shadow-xl">
                                                    {(key === 'category' ? CATEGORIES : (CATEGORY_DATA[selections.category] || [])).map(opt => (
                                                        <div key={opt} onClick={() => handleSelect(key, opt)} className="px-6 py-3 hover:bg-zinc-50 cursor-pointer text-[18px]">{opt}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Location */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                            <h2 className="text-[30px] font-medium text-black mb-6">Location <span style={{ color: accentColor }}>*</span></h2>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8" />
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">City</label>
                                        <div className="relative w-full">
                                            <div onClick={() => isEditMode && toggleDropdown('city')} className={`relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[8px] ${isEditMode ? 'cursor-pointer' : 'cursor-default bg-zinc-50/50'}`}>
                                                <span className={`text-[20px] ${selections.city === 'Select City' ? 'text-[#686868]' : 'text-black'}`}>{selections.city}</span>
                                                {openDropdown === 'city' ? <ChevronUp className="absolute right-6" size={24} /> : <ChevronDown className="absolute right-6" size={24} />}
                                            </div>
                                            {openDropdown === 'city' && (
                                                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-[#686868] rounded-[10px] mt-1 max-h-[350px] overflow-y-auto shadow-xl">
                                                    <div className="p-3 border-b border-[#AEAEAE]">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#AEAEAE]" size={16} />
                                                            <input
                                                                type="text"
                                                                placeholder="Search city..."
                                                                value={dropdownSearch.city}
                                                                onChange={(e) => setDropdownSearch(prev => ({ ...prev, city: e.target.value }))}
                                                                className="w-full pl-10 pr-4 py-2 border border-[#AEAEAE] rounded-lg text-[16px] focus:outline-none focus:border-[#5331EA]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-[300px] overflow-y-auto">
                                                        {CITIES.filter(opt => opt.toLowerCase().includes(dropdownSearch.city.toLowerCase())).map((opt, index) => <div key={`${opt}-${index}`} onClick={() => handleSelect('city', opt)} className="px-6 py-3 hover:bg-zinc-50 cursor-pointer text-[18px]">{opt}</div>)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Venue Name</label>
                                        <div className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[8px]">
                                            <input type="text" placeholder="e.g. Phoenix Mall" value={venueName} onChange={e => setVenueName(e.target.value)} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]">Full Address</label>
                                    <div className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 gap-4 mt-[10px]">
                                        <MapPin className="text-[#AEAEAE]" size={24} />
                                        <input type="text" placeholder="Full address" value={venueAddress} onChange={e => setVenueAddress(e.target.value)} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Google Maps Link</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                            <input type="text" placeholder="Google Maps URL" value={googleMapLink} onChange={e => setGoogleMapLink(e.target.value)} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Instagram Link</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                            <input type="text" placeholder="Instagram URL" value={instagramLink} onChange={e => setInstagramLink(e.target.value)} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Date & Time */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                            <h2 className="text-[30px] font-medium text-black mb-6">Date & Time <span style={{ color: accentColor }}>*</span></h2>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8" />
                            <div className="grid grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]">Event Date</label>
                                    <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                        <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]">Start Time</label>
                                    <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                        <input type="text" placeholder="e.g. 06:00 PM" value={eventTime} onChange={e => setEventTime(e.target.value)} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]">Duration</label>
                                    <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                        <input type="text" placeholder="e.g. 3 Hours" value={duration} onChange={e => setDuration(e.target.value)} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Guide */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                            <h3 className="text-[30px] font-medium text-black mb-6">Event Guide</h3>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8" />
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[25px] font-medium text-black">Pet-friendly? <span style={{ color: accentColor }}>*</span></span>
                                    <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[840px] flex items-center px-6">
                                        <select value={petFriendly} onChange={e => setPetFriendly(e.target.value)} disabled={!isEditMode} className={`w-full appearance-none bg-transparent outline-none text-[25px] ${!isEditMode ? 'cursor-default' : ''}`}>
                                            {['Yes', 'No'].map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                        <ChevronDown size={24} className="absolute right-6" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[25px] font-medium text-black">Facilities</span>
                                    <div className="border border-[#686868] rounded-[10px] h-[64px] w-[840px] flex items-center px-6">
                                        <input type="text" placeholder="e.g. Parking, Locker, Showers" value={facilities} onChange={e => setFacilities(e.target.value)} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[25px] placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Artists / Lineup */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                            <h2 className="text-[30px] font-medium text-black mb-2">Artists / Lineup</h2>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6">Add performers or speakers.</p>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>                             {isEditMode && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Artist Name</label>
                                        <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input type="text" value={newArtist.name} onChange={e => setNewArtist({ ...newArtist, name: e.target.value })} placeholder="e.g. DJ Snake" className="w-full bg-transparent outline-none text-[22px] text-black placeholder-[#AEAEAE]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Role / Description</label>
                                        <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input type="text" value={newArtist.description} onChange={e => setNewArtist({ ...newArtist, description: e.target.value })} placeholder="e.g. Headliner" className="w-full bg-transparent outline-none text-[22px] text-black placeholder-[#AEAEAE]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Artist Image</label>
                                        <div className="flex items-center gap-4">
                                            <label htmlFor="upload-artist_image" className="cursor-pointer flex-1">
                                                <div className="border border-[#AEAEAE] border-dashed rounded-[10px] h-[64px] flex items-center justify-center px-6 hover:bg-zinc-50 transition-colors">
                                                    {uploading.artist_image ? (
                                                        <span className="text-[18px] text-zinc-400 animate-pulse">Uploading...</span>
                                                    ) : newArtist.image_url ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative w-[40px] h-[40px] rounded-[6px] overflow-hidden">
                                                                <Image src={newArtist.image_url} alt="Artist preview" fill className="object-cover" />
                                                            </div>
                                                            <span className="text-[18px] text-green-600 font-semibold uppercase italic">✓ Image Set</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Upload size={20} className="text-[#AEAEAE]" />
                                                            <span className="text-[18px] text-[#AEAEAE]">Upload</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                             )}
                             {isEditMode && (
                                <div className="flex justify-end mb-8">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newArtist.name) {
                                                setArtists([...artists, newArtist]);
                                                setNewArtist({ name: '', description: '', image_url: '' });
                                            }
                                        }}
                                        className="bg-black text-white rounded-[15px] h-[54px] px-8 flex items-center gap-2"
                                    >
                                        <span className="text-[20px] font-medium uppercase">Add Artist</span>
                                        <PlusCircle size={22} />
                                    </button>
                                </div>
                             )}

                            {artists.length > 0 && (
                                <div className="space-y-4">
                                    {artists.map((a, i) => (
                                        <div key={i} className="bg-[#F5F5F5] rounded-[15px] p-6 border border-zinc-200">
                                            {editArtistIndex === i ? (
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="relative w-[80px] h-[80px] rounded-full overflow-hidden border border-zinc-300 shrink-0">
                                                        {editArtistData.image_url ? <Image src={editArtistData.image_url} alt="artist" fill className="object-cover" /> : <div className="bg-zinc-200 w-full h-full"></div>}
                                                        <label htmlFor="upload-edit_artist_image" className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                                                            <span className="text-white text-xs font-bold">Swap</span>
                                                        </label>
                                                    </div>
                                                    <input type="text" value={editArtistData.name} onChange={e => setEditArtistData({...editArtistData, name: e.target.value})} className="w-[30%] bg-white border border-[#AEAEAE] rounded-[5px] p-3 outline-none text-[18px]" placeholder="Name" />
                                                    <input type="text" value={editArtistData.description} onChange={e => setEditArtistData({...editArtistData, description: e.target.value})} className="flex-1 bg-white border border-[#AEAEAE] rounded-[5px] p-3 outline-none text-[18px]" placeholder="Role" />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditArtistIndex(null)} className="text-zinc-500 font-medium text-[16px] px-4 py-2 hover:text-black">Cancel</button>
                                                        <button onClick={() => {
                                                            const newA = [...artists];
                                                            newA[i] = editArtistData;
                                                            setArtists(newA);
                                                            setEditArtistIndex(null);
                                                        }} className="bg-black text-white px-6 py-2 rounded-[5px] font-medium text-[16px]">Save</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-10">
                                                        {a.image_url ? (
                                                            <div className="relative w-[80px] h-[80px] rounded-[12px] overflow-hidden border border-zinc-300">
                                                                <Image src={a.image_url} alt={a.name} fill className="object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-[80px] h-[80px] rounded-[12px] bg-zinc-200 border border-zinc-300 flex items-center justify-center">
                                                                <User className="text-zinc-400" size={32}/>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-[14px] text-[#686868] uppercase font-bold tracking-wider">Name</p>
                                                            <p className="text-[22px] font-semibold text-black">{a.name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[14px] text-[#686868] uppercase font-bold tracking-wider">Role / Description</p>
                                                            <p className="text-[22px] font-semibold text-black">{a.description || '—'}</p>
                                                        </div>
                                                    </div>
                                                     {isEditMode && (
                                                        <div className="flex items-center gap-6">
                                                            <button onClick={() => {
                                                                setEditArtistIndex(i);
                                                                setEditArtistData({
                                                                    name: a.name,
                                                                    description: a.description || '',
                                                                    image_url: a.image_url || ''
                                                                });
                                                            }} className="text-blue-500 font-bold uppercase tracking-tight text-[16px]">Edit</button>
                                                            <button onClick={() => setArtists(artists.filter((_, idx) => idx !== i))} className="text-red-500 font-bold uppercase tracking-tight text-[16px]">Remove</button>
                                                        </div>
                                                     )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Ticket Categories */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                            <h2 className="text-[30px] font-medium text-black mb-2">Ticket Categories <span style={{ color: accentColor }}>*</span></h2>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6">List the specific tickets available.</p>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>

                             {isEditMode && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Category Name</label>
                                        <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input type="text" value={newTicket.name} onChange={e => setNewTicket({ ...newTicket, name: e.target.value })} placeholder="e.g. VIP Phase 1" className="w-full bg-transparent outline-none text-[22px] text-black placeholder-[#AEAEAE]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Price (₹)</label>
                                        <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input type="number" value={newTicket.price} onChange={e => setNewTicket({ ...newTicket, price: e.target.value })} placeholder="e.g. 1500" className="w-full bg-transparent outline-none text-[22px] text-black placeholder-[#AEAEAE]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Capacity</label>
                                        <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input type="number" value={newTicket.capacity} onChange={e => setNewTicket({ ...newTicket, capacity: e.target.value })} placeholder="e.g. 100" className="w-full bg-transparent outline-none text-[22px] text-black placeholder-[#AEAEAE]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Ticket Image</label>
                                        <div className="flex items-center gap-4">
                                            <label htmlFor="upload-ticket_image" className="cursor-pointer flex-1">
                                                <div className="border border-[#AEAEAE] border-dashed rounded-[10px] h-[64px] flex items-center justify-center px-6 hover:bg-zinc-50 transition-colors">
                                                    {uploading.ticket_image ? (
                                                        <span className="text-[18px] text-zinc-400 animate-pulse">Uploading...</span>
                                                    ) : newTicket.image_url ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative w-[40px] h-[40px] rounded-[6px] overflow-hidden">
                                                                <Image src={newTicket.image_url} alt="preview" fill className="object-cover" />
                                                            </div>
                                                            <span className="text-[18px] text-green-600 font-semibold uppercase italic">✓ Image Set</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Upload size={20} className="text-[#AEAEAE]" />
                                                            <span className="text-[18px] text-[#AEAEAE]">Upload</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                             )}
                             {isEditMode && (
                                <div className="flex justify-end mb-8">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newTicket.name && newTicket.price && newTicket.capacity) {
                                                setTicketCategories([...ticketCategories, newTicket]);
                                                setNewTicket({ name: '', price: '', capacity: '', image_url: '' });
                                            }
                                        }}
                                        className="bg-black text-white rounded-[15px] h-[54px] px-8 flex items-center gap-2"
                                    >
                                        <span className="text-[20px] font-medium uppercase">Add Ticket</span>
                                        <PlusCircle size={22} />
                                    </button>
                                </div>
                             )}

                            {ticketCategories.length > 0 && (
                                <div className="space-y-4">
                                    {ticketCategories.map((t, i) => (
                                        <div key={i} className="bg-[#F5F5F5] rounded-[15px] p-6 border border-zinc-200">
                                            {editTicketIndex === i ? (
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="relative w-[80px] h-[80px] rounded-[12px] overflow-hidden border border-zinc-300 shrink-0">
                                                        {editTicketData.image_url ? <Image src={editTicketData.image_url} alt="ticket" fill className="object-cover" /> : <div className="bg-zinc-200 w-full h-full"></div>}
                                                        <label htmlFor="upload-edit_ticket_image" className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                                                            <span className="text-white text-xs font-bold">Swap</span>
                                                        </label>
                                                    </div>
                                                    <input type="text" value={editTicketData.name} onChange={e => setEditTicketData({...editTicketData, name: e.target.value})} className="flex-1 bg-white border border-[#AEAEAE] rounded-[5px] p-3 outline-none text-[18px]" placeholder="Category" />
                                                    <input type="number" value={editTicketData.price} onChange={e => setEditTicketData({...editTicketData, price: e.target.value})} className="w-1/6 bg-white border border-[#AEAEAE] rounded-[5px] p-3 outline-none text-[18px]" placeholder="Price" />
                                                    <input type="number" value={editTicketData.capacity} onChange={e => setEditTicketData({...editTicketData, capacity: e.target.value})} className="w-1/6 bg-white border border-[#AEAEAE] rounded-[5px] p-3 outline-none text-[18px]" placeholder="Capacity" />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditTicketIndex(null)} className="text-zinc-500 font-medium text-[16px] px-4 py-2 hover:text-black">Cancel</button>
                                                        <button onClick={() => {
                                                            const newT = [...ticketCategories];
                                                            newT[i] = editTicketData;
                                                            setTicketCategories(newT);
                                                            setEditTicketIndex(null);
                                                        }} className="bg-black text-white px-6 py-2 rounded-[5px] font-medium text-[16px]">Save</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-10">
                                                        {t.image_url ? (
                                                            <div className="relative w-[80px] h-[80px] rounded-[12px] overflow-hidden border border-zinc-300">
                                                                <Image src={t.image_url} alt={t.name} fill className="object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-[80px] h-[80px] rounded-[12px] bg-zinc-200 border border-zinc-300 flex items-center justify-center text-[10px] text-zinc-400 font-bold uppercase text-center">
                                                                No Img
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-[14px] text-[#686868] uppercase font-bold tracking-wider">Category</p>
                                                            <p className="text-[22px] font-semibold text-black">{t.name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[14px] text-[#686868] uppercase font-bold tracking-wider">Price</p>
                                                            <p className="text-[22px] font-semibold text-black">₹{t.price}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[14px] text-[#686868] uppercase font-bold tracking-wider">Capacity</p>
                                                            <p className="text-[22px] font-semibold text-black">{t.capacity}</p>
                                                        </div>
                                                    </div>
                                                     {isEditMode && (
                                                        <div className="flex items-center gap-6">
                                                            <button onClick={() => { setEditTicketIndex(i); setEditTicketData(t); }} className="text-blue-500 font-bold uppercase tracking-tight text-[16px]">Edit</button>
                                                            <button onClick={() => setTicketCategories(ticketCategories.filter((_, idx) => idx !== i))} className="text-red-500 font-bold uppercase tracking-tight text-[16px]">Remove</button>
                                                        </div>
                                                     )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Images */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                            <h2 className="text-[30px] font-medium text-black mb-2">Card images <span style={{ color: accentColor }}>*</span></h2>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8" />
                            <div className="space-y-6">
                                {[{ key: 'portrait', label: 'Portrait', size: '3:4 (900×1200px)', url: portraitUrl }, { key: 'landscape', label: 'Landscape', size: '16:9 (1600×900px)', url: landscapeUrl }].map(({ key, label, size, url }) => (
                                    <div key={key} className="bg-[#EBEBEB] rounded-[10px] py-3 px-6 flex items-center justify-between gap-6">
                                        <div>
                                            <p className="text-[20px] font-semibold text-[#686868]">{label}</p>
                                            <p className="text-[18px] text-black">{size}</p>
                                        </div>
                                        {url && (
                                            <div className="relative w-[60px] h-[60px] rounded-[8px] overflow-hidden border border-[#AEAEAE]">
                                                <Image src={url} alt={label} fill className="object-cover" />
                                            </div>
                                        )}
                                         {isEditMode && (
                                            <label htmlFor={`upload-${key}`} className="cursor-pointer">
                                                <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-white">
                                                    <span className="px-5 text-[15px] font-medium text-black">{uploading[key] ? 'Uploading...' : url ? 'Replace' : 'Upload'}</span>
                                                    <div className="w-[41px] h-full flex items-center justify-center border-l border-[#686868]" style={{ background: accentColor }}><Upload size={20} className="text-white" /></div>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                ))}
                                {/* Secondary Banner */}
                                <div className="bg-[#EBEBEB] rounded-[10px] py-3 px-6 flex items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <p className="text-[20px] font-semibold text-[#686868]">Secondary Banner</p>
                                        <p className="text-[18px] text-black">16:9 aspect ratio</p>
                                    </div>
                                    {secondaryBannerUrl && (
                                        <div className="relative w-[60px] h-[60px] rounded-[8px] overflow-hidden border border-[#AEAEAE]">
                                            <Image src={secondaryBannerUrl} alt="Secondary Banner" fill className="object-cover" />
                                        </div>
                                    )}
                                     {isEditMode && (
                                        <label htmlFor="upload-secondary_banner" className="cursor-pointer">
                                            <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-white">
                                                <span className="px-5 text-[15px] font-medium text-black">{uploading['secondary_banner'] ? 'Uploading...' : secondaryBannerUrl ? 'Replace' : 'Upload'}</span>
                                                <div className="w-[41px] h-full flex items-center justify-center border-l border-[#686868]" style={{ background: accentColor }}><Upload size={20} className="text-white" /></div>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </section>

                         {/* Media */}
                         <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                            <h2 className="text-[30px] font-medium text-black mb-2">Media</h2>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8" />
                            <div className="space-y-6">
                                <div className="bg-[#EBEBEB] rounded-[10px] py-3 px-6 flex items-center justify-between">
                                    <div><p className="text-[20px] font-semibold text-[#686868]">Card Video</p><p className="text-[18px] text-black">mp4 / mov · max 5MB</p></div>
                                    {videoUrl && <p className="text-[13px] text-green-600 font-medium">✓ Uploaded</p>}
                                     {isEditMode && (
                                        <label htmlFor="upload-video" className="cursor-pointer">
                                            <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-white">
                                                <span className="px-5 text-[15px] font-medium text-black">{uploading.video ? 'Uploading...' : videoUrl ? 'Replace' : 'Upload'}</span>
                                                <div className="w-[41px] h-full flex items-center justify-center border-l border-[#686868]" style={{ background: accentColor }}><Upload size={20} className="text-white" /></div>
                                            </div>
                                        </label>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[20px] font-semibold text-[#686868]">Gallery ({galleryUrls.length}) <span className="text-[#5331EA] text-[16px]">* min 3</span></p>
                                         {isEditMode && (
                                            <label htmlFor="upload-gallery" className="cursor-pointer inline-flex">
                                                <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-[#EBEBEB]">
                                                    <span className="px-5 text-[15px] font-medium text-black">{uploading.gallery ? 'Uploading...' : '+ Add Image'}</span>
                                                    <div className="w-[41px] h-full flex items-center justify-center border-l border-[#686868]" style={{ background: accentColor }}><Upload size={20} className="text-white" /></div>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                    {galleryUrls.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mb-4">
                                            {galleryUrls.map((u, i) => (
                                                <div key={i} className="relative w-[80px] h-[80px]">
                                                    <div className="relative w-[full] h-full rounded-[8px] overflow-hidden border border-[#AEAEAE]">
                                                        <Image src={u} alt="" fill className="object-cover" />
                                                    </div>
                                                     {isEditMode && <button onClick={() => setGalleryUrls(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[12px] flex items-center justify-center">×</button>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Optional Sections */}
                        <section className="bg-[#D8D8D8] rounded-[15px] p-6">
                            <h3 className="text-[25px] font-semibold text-black mb-4">Optional sections</h3>
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { name: 'Event Instructions', toggle: () => setShowInstructions(!showInstructions), active: showInstructions },
                                    { name: 'Youtube Video', toggle: () => setShowYoutube(!showYoutube), active: showYoutube },
                                    { name: 'Prohibited Items', toggle: () => setShowProhibited(!showProhibited), active: showProhibited },
                                    { name: 'FAQs', toggle: () => setShowFaqs(!showFaqs), active: showFaqs },
                                ].map((btn, idx) => (
                                     <button key={idx} onClick={() => isEditMode && btn.toggle()} className={`flex items-center bg-white rounded-[6px] h-[42px] overflow-hidden ${!isEditMode ? 'cursor-default' : ''}`}>
                                        <span className="px-4 text-[19px] font-medium text-black">{btn.name}</span>
                                        <div className={`w-[42px] h-full flex items-center justify-center ${btn.active ? 'bg-black' : ''}`} style={!btn.active ? { background: accentColor } : {}}>
                                            <PlusCircle size={20} className={btn.active ? 'text-white' : 'text-white'} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {showInstructions && (
                            <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                                <h2 className="text-[30px] font-medium text-black mb-4">Event Instructions</h2>
                                <div className="border border-[#686868] rounded-[10px] p-4">
                                     <textarea value={eventInstructions} onChange={e => setEventInstructions(e.target.value)} disabled={!isEditMode} placeholder="Enter instructions..." className={`w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE] min-h-[100px] resize-y ${!isEditMode ? 'cursor-default' : ''}`} />
                                </div>
                            </section>
                        )}
                        {showYoutube && (
                            <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                                <h2 className="text-[30px] font-medium text-black mb-4">YouTube Video</h2>
                                <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                     <input type="text" placeholder="YouTube URL" value={youtubeVideoUrl} onChange={e => setYoutubeVideoUrl(e.target.value)} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                </div>
                            </section>
                        )}
                        {showProhibited && (
                            <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                                <h2 className="text-[30px] font-medium text-black mb-4">Prohibited Items</h2>
                                 {isEditMode && (
                                    <div className="flex gap-4 mb-4">
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex-1 flex items-center px-6">
                                            <input type="text" placeholder="Add item" value={newProhibitedItem} onChange={e => setNewProhibitedItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && (() => { if(newProhibitedItem.trim()) { setProhibitedItems([...prohibitedItems, newProhibitedItem]); setNewProhibitedItem(''); } })()} className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]" />
                                        </div>
                                        <button onClick={() => { if(newProhibitedItem.trim()) { setProhibitedItems([...prohibitedItems, newProhibitedItem]); setNewProhibitedItem(''); } }} className="bg-black text-white px-8 rounded-[10px] font-medium text-[20px]">Add</button>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-3">
                                    {prohibitedItems.map((item, i) => (
                                        <div key={i} className="bg-zinc-100 px-4 py-2 rounded-lg flex items-center gap-2">
                                             <span>{item}</span>{isEditMode && <button onClick={() => setProhibitedItems(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500">×</button>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        {showFaqs && (
                            <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                                <h2 className="text-[30px] font-medium text-black mb-4">FAQs</h2>
                                 {isEditMode && (
                                    <div className="space-y-4 mb-4">
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input type="text" placeholder="Question" value={newFaq.question} onChange={e => setNewFaq({ ...newFaq, question: e.target.value })} className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]" />
                                        </div>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input type="text" placeholder="Answer" value={newFaq.answer} onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })} className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]" />
                                        </div>
                                        <button onClick={() => { if(newFaq.question && newFaq.answer) { setFaqs([...faqs, newFaq]); setNewFaq({ question: '', answer: '' }); } }} className="bg-black text-white w-full h-[64px] rounded-[10px] font-medium text-[20px]">Add FAQ</button>
                                    </div>
                                )}
                                <div className="space-y-4 w-full">
                                    {faqs.map((faq, i) => (
                                        <div key={i} className="bg-[#F5F5F5] rounded-[10px] px-6 py-4 flex flex-col w-full relative">
                                            {editFaqIndex === i ? (
                                                <div className="space-y-3 w-full">
                                                    <input type="text" value={editFaqData.question} onChange={e => setEditFaqData({...editFaqData, question: e.target.value})} className="w-full bg-white border border-[#AEAEAE] rounded-[5px] p-3 outline-none text-[18px]" placeholder="Question" />
                                                    <textarea value={editFaqData.answer} onChange={e => setEditFaqData({...editFaqData, answer: e.target.value})} className="w-full bg-white border border-[#AEAEAE] rounded-[5px] p-3 outline-none text-[18px] min-h-[80px]" placeholder="Answer" />
                                                    <div className="flex gap-2 justify-end mt-2">
                                                        <button onClick={() => setEditFaqIndex(null)} className="text-zinc-500 text-[16px] px-4 py-2 font-medium hover:text-black">Cancel</button>
                                                        <button onClick={() => {
                                                            const newFaqs = [...faqs];
                                                            newFaqs[i] = editFaqData;
                                                            setFaqs(newFaqs);
                                                            setEditFaqIndex(null);
                                                        }} className="bg-black text-white text-[16px] font-medium px-6 py-2 rounded-[5px]">Save</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="font-semibold text-[20px] pr-32">Q: {faq.question}</p>
                                                    <p className="text-[18px] text-zinc-600 pr-32">A: {faq.answer}</p>
                                                     {isEditMode && (
                                                        <div className="absolute top-4 right-6 flex items-center gap-6">
                                                            <button onClick={() => { setEditFaqIndex(i); setEditFaqData(faq); }} className="text-blue-500 text-[16px] font-bold uppercase tracking-tight">Edit</button>
                                                            <button onClick={() => setFaqs(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 text-[16px] font-bold uppercase tracking-tight">Remove</button>
                                                        </div>
                                                     )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Payment */}
                        <h2 className="text-[30px] font-medium text-black mb-6 ml-[25px]">Payment & Contact Details</h2>
                        <section className="bg-white rounded-[15px] p-8 shadow-sm border border-zinc-100">
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]">Organiser Name *</label>
                                    <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                         <input type="text" placeholder="Organiser Name" value={payment.organizerName} onChange={e => setPayment({ ...payment, organizerName: e.target.value })} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]">GSTIN / PAN:</label>
                                    <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                         <input type="text" placeholder="GSTIN or PAN" value={payment.gstin} onChange={e => setPayment({ ...payment, gstin: e.target.value })} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Account Number:</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                             <input type="text" placeholder="Account Number" value={payment.accountNumber} onChange={e => setPayment({ ...payment, accountNumber: e.target.value })} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">IFSC:</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                             <input type="text" placeholder="IFSC Code" value={payment.ifsc} onChange={e => setPayment({ ...payment, ifsc: e.target.value })} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Account Type:</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                             <select value={payment.accountType} onChange={e => setPayment({ ...payment, accountType: e.target.value })} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] ${!isEditMode ? 'cursor-default' : ''}`}>
                                                <option value="">Select type</option>
                                                <option value="Savings">Savings</option>
                                                <option value="Current">Current</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* POC */}
                        <section className="bg-white rounded-[15px] p-10 flex flex-col gap-8 shadow-sm border border-zinc-100">
                            <div>
                                <h2 className="text-[30px] font-medium text-black">Point of Contact <span style={{ color: accentColor }}>*</span></h2>
                                <p className="text-[20px] text-[#AEAEAE] mt-1">POCs with whom feedback will be shared</p>
                            </div>
                            <div className="grid grid-cols-3 gap-8">
                                {[['Name', 'name', 'Enter name'], ['Mail', 'email', 'Enter email'], ['Mobile', 'mobile', 'Enter mobile']].map(([label, key, ph]) => (
                                    <div key={key} className="space-y-3">
                                        <label className="text-[20px] font-medium text-[#686868]">{label}</label>
                                         <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input type="text" placeholder={ph} value={newPoc[key as 'name' | 'email' | 'mobile']} onChange={e => setNewPoc({ ...newPoc, [key]: e.target.value })} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[25px] text-black placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                             {isEditMode && (
                                <div className="flex justify-end">
                                    <button onClick={() => { if(newPoc.name && newPoc.email) { setPocs([...pocs, newPoc]); setNewPoc({ name: '', email: '', mobile: '' }); } }} className="bg-black text-white rounded-[15px] h-[65px] px-6 flex items-center gap-3 text-[25px] font-medium"><PlusCircle size={24} /> ADD</button>
                                </div>
                             )}

                            <div className="space-y-3 mt-4 w-full">
                                {pocs.map((poc, i) => (
                                    <div key={i} className="bg-[#F5F5F5] rounded-[10px] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between min-h-[65px] w-full">
                                        {editPocIndex === i ? (
                                            <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                                                <input type="text" value={editPocData.name} onChange={e => setEditPocData({...editPocData, name: e.target.value})} className="flex-1 w-full md:w-auto bg-white border border-[#AEAEAE] rounded-[5px] p-3 outline-none text-[18px]" placeholder="Name" />
                                                <input type="text" value={editPocData.email} onChange={e => setEditPocData({...editPocData, email: e.target.value})} className="flex-1 w-full md:w-auto bg-white border border-[#AEAEAE] rounded-[5px] p-3 outline-none text-[18px]" placeholder="Email" />
                                                <input type="text" value={editPocData.mobile} onChange={e => setEditPocData({...editPocData, mobile: e.target.value})} className="flex-1 w-full md:w-auto bg-white border border-[#AEAEAE] rounded-[5px] p-3 outline-none text-[18px]" placeholder="Mobile" />
                                                <div className="flex gap-4 md:ml-4">
                                                    <button onClick={() => setEditPocIndex(null)} className="text-zinc-500 font-medium text-[16px] px-4 hover:text-black">Cancel</button>
                                                    <button onClick={() => {
                                                        const newPocs = [...pocs];
                                                        newPocs[i] = editPocData;
                                                        setPocs(newPocs);
                                                        setEditPocIndex(null);
                                                    }} className="bg-black text-white px-6 py-2 rounded-[5px] font-medium text-[16px]">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-[20px] text-black">{poc.name} — {poc.email} — {poc.mobile}</span>
                                                 {isEditMode && (
                                                    <div className="flex items-center gap-6 ml-4">
                                                        <button onClick={() => { setEditPocIndex(i); setEditPocData({ name: poc.name, email: poc.email, mobile: poc.mobile || poc.phone || '' }); }} className="text-blue-500 font-bold uppercase tracking-tight text-[16px]">Edit</button>
                                                        <button onClick={() => setPocs(pocs.filter((_, idx) => idx !== i))} className="text-red-500 font-bold uppercase tracking-tight text-[16px]">Remove</button>
                                                    </div>
                                                 )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Sales Notifications */}
                        <section className="bg-white rounded-[15px] p-10 flex flex-col gap-8 shadow-sm border border-zinc-100">
                            <h2 className="text-[30px] font-medium text-black">Sales Alert Contacts</h2>
                            <div className="grid grid-cols-2 gap-8">
                                {[['Mail', 'email', 'Enter email'], ['Mobile', 'mobile', 'Enter mobile']].map(([label, key, ph]) => (
                                    <div key={key} className="space-y-3">
                                        <label className="text-[20px] font-medium text-[#686868]">{label}</label>
                                         <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input type="text" placeholder={ph} value={newSales[key as 'email' | 'mobile']} onChange={e => setNewSales({ ...newSales, [key]: e.target.value })} disabled={!isEditMode} className={`w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE] ${!isEditMode ? 'cursor-default' : ''}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                             {isEditMode && (
                                <div className="flex justify-end">
                                    <button onClick={() => { if(newSales.email) { setSalesNotifs([...salesNotifs, newSales]); setNewSales({ email: '', mobile: '' }); } }} className="bg-black text-white rounded-[15px] h-[65px] px-6 flex items-center gap-3 text-[25px] font-medium"><PlusCircle size={24} /> ADD</button>
                                </div>
                             )}

                            <div className="space-y-3 mt-4 w-full">
                                {salesNotifs.map((s, i) => (
                                    <div key={i} className="bg-[#F5F5F5] rounded-[10px] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between min-h-[65px] w-full">
                                        {editSalesIndex === i ? (
                                            <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                                                <input type="text" value={editSalesData.email} onChange={e => setEditSalesData({...editSalesData, email: e.target.value})} className="flex-1 w-full md:w-auto bg-white border border-[#AEAEAE] rounded-[5px] p-3 outline-none text-[18px]" placeholder="Email" />
                                                <input type="text" value={editSalesData.mobile} onChange={e => setEditSalesData({...editSalesData, mobile: e.target.value})} className="flex-1 w-full md:w-auto bg-white border border-[#AEAEAE] rounded-[5px] p-3 outline-none text-[18px]" placeholder="Mobile" />
                                                <div className="flex gap-4 md:ml-4">
                                                    <button onClick={() => setEditSalesIndex(null)} className="text-zinc-500 font-medium text-[16px] px-4 hover:text-black">Cancel</button>
                                                    <button onClick={() => {
                                                        const newSales = [...salesNotifs];
                                                        newSales[i] = editSalesData;
                                                        setSalesNotifs(newSales);
                                                        setEditSalesIndex(null);
                                                    }} className="bg-black text-white px-6 py-2 rounded-[5px] font-medium text-[16px]">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-[20px] text-black">{s.email} — {s.mobile}</span>
                                                 {isEditMode && (
                                                    <div className="flex items-center gap-6 ml-4">
                                                        <button onClick={() => { setEditSalesIndex(i); setEditSalesData(s); }} className="text-blue-500 font-bold uppercase tracking-tight text-[16px]">Edit</button>
                                                        <button onClick={() => setSalesNotifs(salesNotifs.filter((_, idx) => idx !== i))} className="text-red-500 font-bold uppercase tracking-tight text-[16px]">Remove</button>
                                                    </div>
                                                 )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Submit */}
                    <div className="flex flex-col items-center mt-8 mb-20 gap-4">
                        {submitMsg && <p className={`text-[20px] font-medium ${submitMsg.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>{submitMsg}</p>}
                         {isEditMode && hasChanges && (
                            <button onClick={handleSave} disabled={submitLoading} className="bg-black text-white rounded-[15px] w-full py-4 text-[25px] font-medium disabled:opacity-50 hover:bg-zinc-800 transition-colors">
                                {submitLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdminEventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get('id');

  const [events, setEvents] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listEvents();
      setEvents(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const getId = (item: AdminListing) => item._id || item.id || '';
  
  const filtered = (events || []).filter(l => {
    const s = l.status || '';
    if (activeTab === 'pending') return s === 'pending' || s === 'draft' || s === '';
    if (activeTab === 'approved') return s === 'approved' || s === 'rejected';
    return false;
  });

  const preview = detailId ? events.find(l => getId(l) === detailId) : null;

  const handleStatus = async (id: string, status: ListingStatus) => {
    try {
      await adminApi.updateEventStatus(id, status);
      setEvents(prev => prev.map(item => (getId(item) === id ? { ...item, status } : item)));
      toast.success(`Event ${status} successfully`);
    } catch (e) { toast.error('Update failed'); }
  };

  const handleUpdate = async (id: string, payload: Partial<AdminListing>) => {
    await adminApi.updateEvent(id, payload);
    setEvents(prev => prev.map(item => (getId(item) === id ? { ...item, ...payload } : item)));
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteEvent(id);
      setEvents(prev => prev.filter(item => getId(item) !== id));
      if (preview && getId(preview) === id) router.push('/admin/events');
      toast.success('Event deleted successfully');
    } catch (e) { toast.error('Delete failed'); }
  };

  if (preview) {
    return (
      <AdminEventDetailView 
        ev={preview} 
        onStatus={handleStatus} 
        onUpdate={handleUpdate} 
        onDelete={handleDelete}
        onBack={() => router.push('/admin/events')}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col" style={{ background: '#F3F0FF' }}>
      {/* Header */}
      <header className="w-full h-[114px] bg-white border-b border-zinc-100 flex items-center justify-between px-[37px] sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-[159px] h-[40px] flex items-center font-bold text-2xl tracking-tighter cursor-pointer" onClick={() => router.push('/admin')}>TICPIN</div>
        </div>
        <div className="flex items-center gap-8">
          <Search size={23} className="text-[#AC9BF7] cursor-pointer" />
          <div className="w-[51px] h-[51px] bg-[#E1E1E1] rounded-full flex items-center justify-center cursor-pointer">
            <User size={24} className="text-white" />
          </div>
        </div>
      </header>

      {/* Main List Content */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-[37px] py-[66px]">
        <h1 className="text-[40px] font-semibold text-black leading-none" style={{ fontFamily: 'var(--font-anek-latin)' }}>Admin Panel</h1>
        <div className="w-[101px] h-[1.5px] bg-[#686868] mt-[24px] mb-[24px]" />
        <h2 className="text-[25px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Event Details</h2>

        <div className="bg-white rounded-[30px] shadow-sm mt-[33px] p-20 min-h-[600px] flex flex-col relative">
          <div className="flex justify-center mb-16">
            <div className="flex w-[600px] h-[52px] rounded-[14px] overflow-hidden">
              <button onClick={() => setActiveTab('pending')}
                className={`flex-1 text-[25px] font-medium transition-all ${activeTab === 'pending' ? 'bg-[#D3CBF5]' : 'bg-[#E7E2FA] opacity-50'} text-black border-r border-[#FFFFFF]`}
                style={{ fontFamily: 'var(--font-anek-latin)' }}>Needs Approval</button>
              <button onClick={() => setActiveTab('approved')}
                className={`flex-1 text-[25px] font-medium transition-all ${activeTab === 'approved' ? 'bg-[#D3CBF5]' : 'bg-[#E7E2FA] opacity-50'} text-black`}
                style={{ fontFamily: 'var(--font-anek-latin)' }}>Approved</button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-[#AC9BF7]" size={40} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-[#686868] text-[25px]">No events {activeTab === 'pending' ? 'pending approval' : 'found'}</div>
          ) : (
            <div className="grid grid-cols-1 gap-12 relative">
              {filtered.map(item => {
                const id = getId(item);
                const thumb = item.portrait_image_url || item.images?.[0] || item.image || null;
                return (
                  <div key={id} onClick={() => router.push(`?id=${id}`)} className="relative group cursor-pointer">
                    <div className="bg-[#EEEDFC] rounded-[19px] p-12 flex items-center gap-16 border border-white hover:shadow-md transition-shadow">
                      <div className="w-[220px] h-[290px] bg-white rounded-[15px] flex-shrink-0 flex items-center justify-center overflow-hidden p-2 relative border border-zinc-200">
                        {thumb ? <Image src={thumb} alt={item.name || 'Event'} fill className="object-cover rounded-[10px]" />
                          : <div className="text-center text-[11px] opacity-50 uppercase font-bold text-zinc-500">No Image</div>}
                      </div>
                      <div className="w-[1.5px] h-[100px] bg-[#AEAEAE] opacity-50" />
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-[32px] font-bold text-black uppercase leading-tight tracking-tight">
                          {item.name || 'EVENT NAME'}
                        </h3>
                        <p className="text-[20px] font-medium text-[#686868] uppercase mt-1">
                          {item.payment?.organizer_name || item.organizer_name || '—'}
                        </p>
                        <p className="text-[16px] text-[#686868] mt-1">{item.venue_address || item.address || ''}</p>
                      </div>
                      <div className={`rounded-[16px] px-6 py-2 ${item.status === 'approved' ? 'bg-[#D1F7C4] text-green-800' : item.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-[#E7E2FA] text-[#5331EA]'}`}>
                        <span className="text-[20px] font-medium capitalize">{item.status}</span>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); router.push(`?id=${id}`); }} className="absolute -right-7 top-1/2 -translate-y-1/2 w-[57px] h-[57px] bg-black rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform z-10">
                      <ChevronRight size={30} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="w-full bg-[#2A2A2A] text-white pt-[60px] pb-[40px] px-[80px] mt-20">
        <div className="max-w-[1440px] mx-auto grid grid-cols-4 gap-20">
          <div className="col-span-1"><div className="text-3xl font-bold mb-10">TICPIN</div></div>
          <div className="col-span-3 grid grid-cols-4 text-[16px] font-semibold">
            <span className="cursor-pointer hover:underline">Terms & Conditions</span>
            <span className="cursor-pointer hover:underline">Privacy Policy</span>
            <span className="cursor-pointer hover:underline">Contact Us</span>
            <span className="cursor-pointer hover:underline">List your events</span>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto mt-20 pt-10 border-t border-white/20 flex justify-between items-center text-[#686868] text-[16px]">
          <p className="max-w-3xl">By accessing this page, you confirm that you have read, understood, and agreed to our Terms of Service, Cookie Policy, Privacy Policy, and Content Guidelines. All rights reserved.</p>
          <div className="bg-[#D9D9D9] text-black px-10 py-2 rounded-md font-bold text-xl">Socials</div>
        </div>
      </footer>
    </div>
  );
}

export default function AdminEventsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><RefreshCw className="animate-spin text-[#AC9BF7]" size={48} /></div>}>
      <AdminEventsContent />
    </Suspense>
  );
}