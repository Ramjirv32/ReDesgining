'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown,
    ChevronUp,
    PlusCircle,
    ExternalLink,
    Upload,
    Search,
    ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { CATEGORIES, CITIES, CATEGORY_DATA } from './data';
import { getOrganizerSession } from '@/lib/auth/organizer';
import { uploadMedia } from '@/lib/api/admin';
import { eventsApi } from '@/lib/api/events';
import { useCreateEventStore } from '@/store/useCreateEventStore';
import { ArtistSection, TicketSection } from '@/components/events/shared/FormSections';

export default function CreateEventPage() {
    const router = useRouter();
    const editorRef = useRef<HTMLDivElement>(null);
    const store = useCreateEventStore();

    // UI State
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitMsg, setSubmitMsg] = useState('');

    // Rich Text State
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    // Optional Sections Toggles
    const [showTerms, setShowTerms] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showYoutube, setShowYoutube] = useState(false);
    const [showProhibited, setShowProhibited] = useState(false);
    const [showFaqs, setShowFaqs] = useState(false);

    // Local state for complex nested items that don't need global store until submit (or keep in store for consistency)
    // Actually, store has artists, tickets, pocs, so let's use them.
    const {
        artists, setArtists,
        ticketCategories, setTicketCategories,
        pocs, setPocs,
        salesNotifs, setSalesNotifs,
        galleryUrls, setGalleryUrls,
        selections, updateSelections,
        guide, updateGuide,
        payment, updatePayment,
        updateField
    } = store;

    const [newPoc, setNewPoc] = useState({ name: '', email: '', mobile: '' });
    const [newSales, setNewSales] = useState({ email: '', mobile: '' });
    const [newProhibitedItem, setNewProhibitedItem] = useState('');
    const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
    const [prohibitedItems, setProhibitedItems] = useState<string[]>([]);
    const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
    const [terms, setTerms] = useState('');
    const [eventInstructions, setEventInstructions] = useState('');
    const [youtubeVideoUrl, setYoutubeVideoUrl] = useState('');

    const toggleDropdown = (name: string) => setOpenDropdown(openDropdown === name ? null : name);

    const handleSelect = (name: string, value: string) => {
        updateSelections({ [name]: value });
        if (name === 'category') updateSelections({ subCategory: 'Select Sub-Category' });
        setOpenDropdown(null);
    };

    const handleUpload = async (key: string, file: File, multi = false) => {
        setUploading(u => ({ ...u, [key]: true }));
        try {
            const url = await uploadMedia(file);
            if (multi && key === 'gallery') setGalleryUrls([...galleryUrls, url]);
            else updateField(key === 'portrait' ? 'portraitUrl' : key === 'landscape' ? 'landscapeUrl' : 'videoUrl', url);
        } catch {
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(u => ({ ...u, [key]: false }));
        }
    };

    const handleArtistImageUpload = async (idx: number, file: File) => {
        const key = `artist-${idx}`;
        setUploading(u => ({ ...u, [key]: true }));
        try {
            const url = await uploadMedia(file);
            const newArtists = [...artists];
            newArtists[idx] = { ...newArtists[idx], image_url: url };
            setArtists(newArtists);
        } catch {
            alert('Artist image upload failed.');
        } finally {
            setUploading(u => ({ ...u, [key]: false }));
        }
    };

    const handleTicketImageUpload = async (idx: number, file: File) => {
        const key = `ticket-${idx}`;
        setUploading(u => ({ ...u, [key]: true }));
        try {
            const url = await uploadMedia(file);
            const newCats = [...ticketCategories];
            newCats[idx] = { ...newCats[idx], image_url: url };
            setTicketCategories(newCats);
        } catch {
            alert('Ticket image upload failed.');
        } finally {
            setUploading(u => ({ ...u, [key]: false }));
        }
    };

    const handleFormat = (command: string) => {
        document.execCommand(command, false);
        if (command === 'bold') setIsBold(!isBold);
        if (command === 'italic') setIsItalic(!isItalic);
        if (command === 'underline') setIsUnderline(!isUnderline);
        editorRef.current?.focus();
    };

    const addPoc = () => {
        if (!newPoc.name || !newPoc.email || !newPoc.mobile) return;
        setPocs([...pocs, newPoc]);
        setNewPoc({ name: '', email: '', mobile: '' });
    };

    const addSalesNotif = () => {
        if (!newSales.email || !newSales.mobile) return;
        setSalesNotifs([...salesNotifs, newSales]);
        setNewSales({ email: '', mobile: '' });
    };

    const addProhibitedItem = () => {
        if (newProhibitedItem.trim()) {
            setProhibitedItems([...prohibitedItems, newProhibitedItem.trim()]);
            setNewProhibitedItem('');
        }
    };

    const addFaq = () => {
        if (newFaq.question.trim() && newFaq.answer.trim()) {
            setFaqs([...faqs, newFaq]);
            setNewFaq({ question: '', answer: '' });
        }
    };

    const handleSubmit = async () => {
        const session = getOrganizerSession();
        if (!session) {
            setSubmitMsg('Please log in as an organizer.');
            return;
        }

        if (!store.eventName.trim()) {
            setSubmitMsg('Event name is required.');
            return;
        }

        if (selections.category === 'Select Category') {
            setSubmitMsg('Please select a category.');
            return;
        }

        setSubmitLoading(true);
        setSubmitMsg('');

        try {
            await eventsApi.create({
                name: store.eventName.trim(),
                description: editorRef.current?.innerHTML ?? '',
                category: selections.category,
                sub_category: selections.subCategory === 'Select Sub-Category' ? '' : selections.subCategory,
                city: selections.city === 'Select City' ? '' : selections.city,
                date: store.eventDate ? `${store.eventDate}T00:00:00Z` : '',
                time: store.eventTime,
                duration: store.duration,
                venue_name: store.venueName,
                venue_address: store.venueAddress,
                google_map_link: store.googleMapLink,
                instagram_link: store.instagramLink,
                portrait_image_url: store.portraitUrl,
                landscape_image_url: store.landscapeUrl,
                card_video_url: store.videoUrl,
                gallery_urls: galleryUrls,
                guide: {
                    languages: guide.languages,
                    min_age: guide.minAge,
                    ticket_required_above_age: guide.ticketRequiredAboveAge,
                    venue_type: guide.venueType,
                    audience_type: guide.audienceType,
                    is_kid_friendly: guide.isKidFriendly,
                    is_pet_friendly: guide.isPetFriendly,
                    gates_open_before: guide.gatesOpenBefore,
                    gates_open_before_value: guide.gatesOpenBeforeValue,
                    gates_open_before_unit: guide.gatesOpenBeforeUnit,
                    facilities: [],
                },
                terms_and_conditions: terms,
                event_instructions: eventInstructions,
                youtube_video_url: youtubeVideoUrl,
                prohibited_items: prohibitedItems,
                faqs,
                artists: artists.filter(a => a.name.trim()).map(a => ({
                    name: a.name,
                    image_url: a.image_url,
                    description: a.description,
                })),
                ticket_categories: ticketCategories.filter(t => t.name.trim()).map(t => ({
                    name: t.name,
                    price: parseFloat(t.price) || 0,
                    capacity: parseInt(t.capacity) || 0,
                    image_url: t.image_url,
                    has_image: t.has_image,
                })),
                payment: {
                    organizer_name: payment.organizerName,
                    gstin: payment.gstin,
                    account_number: payment.accountNumber,
                    ifsc: payment.ifsc,
                    account_type: payment.accountType,
                },
                points_of_contact: pocs,
                sales_notifications: salesNotifs,
            });

            setSubmitMsg('✅ Event created successfully!');
            store.reset();
            setTimeout(() => router.push('/organizer/dashboard?category=events'), 2000);
        } catch (err) {
            setSubmitMsg(err instanceof Error ? err.message : 'Failed to create event.');
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#D3CBF5]/10 overflow-x-hidden pb-20">
            <div className="w-full" style={{ zoom: '0.70' }}>
                <div className="max-w-[1920px] mx-auto px-10 pt-20">

                    {/* Header */}
                    <div className="mb-6">
                        <button onClick={() => router.back()} className="flex items-center gap-2 text-[18px] text-zinc-500 hover:text-black mb-4 transition-colors">
                            <ArrowLeft size={20} /> Back
                        </button>
                        <h1 className="text-[40px] font-medium leading-[44px] text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            Create your event
                        </h1>
                        <p className="text-[25px] font-medium text-[#686868] mt-2">Bring your event to life on Ticpin in minutes.</p>
                    </div>

                    <div className="w-[1800px] h-[1.5px] bg-gray-400 ml-[25px] mb-6" />

                    {/* Hidden Inputs */}
                    <input type="file" id="upload-portrait" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('portrait', e.target.files[0])} />
                    <input type="file" id="upload-landscape" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('landscape', e.target.files[0])} />
                    <input type="file" id="upload-video" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('video', e.target.files[0])} />
                    <input type="file" id="upload-gallery" accept="image/*,video/*" className="hidden" onChange={e => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(f => handleUpload('gallery', f, true));
                    }} multiple />

                    {/* Form Content */}
                    <div className="space-y-12">

                        {/* Event Name */}
                        <div className="mb-8">
                            <label className="block text-[24px] font-medium mb-2 text-black mt-[20px]">Event name</label>
                            <input
                                type="text"
                                placeholder="Your event's name"
                                className="w-full text-[30px] font-medium text-black placeholder-[#AEAEAE] bg-transparent border-none outline-none"
                                value={store.eventName}
                                onChange={e => updateField('eventName', e.target.value)}
                            />
                            <div className="w-full h-[1px] bg-[#AEAEAE] mt-2" />
                        </div>

                        {/* Description Section */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-[30px] font-medium text-black">Event Description <span className="text-[#5331EA]">*</span></h2>
                            </div>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-6" />

                            <div className="flex gap-2 mb-4">
                                <button onClick={() => handleFormat('bold')} className={`p-2 rounded hover:bg-zinc-100 transition-colors ${isBold ? 'bg-zinc-200' : ''}`}>
                                    <Image src="/create event/bold.svg" width={40} height={40} alt="Bold" />
                                </button>
                                <button onClick={() => handleFormat('italic')} className={`p-2 rounded hover:bg-zinc-100 transition-colors ${isItalic ? 'bg-zinc-200' : ''}`}>
                                    <Image src="/create event/italic.svg" width={40} height={40} alt="Italic" />
                                </button>
                                <button onClick={() => handleFormat('underline')} className={`p-2 rounded hover:bg-zinc-100 transition-colors ${isUnderline ? 'bg-zinc-200' : ''}`}>
                                    <Image src="/create event/underline.svg" width={40} height={40} alt="Underline" />
                                </button>
                            </div>

                            <div className="border border-[#AEAEAE] rounded-[10px] p-6 min-h-[260px] relative">
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    onInput={e => setHasContent(e.currentTarget.innerText.length > 0)}
                                    className="w-full h-full text-[30px] font-medium text-black outline-none min-h-[210px]"
                                />
                                {!hasContent && <div className="absolute top-6 left-6 text-[#AEAEAE] text-[25px] font-medium pointer-events-none">Your event's description</div>}
                            </div>
                        </section>

                        {/* Category Section */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm">
                            <h2 className="text-[30px] font-medium text-black mb-6">Event type <span className="text-[#5331EA]">*</span></h2>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8" />
                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]">Category <span className="text-[#5331EA]">*</span></label>
                                    <div className="relative">
                                        <div onClick={() => toggleDropdown('category')} className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-2 cursor-pointer bg-white">
                                            <span className={`text-[20px] ${selections.category === 'Select Category' ? 'text-[#686868]' : 'text-black'}`}>{selections.category}</span>
                                            {openDropdown === 'category' ? <ChevronUp className="absolute right-6" size={24} /> : <ChevronDown className="absolute right-6" size={24} />}
                                        </div>
                                        {openDropdown === 'category' && (
                                            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-[#686868] rounded-[10px] mt-1 max-h-[300px] overflow-y-auto shadow-lg">
                                                {CATEGORIES.map(cat => (
                                                    <div key={cat} onClick={() => handleSelect('category', cat)} className="px-6 py-3 hover:bg-[#F5F5F5] cursor-pointer text-[18px] transition-colors">{cat}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]">Sub-Category <span className="text-[#5331EA]">*</span></label>
                                    <div className="relative">
                                        <div onClick={() => toggleDropdown('subCategory')} className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-2 cursor-pointer bg-white">
                                            <span className={`text-[20px] ${selections.subCategory === 'Select Sub-Category' ? 'text-[#686868]' : 'text-black'}`}>{selections.subCategory}</span>
                                            {openDropdown === 'subCategory' ? <ChevronUp className="absolute right-6" size={24} /> : <ChevronDown className="absolute right-6" size={24} />}
                                        </div>
                                        {openDropdown === 'subCategory' && selections.category !== 'Select Category' && (
                                            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-[#686868] rounded-[10px] mt-1 max-h-[300px] overflow-y-auto shadow-lg">
                                                {(CATEGORY_DATA[selections.category] || []).map(sub => (
                                                    <div key={sub} onClick={() => handleSelect('subCategory', sub)} className="px-6 py-3 hover:bg-[#F5F5F5] cursor-pointer text-[18px] transition-colors">{sub}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Location Section */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm">
                            <h2 className="text-[30px] font-medium text-black mb-6">Location <span className="text-[#5331EA]">*</span></h2>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8" />
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]">City</label>
                                    <div className="relative">
                                        <div onClick={() => toggleDropdown('city')} className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-2 cursor-pointer bg-white">
                                            <span className={`text-[20px] ${selections.city === 'Select City' ? 'text-[#686868]' : 'text-black'}`}>{selections.city}</span>
                                            {openDropdown === 'city' ? <ChevronUp className="absolute right-6" size={24} /> : <ChevronDown className="absolute right-6" size={24} />}
                                        </div>
                                        {openDropdown === 'city' && (
                                            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-[#686868] rounded-[10px] mt-1 max-h-[300px] overflow-y-auto shadow-lg">
                                                {CITIES.map(city => (
                                                    <div key={city} onClick={() => handleSelect('city', city)} className="px-6 py-3 hover:bg-[#F5F5F5] cursor-pointer text-[18px] transition-colors">{city}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Venue Name</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-2 bg-white">
                                            <input type="text" placeholder="Enter venue name" className="w-full bg-transparent outline-none text-[20px] text-black" value={store.venueName} onChange={e => updateField('venueName', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Venue Address</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-2 bg-white relative">
                                            <Search className="absolute left-6 text-[#AEAEAE]" size={24} />
                                            <input type="text" placeholder="Search and select address" className="w-full bg-transparent outline-none text-[20px] text-black pl-10" value={store.venueAddress} onChange={e => updateField('venueAddress', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Google Maps Link</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-2 bg-white">
                                            <input type="text" placeholder="Paste URL" className="w-full bg-transparent outline-none text-[20px] text-black" value={store.googleMapLink} onChange={e => updateField('googleMapLink', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Instagram Link</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-2 bg-white">
                                            <input type="text" placeholder="Enter IG URL" className="w-full bg-transparent outline-none text-[20px] text-black" value={store.instagramLink} onChange={e => updateField('instagramLink', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Date</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-2 bg-white">
                                            <input type="date" className="w-full bg-transparent outline-none text-[20px] text-black" value={store.eventDate} onChange={e => updateField('eventDate', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Start Time</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-2 bg-white">
                                            <input type="time" className="w-full bg-transparent outline-none text-[20px] text-black" value={store.eventTime} onChange={e => updateField('eventTime', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Duration</label>
                                        <div className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-2 bg-white">
                                            <select className="w-full bg-transparent outline-none text-[20px] text-black appearance-none" value={store.duration} onChange={e => updateField('duration', e.target.value)}>
                                                <option value="">Select duration</option>
                                                {["30 mins", "1 hour", "1.5 hours", "2 hours", "2.5 hours", "3 hours", "4 hours", "All day"].map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-6 pointer-events-none" size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Images Section */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm">
                            <h2 className="text-[30px] font-medium text-black mb-2">Event card images <span className="text-[#5331EA]">*</span></h2>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8" />
                            <div className="space-y-4">
                                {[
                                    { key: 'portrait', label: 'Portrait', size: '3:4', url: store.portraitUrl },
                                    { key: 'landscape', label: 'Landscape', size: '16:9', url: store.landscapeUrl },
                                    { key: 'video', label: 'Card Video', size: 'Max 10MB', url: store.videoUrl, type: 'video' }
                                ].map(img => (
                                    <div key={img.key} className="bg-[#EBEBEB] rounded-[10px] py-4 px-6 flex items-center justify-between transition-all">
                                        <div>
                                            <p className="text-[18px] font-semibold text-[#686868]">{img.label}</p>
                                            <p className="text-[16px] text-black">{img.size}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {img.url && (
                                                <div className="relative w-[80px] h-[60px] bg-black rounded-[5px] overflow-hidden flex items-center justify-center">
                                                    {img.type === 'video' ? (
                                                        <video src={img.url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Image src={img.url} fill alt={img.label} className="object-cover" />
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => document.getElementById(`upload-${img.key}`)?.click()}
                                                className="flex items-center border border-[#686868] rounded-[5px] h-[40px] overflow-hidden bg-white"
                                            >
                                                <span className="px-5 text-[15px] font-medium text-black">{uploading[img.key] ? 'Uploading...' : img.url ? 'Replace' : 'Upload'}</span>
                                                <div className="bg-[#AC9BF7] w-[40px] h-full flex items-center justify-center border-l border-[#686868]"><Upload size={18} /></div>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8">
                                <h3 className="text-[20px] font-medium text-black mb-4">Gallery Images/Videos</h3>
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    {galleryUrls.map((url, i) => (
                                        <div key={i} className="relative aspect-video bg-black rounded-[10px] overflow-hidden group">
                                            {url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') ? (
                                                <video src={url} className="w-full h-full object-cover" />
                                            ) : (
                                                <Image src={url} fill alt="Gallery item" className="object-cover" />
                                            )}
                                            <button
                                                onClick={() => setGalleryUrls(galleryUrls.filter((_, idx) => idx !== i))}
                                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => document.getElementById('upload-gallery')?.click()}
                                        className="aspect-video border-2 border-dashed border-[#AEAEAE] rounded-[10px] flex flex-col items-center justify-center gap-2 hover:border-[#5331EA] transition-colors"
                                    >
                                        <Upload size={24} className="text-[#AEAEAE]" />
                                        <span className="text-[14px] font-medium text-[#AEAEAE]">Add to Gallery</span>
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Artist and Ticket Sections */}
                        <ArtistSection artists={artists} onChange={setArtists} onUpload={handleArtistImageUpload} />
                        <TicketSection categories={ticketCategories} onChange={setTicketCategories} onUpload={handleTicketImageUpload} />

                        {/* Guide Section */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm">
                            <h2 className="text-[30px] font-medium text-black mb-6">Event Guide</h2>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8" />
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[22px] font-medium">Languages <span className="text-[#5331EA]">*</span></span>
                                    <div className="relative w-[60%] border border-[#686868] rounded-[10px] h-[56px] flex items-center px-4 bg-white">
                                        <select className="w-full bg-transparent outline-none text-[20px] appearance-none" value={guide.languages[0] || ''} onChange={e => updateGuide({ languages: [e.target.value] })}>
                                            <option value="">Select Language</option>
                                            {["English", "Hindi", "Tamil", "Other"].map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4" size={20} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[22px] font-medium">Age Limit <span className="text-[#5331EA]">*</span></span>
                                    <div className="relative w-[60%] border border-[#686868] rounded-[10px] h-[56px] flex items-center px-4 bg-white">
                                        <select className="w-full bg-transparent outline-none text-[20px] appearance-none" value={guide.minAge} onChange={e => updateGuide({ minAge: Number(e.target.value) })}>
                                            {[0, 5, 10, 12, 14, 16, 18, 21].map(a => <option key={a} value={a}>{a}+</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4" size={20} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[22px] font-medium">Venue Type <span className="text-[#5331EA]">*</span></span>
                                    <div className="relative w-[60%] border border-[#686868] rounded-[10px] h-[56px] flex items-center px-4 bg-white">
                                        <select className="w-full bg-transparent outline-none text-[20px] appearance-none" value={guide.venueType} onChange={e => updateGuide({ venueType: e.target.value })}>
                                            {["Indoor", "Outdoor", "Both"].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4" size={20} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Optional Sections */}
                        <div className="bg-[#D8D8D8] rounded-[15px] p-8">
                            <h3 className="text-[24px] font-bold mb-6">Add more sections</h3>
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { name: 'Terms & Conditions', active: showTerms, set: setShowTerms },
                                    { name: 'Event Instructions', active: showInstructions, set: setShowInstructions },
                                    { name: 'YouTube Video', active: showYoutube, set: setShowYoutube },
                                    { name: 'Prohibited Items', active: showProhibited, set: setShowProhibited },
                                    { name: 'FAQs', active: showFaqs, set: setShowFaqs },
                                ].map(btn => (
                                    <button
                                        key={btn.name}
                                        onClick={() => btn.set(!btn.active)}
                                        className="flex items-center h-[45px] bg-white rounded-[8px] overflow-hidden shadow-sm hover:translate-y-[-2px] transition-transform"
                                    >
                                        <span className="px-5 font-medium text-[18px]">{btn.name}</span>
                                        <div className={`w-[45px] h-full flex items-center justify-center ${btn.active ? 'bg-black text-white' : 'bg-[#AC9BF7] text-black'}`}>
                                            <PlusCircle size={22} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {showTerms && (
                            <section className="bg-white rounded-[15px] p-8 shadow-sm">
                                <h2 className="text-[28px] font-medium mb-4">Terms & Conditions</h2>
                                <textarea
                                    className="w-full p-6 border border-[#686868] rounded-[12px] text-[20px] min-h-[150px] outline-none"
                                    placeholder="Enter terms..."
                                    value={terms}
                                    onChange={e => setTerms(e.target.value)}
                                />
                            </section>
                        )}

                        {showInstructions && (
                            <section className="bg-white rounded-[15px] p-8 shadow-sm">
                                <h2 className="text-[28px] font-medium mb-4">Event Instructions</h2>
                                <textarea
                                    className="w-full p-6 border border-[#686868] rounded-[12px] text-[20px] min-h-[150px] outline-none"
                                    placeholder="Enter instructions..."
                                    value={eventInstructions}
                                    onChange={e => setEventInstructions(e.target.value)}
                                />
                            </section>
                        )}

                        {showYoutube && (
                            <section className="bg-white rounded-[15px] p-8 shadow-sm">
                                <h2 className="text-[28px] font-medium mb-4">YouTube Video</h2>
                                <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 bg-white">
                                    <input
                                        type="text"
                                        placeholder="Paste YouTube Link"
                                        className="w-full bg-transparent outline-none text-[20px]"
                                        value={youtubeVideoUrl}
                                        onChange={e => setYoutubeVideoUrl(e.target.value)}
                                    />
                                </div>
                            </section>
                        )}

                        {showProhibited && (
                            <section className="bg-white rounded-[15px] p-8 shadow-sm">
                                <h2 className="text-[28px] font-medium mb-4">Prohibited Items</h2>
                                <div className="flex gap-4 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Add item..."
                                        className="flex-1 h-[60px] px-6 border border-[#686868] rounded-[10px] text-[20px]"
                                        value={newProhibitedItem}
                                        onChange={e => setNewProhibitedItem(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addProhibitedItem()}
                                    />
                                    <button onClick={addProhibitedItem} className="bg-black text-white px-8 rounded-[10px] font-bold">Add</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {prohibitedItems.map((item, i) => (
                                        <div key={i} className="bg-zinc-100 flex items-center gap-2 px-4 py-2 rounded-lg">
                                            <span className="text-[18px]">{item}</span>
                                            <button onClick={() => setProhibitedItems(prohibitedItems.filter((_, idx) => idx !== i))} className="text-red-500 font-bold">×</button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {showFaqs && (
                            <section className="bg-white rounded-[15px] p-8 shadow-sm">
                                <h2 className="text-[28px] font-medium mb-4">FAQs</h2>
                                <div className="space-y-4 mb-6">
                                    <input type="text" placeholder="Question" className="w-full h-[60px] px-6 border border-[#686868] rounded-[10px] text-[20px]" value={newFaq.question} onChange={e => setNewFaq({ ...newFaq, question: e.target.value })} />
                                    <input type="text" placeholder="Answer" className="w-full h-[60px] px-6 border border-[#686868] rounded-[10px] text-[20px]" value={newFaq.answer} onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })} />
                                    <button onClick={addFaq} className="bg-black text-white h-[60px] w-full rounded-[10px] text-[20px] font-semibold">Add FAQ</button>
                                </div>
                                <div className="space-y-3">
                                    {faqs.map((f, i) => (
                                        <div key={i} className="bg-zinc-50 p-6 rounded-[12px] relative border border-zinc-100">
                                            <p className="font-bold text-[20px]">Q: {f.question}</p>
                                            <p className="text-[18px] text-zinc-600 mt-2">A: {f.answer}</p>
                                            <button onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))} className="absolute top-6 right-6 text-red-500 font-bold">×</button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Payment & Contact Details */}
                        <section className="bg-white rounded-[15px] p-8 shadow-sm">
                            <h2 className="text-[30px] font-medium mb-6">Confirm payment and contact details</h2>
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Organizer Name *</label>
                                        <input type="text" className="w-full h-[60px] border border-[#686868] rounded-[10px] px-6 text-[20px]" value={payment.organizerName} onChange={e => updatePayment({ organizerName: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">GSTIN</label>
                                        <input type="text" className="w-full h-[60px] border border-[#686868] rounded-[10px] px-6 text-[20px]" value={payment.gstin} onChange={e => updatePayment({ gstin: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Bank Account Number</label>
                                        <input type="text" className="w-full h-[60px] border border-[#686868] rounded-[10px] px-6 text-[20px]" value={payment.accountNumber} onChange={e => updatePayment({ accountNumber: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">IFSC Code</label>
                                        <input type="text" className="w-full h-[60px] border border-[#686868] rounded-[10px] px-6 text-[20px]" value={payment.ifsc} onChange={e => updatePayment({ ifsc: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Account Type</label>
                                        <select className="w-full h-[60px] border border-[#686868] rounded-[10px] px-6 text-[20px] appearance-none" value={payment.accountType} onChange={e => updatePayment({ accountType: e.target.value })}>
                                            <option value="Current">Current</option>
                                            <option value="Savings">Savings</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="w-full h-[1px] bg-[#AEAEAE] my-8" />

                                <h3 className="text-[24px] font-semibold">Points of Contact</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <input type="text" placeholder="Name" className="h-[56px] border border-[#686868] rounded-[10px] px-4" value={newPoc.name} onChange={e => setNewPoc({ ...newPoc, name: e.target.value })} />
                                    <input type="email" placeholder="Email" className="h-[56px] border border-[#686868] rounded-[10px] px-4" value={newPoc.email} onChange={e => setNewPoc({ ...newPoc, email: e.target.value })} />
                                    <input type="tel" placeholder="Mobile" className="h-[56px] border border-[#686868] rounded-[10px] px-4" value={newPoc.mobile} onChange={e => setNewPoc({ ...newPoc, mobile: e.target.value })} />
                                    <button onClick={addPoc} className="bg-black text-white rounded-[10px] font-medium">Add POC</button>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {pocs.map((poc, i) => (
                                        <div key={i} className="bg-zinc-100 px-4 py-2 rounded-lg flex items-center gap-4">
                                            <span className="font-medium text-[16px]">{poc.name} ({poc.mobile})</span>
                                            <button onClick={() => setPocs(pocs.filter((_, idx) => idx !== i))} className="text-red-500 font-bold">×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Submit Section */}
                        <div className="space-y-6 flex flex-col items-center">
                            {submitMsg && (
                                <div className={`px-8 py-4 rounded-[12px] text-[20px] font-medium ${submitMsg.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {submitMsg}
                                </div>
                            )}
                            <button
                                onClick={handleSubmit}
                                disabled={submitLoading}
                                className={`w-[400px] h-[80px] rounded-[15px] text-[28px] font-bold text-white transition-all shadow-xl hover:scale-105 active:scale-95 ${submitLoading ? 'bg-zinc-400' : 'bg-black'}`}
                            >
                                {submitLoading ? 'Creating Event...' : 'Create Event'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
