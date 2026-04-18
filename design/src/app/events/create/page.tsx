'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Info, PlusCircle, ExternalLink, Bold, Italic, Underline, Search, Upload } from 'lucide-react';
import { CATEGORIES, CITIES, CATEGORY_DATA } from './data';

const CreateEventPage = () => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    // Dropdown States
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [selections, setSelections] = useState({
        category: 'Select Category',
        subCategory: 'Select Sub-Category',
        city: 'Select City'
    });

    const toggleDropdown = (name: string) => setOpenDropdown(openDropdown === name ? null : name);
    const handleSelect = (name: string, value: string) => {
        setSelections(prev => {
            const newSelections = { ...prev, [name]: value };
            // Reset subCategory if category changes
            if (name === 'category') {
                newSelections.subCategory = 'Select Sub-Category';
            }
            return newSelections;
        });
        setOpenDropdown(null);
    };

    const handleFormat = (command: string) => {
        document.execCommand(command, false);
        // Toggle state for UI feedback if needed
        if (command === 'bold') setIsBold(!isBold);
        if (command === 'italic') setIsItalic(!isItalic);
        if (command === 'underline') setIsUnderline(!isUnderline);
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };
    return (
        <div className="min-h-screen bg-[#D3CBF5 opacity-10] overflow-x-hidden">
            <div
                className="w-full"
                style={{
                    zoom: '0.70'
                }}
            >
                <div className="max-w-[1920px] mx-auto px-10 pt-20">
                    {/* Title Section */}
                    <div className="mb-12">
                        <h1 className="text-[40px] font-medium leading-[44px] text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            Create an event
                        </h1>
                        <p className="text-[25px] font-medium leading-[28px] text-[#686868] mt-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            Only a few steps left to get your event live on Ticpin!
                        </p>
                    </div>
                    <div className="w-[1800px] h-[1.5px] bg-gray-400 mt-[-20px] ml-[25px] mb-2"></div>
                    {/* Event Name */}
                    <div className="mb-12">
                        <label className="block text-[24px] font-medium mb-2 text-black mt-[20px]" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            Event name
                        </label>
                        <input
                            type="text"
                            placeholder="Your event's name"
                            className="w-full text-[30px] font-medium text-[black] placeholder-[#AEAEAE] bg-transparent border-none outline-none mt-[-10px]"
                            style={{ fontFamily: 'var(--font-anek-latin)' }}
                        />
                        <div className="w-full h-[px] bg-[#AEAEAE] mt-2"></div>
                    </div>

                    <div className="space-y-10 mt-[-30px]">
                        {/* Event Description Section */}
                        <section className="bg-white rounded-[15px] p-8 relative">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-[30px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    Event Description <span style={{ color: '#5331EA' }}>*</span>
                                </h2>
                                <div className="flex items-center border border-[#686868] rounded-[5px] h-[38px] overflow-hidden">
                                    <span className="px-5 text-[18px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                        Event description guidelines
                                    </span>
                                    <div className="bg-[#AC9BF7] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                        <ExternalLink size={20} className="text-black" />
                                    </div>
                                </div>
                            </div>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-6"></div>

                            <div className="flex gap-1 mb-4 mt-[-10px]">
                                <button
                                    onClick={() => handleFormat('bold')}
                                    className={`p-2 rounded ${isBold ? 'bg-gray-200' : ''}`}
                                >
                                    <img src="/create event/bold.svg" alt="Bold" className="w-[40px] h-[40px]" />
                                </button>
                                <button
                                    onClick={() => handleFormat('italic')}
                                    className={`p-2 rounded ${isItalic ? 'bg-gray-200' : ''}`}
                                >
                                    <img src="/create event/italic.svg" alt="Italic" className="w-[40px] h-[40px]" />
                                </button>
                                <button
                                    onClick={() => handleFormat('underline')}
                                    className={`p-2 rounded ${isUnderline ? 'bg-gray-200' : ''}`}
                                >
                                    <img src="/create event/underline.svg" alt="Underline" className="w-[40px] h-[40px]" />
                                </button>
                            </div>
                            <div className="border border-[#AEAEAE] rounded-[10px] p-6 min-h-[326px] relative">
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    onInput={(e) => {
                                        setHasContent(e.currentTarget.innerText.length > 0);
                                    }}
                                    className="w-full h-full text-[30px] font-medium text-[black] outline-none min-h-[278px]"
                                    style={{ fontFamily: 'var(--font-anek-latin)' }}
                                />
                                {!hasContent && (
                                    <div className="absolute top-6 left-6 text-[#AEAEAE] text-[25px] font-medium pointer-events-none" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                        Your event's description
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Event Type Section */}
                        <section className="bg-white rounded-[15px] p-8">
                            <h2 className="text-[30px] font-medium text-black mb-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Event type <span style={{ color: '#5331EA' }}>*</span>
                            </h2>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6 " style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Add category tags to help your event reach the right audience.
                            </p>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>
                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868] ml-[1px]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Category <span style={{ color: '#5331EA' }}>*</span></label>
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
                                    <label className="text-[20px] font-medium text-[#686868] ml-[1px]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Sub-Category <span style={{ color: '#5331EA' }}>*</span></label>
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
                                Location <span style={{ color: '#5331EA' }}>*</span>
                            </h2>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Help local audiences discover your event and find the venue easily.
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
                                    <label className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Search and select your venue address</label>
                                    <div className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 gap-4 mt-[10px]">
                                        <Search className="text-[#AEAEAE]" size={24} />
                                        <input
                                            type="text"
                                            placeholder="Search address"
                                            className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]"
                                        />
                                        <ChevronDown className="text-black" size={24} />
                                    </div>
                                </div>
                                <button className="flex items-center gap-2 text-[#686868] text-[20px] font-medium">
                                    Show Map <ChevronDown size={20} />
                                </button>
                            </div>
                        </section>

                        {/* Instagram Link Section */}
                        <div className="mb-12">
                            <label className="block text-[20px] font-medium mb-4 text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Instagram Link
                            </label>
                            <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6">
                                <input
                                    type="text"
                                    placeholder="Enter Valid Instagram Link"
                                    className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]"
                                    style={{ fontFamily: 'var(--font-anek-latin)' }}
                                />
                            </div>
                        </div>

                        {/* Event Card Images Section */}
                        <section className="bg-white rounded-[15px] p-8">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-[30px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    Event card images <span style={{ color: '#5331EA' }}>*</span>
                                </h2>
                                <div className="flex items-center border border-[#686868] rounded-[5px] h-[38px] overflow-hidden">
                                    <span className="px-5 text-[18px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                        Card image guidelines
                                    </span>
                                    <div className="bg-[#AC9BF7] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                        <ExternalLink size={20} className="text-black" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Please follow the event card image guidelines and provide images in both formats.
                            </p>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>

                            <div className="space-y-6">
                                {/* Portrait Image Upload */}
                                <div className="bg-[#EBEBEB] rounded-[10px] py-3 px-6">
                                    <div className="flex-1 grid grid-cols-3 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[20px] font-semibold text-[#686868]">Portrait</p>
                                            <p className="text-[20px] text-black">3:4 aspect ratio (900px by 1200px)</p>
                                        </div>
                                        <div className="space-y-1 ml-[-250px]">
                                            <p className="text-[20px] font-semibold text-[#686868]">Max Size</p>
                                            <p className="text-[20px] text-black">1.5MB</p>
                                        </div>
                                        <div className="flex items-center justify-end gap-6 text-[#5331EA]">
                                            <span className="text-[17px] font-medium">* required</span>
                                            <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-[#EBEBEB]">
                                                <span className="px-5 text-[15px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                                    Upload
                                                </span>
                                                <div className="bg-[#AC9BF7] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                                    <Upload size={20} className="text-black" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Landscape Image Upload */}
                                <div className="bg-[#EBEBEB] rounded-[10px] py-3 px-6">
                                    <div className="flex-1 grid grid-cols-3 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[20px] font-semibold text-[#686868]">Landscape</p>
                                            <p className="text-[20px] text-black">16:9 aspect ratio (1600px by 900px)</p>
                                        </div>
                                        <div className="space-y-1 ml-[-250px]">
                                            <p className="text-[20px] font-semibold text-[#686868]">Max Size</p>
                                            <p className="text-[20px] text-black">1.5MB</p>
                                        </div>
                                        <div className="flex items-center justify-end gap-6 text-[#5331EA]">
                                            <span className="text-[17px] font-medium">* required</span>
                                            <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-[#EBEBEB]">
                                                <span className="px-5 text-[15px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                                    Upload
                                                </span>
                                                <div className="bg-[#AC9BF7] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                                    <Upload size={20} className="text-black" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Event Card Video Section */}
                        <section className="bg-white rounded-[15px] p-8">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-[30px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    Event card video
                                </h2>
                                <div className="flex items-center border border-[#686868] rounded-[5px] h-[38px] overflow-hidden">
                                    <span className="px-5 text-[18px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                        Card video guidelines
                                    </span>
                                    <div className="bg-[#AC9BF7] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                        <ExternalLink size={20} className="text-black" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Please follow the event card video guidelines and provide video in both formats.
                            </p>
                            <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>

                            <div className="bg-[#EBEBEB] rounded-[10px] py-3 px-6">
                                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center gap-4">
                                    <div className="space-y-1 ml-[-10px]">
                                        <p className="text-[20px] font-semibold text-[#686868]">Dimensions</p>
                                        <p className="text-[20px] text-black">3:4 aspect ratio (900px by 1200px)</p>
                                    </div>
                                    <div className="space-y-1 ml-[-135px]">
                                        <p className="text-[20px] font-semibold text-[#686868]">Duration</p>
                                        <p className="text-[20px] text-black font-medium">10 to 60 secs</p>
                                    </div>
                                    <div className="space-y-1 ml-[-290px]">
                                        <p className="text-[20px] font-semibold text-[#686868]">Max Size</p>
                                        <p className="text-[20px] text-black font-medium">5MB</p>
                                    </div>
                                    <div className="space-y-1 ml-[-490px]">
                                        <p className="text-[20px] font-semibold text-[#686868]">Format</p>
                                        <p className="text-[20px] text-black font-medium">.mov or .mp4</p>
                                    </div>
                                    <div className="flex justify-end">
                                        <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-[#EBEBEB]">
                                            <span className="px-5 text-[15px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                                Upload
                                            </span>
                                            <div className="bg-[#AC9BF7] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                                <Upload size={20} className="text-black" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#5331EA26] border border-[#5331EA] rounded-[10px] p-4 flex items-center gap-3 mt-6">
                                <div className="flex items-center justify-center w-6 h-6">
                                    <img src="/create event/info-circle.svg" alt="Info" className="w-[40px] h-[40px]" />
                                </div>
                                <span className="text-[19px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    Viewable only on mobile and tablet web
                                </span>
                            </div>
                        </section>

                        {/* Gallery Section */}
                        <section className="bg-white rounded-[15px] p-8">
                            <h2 className="text-[30px] font-medium text-black mb-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Gallery <span style={{ color: '#5331EA' }}>*</span>
                            </h2>
                            <p className="text-[20px] font-medium text-[#AEAEAE] mb-6" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Your event card now supports a gallery, use images and videos to make your event stand out.
                            </p>
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
                                    <div className="flex items-center justify-end gap-6 text-[#5331EA]">
                                        <span className="text-[17px] font-medium">* required</span>
                                        <div className="flex items-center border border-[#686868] rounded-[5px] h-[35px] overflow-hidden bg-[#EBEBEB]">
                                            <span className="px-5 text-[15px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                                Upload
                                            </span>
                                            <div className="bg-[#AC9BF7] w-[41px] h-full flex items-center justify-center border-l border-[#686868]">
                                                <Upload size={20} className="text-black" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Event Guide Section */}
                        <div className="mt-12">
                            <h2 className="text-[30px] font-medium text-black ml-[25px] mb-4" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Clearly define event details
                            </h2>
                            <section className="bg-white rounded-[15px] p-8 ">
                                <h3 className="text-[30px] font-medium text-black mb-6" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    Event Guide
                                </h3>
                                <div className="w-full h-[1px] bg-[#AEAEAE] mb-8"></div>

                                <div className="space-y-6">
                                    {/* Q1 */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-black">Which languages will your event be performed in? <span className="text-[#5331EA]">*</span></span>
                                        <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[840px] flex items-center px-6">
                                            <select className="w-full appearance-none bg-transparent outline-none text-[25px]">
                                                <option>sample</option>
                                                <option>sample 1</option>
                                                <option>sample 2</option>

                                            </select>
                                            <ChevronDown size={24} className="absolute right-6" />
                                        </div>
                                    </div>

                                    {/* Q2 & Q3 with Age select */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-black">What is the minimum age allowed for entry? <span className="text-[#5331EA]">*</span></span>
                                        <div className="flex items-center gap-4 w-[840px]">
                                            <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[280px] flex items-center px-6">
                                                <select className="w-full appearance-none bg-transparent outline-none text-[25px]">
                                                    <option>sample</option>
                                                    <option>sample 1</option>
                                                    <option>sample 2</option>
                                                </select>
                                                <ChevronDown size={24} className="absolute right-6" />
                                            </div>
                                            <span className="text-[25px] font-medium text-black">& above</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-black">Above what age is a ticket required (paid entry)? <span className="text-[#5331EA]">*</span></span>
                                        <div className="flex items-center gap-4 w-[840px]">
                                            <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[280px] flex items-center px-6">
                                                <select className="w-full appearance-none bg-transparent outline-none text-[25px]">
                                                    <option>sample</option>
                                                    <option>sample 1</option>
                                                    <option>sample 2</option>
                                                </select>
                                                <ChevronDown size={24} className="absolute right-6" />
                                            </div>
                                            <span className="text-[25px] font-medium text-black">& above</span>
                                        </div>
                                    </div>

                                    {/* Q4 */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-black">Is your venue indoor or outdoor? <span className="text-[#5331EA]">*</span></span>
                                        <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[840px] flex items-center px-6">
                                            <select className="w-full appearance-none bg-transparent outline-none text-[25px]">
                                                <option>sample</option>
                                                <option>sample 1</option>
                                                <option>sample 2</option>
                                            </select>
                                            <ChevronDown size={24} className="absolute right-6" />
                                        </div>
                                    </div>
                                    {/* Q5 */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-black">Will your audience be seated or standing? <span className="text-[#5331EA]">*</span></span>
                                        <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[840px] flex items-center px-6">
                                            <select className="w-full appearance-none bg-transparent outline-none text-[25px]">
                                                <option>sample</option>
                                                <option>sample 1</option>
                                                <option>sample 2</option>
                                            </select>
                                            <ChevronDown size={24} className="absolute right-6" />
                                        </div>
                                    </div>
                                    {/* Q6 */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-black">Is your event kid-friendly? <span className="text-[#5331EA]">*</span></span>
                                        <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[840px] flex items-center px-6">
                                            <select className="w-full appearance-none bg-transparent outline-none text-[25px]">
                                                <option>sample</option>
                                                <option>sample 1</option>
                                                <option>sample 2</option>
                                            </select>
                                            <ChevronDown size={24} className="absolute right-6" />
                                        </div>
                                    </div>
                                    {/* Q7 */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-black">Is your event pet-friendly? <span className="text-[#5331EA]">*</span></span>
                                        <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[840px] flex items-center px-6">
                                            <select className="w-full appearance-none bg-transparent outline-none text-[25px]">
                                                <option>sample</option>
                                                <option>sample 1</option>
                                                <option>sample 2</option>
                                            </select>
                                            <ChevronDown size={24} className="absolute right-6" />
                                        </div>
                                    </div>
                                    {/* Q8 */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-black">Do gates open before the start time of the event? <span className="text-[#5331EA]">*</span></span>
                                        <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[840px] flex items-center px-6">
                                            <select className="w-full appearance-none bg-transparent outline-none text-[25px]">
                                                <option>sample</option>
                                                <option>sample 1</option>
                                                <option>sample 2</option>
                                            </select>
                                            <ChevronDown size={24} className="absolute right-6" />
                                        </div>
                                    </div>

                                    {/* Time Select */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-medium text-[#5331EA]">Gates open before <span className="text-[#5331EA]">*</span></span>
                                        <div className="flex items-center gap-4 w-[840px]">
                                            <div className="relative border border-[#686868] rounded-[10px] h-[64px] w-[412px] flex items-center px-6">
                                                <select className="w-full appearance-none bg-transparent outline-none text-[25px] text-[#686868]">
                                                    <option>{'{NUMBER}'}</option>
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

                                {/* Note Box */}
                                <div className="bg-[#5331EA26] border border-[#5331EA] rounded-[10px] p-4 flex items-center gap-3 mt-6">
                                    <div className="flex items-center justify-center w-6 h-6">
                                        <img src="/create event/info-circle.svg" alt="Info" className="w-[40px] h-[40px]" />
                                    </div>
                                    <span className="text-[19px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                        Can’t find an option that properly describes your event? Email events@ticpin.in and we’ll assist you.
                                    </span>
                                </div>
                            </section>
                        </div>

                        <section className="bg-[#D8D8D8] rounded-[15px] p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[25px] font-semibold text-black mt-[-15px]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Add more sections</h3>
                            </div>
                            <div className="flex flex-wrap gap-6 mt-[-16px]">
                                {[
                                    { name: 'Event Instructions' },
                                    { name: 'Youtube Video' },
                                    { name: 'Prohibited Items' },
                                    { name: 'FAQs' }
                                ].map((btn, idx) => (
                                    <button key={idx} className="flex items-center bg-white rounded-[6px] h-[42px] overflow-hidden ">
                                        <span className="px-4 text-[19px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                            {btn.name}
                                        </span>
                                        <div className="bg-[#AC9BF7] w-[42px] h-full flex items-center justify-center">
                                            <PlusCircle size={20} className="text-black" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Payment Details Section */}
                        <h2 className="text-[30px] font-medium text-black mb-6 ml-[25px]" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            Confirm your payment and contact details
                        </h2>
                        <section className="bg-white rounded-[15px] p-8">

                            <div className="space-y-8 ">
                                <div className="space-y-2 mt-[-10px]">
                                    <label className="text-[20px] font-medium text-[#686868]">Organiser *</label>
                                    <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                        <input type="text" placeholder="{ORGANISER NAME}" className="w-full bg-transparent outline-none text-[20px] placeholder-[#AEAEAE]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[20px] font-medium text-[#686868]">GSTIN:</label>
                                    <div className="relative border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                        <select className="w-full appearance-none bg-transparent outline-none text-[25px] text-[#AEAEAE]">
                                            <option>{'{GSTIN} ( One from three can be choosen)'}</option>
                                        </select>
                                        <ChevronDown size={24} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Account Number:</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                            <input type="text" placeholder="{ACCOUNT NUMBER}" className="w-full bg-transparent outline-none text-[20px] placeholder-[#AEAEAE]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">IFSC:</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                            <input type="text" placeholder="{IFSC}" className="w-full bg-transparent outline-none text-[20px] placeholder-[#AEAEAE]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[20px] font-medium text-[#686868]">Account Type:</label>
                                        <div className="border border-[#686868] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                            <input type="text" placeholder="{ACCOUNT TYPE}" className="w-full bg-transparent outline-none text-[20px] placeholder-[#AEAEAE]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Point of Contact Section */}
                        <section className="bg-white rounded-[15px] p-10 flex flex-col gap-8">
                            <div>
                                <h2 className="text-[30px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    Point of Contact <span className="text-[#5331EA]">*</span>
                                </h2>
                                <p className="text-[20px] text-[#AEAEAE] mt-1" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    Please add POCs with whom event feedback will be shared
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3 ">
                                    <label className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Name</label>
                                    <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                        <input type="text" placeholder="Enter name" className="w-full bg-transparent outline-none text-[25px] text-black placeholder-[#AEAEAE] " style={{ fontFamily: 'var(--font-anek-latin)' }} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Mail</label>
                                    <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                        <input type="text" placeholder="Enter email address" className="w-full bg-transparent outline-none text-[25px] text-black placeholder-[#AEAEAE]" style={{ fontFamily: 'var(--font-anek-latin)' }} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Mobile</label>
                                    <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                        <input type="text" placeholder="Enter mobile number" className="w-full bg-transparent outline-none text-[25px] text-black placeholder-[#AEAEAE]" style={{ fontFamily: 'var(--font-anek-latin)' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button className="bg-black text-white rounded-[15px] h-[65px] px-3 flex items-center gap-3">
                                    <span className="text-[30px] font-medium" style={{ fontFamily: 'var(--font-anek-tamil)' }}>ADD</span>
                                    <PlusCircle size={28} />
                                </button>
                            </div>
                        </section>

                        {/* Sales Notifications Section */}
                        <section className="bg-white rounded-[15px] p-10 mt-12  flex flex-col gap-8">
                            <h2 className="text-[30px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                Send a copy of every sale to
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Mail</label>
                                    <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                        <input type="text" placeholder="Enter email address" className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]" style={{ fontFamily: 'var(--font-anek-latin)' }} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[20px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Mobile</label>
                                    <div className="border border-[#AEAEAE] rounded-[10px] h-[64px] flex items-center px-6 mt-[10px]">
                                        <input type="text" placeholder="Enter mobile number" className="w-full bg-transparent outline-none text-[20px] text-black placeholder-[#AEAEAE]" style={{ fontFamily: 'var(--font-anek-latin)' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button className="bg-black text-white rounded-[15px] h-[65px] px-3 flex items-center gap-3">
                                    <span className="text-[30px] font-medium" style={{ fontFamily: 'var(--font-anek-tamil)' }}>ADD</span>
                                    <PlusCircle size={28} />
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Final Action Button */}
                    <div className="flex justify-center mt-8 mb-20 ">
                        <button className="bg-black text-white rounded-[15px] w-full py-3 text-[25px] font-medium" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            Save and proceed
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateEventPage;
