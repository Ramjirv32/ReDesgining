'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Info, PlusCircle, ExternalLink, Bold, Italic, Underline, Search, Upload } from 'lucide-react';
import { CATEGORIES, CITIES, CATEGORY_DATA } from './data';
import { useRouter } from 'next/navigation';
import { getOrganizerSession } from '@/lib/auth/organizer';
import { uploadMedia } from '@/lib/api/admin';
import { diningApi } from '@/lib/api/dining';

const CreateDiningPage = () => {
    const router = useRouter();
    const editorRef = useRef<HTMLDivElement>(null);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [hasContent, setHasContent] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // Form fields
    const [diningName, setDiningName] = useState('');
    const [instagramLink, setInstagramLink] = useState('');
    const [googleBizLink, setGoogleBizLink] = useState('');
    const [googleMapLink, setGoogleMapLink] = useState('');
    const [portraitUrl, setPortraitUrl] = useState('');
    const [landscapeUrl, setLandscapeUrl] = useState('');
    const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
    const [menuUrls, setMenuUrls] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState('');
    const [venueAddress, setVenueAddress] = useState('');
    const [openingTime, setOpeningTime] = useState('');
    const [minAge, setMinAge] = useState('');
    const [facilities, setFacilities] = useState('');
    const [petFriendly, setPetFriendly] = useState('');

    // Payment Details
    const [payment, setPayment] = useState({
        organizerName: '',
        gstin: '',
        accountNumber: '',
        ifsc: '',
        accountType: ''
    });

    // Lists
    const [pocs, setPocs] = useState<{ name: string; email: string; mobile: string }[]>([]);
    const [salesNotifs, setSalesNotifs] = useState<{ email: string; mobile: string }[]>([]);
    const [newPoc, setNewPoc] = useState({ name: '', email: '', mobile: '' });
    const [newSales, setNewSales] = useState({ email: '', mobile: '' });

    // Optional Sections Toggles
    const [showInstructions, setShowInstructions] = useState(false);
    const [showYoutube, setShowYoutube] = useState(false);
    const [showProhibited, setShowProhibited] = useState(false);
    const [showFaqs, setShowFaqs] = useState(false);

    // Optional Sections Data
    const [diningInstructions, setDiningInstructions] = useState('');
    const [youtubeVideoUrl, setYoutubeVideoUrl] = useState('');
    const [prohibitedItems, setProhibitedItems] = useState<string[]>([]);
    const [newProhibitedItem, setNewProhibitedItem] = useState('');
    const [faqs, setFaqs] = useState<{ question: string, answer: string }[]>([]);
    const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitMsg, setSubmitMsg] = useState('');

    // Dropdown States
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [selections, setSelections] = useState({
        category: 'Select Category',
        subCategory: 'Select Sub-Category',
        city: 'Select City'
    });

    useEffect(() => {
        const session = getOrganizerSession();
        if (!session || session.categoryStatus?.dining !== 'approved') {
            setAuthChecked(false);
        } else {
            setAuthChecked(true);
            setPayment(p => ({ ...p, organizerName: session.email.split('@')[0] }));
        }
    }, []);

    if (!authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FFF1A8]/10">
                <div className="bg-white rounded-[24px] p-10 shadow-lg max-w-md text-center space-y-4">
                    <h2 className="text-[24px] font-semibold text-black">Access Restricted</h2>
                    <p className="text-[16px] text-zinc-500">Your dining registration must be approved by the admin before you can create listings.</p>
                    <button onClick={() => router.back()} className="bg-black text-white px-6 h-10 rounded-[12px] text-[14px] font-medium">Go Back</button>
                </div>
            </div>
        );
    }

    const handleUpload = async (key: string, file: File, multi = false) => {
        const maxSizeMB = key === 'video' ? 5 : 1.5;
        if (file.size > maxSizeMB * 1024 * 1024) {
            alert(`File size exceeds the allowable limit. Maximum allowed size is ${maxSizeMB}MB.`);
            return;
        }

        setUploading(u => ({ ...u, [key]: true }));
        try {
            const url = await uploadMedia(file);
            if (multi) {
                if (key === 'gallery') setGalleryUrls(prev => [...prev, url]);
                if (key === 'menu') setMenuUrls(prev => [...prev, url]);
            } else {
                if (key === 'portrait') setPortraitUrl(url);
                if (key === 'landscape') setLandscapeUrl(url);
                if (key === 'video') setVideoUrl(url);
            }
        } catch { alert('Upload failed. Try again.'); }
        finally { setUploading(u => ({ ...u, [key]: false })); }
    };

    const makeUploadInput = (key: string, accept: string, multi = false) => (
        <input type="file" accept={accept} className="hidden"
            id={`upload-${key}`}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(key, f, multi); }} />
    );

    const handleSubmit = async () => {
        const session = getOrganizerSession();
        if (!session) return;
        if (!diningName.trim()) { setSubmitMsg('Dining name is required.'); return; }
        if (selections.category === 'Select Category') { setSubmitMsg('Please select a category.'); return; }
        if (selections.city === 'Select City') { setSubmitMsg('Please select a city.'); return; }
        if (!portraitUrl || !landscapeUrl) { setSubmitMsg('Please upload both portrait and landscape card images.'); return; }

        setSubmitLoading(true); setSubmitMsg('');
        try {
            await diningApi.create({
                name: diningName.trim(),
                description: editorRef.current?.innerHTML ?? '',
                category: selections.category,
                sub_category: selections.subCategory === 'Select Sub-Category' ? '' : selections.subCategory,
                city: selections.city,
                time: openingTime,
                venue_name: diningName.trim(),
                venue_address: venueAddress,
                google_map_link: googleMapLink,
                instagram_link: instagramLink,
                google_business_link: googleBizLink,
                portrait_image_url: portraitUrl,
                landscape_image_url: landscapeUrl,
                card_video_url: videoUrl,
                gallery_urls: galleryUrls,
                menu_urls: menuUrls,
                guide: {
                    min_age: Number(minAge) || 0,
                    is_pet_friendly: petFriendly === 'Yes',
                    facilities: facilities ? [facilities] : [],
                },
                event_instructions: diningInstructions,
                youtube_video_url: youtubeVideoUrl,
                prohibited_items: prohibitedItems,
                faqs: faqs,
                payment: {
                    organizer_name: payment.organizerName,
                    gstin: payment.gstin,
                    account_number: payment.accountNumber,
                    ifsc: payment.ifsc,
                    account_type: payment.accountType,
                },
                points_of_contact: pocs,
                sales_notifications: salesNotifs,
                status: 'pending',
            });
            setSubmitMsg('✅ Dining listed successfully!');
            setTimeout(() => router.push('/organizer/dining'), 2000);
        } catch (err) {
            setSubmitMsg(err instanceof Error ? err.message : 'Submission failed.');
        } finally {
            setSubmitLoading(false);
        }
    };


    const toggleDropdown = (name: string) => setOpenDropdown(openDropdown === name ? null : name);
    const handleSelect = (name: string, value: string) => {
        setSelections(prev => {
            const newSelections = { ...prev, [name]: value };
            if (name === 'category') {
                newSelections.subCategory = 'Select Sub-Category';
            }
            return newSelections;
        });
        setOpenDropdown(null);
    };

    const addPoc = () => {
        if (!newPoc.name || !newPoc.email || !newPoc.mobile) return;
        setPocs([...pocs, newPoc]);
        setNewPoc({ name: '', email: '', mobile: '' });
    };
    const removePoc = (idx: number) => setPocs(pocs.filter((_, i) => i !== idx));

    const addSalesNotif = () => {
        if (!newSales.email || !newSales.mobile) return;
        setSalesNotifs([...salesNotifs, newSales]);
        setNewSales({ email: '', mobile: '' });
    };
    const removeSalesNotif = (idx: number) => setSalesNotifs(salesNotifs.filter((_, i) => i !== idx));

    const addProhibitedItem = () => {
        if (newProhibitedItem.trim()) {
            setProhibitedItems([...prohibitedItems, newProhibitedItem.trim()]);
            setNewProhibitedItem('');
        }
    };
    const removeProhibitedItem = (idx: number) => setProhibitedItems(prohibitedItems.filter((_, i) => i !== idx));

    const addFaq = () => {
        if (newFaq.question.trim() && newFaq.answer.trim()) {
            setFaqs([...faqs, newFaq]);
            setNewFaq({ question: '', answer: '' });
        }
    };
    const removeFaq = (idx: number) => setFaqs(faqs.filter((_, i) => i !== idx));

    const handleFormat = (command: string) => {
        document.execCommand(command, false);
        if (command === 'bold') setIsBold(!isBold);
        if (command === 'italic') setIsItalic(!isItalic);
        if (command === 'underline') setIsUnderline(!isUnderline);
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF1A8] bg-opacity-[0.1] overflow-x-hidden">
            <div className="w-full" style={{ zoom: '0.70' }}>
                <div className="max-w-[1920px] mx-auto px-10 pt-20">
                    {/* Title Section */}
                    <div className="mb-12">
                        <h1 className="text-[40px] font-medium leading-[44px] text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            List an dining
                        </h1>
                        <p className="text-[25px] font-medium leading-[28px] text-[#686868] mt-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            Only a few steps left to get your dining live on Ticpin!
                        </p>
                    </div>
                    <div className="w-[1800px] h-[1.5px] bg-gray-400 mt-[-20px] ml-[25px] mb-2"></div>

                    {/* Hidden Inputs for Uploads */}
                    {makeUploadInput('video', 'video/*')}
                    {makeUploadInput('gallery', 'image/*,video/*', true)}
                    {makeUploadInput('menu', 'image/*', true)}

                    {/* Dining Name */}
                    <div className="mb-12">
                        <label className="block text-[24px] font-medium mb-2 text-black mt-[20px]" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            Dining name
                        </label>
                        <input
                            type="text"
                            value={diningName}
                            onChange={e => setDiningName(e.target.value)}
                            placeholder="Your dining name"
                            className="w-full text-[30px] font-medium text-[black] placeholder-[#AEAEAE] bg-transparent border-none outline-none mt-[-10px]"
                            style={{ fontFamily: 'var(--font-anek-latin)' }}
                        />
                        <div className="w-full h-[px] bg-[#AEAEAE] mt-2"></div>
                    </div>

                    <div className="space-y-10 mt-[-30px]">
                        {/* Dining Description Section */}
                        <section className="bg-white rounded-[15px] p-8 relative">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-[30px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    Dining Description <span className="text-[#E7C200]">*</span>
                                </h2>
                                <div className="flex items-center border border-[#686868] rounded-[5px] h-[38px] overflow-hidden">
                                    <span className="px-5 text-[18px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                        Dining description guidelines
                                    </span>
                                    <div className="bg-[#E7C200] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                        <ExternalLink size={20} className="text-black" />
                                    </div>
                                </div>
                            </div>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-6"></div>

                            <div className="flex gap-1 mb-4 mt-[-10px]">
                                <button onClick={() => handleFormat('bold')} className={`p-2 rounded ${isBold ? 'bg-gray-200' : ''}`}>
                                    <img src="/create event/bold.svg" alt="Bold" className="w-[40px] h-[40px]" />
                                </button>
                                <button onClick={() => handleFormat('italic')} className={`p-2 rounded ${isItalic ? 'bg-gray-200' : ''}`}>
                                    <img src="/create event/italic.svg" alt="Italic" className="w-[40px] h-[40px]" />
                                </button>
                                <button onClick={() => handleFormat('underline')} className={`p-2 rounded ${isUnderline ? 'bg-gray-200' : ''}`}>
                                    <img src="/create event/underline.svg" alt="Underline" className="w-[40px] h-[40px]" />
                                </button>
                            </div>
                            <div className="border border-[#AEAEAE] rounded-[10px] p-6 min-h-[326px] relative">
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    onInput={(e) => setHasContent(e.currentTarget.innerText.length > 0)}
                                    className="w-full h-full text-[30px] font-medium text-[black] outline-none min-h-[278px]"
                                    style={{ fontFamily: 'var(--font-anek-latin)' }}
                                />
                                {!hasContent && (
                                    <div className="absolute top-6 left-6 text-[#AEAEAE] text-[25px] font-medium pointer-events-none" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                        Your dining description
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Dining Type Section */}
                        <section className="bg-white rounded-[15px] p-8">
                            <h2 className="text-[30px] font-medium text-black mb-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Dining type <span className="text-[#E7C200]">*</span>
                            </h2>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Add category tags to help your dining reach the right audience.
                            </p>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>
                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Category <span className="text-[#E7C200]">*</span></label>
                                    <div className="relative w-full">
                                        <div onClick={() => toggleDropdown('category')} className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[8px] cursor-pointer bg-transparent">
                                            <span className={`text-[20px] ${selections.category === 'Select Category' ? 'text-[#686868]' : 'text-black'}`}>{selections.category}</span>
                                            {openDropdown === 'category' ? <ChevronUp className="absolute right-6 text-black" size={24} /> : <ChevronDown className="absolute right-6 text-black" size={24} />}
                                        </div>
                                        {openDropdown === 'category' && (
                                            <div className="dropdown-menu">
                                                <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                                                    {CATEGORIES.map((opt) => (
                                                        <div key={opt} onClick={() => handleSelect('category', opt)} className="dropdown-item">{opt}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Sub-Category <span className="text-[#E7C200]">*</span></label>
                                    <div className="relative w-full">
                                        <div onClick={() => toggleDropdown('subCategory')} className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[8px] cursor-pointer bg-transparent">
                                            <span className={`text-[20px] ${selections.subCategory === 'Select Sub-Category' ? 'text-[#686868]' : 'text-black'}`}>{selections.subCategory}</span>
                                            {openDropdown === 'subCategory' ? <ChevronUp className="absolute right-6 text-black" size={24} /> : <ChevronDown className="absolute right-6 text-black" size={24} />}
                                        </div>
                                        {openDropdown === 'subCategory' && (
                                            <div className="dropdown-menu">
                                                <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                                                    {(CATEGORY_DATA[selections.category] || []).length > 0 ? (
                                                        CATEGORY_DATA[selections.category].map((opt) => (
                                                            <div key={opt} onClick={() => handleSelect('subCategory', opt)} className="dropdown-item">{opt}</div>
                                                        ))
                                                    ) : (
                                                        <div className="dropdown-item text-[#AEAEAE]">Nil</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Location Section */}
                        <section className="bg-white rounded-[15px] p-8">
                            <h2 className="text-[30px] font-medium text-black mb-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Location <span className="text-[#E7C200]">*</span>
                            </h2>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Help local audiences discover your dining and find the venue easily.
                            </p>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>City</label>
                                    <div className="relative w-full">
                                        <div onClick={() => toggleDropdown('city')} className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[8px] cursor-pointer bg-transparent">
                                            <span className={`text-[20px] ${selections.city === 'Select City' ? 'text-[#686868]' : 'text-black'}`}>{selections.city}</span>
                                            {openDropdown === 'city' ? <ChevronUp className="absolute right-6 text-black" size={24} /> : <ChevronDown className="absolute right-6 text-black" size={24} />}
                                        </div>
                                        {openDropdown === 'city' && (
                                            <div className="dropdown-menu">
                                                <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                                                    {CITIES.map((opt) => (
                                                        <div key={opt} onClick={() => handleSelect('city', opt)} className="dropdown-item">{opt}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Venue Address</label>
                                    <div className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 gap-4 mt-[10px]">
                                        <input
                                            type="text"
                                            value={venueAddress}
                                            onChange={e => setVenueAddress(e.target.value)}
                                            placeholder="Enter venue / restaurant address"
                                            className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Google map link</label>
                                    <div className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 gap-4 mt-[10px]">
                                        <input
                                            type="text"
                                            value={googleMapLink}
                                            onChange={e => setGoogleMapLink(e.target.value)}
                                            placeholder="Google Map Link"
                                            className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]"
                                        />
                                    </div>
                                </div>
                                <button className="flex items-center gap-2 text-[#686868] text-[20px] font-medium">
                                    Show Map <ChevronDown size={20} />
                                </button>
                            </div>
                        </section>

                        {/* Social Links Section */}
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <label className="block text-[20px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Instagram Link</label>
                                <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                    <input type="text" value={instagramLink} onChange={e => setInstagramLink(e.target.value)} placeholder="Enter Valid Instagram Link" className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[20px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Google business link</label>
                                <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                    <input type="text" value={googleBizLink} onChange={e => setGoogleBizLink(e.target.value)} placeholder="Enter Valid Google Business Link" className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]" />
                                </div>
                            </div>
                        </div>

                        {/* Dining Card Images Section */}
                        <section className="bg-white rounded-[15px] p-8">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-[30px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    Dining card images <span className="text-[#E7C200]">*</span>
                                </h2>
                                <div className="flex items-center border border-[#686868] rounded-[5px] h-[38px] overflow-hidden">
                                    <span className="px-5 text-[18px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                        Set image guidelines
                                    </span>
                                    <div className="bg-[#E7C200] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                        <ExternalLink size={20} className="text-black" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Please follow the dining card image guidelines and provide images in both formats.
                            </p>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>

                            <div className="space-y-6">
                                <div className="bg-[#EBEBEB] rounded-[10px] py-3 px-6">
                                    <div className="flex-1 grid grid-cols-3 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[20px] font-semibold text-[#686868]">Portrait</p>
                                            <p className="text-[20px] text-black">3:4 aspect ratio (900px by 1200px)</p>
                                            {portraitUrl && <img src={portraitUrl} alt="Portrait preview" className="w-[50px] h-[50px] rounded-[6px] object-cover border border-[#686868] mt-1" />}
                                        </div>
                                        <div className="space-y-1 ml-[-250px]">
                                            <p className="text-[20px] font-semibold text-[#686868]">Max Size</p>
                                            <p className="text-[20px] text-black">1.5MB</p>
                                        </div>
                                        <div className="flex items-center justify-end gap-6 text-[#E7C200]">
                                            <span className="text-[17px] font-medium">* required</span>
                                            {makeUploadInput('portrait', 'image/*')}
                                            <label htmlFor="upload-portrait" className="cursor-pointer">
                                                <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-[#EBEBEB]">
                                                    <span className="px-5 text-[15px] font-medium text-black">{uploading.portrait ? 'Uploading...' : portraitUrl ? 'Replace' : 'Upload'}</span>
                                                    <div className="bg-[#E7C200] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                                        <Upload size={20} className="text-black" />
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#EBEBEB] rounded-[10px] py-3 px-6">
                                    <div className="flex-1 grid grid-cols-3 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[20px] font-semibold text-[#686868]">Landscape</p>
                                            <p className="text-[20px] text-black">16:9 aspect ratio (1600px by 900px)</p>
                                            {landscapeUrl && <img src={landscapeUrl} alt="Landscape preview" className="w-[50px] h-[50px] rounded-[6px] object-cover border border-[#686868] mt-1" />}
                                        </div>
                                        <div className="space-y-1 ml-[-250px]">
                                            <p className="text-[20px] font-semibold text-[#686868]">Max Size</p>
                                            <p className="text-[20px] text-black">1.5MB</p>
                                        </div>
                                        <div className="flex items-center justify-end gap-6 text-[#E7C200]">
                                            <span className="text-[17px] font-medium">* required</span>
                                            {makeUploadInput('landscape', 'image/*')}
                                            <label htmlFor="upload-landscape" className="cursor-pointer">
                                                <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-[#EBEBEB]">
                                                    <span className="px-5 text-[15px] font-medium text-black">{uploading.landscape ? 'Uploading...' : landscapeUrl ? 'Replace' : 'Upload'}</span>
                                                    <div className="bg-[#E7C200] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                                        <Upload size={20} className="text-black" />
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Dining Card Video Section */}
                        <section className="bg-white rounded-[15px] p-8">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-[30px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    Dining card video
                                </h2>
                                <div className="flex items-center border border-[#686868] rounded-[5px] h-[38px] overflow-hidden">
                                    <span className="px-5 text-[18px] font-medium text-black">Set video guidelines</span>
                                    <div className="bg-[#E7C200] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                        <ExternalLink size={20} className="text-black" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Please follow the dining card video guidelines and provide video in both formats.
                            </p>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>
                            <div className="bg-[#EBEBEB] rounded-[10px] py-3 px-6">
                                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center gap-4">
                                    <div className="space-y-1 ml-[-10px]">
                                        <p className="text-[20px] font-semibold text-[#686868]">Dimensions</p>
                                        <p className="text-[20px] text-black">16:9 aspect ratio (1600px by 900px)</p>
                                    </div>
                                    <div className="space-y-1 ml-[-135px]">
                                        <p className="text-[20px] font-semibold text-[#686868]">Duration</p>
                                        <p className="text-[20px] text-black">10 to 60 secs</p>
                                    </div>
                                    <div className="space-y-1 ml-[-290px]">
                                        <p className="text-[20px] font-semibold text-[#686868]">Max Size</p>
                                        <p className="text-[20px] text-black">5MB</p>
                                    </div>
                                    <div className="space-y-1 ml-[-490px]">
                                        <p className="text-[20px] font-semibold text-[#686868]">Format</p>
                                        <p className="text-[20px] text-black">.mov or .mp4</p>
                                    </div>
                                    <div className="flex justify-end">
                                        {videoUrl && <p className="text-[13px] text-green-600 font-medium mr-3">✓ Uploaded</p>}
                                        <label htmlFor="upload-video" className="cursor-pointer">
                                            <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-[#EBEBEB]">
                                                <span className="px-5 text-[15px] font-medium text-black">{uploading.video ? 'Uploading...' : 'Upload'}</span>
                                                <div className="bg-[#E7C200] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                                    <Upload size={20} className="text-black" />
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#E7C20026] border border-[#E7C200] rounded-[10px] p-4 flex items-center gap-3 mt-6">
                                <img src="/create event/info-circle.svg" alt="Info" className="w-[40px] h-[40px]" />
                                <span className="text-[19px] font-medium text-black">Viewable only on mobile and tablet web</span>
                            </div>
                        </section>

                        {/* Gallery Section */}
                        <section className="bg-white rounded-[15px] p-8">
                            <h2 className="text-[30px] font-medium text-black mb-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Gallery <span className="text-[#E7C200]">*</span>
                            </h2>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6">Your dining card now supports a gallery, use images and videos to make your event stand out.</p>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>
                            <div className="bg-[#EBEBEB] rounded-[10px] py-2 px-6">
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <div className="space-y-1">
                                        <p className="text-[20px] font-semibold text-[#686868]">Format</p>
                                        <p className="text-[20px] text-black">jpeg, png</p>
                                    </div>
                                    <div className="space-y-1 ml-[-450px]">
                                        <p className="text-[20px] font-semibold text-[#686868]">Max size per image</p>
                                        <p className="text-[20px] text-black">1.5MB</p>
                                    </div>
                                    <div className="flex items-center justify-end gap-6 text-[#E7C200]">
                                        <span className="text-[17px] font-medium">* required</span>
                                        {galleryUrls.length > 0 && <span className="text-[13px] text-green-600 font-medium">{galleryUrls.length} uploaded</span>}
                                        <label htmlFor="upload-gallery" className="cursor-pointer">
                                            <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-[#EBEBEB]">
                                                <span className="px-5 text-[15px] font-medium text-black">{uploading.gallery ? 'Uploading...' : 'Upload'}</span>
                                                <div className="bg-[#E7C200] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                                    <Upload size={20} className="text-black" />
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Menu Section */}
                        <section className="bg-white rounded-[15px] p-8">
                            <h2 className="text-[30px] font-medium text-black mb-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Menu <span className="text-[#E7C200]">*</span>
                            </h2>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6">Your dining card now features a menu section, add menu images to showcase your dishes.</p>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>
                            <div className="bg-[#EBEBEB] rounded-[10px] py-2 px-6">
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <div className="space-y-1">
                                        <p className="text-[20px] font-semibold text-[#686868]">Format</p>
                                        <p className="text-[20px] text-black">jpeg, png</p>
                                    </div>
                                    <div className="space-y-1 ml-[-450px]">
                                        <p className="text-[20px] font-semibold text-[#686868]">Max size per image</p>
                                        <p className="text-[20px] text-black">1.5MB</p>
                                    </div>
                                    <div className="flex items-center justify-end gap-6 text-[#E7C200]">
                                        <span className="text-[17px] font-medium">* required</span>
                                        {menuUrls.length > 0 && <span className="text-[13px] text-green-600 font-medium">{menuUrls.length} uploaded</span>}
                                        <label htmlFor="upload-menu" className="cursor-pointer">
                                            <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-[#EBEBEB]">
                                                <span className="px-5 text-[15px] font-medium text-black">{uploading.menu ? 'Uploading...' : 'Add'}</span>
                                                <div className="bg-[#E7C200] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                                    <Upload size={20} className="text-black" />
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Dining Guide Section */}
                        <div className="mt-12">
                            <h2 className="text-[30px] font-medium text-black ml-[25px] mb-4">Clearly define dining details</h2>
                            <section className="bg-white rounded-[15px] p-8">
                                <h3 className="text-[30px] font-medium text-black mb-6">Dining Guide</h3>
                                <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-black">What time does your dining open? <span className="text-[#E7C200]">*</span></span>
                                        <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[840px] flex items-center px-6">
                                            <select value={openingTime} onChange={e => setOpeningTime(e.target.value)} className="w-full appearance-none bg-transparent outline-none text-[25px]">
                                                <option value="">Select time</option>
                                                <option value="07:00 AM">07:00 AM</option>
                                                <option value="08:00 AM">08:00 AM</option>
                                                <option value="09:00 AM">09:00 AM</option>
                                                <option value="10:00 AM">10:00 AM</option>
                                                <option value="11:00 AM">11:00 AM</option>
                                                <option value="12:00 PM">12:00 PM</option>
                                                <option value="01:00 PM">01:00 PM</option>
                                                <option value="05:00 PM">05:00 PM</option>
                                                <option value="06:00 PM">06:00 PM</option>
                                            </select>
                                            <ChevronDown size={24} className="absolute right-6" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-black">What is the minimum age allowed for entry? <span className="text-[#E7C200]">*</span></span>
                                        <div className="flex items-center gap-4 w-[840px]">
                                            <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[280px] flex items-center px-6">
                                                <select value={minAge} onChange={e => setMinAge(e.target.value)} className="w-full appearance-none bg-transparent outline-none text-[25px]">
                                                    <option value="">Select age</option>
                                                    <option value="0">No restriction</option>
                                                    <option value="5">5+</option>
                                                    <option value="10">10+</option>
                                                    <option value="13">13+</option>
                                                    <option value="18">18+</option>
                                                    <option value="21">21+</option>
                                                </select>
                                                <ChevronDown size={24} className="absolute right-6" />
                                            </div>
                                            <span className="text-[25px] font-medium text-black">& above</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-black">Choose the facilities available at your restaurant <span className="text-[#E7C200]">*</span></span>
                                        <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[840px] flex items-center px-6">
                                            <select value={facilities} onChange={e => setFacilities(e.target.value)} className="w-full appearance-none bg-transparent outline-none text-[25px]">
                                                <option value="">Select facilities</option>
                                                <option value="Parking">Parking</option>
                                                <option value="WiFi">WiFi</option>
                                                <option value="AC">Air Conditioning</option>
                                                <option value="Outdoor Seating">Outdoor Seating</option>
                                                <option value="Private Dining">Private Dining</option>
                                                <option value="Live Music">Live Music</option>
                                                <option value="Valet Parking">Valet Parking</option>
                                            </select>
                                            <ChevronDown size={24} className="absolute right-6" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-black">Is your dining pet-friendly? <span className="text-[#E7C200]">*</span></span>
                                        <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[840px] flex items-center px-6">
                                            <select value={petFriendly} onChange={e => setPetFriendly(e.target.value)} className="w-full appearance-none bg-transparent outline-none text-[25px]">
                                                <option value="">Select option</option>
                                                <option value="Yes">Yes</option>
                                                <option value="No">No</option>
                                            </select>
                                            <ChevronDown size={24} className="absolute right-6" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-[#E7C200]">Custom timing <span className="text-[#E7C200]">*</span></span>
                                        <div className="flex items-center gap-4 w-[840px]">
                                            <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[412px] flex items-center px-6">
                                                <select className="w-full appearance-none bg-transparent outline-none text-[25px] text-[#686868]">
                                                    <option>{'{DAY}'}</option>
                                                </select>
                                                <ChevronDown size={24} className="absolute right-6" />
                                            </div>
                                            <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[412px] flex items-center px-6">
                                                <select className="w-full appearance-none bg-transparent outline-none text-[25px] text-[#686868]">
                                                    <option>{'{MINUTES / HOURS}'}</option>
                                                </select>
                                                <ChevronDown size={24} className="absolute right-6" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#E7C20026] border border-[#E7C200] rounded-[10px] p-4 flex items-center gap-3 mt-6">
                                    <img src="/create event/info-circle.svg" alt="Info" className="w-[40px] h-[40px]" />
                                    <span className="text-[19px] font-medium text-black">Can’t find an option that properly describes your dining? Email dining@ticpin.in and we’ll assist you.</span>
                                </div>
                            </section>
                        </div>

                        {/* Add More Sections */}
                        <section className="bg-[#D8D8D8] rounded-[15px] p-6 mb-8 mt-12 pr-[150px]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[25px] font-semibold text-black mt-[-15px]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Add more sections</h3>
                            </div>
                            <div className="flex flex-wrap gap-6 mt-[-16px]">
                                {[
                                    { name: 'Dining Instructions', toggle: () => setShowInstructions(!showInstructions), active: showInstructions },
                                    { name: 'Youtube Video', toggle: () => setShowYoutube(!showYoutube), active: showYoutube },
                                    { name: 'Prohibited Items', toggle: () => setShowProhibited(!showProhibited), active: showProhibited },
                                    { name: 'FAQs', toggle: () => setShowFaqs(!showFaqs), active: showFaqs }
                                ].map((btn, idx) => (
                                    <button key={idx} onClick={btn.toggle} className="flex items-center bg-white rounded-[6px] h-[42px] overflow-hidden ">
                                        <span className="px-4 text-[19px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                            {btn.name}
                                        </span>
                                        <div className={`w-[42px] h-full flex items-center justify-center ${btn.active ? 'bg-black' : 'bg-[#E7C200]'}`}>
                                            <PlusCircle size={20} className={btn.active ? 'text-white' : 'text-black'} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Optional Sections Rendering */}
                        <div className="space-y-8 pr-[150px] mb-12">
                            {showInstructions && (
                                <section className="bg-white rounded-[15px] p-8">
                                    <h2 className="text-[30px] font-medium text-black mb-2">Dining Instructions</h2>
                                    <p className="text-[20px] font-medium text-[#AEAEAE] mb-6">Add specific instructions for attendees.</p>
                                    <div className="border border-[#686868] rounded-[10px] p-4">
                                        <textarea
                                            value={diningInstructions}
                                            onChange={e => setDiningInstructions(e.target.value)}
                                            placeholder="Enter instructions here..."
                                            className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE] min-h-[100px] resize-y"
                                        />
                                    </div>
                                </section>
                            )}

                            {showYoutube && (
                                <section className="bg-white rounded-[15px] p-8">
                                    <h2 className="text-[30px] font-medium text-black mb-2">YouTube Video</h2>
                                    <p className="text-[20px] font-medium text-[#AEAEAE] mb-6">Link a promotional YouTube video.</p>
                                    <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                        <input
                                            type="text"
                                            placeholder="Paste YouTube Video URL"
                                            value={youtubeVideoUrl}
                                            onChange={e => setYoutubeVideoUrl(e.target.value)}
                                            className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]"
                                        />
                                    </div>
                                </section>
                            )}

                            {showProhibited && (
                                <section className="bg-white rounded-[15px] p-8">
                                    <h2 className="text-[30px] font-medium text-black mb-2">Prohibited Items</h2>
                                    <p className="text-[20px] font-medium text-[#AEAEAE] mb-6">List items that are not allowed at the venue.</p>
                                    <div className="flex gap-4 mb-6">
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex-1 flex items-center px-6">
                                            <input
                                                type="text"
                                                placeholder="Add an item"
                                                value={newProhibitedItem}
                                                onChange={e => setNewProhibitedItem(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addProhibitedItem()}
                                                className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]"
                                            />
                                        </div>
                                        <button onClick={addProhibitedItem} className="bg-black text-white px-8 rounded-[10px] font-medium text-[20px]">Add</button>
                                    </div>
                                    {prohibitedItems.length > 0 && (
                                        <div className="flex flex-wrap gap-3">
                                            {prohibitedItems.map((item, idx) => (
                                                <div key={idx} className="bg-zinc-100 px-4 py-2 rounded-lg flex items-center gap-2">
                                                    <span>{item}</span>
                                                    <button onClick={() => removeProhibitedItem(idx)} className="text-red-500">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {showFaqs && (
                                <section className="bg-white rounded-[15px] p-8">
                                    <h2 className="text-[30px] font-medium text-black mb-2">FAQs</h2>
                                    <p className="text-[20px] font-medium text-[#AEAEAE] mb-6">Add frequently asked questions about your dining venue.</p>
                                    <div className="space-y-4 mb-6">
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input
                                                type="text"
                                                placeholder="Question"
                                                value={newFaq.question}
                                                onChange={e => setNewFaq({ ...newFaq, question: e.target.value })}
                                                className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]"
                                            />
                                        </div>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input
                                                type="text"
                                                placeholder="Answer"
                                                value={newFaq.answer}
                                                onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })}
                                                onKeyDown={e => e.key === 'Enter' && addFaq()}
                                                className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]"
                                            />
                                        </div>
                                        <button onClick={addFaq} className="bg-black text-white w-full h-[64px] rounded-[10px] font-medium text-[20px]">Add FAQ</button>
                                    </div>
                                    {faqs.length > 0 && (
                                        <div className="space-y-3">
                                            {faqs.map((faq, idx) => (
                                                <div key={idx} className="bg-zinc-100 p-4 rounded-lg relative">
                                                    <p className="font-semibold text-[18px]">Q: {faq.question}</p>
                                                    <p className="text-[18px] text-zinc-600">A: {faq.answer}</p>
                                                    <button onClick={() => removeFaq(idx)} className="absolute top-4 right-4 text-red-500 font-medium">Remove</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>

                        {/* Payment Details Section */}
                        <h2 className="text-[30px] font-medium text-black mb-6 ml-[25px]">Confirm your organisation and contact details</h2>
                        <section className="bg-white rounded-[15px] p-8">
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]">Organiser *</label>
                                    <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                        <input type="text" value={payment.organizerName} onChange={e => setPayment(p => ({ ...p, organizerName: e.target.value }))} placeholder="Organiser name" className="w-full bg-transparent outline-none text-[20px] placeholder-[#AEAEAE]" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">GSTIN / PAN:</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input type="text" value={payment.gstin} onChange={e => setPayment(p => ({ ...p, gstin: e.target.value }))} placeholder="GSTIN or PAN number" className="w-full bg-transparent outline-none text-[20px] placeholder-[#AEAEAE]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Account Number:</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input type="text" value={payment.accountNumber} onChange={e => setPayment(p => ({ ...p, accountNumber: e.target.value }))} placeholder="Bank account number" className="w-full bg-transparent outline-none text-[20px] placeholder-[#AEAEAE]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">IFSC:</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                            <input type="text" value={payment.ifsc} onChange={e => setPayment(p => ({ ...p, ifsc: e.target.value }))} placeholder="Bank IFSC code" className="w-full bg-transparent outline-none text-[20px] placeholder-[#AEAEAE]" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Account Type:</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                            <select value={payment.accountType} onChange={e => setPayment(p => ({ ...p, accountType: e.target.value }))} className="w-full bg-transparent outline-none text-[20px]">
                                                <option value="">Select type</option>
                                                <option value="Savings">Savings</option>
                                                <option value="Current">Current</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* POC Section */}
                        <section className="bg-white rounded-[15px] p-10 flex flex-col gap-8">
                            <div>
                                <h2 className="text-[30px] font-medium text-black">Point of Contact <span className="text-[#E7C200]">*</span></h2>
                                <p className="text-[20px] text-[#AEAEAE] mt-1">Please add POCs with whom dining feedback will be shared</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[20px] font-medium text-[#686868]">Name</label>
                                    <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6">
                                        <input type="text" value={newPoc.name} onChange={e => setNewPoc({ ...newPoc, name: e.target.value })} placeholder="Enter name" className="w-full bg-transparent outline-none text-[25px] text-black placeholder-[#AEAEAE]" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[20px] font-medium text-[#686868]">Mail</label>
                                    <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6">
                                        <input type="text" value={newPoc.email} onChange={e => setNewPoc({ ...newPoc, email: e.target.value })} placeholder="Enter email address" className="w-full bg-transparent outline-none text-[25px] text-black placeholder-[#AEAEAE]" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[20px] font-medium text-[#686868]">Mobile</label>
                                    <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6">
                                        <input type="text" value={newPoc.mobile} onChange={e => setNewPoc({ ...newPoc, mobile: e.target.value })} placeholder="Enter mobile number" className="w-full bg-transparent outline-none text-[25px] text-black placeholder-[#AEAEAE]" />
                                    </div>
                                </div>
                            </div>
                            {pocs.length > 0 && (
                                <div className="space-y-2">
                                    {pocs.map((poc, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-[#F5F5F5] rounded-[10px] px-6 py-3">
                                            <span className="text-[18px] text-black">{poc.name} — {poc.email} — {poc.mobile}</span>
                                            <button onClick={() => removePoc(idx)} className="text-red-500 text-[14px] font-medium">Remove</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button onClick={addPoc} className="bg-black text-white rounded-[15px] h-[65px] px-3 flex items-center gap-3">
                                    <span className="text-[30px] font-medium">ADD</span>
                                    <PlusCircle size={28} />
                                </button>
                            </div>
                        </section>

                        {/* Sales Notifications Section */}
                        <section className="bg-white rounded-[15px] p-10 flex flex-col gap-8">
                            <h2 className="text-[30px] font-medium text-black">Need a copy of every sale to</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[20px] font-medium text-[#686868]">Mail</label>
                                    <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6">
                                        <input type="text" value={newSales.email} onChange={e => setNewSales({ ...newSales, email: e.target.value })} placeholder="Enter email address" className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[20px] font-medium text-[#686868]">Mobile</label>
                                    <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6">
                                        <input type="text" value={newSales.mobile} onChange={e => setNewSales({ ...newSales, mobile: e.target.value })} placeholder="Enter mobile number" className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]" />
                                    </div>
                                </div>
                            </div>
                            {salesNotifs.length > 0 && (
                                <div className="space-y-2">
                                    {salesNotifs.map((s, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-[#F5F5F5] rounded-[10px] px-6 py-3">
                                            <span className="text-[18px] text-black">{s.email} — {s.mobile}</span>
                                            <button onClick={() => removeSalesNotif(idx)} className="text-red-500 text-[14px] font-medium">Remove</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button onClick={addSalesNotif} className="bg-black text-white rounded-[15px] h-[65px] px-3 flex items-center gap-3">
                                    <span className="text-[30px] font-medium">ADD</span>
                                    <PlusCircle size={28} />
                                </button>
                            </div>
                        </section>
                    </div>

                    <div className="flex justify-center mt-8 mb-20">
                        {submitMsg && <p className="text-center text-[18px] font-medium mb-4 text-red-500">{submitMsg}</p>}
                        <button onClick={handleSubmit} disabled={submitLoading}
                            className="bg-black text-white rounded-[15px] w-full py-3 text-[25px] font-medium disabled:opacity-50">
                            {submitLoading ? 'Saving...' : 'Save and proceed'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateDiningPage;
