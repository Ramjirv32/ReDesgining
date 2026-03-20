'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi, AdminListing, ListingStatus } from '@/lib/api/admin';
import ImageUpload from '@/components/admin/ImageUpload';
import TimeInput from '@/components/admin/TimeInput';
import {
  X, RefreshCw, Trash2, ChevronRight, Search, User, Edit3, Save, XCircle, 
  ImageOff, Upload, Check, Plus, Minus, ExternalLink, Play, Instagram, Youtube,
  FileText, ShieldAlert, BadgeInfo, PhoneCall, Wallet, Camera, MapPin
} from 'lucide-react';

type Tab = 'pending' | 'approved';

function DetailViewPanel({ ev, onStatus, updating, onUpdate, onNext, currentIndex, totalCount, onDelete, onClose }: {
  ev: AdminListing;
  onStatus: (id: string, status: ListingStatus) => void;
  updating: string | null;
  onDelete: (id: string) => void;
  onUpdate: (id: string, payload: Partial<AdminListing>) => Promise<void>;
  onNext: () => void;
  onClose: () => void;
  currentIndex: number;
  totalCount: number;
}) {
  const id = ev.name || ev.id || '';
  const [editedEv, setEditedEv] = useState<AdminListing>({ ...ev });
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [savedOk, setSavedOk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedEv({ ...ev });
    setIsEditMode(false);
  }, [ev]);

  const handleChange = (field: string, value: any) => {
    setEditedEv(prev => {
      const keys = field.split('.');
      if (keys.length === 1) return { ...prev, [field]: value };
      const newObj = JSON.parse(JSON.stringify(prev)); // Deep clone simple objects
      let current = newObj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newObj;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(id, editedEv);
      setSavedOk(true);
      setIsEditMode(false);
      setTimeout(() => setSavedOk(false), 2500);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setEditedEv({ ...ev });
    setIsEditMode(false);
  };

  // Helper for adding to arrays
  const addToArray = (field: string, defaultValue: any) => {
    const currentArray = (editedEv as any)[field] || [];
    handleChange(field, [...currentArray, defaultValue]);
  };

  const removeFromArray = (field: string, index: number) => {
    const currentArray = (editedEv as any)[field] || [];
    const newArray = currentArray.filter((_: any, i: number) => i !== index);
    handleChange(field, newArray);
  };

  const updateArrayItem = (field: string, index: number, value: any) => {
    const currentArray = (editedEv as any)[field] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    handleChange(field, newArray);
  };

  const updateNestedArrayItem = (field: string, index: number, subField: string, value: any) => {
    const currentArray = (editedEv as any)[field] || [];
    const newArray = [...currentArray];
    newArray[index] = { ...newArray[index], [subField]: value };
    handleChange(field, newArray);
  };

  const renderField = (label: string, field: string, value: any, type: 'text' | 'number' | 'tel' | 'email' | 'url' | 'checkbox' = 'text') => {
    if (!isEditMode) {
      if (type === 'checkbox') return <span className="text-black font-semibold text-[16px]">{value ? 'Yes' : 'No'}</span>;
      if (type === 'url' && value) return <a href={value} target="_blank" rel="noreferrer" className="text-[#5331EA] font-semibold hover:underline truncate max-w-[200px]">{value} ↗</a>;
      return <span className="text-black font-semibold text-[16px] truncate max-w-[250px]">{value || '—'}</span>;
    }
    if (type === 'checkbox') {
      return (
        <input 
          type="checkbox" 
          checked={!!value} 
          onChange={e => handleChange(field, e.target.checked)} 
          className="w-5 h-5 accent-black"
        />
      );
    }
    return (
      <input
        type={type}
        value={value ?? ''}
        onChange={e => {
          const val = type === 'number' ? Number(e.target.value) : e.target.value;
          handleChange(field, val);
        }}
        className="w-full bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 text-[16px] font-semibold text-black focus:outline-none focus:border-amber-400 text-right"
        placeholder={label}
      />
    );
  };

  const steps = [
    { id: 1, label: 'Basic Info', icon: <BadgeInfo size={18} /> },
    { id: 2, label: 'Media & Links', icon: <Camera size={18} /> },
    { id: 3, label: 'Pricing & Courts', icon: <Wallet size={18} /> },
    { id: 4, label: 'Guide & Rules', icon: <ShieldAlert size={18} /> },
    { id: 5, label: 'Contact & Pay', icon: <Wallet size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="pt-10 px-[37px] pb-4 flex items-start justify-between border-b border-zinc-100">
        <div>
          <h1 className="text-[34px] font-semibold text-black leading-none" style={{ fontFamily: 'var(--font-anek-latin)' }}>Admin Panel — Play</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[#686868] font-medium">{editedEv.name || 'Untitled Venue'}</span>
            <span className={`px-3 py-0.5 rounded-full text-[12px] font-bold uppercase ${editedEv.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {editedEv.status}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {savedOk && <span className="text-green-600 font-bold text-[14px] flex items-center gap-1"><Check size={16}/> Saved</span>}
          {!isEditMode ? (
            <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-400 text-black font-bold hover:bg-amber-500 transition-all shadow-sm">
              <Edit3 size={18} /> Edit Mode
            </button>
          ) : (
            <>
              <button onClick={handleDiscard} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50 transition-all">
                <Trash2 size={18} /> Discard
              </button>
              <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 transition-all disabled:opacity-50">
                <Save size={18} /> {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          )}
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-black transition-colors">
            <X size={28} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-[260px] bg-zinc-50 border-r border-zinc-100 p-6 flex flex-col gap-2">
          {steps.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeStep === s.id ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-zinc-500 hover:text-black hover:bg-zinc-100'}`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
          
          <div className="mt-auto pt-6 border-t border-zinc-200">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100">
              <p className="text-[12px] text-zinc-400 uppercase font-bold tracking-widest mb-3">Status Control</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => onStatus(id, 'approved')} disabled={ev.status === 'approved'} className="w-full py-2 rounded-lg bg-green-50 text-green-700 font-bold text-[14px] hover:bg-green-100 disabled:opacity-40">Approve</button>
                <button onClick={() => onStatus(id, 'rejected')} disabled={ev.status === 'rejected'} className="w-full py-2 rounded-lg bg-red-50 text-red-700 font-bold text-[14px] hover:bg-red-100 disabled:opacity-40">Reject</button>
                <button onClick={() => { if(confirm('Delete permanently?')) onDelete(id); }} className="w-full py-2 rounded-lg border border-red-100 text-red-600 font-bold text-[14px] hover:bg-red-50 mt-2">Delete Hub</button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-white">
          
          {activeStep === 1 && (
            <div className="max-w-4xl space-y-8">
              <h3 className="text-2xl font-bold text-black border-b pb-4 mb-6">Basic Information</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Venue Name</span>
                  {renderField('Venue Name', 'name', editedEv.name)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Display Name</span>
                  {renderField('Venue Name', 'venue_name', editedEv.venue_name)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Category</span>
                  {renderField('Category', 'category', editedEv.category)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Sub Category</span>
                  {renderField('Sub Category', 'sub_category', editedEv.sub_category)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2 col-span-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Address</span>
                  {renderField('Address', 'address', editedEv.address)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">City</span>
                  {renderField('City', 'city', editedEv.city)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Venue Address (Strict)</span>
                  {renderField('Venue Address', 'venue_address', editedEv.venue_address)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Listing Date</span>
                  {isEditMode ? (
                    <input 
                      type="date" 
                      value={editedEv.date ? new Date(editedEv.date).toISOString().split('T')[0] : ''} 
                      onChange={e => handleChange('date', e.target.value)}
                      className="w-full bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 text-[16px] font-semibold text-black focus:outline-none focus:border-amber-400 text-right"
                    />
                  ) : (
                    <span className="text-black font-semibold text-[16px] text-right">
                      {editedEv.date ? new Date(editedEv.date).toLocaleDateString() : 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="max-w-4xl space-y-10">
              <h3 className="text-2xl font-bold text-black border-b pb-4 mb-6">Media & Links</h3>
              
              <div className="grid grid-cols-2 gap-8">
                {/* Images */}
                <div className="space-y-4">
                  <p className="text-[14px] text-zinc-400 font-bold uppercase tracking-widest">Portrait Banner</p>
                  <div className="relative w-full h-[300px] bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200 group">
                    {editedEv.portrait_image_url ? (
                      <Image src={editedEv.portrait_image_url} alt="Portrait" fill className="object-cover" />
                    ) : <div className="flex items-center justify-center h-full"><ImageOff size={48} className="text-zinc-300"/></div>}
                  </div>
                  {renderField('Portrait URL', 'portrait_image_url', editedEv.portrait_image_url, 'url')}
                </div>
                
                <div className="space-y-4">
                  <p className="text-[14px] text-zinc-400 font-bold uppercase tracking-widest">Landscape Banner</p>
                  <div className="relative w-full h-[300px] bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200">
                    {editedEv.landscape_image_url ? (
                      <Image src={editedEv.landscape_image_url} alt="Landscape" fill className="object-cover" />
                    ) : <div className="flex items-center justify-center h-full"><ImageOff size={48} className="text-zinc-300"/></div>}
                  </div>
                  {renderField('Landscape URL', 'landscape_image_url', editedEv.landscape_image_url, 'url')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-12 gap-y-6 mt-6">
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Secondary Banner</span>
                  {renderField('Secondary Banner URL', 'secondary_banner_url', editedEv.secondary_banner_url, 'url')}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Card Video</span>
                  {renderField('Card Video URL', 'card_video_url', editedEv.card_video_url, 'url')}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase flex items-center gap-2"><MapPin size={14}/> Google Maps</span>
                  {renderField('Google Maps Link', 'google_map_link', editedEv.google_map_link, 'url')}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase flex items-center gap-2"><Youtube size={14}/> Youtube</span>
                  {renderField('Youtube Video URL', 'youtube_video_url', editedEv.youtube_video_url, 'url')}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase flex items-center gap-2"><Instagram size={14}/> Instagram</span>
                  {renderField('Instagram Link', 'instagram_link', editedEv.instagram_link, 'url')}
                </div>
              </div>

              {/* Gallery List */}
              <div className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[14px] text-zinc-400 font-bold uppercase tracking-widest">Gallery Images</p>
                  {isEditMode && (
                    <button onClick={() => addToArray('gallery_urls', '')} className="flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all">
                      <Plus size={14}/> Add Image
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {(editedEv.gallery_urls || []).map((url, i) => (
                    <div key={i} className="relative aspect-video bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden group">
                      {url ? <Image src={url} alt={`Gal ${i}`} fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-zinc-300">Empty URL</div>}
                      {isEditMode && (
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                          <input 
                            value={url} 
                            onChange={e => updateArrayItem('gallery_urls', i, e.target.value)}
                            placeholder="Image URL"
                            className="w-full text-[10px] bg-white rounded px-1 text-black outline-none"
                          />
                          <button onClick={() => removeFromArray('gallery_urls', i)} className="text-white hover:text-red-400 flex items-center gap-1 text-[10px] font-bold">
                            <Trash2 size={10}/> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {(editedEv.gallery_urls || []).length === 0 && <p className="text-zinc-400 text-[14px] italic">No gallery images added</p>}
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="max-w-4xl space-y-10">
              <h3 className="text-2xl font-bold text-black border-b pb-4 mb-6">Pricing & Court Management</h3>
              
              <div className="grid grid-cols-3 gap-8">
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Price Starts From (₹)</span>
                  {renderField('Price Starts', 'price_starts_from', editedEv.price_starts_from, 'number')}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Opening Time</span>
                  {renderField('Opening', 'opening_time', editedEv.opening_time)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Closing Time</span>
                  {renderField('Closing', 'closing_time', editedEv.closing_time)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Displays As Timings</span>
                  {renderField('Timings', 'time', editedEv.time)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Slot Duration</span>
                  {renderField('Duration', 'duration', editedEv.duration)}
                </div>
              </div>

              {/* Courts Array */}
              <div className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[18px] font-bold text-black">Courts Configuration</h4>
                  {isEditMode && (
                    <button onClick={() => addToArray('courts', { name: '', type: 'Court', price: 0, image_url: '' })} className="flex items-center gap-2 px-4 py-1.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-md">
                      <Plus size={16}/> Add New Court
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {(editedEv.courts || []).map((court, i) => (
                    <div key={i} className="flex gap-6 bg-zinc-50 p-6 rounded-2xl border border-zinc-100 items-center hover:bg-zinc-100/50 transition-colors">
                      <div className="w-24 h-24 relative rounded-xl overflow-hidden bg-white shrink-0 border border-zinc-200">
                        {court.image_url ? <Image src={court.image_url} alt={court.name} fill className="object-cover" /> : <div className="flex items-center justify-center h-full font-bold text-[10px] text-zinc-300 uppercase">No Img</div>}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Court Name</span>
                          {isEditMode ? (
                            <input value={court.name || ''} onChange={e => updateNestedArrayItem('courts', i, 'name', e.target.value)} className="bg-white border rounded px-2 py-1 text-sm font-bold" />
                          ) : <span className="text-sm font-bold">{court.name || 'Untitled'}</span>}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Type</span>
                          {isEditMode ? (
                            <input value={court.type || ''} onChange={e => updateNestedArrayItem('courts', i, 'type', e.target.value)} className="bg-white border rounded px-2 py-1 text-sm font-bold" />
                          ) : <span className="text-sm font-bold">{court.type || 'Court'}</span>}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Price (₹)</span>
                          {isEditMode ? (
                            <input type="number" value={court.price ?? 0} onChange={e => updateNestedArrayItem('courts', i, 'price', Number(e.target.value))} className="bg-white border rounded px-2 py-1 text-sm font-bold" />
                          ) : <span className="text-sm font-bold">₹{court.price}</span>}
                        </div>
                        {isEditMode && (
                          <div className="flex flex-col col-span-2">
                             <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Image URL</span>
                             <input value={court.image_url || ''} onChange={e => updateNestedArrayItem('courts', i, 'image_url', e.target.value)} className="bg-white border rounded px-2 py-1 text-xs" placeholder="Cloudinary URL" />
                          </div>
                        )}
                      </div>

                      {isEditMode && (
                        <button onClick={() => removeFromArray('courts', i)} className="text-red-300 hover:text-red-500 hover:bg-white p-2 rounded-full transition-all">
                          <Trash2 size={20}/>
                        </button>
                      )}
                    </div>
                  ))}
                  {(editedEv.courts || []).length === 0 && <div className="p-10 border-2 border-dashed border-zinc-100 rounded-3xl text-center text-zinc-400 font-medium font-anek">No courts defined for this venue</div>}
                </div>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="max-w-4xl space-y-10">
              <h3 className="text-2xl font-bold text-black border-b pb-4 mb-6">Guide & Rules</h3>
              
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Legal Info / Rules</span>
                  {renderField('Legal', 'legal_info', editedEv.legal_info)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Tickets Needed For</span>
                  {renderField('Person/Slot etc', 'tickets_needed_for', editedEv.tickets_needed_for)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Min Age</span>
                  {renderField('Age', 'guide.min_age', editedEv.guide?.min_age, 'number')}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Kid Friendly</span>
                  {renderField('Kid Friendly', 'guide.is_kid_friendly', editedEv.guide?.is_kid_friendly, 'checkbox')}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Pet Friendly</span>
                  {renderField('Pet Friendly', 'guide.is_pet_friendly', editedEv.guide?.is_pet_friendly, 'checkbox')}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Venue Type</span>
                  {renderField('Venue Type', 'guide.venue_type', editedEv.guide?.venue_type)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Audience Type</span>
                  {renderField('Audience', 'guide.audience_type', editedEv.guide?.audience_type)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Ticket Required Above Age</span>
                  {renderField('Age Limit', 'guide.ticket_required_above_age', editedEv.guide?.ticket_required_above_age, 'number')}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Gates Open Before</span>
                  <div className="flex items-center gap-2 mt-1">
                    {renderField('Enabled', 'guide.gates_open_before', editedEv.guide?.gates_open_before, 'checkbox')}
                    {editedEv.guide?.gates_open_before && (
                      <div className="flex items-center gap-2 ml-auto">
                        {isEditMode ? (
                          <>
                            <input type="number" value={editedEv.guide?.gates_open_before_value || 0} onChange={e => handleChange('guide.gates_open_before_value', Number(e.target.value))} className="w-16 bg-amber-50 border border-amber-200 rounded px-1 py-0.5 text-xs text-right" />
                            <select value={editedEv.guide?.gates_open_before_unit || 'hours'} onChange={e => handleChange('guide.gates_open_before_unit', e.target.value)} className="bg-amber-50 border border-amber-200 rounded px-1 py-0.5 text-xs">
                              <option value="hours">Hours</option>
                              <option value="minutes">Minutes</option>
                            </select>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-black">{editedEv.guide?.gates_open_before_value} {editedEv.guide?.gates_open_before_unit} before</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2 col-span-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Instructions</span>
                  {renderField('Event Instructions', 'event_instructions', editedEv.event_instructions)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2 col-span-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Terms & Conditions</span>
                  <textarea 
                    value={editedEv.terms || ''} 
                    readOnly={!isEditMode}
                    onChange={e => handleChange('terms', e.target.value)}
                    className={`w-full h-24 rounded-lg p-2 text-sm mt-1 focus:outline-none ${isEditMode ? 'bg-amber-50 border border-amber-200 text-black' : 'bg-transparent text-zinc-600'}`}
                  />
                </div>
              </div>

              {/* Lists Section */}
              <div className="grid grid-cols-2 gap-10">
                {/* Languages */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> Languages</p>
                    {isEditMode && <button onClick={() => addToArray('guide.languages', '')} className="text-black hover:opacity-70"><Plus size={20}/></button>}
                  </div>
                  <div className="space-y-2">
                    {(editedEv.guide?.languages || []).map((lang, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {isEditMode ? (
                          <>
                            <input value={lang} onChange={e => updateArrayItem('guide.languages', i, e.target.value)} className="flex-1 bg-white border rounded px-3 py-1 text-sm font-bold" />
                            <button onClick={() => removeFromArray('guide.languages', i)} className="text-red-400 p-1 hover:bg-red-50 rounded-full transition-colors"><Minus size={16}/></button>
                          </>
                        ) : <div className="flex-1 bg-zinc-50 px-3 py-1.5 rounded-lg text-sm font-semibold border border-zinc-100">{lang}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prohibited Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={14}/> Prohibited Items</p>
                    {isEditMode && <button onClick={() => addToArray('prohibited_items', '')} className="text-black hover:opacity-70"><Plus size={20}/></button>}
                  </div>
                  <div className="space-y-2">
                    {(editedEv.prohibited_items || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {isEditMode ? (
                          <>
                            <input value={item} onChange={e => updateArrayItem('prohibited_items', i, e.target.value)} className="flex-1 bg-white border rounded px-3 py-1 text-sm font-bold" />
                            <button onClick={() => removeFromArray('prohibited_items', i)} className="text-red-400 p-1 hover:bg-red-50 rounded-full transition-colors"><Minus size={16}/></button>
                          </>
                        ) : <div className="flex-1 bg-zinc-50 px-3 py-1.5 rounded-lg text-sm font-semibold border border-zinc-100">🚫 {item}</div>}
                      </div>
                    ))}
                    {(editedEv.prohibited_items || []).length === 0 && <p className="text-zinc-400 text-xs italic">No prohibited items listed</p>}
                  </div>
                </div>

                {/* Facilities / Amenities */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2"><BadgeInfo size={14}/> Facilities</p>
                    {isEditMode && <button onClick={() => addToArray('guide.facilities', '')} className="text-black hover:opacity-70"><Plus size={20}/></button>}
                  </div>
                  <div className="space-y-2">
                    {(editedEv.guide?.facilities || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {isEditMode ? (
                          <>
                            <input value={item} onChange={e => updateArrayItem('guide.facilities', i, e.target.value)} className="flex-1 bg-white border rounded px-3 py-1 text-sm font-bold" />
                            <button onClick={() => removeFromArray('guide.facilities', i)} className="text-red-400 p-1 hover:bg-red-50 rounded-full transition-colors"><Minus size={16}/></button>
                          </>
                        ) : <div className="flex-1 bg-green-50/30 px-3 py-1.5 rounded-lg text-sm font-semibold border border-green-100/50 text-green-800">✓ {item}</div>}
                      </div>
                    ))}
                    {(editedEv.guide?.facilities || []).length === 0 && <p className="text-zinc-400 text-xs italic">No facilities listed</p>}
                  </div>
                </div>
              </div>

              {/* FAQs Array */}
              <div className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[18px] font-bold text-black flex items-center gap-2"><FileText size={18}/> Frequently Asked Questions</h4>
                  {isEditMode && <button onClick={() => addToArray('faqs', { question: '', answer: '' })} className="px-4 py-1.5 bg-black text-white rounded-xl text-sm font-bold shadow-md">+ Add FAQ</button>}
                </div>
                <div className="space-y-3">
                  {(editedEv.faqs || []).map((faq, i) => (
                    <div key={i} className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 relative group">
                      {isEditMode ? (
                        <div className="space-y-3 pr-8">
                          <input value={faq.question} onChange={e => updateNestedArrayItem('faqs', i, 'question', e.target.value)} className="w-full bg-white border rounded px-4 py-2 font-bold focus:border-black outline-none" placeholder="Question?" />
                          <textarea value={faq.answer} onChange={e => updateNestedArrayItem('faqs', i, 'answer', e.target.value)} className="w-full bg-white border rounded px-4 py-2 text-sm focus:border-black outline-none h-20" placeholder="Answer..." />
                          <button onClick={() => removeFromArray('faqs', i)} className="absolute top-4 right-4 text-red-300 hover:text-red-500"><Trash2 size={18}/></button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-bold text-[16px] text-black">Q: {faq.question || 'N/A'}</p>
                          <p className="text-zinc-600 text-sm">A: {faq.answer || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {(editedEv.faqs || []).length === 0 && <p className="text-center py-10 text-zinc-300 italic">No FAQs available</p>}
                </div>
              </div>
            </div>
          )}

          {activeStep === 5 && (
            <div className="max-w-4xl space-y-10">
              <h3 className="text-2xl font-bold text-black border-b pb-4 mb-6">Contact & Payment Information</h3>
              
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Business Owner Name</span>
                  {renderField('Owner', 'payment.organizer_name', editedEv.payment?.organizer_name)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">GSTIN</span>
                  {renderField('GSTIN', 'payment.gstin', editedEv.payment?.gstin)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Account Number</span>
                  {renderField('Account No', 'payment.account_number', editedEv.payment?.account_number)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">IFSC Code</span>
                  {renderField('IFSC', 'payment.ifsc', editedEv.payment?.ifsc)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Account Type</span>
                  {renderField('Type', 'payment.account_type', editedEv.payment?.account_type)}
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2">
                  <span className="text-[14px] text-zinc-400 font-bold uppercase">Pay Mobile</span>
                  {renderField('Mobile', 'payment.mobile', editedEv.payment?.mobile, 'tel')}
                </div>
              </div>

              {/* Points of Contact */}
              <div className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[18px] font-bold text-black flex items-center gap-2"><PhoneCall size={18}/> Points of Contact</h4>
                  {isEditMode && <button onClick={() => addToArray('points_of_contact', { name: '', email: '', mobile: '' })} className="text-sm font-bold bg-black text-white px-3 py-1 rounded-lg">+ Add Contact</button>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(editedEv.points_of_contact || []).map((poc: any, i) => (
                    <div key={i} className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 flex flex-col gap-2 relative">
                      {isEditMode ? (
                        <>
                          <input value={poc.name || ''} onChange={e => updateNestedArrayItem('points_of_contact', i, 'name', e.target.value)} className="bg-white border text-sm font-bold p-2 rounded" placeholder="Name" />
                          <input value={poc.email || ''} onChange={e => updateNestedArrayItem('points_of_contact', i, 'email', e.target.value)} className="bg-white border text-sm p-2 rounded" placeholder="Email" />
                          <input value={poc.mobile || poc.phone || ''} onChange={e => updateNestedArrayItem('points_of_contact', i, 'mobile', e.target.value)} className="bg-white border text-sm p-2 rounded" placeholder="Mobile" />
                          <button onClick={() => removeFromArray('points_of_contact', i)} className="absolute top-2 right-2 text-red-300 hover:text-red-500"><X size={16}/></button>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-black">{poc.name || 'N/A'}</p>
                          <p className="text-sm text-zinc-500">{poc.email || '—'}</p>
                          <p className="text-sm text-zinc-500">{poc.mobile || poc.phone || '—'}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

               {/* Sales Notifications */}
               <div className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[18px] font-bold text-black flex items-center gap-2"><Check size={18}/> Sales Alert Contacts</h4>
                  {isEditMode && <button onClick={() => addToArray('sales_notifications', { email: '', mobile: '' })} className="text-sm font-bold bg-black text-white px-3 py-1 rounded-lg">+ Add Receiver</button>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(editedEv.sales_notifications || []).map((notif: any, i) => (
                    <div key={i} className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex flex-col gap-1 relative">
                       {isEditMode ? (
                        <>
                          <input value={notif.email || ''} onChange={e => updateNestedArrayItem('sales_notifications', i, 'email', e.target.value)} className="bg-white border text-xs p-2 rounded" placeholder="Email" />
                          <input value={notif.mobile || ''} onChange={e => updateNestedArrayItem('sales_notifications', i, 'mobile', e.target.value)} className="bg-white border text-xs p-2 rounded" placeholder="Mobile" />
                          <button onClick={() => removeFromArray('sales_notifications', i)} className="absolute top-2 right-2 text-red-300 hover:text-red-500"><X size={14}/></button>
                        </>
                      ) : (
                        <div className="flex flex-col text-sm">
                          <span className="font-semibold text-black">{notif.email || '—'}</span>
                          <span className="text-zinc-400">{notif.mobile || '—'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function AdminPlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailName = searchParams.get('id');

  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setListings(await adminApi.listPlay());
    } catch (e) { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getName = (item: AdminListing) => item.name || item.id || '';
  const filtered = (listings || []).filter(l => l.status === activeTab);
  const preview = detailName ? listings.find(l => getName(l) === detailName) : null;

  const handleStatus = async (id: string, status: ListingStatus) => {
    setUpdating(id);
    try {
      await adminApi.updatePlayStatus(id, status);
      setListings(prev => prev.map(item => (getName(item) === id ? { ...item, status } : item)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdate = async (id: string, payload: Partial<AdminListing>) => {
    try {
      await adminApi.updatePlay(id, payload);
      setListings(prev => prev.map(item => (getName(item) === id ? { ...item, ...payload } : item)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this play listing?')) return;
    try {
      await adminApi.deletePlay(id);
      setListings(prev => prev.filter(item => getName(item) !== id));
      if (preview && getName(preview) === id) {
        router.replace('/admin/play');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  if (preview) {
    return (
      <div className="min-h-screen relative overflow-x-hidden flex flex-col" style={{ background: '#FFFCED' }}>
        <DetailViewPanel
          ev={preview}
          onStatus={handleStatus}
          updating={updating}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onClose={() => router.push('/admin/play')}
          onNext={() => {
            const idx = filtered.findIndex(l => getName(l) === getName(preview));
            if (idx !== -1 && idx < filtered.length - 1) {
              router.push(`?id=${getName(filtered[idx + 1])}`);
            } else if (filtered.length > 0) {
              router.push(`?id=${getName(filtered[0])}`);
            }
          }}
          currentIndex={filtered.findIndex(l => getName(l) === getName(preview))}
          totalCount={filtered.length}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col" style={{ background: '#FFFCED' }}>
      <header className="w-full h-[114px] bg-white border-b border-zinc-100 flex items-center justify-between px-[37px] sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-[159px] h-[40px] flex items-center font-bold text-2xl tracking-tighter cursor-pointer" onClick={() => router.push('/admin')}>TICPIN</div>
        </div>
        <div className="flex items-center gap-8">
          <Search size={23} className="text-[#E7C200] cursor-pointer" />
          <div className="w-[51px] h-[51px] bg-[#E1E1E1] rounded-full flex items-center justify-center cursor-pointer">
            <User size={24} className="text-white" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-[37px] py-[66px]">
        <h1 className="text-[40px] font-semibold text-black leading-none" style={{ fontFamily: 'var(--font-anek-latin)' }}>Admin Panel</h1>
        <div className="w-[101px] h-[1.5px] bg-[#686868] mt-[24px] mb-[24px]" />
        <h2 className="text-[25px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Play Details</h2>

        <div className="bg-white rounded-[30px] shadow-sm mt-[33px] p-20 min-h-[600px] flex flex-col relative">
          <div className="flex justify-center mb-16">
            <div className="flex w-[600px] h-[52px] rounded-[14px] overflow-hidden">
              <button onClick={() => setActiveTab('pending')}
                className={`flex-1 text-[25px] font-medium transition-all ${activeTab === 'pending' ? 'bg-[#FFF7C2]' : 'bg-[#FFFCEC] opacity-50'} text-black border-r border-[#FFFFFF]`}
                style={{ fontFamily: 'var(--font-anek-latin)' }}>Needs Approval</button>
              <button onClick={() => setActiveTab('approved')}
                className={`flex-1 text-[25px] font-medium transition-all ${activeTab === 'approved' ? 'bg-[#FFF7C2]' : 'bg-[#FFFCEC] opacity-50'} text-black`}
                style={{ fontFamily: 'var(--font-anek-latin)' }}>Approved</button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-amber-400" size={40} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-[#686868] text-[25px]">No listings {activeTab}</div>
          ) : (
            <div className="grid grid-cols-1 gap-12 relative">
              {filtered.map(item => {
                const id = getName(item);
                const thumb = item.portrait_image_url || item.images?.[0] || item.image || null;
                return (
                  <div key={id} className="relative group">
                    <div className="bg-[#FFFCE4] rounded-[19px] p-12 flex items-center gap-16 border border-white hover:shadow-md transition-shadow cursor-default">
                      <div className="w-[320px] h-[180px] bg-white rounded-[15px] flex-shrink-0 flex items-center justify-center overflow-hidden p-2 relative">
                        {thumb ? <Image src={thumb} alt={item.name || 'Play'} fill className="object-cover rounded-[10px]" />
                          : <div className="text-center text-zinc-400"><ImageOff size={32} className="mx-auto mb-1" /><p className="text-[14px]">No image</p></div>}
                      </div>
                      <div className="w-[1.5px] h-[100px] bg-[#AEAEAE] opacity-50" />
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-[32px] font-bold text-black uppercase leading-tight tracking-tight">
                          {item.name || 'PLAY NAME'}
                        </h3>
                        <p className="text-[20px] font-medium text-[#686868] uppercase mt-1">
                          {item.payment?.organizer_name || item.city || '—'}
                        </p>
                        <p className="text-[16px] text-[#686868] mt-1">{item.address || ''}</p>
                      </div>
                      <div className="bg-[#FFF7C2] rounded-[16px] px-6 py-2">
                        <span className="text-[20px] font-medium text-black capitalize">{item.status}</span>
                      </div>
                    </div>

                    <button
                      onClick={e => { e.stopPropagation(); router.push(`?id=${id}`); }}
                      className="absolute -right-7 top-1/2 -translate-y-1/2 w-[57px] h-[57px] bg-black rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-transform z-10">
                      <ChevronRight size={30} />
                    </button>

                    <button
                      onClick={e => { e.stopPropagation(); if (confirm('Delete?')) handleDelete(id); }}
                      className="absolute top-4 left-4 bg-white/50 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 transition-all">
                      <Trash2 size={18} />
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

export default function AdminPlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><RefreshCw className="animate-spin text-amber-400" size={48} /></div>}>
      <AdminPlayContent />
    </Suspense>
  );
}
