'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi, AdminListing, ListingStatus } from '@/lib/api/admin';
import {
  X, RefreshCw, Trash2, ChevronRight, Search, User
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
  const id = ev.id || ev._id || '';
  const [editedEv, setEditedEv] = useState<AdminListing>({ ...ev });
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setEditedEv({ ...ev });
  }, [ev]);

  const thumb = editedEv.portrait_image_url || editedEv.landscape_image_url || (editedEv.images && editedEv.images[0]) || editedEv.image || null;

  const handleChange = (field: string, value: any) => {
    setEditedEv(prev => {
      const keys = field.split('.');
      if (keys.length === 1) return { ...prev, [field]: value };
      const newObj = { ...prev } as any;
      let current = newObj;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
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
      alert('Changes saved successfully');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const detailRows = [
    { label: 'Event Name', field: 'name', value: editedEv.name || editedEv.title || '' },
    { label: 'Artist', field: 'artist_name', value: editedEv.artist_name || '' },
    { label: 'Category', field: 'category', value: editedEv.category || '' },
    { label: 'Venue Rules', field: 'legal_info', value: editedEv.legal_info || '' },
    { label: 'Min Price', field: 'price_starts_from', value: editedEv.price_starts_from || 0, type: 'number' },
    { label: 'Ticket Tiers', value: editedEv.ticket_categories?.length ? `${editedEv.ticket_categories.length} Tiers` : 'N/A', readOnly: true },
    { label: 'Age Restriction', field: 'guide.min_age', value: editedEv.guide?.min_age || 0, type: 'number' },
    { label: 'Venue Type', field: 'guide.venue_type', value: editedEv.guide?.venue_type || '' },
    { label: 'Venue', field: 'venue_name', value: editedEv.venue_name || '' },
    { label: 'Venue Link', field: 'google_map_link', value: editedEv.google_map_link || '', isLink: true },
    { label: 'Timings', field: 'time', value: editedEv.time || '' },
    { label: 'Created at', value: editedEv.created_at ? new Date(editedEv.created_at).toLocaleDateString() : 'N/A', readOnly: true },
    { label: 'Organizer', field: 'organizer_name', value: editedEv.organizer_name || '', readOnly: true },
    { label: 'Legal', value: 'Verified', readOnly: true },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col shadow-sm relative overflow-hidden">
      <div className="pt-12 px-[37px] pb-6">
        <h1 className="text-[40px] font-semibold text-black leading-none" style={{ fontFamily: 'var(--font-anek-latin)' }}>Admin Panel</h1>
        <div className="w-[101px] h-[1.5px] bg-[#686868] mt-[24px] mb-[24px]"></div>
        <h2 className="text-[25px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Event Details</h2>
      </div>

      <div className="flex-1 px-[37px] pb-16 flex gap-16 items-center">
        <div className="w-1/3 flex flex-col h-[400px]">
          <div className="bg-[#EEEDFC] rounded-[19px] flex-1 flex flex-col items-center justify-center p-8 overflow-hidden relative border border-white">
            <div className="bg-white w-full h-full rounded-[15px] flex items-center justify-center overflow-hidden mb-2 shadow-sm">
              {thumb ? (
                <img src={thumb} alt={editedEv.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <p className="text-[17px] font-medium text-black">{"{EVENT POSTER}"}</p>
                  <p className="text-[12px] font-medium text-black">3:4 aspect ratio</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-2/3 flex flex-col relative h-full pt-10">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 pr-4 overflow-y-auto max-h-[600px] scrollbar-hide">
                {detailRows.map((row, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex items-center justify-between border-b-[1px] border-[#AEAEAE] pb-1">
                      <span className="text-[18px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>{row.label}</span>
                      {row.readOnly ? (
                        <span className="text-[18px] font-medium text-black truncate max-w-[200px] text-right">{"{"}{row.value}{"}"}</span>
                      ) : (
                        <input
                          type={row.type === 'number' ? 'number' : 'text'}
                          value={row.value === undefined ? '' : row.value}
                          onChange={(e) => {
                            const val = row.type === 'number' ? Number(e.target.value) : e.target.value;
                            handleChange(row.field!, val);
                          }}
                          className="text-[18px] font-medium text-black bg-transparent border-none focus:outline-none text-right w-1/2"
                          placeholder={`{${row.label}}`}
                          style={{ fontFamily: 'var(--font-anek-latin)' }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-auto pb-10 flex items-center justify-between border-t border-zinc-100 pt-8">
                <div className="flex gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${i === (currentIndex % 3) ? 'bg-[#686868]' : 'bg-[#D9D9D9]'}`}></div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this event?')) onDelete(id); }}
                    className="px-6 py-2 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-all font-sans"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 font-sans"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => onStatus(id, 'approved')}
                    disabled={ev.status === 'approved' || updating === id}
                    className="px-8 py-2 rounded-xl bg-[#D1FAE5] text-[#065F46] font-bold hover:scale-105 transition-all font-sans"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onStatus(id, 'rejected')}
                    disabled={ev.status === 'rejected' || updating === id}
                    className="px-8 py-2 rounded-xl bg-red-100 text-red-700 font-bold hover:scale-105 transition-all font-sans"
                  >
                    Reject
                  </button>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="bg-black text-white rounded-[15px] px-10 h-[45px] flex items-center justify-center text-[20px] font-medium shadow-md hover:scale-105 transition-transform"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="overflow-y-auto max-h-[600px] scrollbar-hide pr-4">
                <h3 className="text-xl font-semibold mb-2">Additional Details</h3>
                {/* Guide and instructions */}
                {editedEv.guide && (
                  <div className="mb-2"><strong>Guide:</strong> {editedEv.guide.event_instructions}</div>
                )}
                {editedEv.youtube_video_url && (
                  <div className="mb-2"><strong>YouTube Video:</strong> <a href={editedEv.youtube_video_url} target="_blank" rel="noopener noreferrer">Watch</a></div>
                )}
                {/* Prohibited items */}
                {editedEv.prohibited_items && editedEv.prohibited_items.length > 0 && (
                  <div className="mb-2"><strong>Prohibited Items:</strong> {editedEv.prohibited_items.join(", ")}</div>
                )}
                {/* FAQs */}
                {editedEv.faqs && editedEv.faqs.length > 0 && (
                  <div className="mb-2"><strong>FAQs:</strong><ul>{editedEv.faqs.map((faq, idx) => (<li key={idx}><strong>Q:</strong> {faq.question} <br /> <strong>A:</strong> {faq.answer}</li>))}</ul></div>
                )}
                {/* Artists */}
                {editedEv.artists && editedEv.artists.length > 0 && (
                  <div className="mb-2"><strong>Artists:</strong><ul>{editedEv.artists.map((artist, idx) => (
                    <li key={idx}>
                      {typeof artist === 'object' ? (
                        <>
                          <span>{artist.name}</span>
                          {artist.image_url && <img src={artist.image_url} alt={artist.name} className="inline-block w-8 h-8 ml-2" />}
                        </>
                      ) : (
                        String(artist)
                      )}
                    </li>
                  ))}</ul></div>
                )}
                {/* Ticket categories */}
                {editedEv.ticket_categories && editedEv.ticket_categories.length > 0 && (
                  <div className="mb-2"><strong>Ticket Categories:</strong><ul>{editedEv.ticket_categories.map((cat, idx) => (
                    <li key={idx}>
                      {typeof cat === 'object' ? (
                        <>
                          <span><strong>Name:</strong> {cat.name}</span>{' '}
                          <span><strong>Price:</strong> {cat.price}</span>{' '}
                          <span><strong>Capacity:</strong> {cat.capacity}</span>{' '}
                          {cat.image_url && <img src={cat.image_url} alt={cat.name} className="inline-block w-8 h-8 ml-2" />}
                        </>
                      ) : (
                        String(cat)
                      )}
                    </li>
                  ))}</ul></div>
                )}
                <div className="mb-2"><strong>Tickets Needed For:</strong> {editedEv.tickets_needed_for}</div>
                <div className="mb-2"><strong>Price Starts From:</strong> ₹{editedEv.price_starts_from}</div>
                <div className="mb-2"><strong>Terms:</strong> {editedEv.terms}</div>
                {/* Payment object */}
                {editedEv.payment && (
                  <div className="mb-2"><strong>Payment:</strong> {JSON.stringify(editedEv.payment)}</div>
                )}
                {/* Points of contact */}
                {editedEv.points_of_contact && editedEv.points_of_contact.length > 0 && (
                  <div className="mb-2"><strong>Points of Contact:</strong><ul>{editedEv.points_of_contact.map((contact: { name: string; phone: string; email: string }, idx: number) => (
                    <li key={idx}>
                      <span><strong>Name:</strong> {contact.name}</span>{' '}
                      <span><strong>Phone:</strong> {contact.phone}</span>{' '}
                      <span><strong>Email:</strong> {contact.email}</span>
                    </li>
                  ))}</ul></div>
                )}
                {/* Sales notifications */}
                {editedEv.sales_notifications && editedEv.sales_notifications.length > 0 && (
                  <div className="mb-2"><strong>Sales Notifications:</strong><ul>{editedEv.sales_notifications.map((note: { type: string; message: string }, idx: number) => (
                    <li key={idx}>
                      <span><strong>Type:</strong> {note.type}</span>{' '}
                      <span><strong>Message:</strong> {note.message}</span>
                    </li>
                  ))}</ul></div>
                )}
                <div className="mb-2"><strong>Status:</strong> {editedEv.status}</div>
                <div className="mb-2"><strong>Created At:</strong> {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : 'N/A'}</div>
                <div className="mb-2"><strong>Updated At:</strong> {ev.updatedAt ? new Date(ev.updatedAt).toLocaleString() : 'N/A'}</div>
              </div>
              <div className="mt-auto pb-10 flex items-center justify-between border-t border-zinc-100 pt-8">
                <div className="flex gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${i === (currentIndex % 3) ? 'bg-[#686868]' : 'bg-[#D9D9D9]'}`}></div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this event?')) onDelete(id); }}
                    className="px-6 py-2 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-all font-sans"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 font-sans"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => onStatus(id, 'approved')}
                    disabled={ev.status === 'approved' || updating === id}
                    className="px-8 py-2 rounded-xl bg-[#D1FAE5] text-[#065F46] font-bold hover:scale-105 transition-all font-sans"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onStatus(id, 'rejected')}
                    disabled={ev.status === 'rejected' || updating === id}
                    className="px-8 py-2 rounded-xl bg-red-100 text-red-700 font-bold hover:scale-105 transition-all font-sans"
                  >
                    Reject
                  </button>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="bg-black text-white rounded-[15px] px-10 h-[45px] flex items-center justify-center text-[20px] font-medium shadow-md hover:scale-105 transition-transform"
                >
                  Previous
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <button onClick={onClose} className="absolute top-12 right-12 text-black opacity-30 hover:opacity-100 transition-opacity">
        <X size={32} />
      </button>
    </div>
  );
}

function AdminEventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get('id');

  const [events, setEvents] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      // error suppressed
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getId = (item: AdminListing) => item.id || item._id || '';
  const filtered = events.filter(l =>
    activeTab === 'pending'
      ? (l.status === 'pending' || l.status === 'draft')
      : l.status === activeTab
  );
  const preview = detailId ? events.find(l => getId(l) === detailId) : null;

  const handleStatus = async (id: string, status: ListingStatus) => {
    if (!id) {
      alert("Error: Listing ID is missing.");
      return;
    }
    setUpdating(id);
    try {
      await adminApi.updateEventStatus(id, status);
      setEvents(prev => prev.map(item => (getId(item) === id ? { ...item, status } : item)));
   
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdate = async (id: string, payload: Partial<AdminListing>) => {
    try {
      await adminApi.updateEvent(id, payload);
      setEvents(prev => prev.map(l => (getId(l) === id ? { ...l, ...payload } : l)));
    } catch (e) {
      throw e;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteEvent(id);
      setEvents(prev => prev.filter(l => getId(l) !== id));
      router.push('/admin/events');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  if (preview) {
    return (
      <div className="min-h-screen relative overflow-x-hidden flex flex-col" style={{ background: '#FFFFFF' }}>
        <DetailViewPanel
          ev={preview}
          onStatus={handleStatus}
          updating={updating}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onClose={() => router.push('/admin/events')}
          onNext={() => {
            const idx = filtered.findIndex(l => getId(l) === getId(preview));
            if (idx !== -1 && idx < filtered.length - 1) {
              router.push(`?id=${getId(filtered[idx + 1])}`);
            } else if (filtered.length > 0) {
              router.push(`?id=${getId(filtered[0])}`);
            }
          }}
          currentIndex={filtered.findIndex(l => getId(l) === getId(preview))}
          totalCount={filtered.length}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col" style={{ background: '#F3F0FF' }}>
      {/* Hero Section */}
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

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-[37px] py-[66px]">
        <h1 className="text-[40px] font-semibold text-black leading-none" style={{ fontFamily: 'var(--font-anek-latin)' }}>Admin Panel</h1>
        <div className="w-[101px] h-[1.5px] bg-[#686868] mt-[24px] mb-[24px]"></div>
        <h2 className="text-[25px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Event Details</h2>

        <div className="bg-white rounded-[30px] shadow-sm mt-[33px] p-20 min-h-[600px] flex flex-col relative">
          {/* Tabs Toggle */}
          <div className="flex justify-center mb-16">
            <div className="flex w-[600px] h-[52px] rounded-[14px] overflow-hidden">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 text-[25px] font-medium transition-all ${activeTab === 'pending' ? 'bg-[#D3CBF5]' : 'bg-[#E7E2FA] opacity-50'} text-black border-r border-[#FFFFFF]`}
                style={{ fontFamily: 'var(--font-anek-latin)' }}
              >
                Needs Approval
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`flex-1 text-[25px] font-medium transition-all ${activeTab === 'approved' ? 'bg-[#D3CBF5]' : 'bg-[#E7E2FA] opacity-50'} text-black`}
                style={{ fontFamily: 'var(--font-anek-latin)' }}
              >
                Approved
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-[#AC9BF7]" size={40} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-[#686868] text-[25px]">No events {activeTab}</div>
          ) : (
            <div className="grid grid-cols-1 gap-12 relative">
              {filtered.map(item => {
                const id = getId(item);
                const thumb = item.portrait_image_url || item.images?.[0] || item.image || null;

                return (
                  <div key={id} className="relative group">
                    <div
                      onClick={() => router.push(`?id=${id}`)}
                      className="bg-[#EEEDFC] rounded-[19px] p-12 flex items-center gap-16 border border-white hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="w-[220px] h-[290px] bg-white rounded-[15px] flex-shrink-0 flex items-center justify-center overflow-hidden p-2">
                        {thumb ? <img src={thumb} alt={item.name} className="w-full h-full object-cover rounded-[10px]" />
                          : <div className="text-center"><p className="text-[14px] font-bold uppercase mb-1 leading-tight">{"{EVENT POSTER}"}</p><p className="text-[11px] opacity-50">3:4 aspect ratio</p></div>}
                      </div>

                      <div className="w-[1.5px] h-[100px] bg-[#AEAEAE] opacity-50"></div>

                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-[32px] font-bold text-black uppercase leading-tight tracking-tight">{"{"}{item.name || item.title || 'EVENT NAME'}{"}"}</h3>
                        <p className="text-[25px] font-medium text-[#686868] uppercase mt-2">{"{"}{item.organizer_name || 'ORGANIZER NAME'}{"}"}</p>
                      </div>

                      <div className="bg-[#E7E2FA] rounded-[16px] px-6 py-2">
                        <span className="text-[20px] font-medium text-[#5331EA] capitalize">{item.status}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const idx = filtered.findIndex(l => getId(l) === id);
                        const nextItem = filtered[idx + 1] ?? filtered[0];
                        router.push(`?id=${getId(nextItem)}`);
                      }}
                      className="absolute -right-7 top-1/2 -translate-y-1/2 w-[57px] h-[57px] bg-black rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-transform z-10"
                    >
                      <ChevronRight size={30} />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) handleDelete(id); }}
                      className="absolute top-4 left-4 bg-white/50 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 transition-all font-sans"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#2A2A2A] text-white pt-[60px] pb-[40px] px-[80px] mt-20">
        <div className="max-w-[1440px] mx-auto grid grid-cols-4 gap-20">
          <div className="col-span-1">
            <div className="text-3xl font-bold mb-10">TICPIN</div>
          </div>
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
    <Suspense fallback={<div className="min-h-screen bg-[#F3F0FF] flex items-center justify-center"><RefreshCw className="animate-spin text-[#AC9BF7]" size={48} /></div>}>
      <AdminEventsContent />
    </Suspense>
  );
}
