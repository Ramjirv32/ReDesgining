'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AdminListing, ListingStatus } from '@/lib/api/admin';
import {
  CheckCircle, XCircle, Clock, ArrowLeft, MapPin, Calendar, Tag,
  X, User, Ticket, Image as ImageIcon, ExternalLink, RefreshCw, Trash2, Edit2,
  ChevronRight, ChevronLeft
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700 border border-green-200',
  pending: 'bg-orange-100 text-orange-700 border border-orange-200',
  rejected: 'bg-red-100 text-red-700 border border-red-200',
  draft: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  approved: <CheckCircle size={13} />,
  pending: <Clock size={13} />,
  rejected: <XCircle size={13} />,
  draft: <Clock size={13} />,
};

type Tab = 'pending' | 'approved' | 'rejected' | 'all';

function DetailViewPanel({ ev, onClose, onStatus, updating, onUpdate, onNext, currentIndex, totalCount }: {
  ev: AdminListing;
  onClose: () => void;
  onStatus: (id: string, status: ListingStatus) => void;
  updating: string | null;
  onDelete: (id: string) => void;
  onUpdate: (id: string, payload: Partial<AdminListing>) => Promise<void>;
  onNext: () => void;
  currentIndex: number;
  totalCount: number;
}) {
  const router = useRouter();
  const id = ev.id || ev._id || '';
  const [editedEv, setEditedEv] = useState<AdminListing>({ ...ev });
  const [isSaving, setIsSaving] = useState(false);

  const thumb = editedEv.portrait_image_url || editedEv.landscape_image_url || (editedEv.images && editedEv.images[0]) || null;

  const handleChange = (field: string, value: any) => {
    setEditedEv(prev => {
      const keys = field.split('.');
      if (keys.length === 1) return { ...prev, [field]: value };

      // Handle nested fields like guide.min_age
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
    { label: 'Event ID', value: id.slice(-8).toUpperCase(), readOnly: true },
    { label: 'Age Restriction', field: 'guide.min_age', value: editedEv.guide?.min_age || 0, type: 'number' },
    { label: 'Ticket Age Requirement', field: 'guide.ticket_age_limit', value: editedEv.guide?.ticket_age_limit || 0, type: 'number' },
    { label: 'Languages', field: 'guide.languages', value: editedEv.guide?.languages?.join(', ') || '', type: 'languages' },
    { label: 'Venue Type', field: 'guide.venue_type', value: editedEv.guide?.venue_type || '' },
    { label: 'Venue', field: 'venue_name', value: editedEv.venue_name || '' },
    { label: 'Venue Link', field: 'google_map_link', value: editedEv.google_map_link || '', isLink: true },
    { label: 'Organiser', field: 'organizer_name', value: editedEv.organizer_name || '', readOnly: true },
    { label: 'Created at', value: editedEv.created_at ? new Date(editedEv.created_at).toLocaleString() : 'N/A', readOnly: true },
    { label: 'Tickets', value: editedEv.ticket_categories?.length ? `${editedEv.ticket_categories.length} Tiers` : 'N/A', readOnly: true },
    { label: 'Legal', field: 'legal_info', value: editedEv.legal_info || '' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-10 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] w-full max-w-[1600px] h-full flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header Area */}
        <div className="pt-12 px-16 pb-6">
          <h1 className="text-[48px] font-semibold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Admin Panel</h1>
          <div className="w-16 h-1 bg-black mt-2 mb-6"></div>
          <h2 className="text-[32px] font-medium text-black mt-4" style={{ fontFamily: 'var(--font-anek-latin)' }}>Event Details</h2>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-16 pb-16 flex gap-12 overflow-hidden">
          {/* Left: Poster */}
          <div className="w-1/3 flex flex-col">
            <div className="bg-[#EEEDFC] rounded-[30px] flex-1 flex items-center justify-center p-12 overflow-hidden shadow-inner relative group">
              {thumb ? (
                <>
                  <img src={thumb} alt={editedEv.name} className="w-full h-full object-contain drop-shadow-2xl rounded-[15px]" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white text-black px-6 py-2 rounded-full font-bold">Change Image</button>
                  </div>
                </>
              ) : (
                <div className="text-zinc-300 text-center">
                  <p className="text-[28px] font-bold leading-tight uppercase mb-4">{"{EVENT POSTER}"}</p>
                  <p className="text-[18px]">3:4 aspect ratio</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Grid */}
          <div className="w-2/3 flex flex-col relative">
            <div className="grid grid-cols-2 gap-x-16 gap-y-4 pr-4 overflow-y-auto max-h-[500px] scrollbar-hide">
              {detailRows.map((row, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex items-end justify-between border-b-[1.5px] border-[#AEAEAE] pb-1">
                    <span className="text-[20px] font-medium text-[#686868] whitespace-nowrap mr-4" style={{ fontFamily: 'var(--font-anek-latin)' }}>{row.label}</span>
                    {row.readOnly ? (
                      <span className="text-[20px] font-medium text-black truncate">{"{"}{row.value || 'None'}{"}"}</span>
                    ) : (
                      <input
                        type={row.type === 'number' ? 'number' : 'text'}
                        value={row.value}
                        onChange={(e) => {
                          const val = row.type === 'number' ? Number(e.target.value) : (row.type === 'languages' ? e.target.value.split(',').map(s => s.trim()) : e.target.value);
                          handleChange(row.field!, val);
                        }}
                        className="text-[20px] font-medium text-black bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-purple-200 rounded px-2 w-full text-right"
                        placeholder={`{${row.label}}`}
                        style={{ fontFamily: 'var(--font-anek-latin)' }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-auto pt-10 flex items-center justify-between">
              {/* Pagination Dots */}
              <div className="flex gap-4">
                {Array.from({ length: Math.min(totalCount, 3) }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i === (currentIndex % 3) ? 'bg-black' : 'bg-[#AEAEAE]'}`}></div>
                ))}
              </div>

              {/* Status Actions */}
              <div className="flex gap-6">
                <button
                  onClick={() => onStatus(id, 'approved')}
                  disabled={ev.status === 'approved' || updating === id}
                  className="px-8 py-3 rounded-[15px] bg-[#D1FAE5] text-[#065F46] text-[20px] font-bold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-anek-latin)' }}
                >
                  {updating === id ? '...' : 'Approve'}
                </button>
                <button
                  onClick={() => onStatus(id, 'rejected')}
                  disabled={ev.status === 'rejected' || updating === id}
                  className="px-8 py-3 rounded-[15px] bg-red-100 text-red-700 text-[20px] font-bold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-anek-latin)' }}
                >
                  Reject
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-3 rounded-[15px] bg-[#5331EA] text-white text-[20px] font-bold transition-all hover:scale-105 disabled:opacity-50 shadow-lg shadow-purple-200"
                  style={{ fontFamily: 'var(--font-anek-latin)' }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <button
                onClick={onNext}
                className="bg-black text-white rounded-full w-[100px] h-[45px] flex items-center justify-center text-[20px] font-medium shadow-lg transition-transform hover:scale-105"
                style={{ fontFamily: 'var(--font-anek-latin)' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Close Icon - Back functionality */}
        <button onClick={onClose} className="absolute top-12 right-12 text-black opacity-30 hover:opacity-100 transition-opacity">
          <X size={40} />
        </button>
      </div>
    </div >
  );
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [updating, setUpdating] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdminListing | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.listEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id: string, status: ListingStatus) => {
    setUpdating(id);
    try {
      await adminApi.updateEventStatus(id, status);
      setEvents(prev => prev.map(ev => (getId(ev) === id ? { ...ev, status } : ev)));
      setPreview(prev => prev && getId(prev) === id ? { ...prev, status } : prev);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdate = async (id: string, payload: Partial<AdminListing>) => {
    try {
      await adminApi.updateEvent(id, payload);
      setEvents(prev => prev.map(ev => (getId(ev) === id ? { ...ev, ...payload } : ev)));
      setPreview(prev => prev && getId(prev) === id ? { ...prev, ...payload } : prev);
    } catch (e) {
      throw e;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteEvent(id);
      setEvents(prev => prev.filter(ev => getId(ev) !== id));
      setPreview(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const getId = (item: AdminListing) => item.id || item._id || '';

  const filtered = activeTab === 'all' ? events : events.filter(e => e.status === activeTab);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Needs Approval' },
    { key: 'approved', label: 'Approved' },
  ];

  const handleSetAllPending = async () => {
    if (!filtered.length) return;
    if (!confirm(`Are you sure you want to set all ${filtered.length} currently visible events to Pending?`)) return;

    setLoading(true);
    try {
      await Promise.all(filtered.map(ev => adminApi.updateEventStatus(getId(ev), 'pending')));
      await load();
      alert('All items set to pending successfully');
    } catch (e) {
      alert('Failed to update some items');
      load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F0FF] p-10">
      <div className="max-w-[1920px] mx-auto" style={{ zoom: 0.85 }}>
        {/* Header Area */}
        <div className="mb-10 flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-[48px] font-semibold text-black leading-tight" style={{ fontFamily: 'var(--font-anek-latin)' }}>Admin Panel</h1>
            <div className="w-16 h-1 bg-black mt-2 mb-6"></div>
            <h2 className="text-[32px] font-medium text-black mt-4" style={{ fontFamily: 'var(--font-anek-latin)' }}>Event Details</h2>
          </div>
          <button onClick={load} className="mt-8 flex items-center gap-2 text-[18px] font-medium text-[#686868] hover:text-black">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* List Content */}
        <div className="bg-white rounded-[40px] shadow-sm p-16 min-h-[700px]">
          {/* Tabs & Bulk Actions */}
          <div className="flex justify-between items-center mb-16">
            <div className="flex-1"></div>
            <div className="bg-[#E7E2FA] rounded-[15px] flex w-[600px] h-[55px] overflow-hidden">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 text-[24px] font-medium transition-all ${activeTab === tab.key ? 'bg-[#D3CBF5] text-black shadow-inner' : 'text-[#686868] hover:text-black'}`}
                  style={{ fontFamily: 'var(--font-anek-latin)' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 flex justify-end">
              {activeTab === 'approved' && (
                <button
                  onClick={handleSetAllPending}
                  className="flex items-center gap-2 text-[18px] font-semibold text-orange-600 bg-orange-50 px-6 py-2 rounded-[12px] border border-orange-200 hover:bg-orange-100 transition-all"
                >
                  <RefreshCw size={18} /> Set All Pending
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-32 opacity-30"><RefreshCw size={48} className="animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32 text-[#686868] text-[24px] font-medium italic">
              No events {activeTab === 'pending' ? 'awaiting approval' : 'currently approved'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12 px-16">
              {filtered.map(ev => {
                const id = getId(ev);
                const thumb = ev.portrait_image_url || ev.landscape_image_url || (ev.images && ev.images[0]) || null;
                const statusBadgeColor = ev.status === 'pending' ? 'bg-[#FFD9B7] text-[#8B4D1A]' : 'bg-[#D1FAE5] text-[#065F46]';

                return (
                  <div key={id} className="relative">
                    <div
                      onClick={() => setPreview(ev)}
                      className="bg-[#EEEDFC] rounded-[24px] p-10 flex items-center gap-12 cursor-pointer transition-all hover:bg-[#E7E5FB] hover:shadow-md"
                    >
                      {/* Poster */}
                      <div className="w-[180px] h-[240px] rounded-[15px] bg-white overflow-hidden flex-shrink-0 flex flex-col items-center justify-center p-4">
                        {thumb ? (
                          <img src={thumb} alt={ev.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-zinc-300">
                            <p className="text-[16px] font-bold uppercase mb-1 leading-tight">{"{EVENT POSTER}"}</p>
                            <p className="text-[11px]">3:4 aspect ratio</p>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col h-[200px]">
                        <div className="pl-12 border-l-[2px] border-[#AC9BF7] flex-1 flex flex-col justify-center">
                          <h3 className="text-[36px] font-semibold text-black uppercase truncate leading-tight" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {"{"}{ev.name || 'EVENT NAME'}{"}"}
                          </h3>
                          <p className="text-[28px] font-medium text-[#686868] mt-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {"{"}{ev.organizer_name || 'ORGANIZER NAME'}{"}"}
                          </p>
                        </div>

                        {/* Status & Quick Actions */}
                        <div className="flex justify-between items-center">
                          <span className={`${statusBadgeColor} px-10 py-2.5 rounded-[12px] text-[22px] font-semibold shadow-sm`} style={{ fontFamily: 'var(--font-anek-latin)' }}>
                            {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                          </span>

                          {ev.status === 'pending' && (
                            <div className="flex gap-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatus(id, 'approved'); }}
                                disabled={updating === id}
                                className="bg-[#1DB954] text-white px-6 py-2 rounded-[10px] text-[18px] font-bold transition-all hover:scale-105 disabled:opacity-50"
                                style={{ fontFamily: 'var(--font-anek-latin)' }}
                              >
                                {updating === id ? '...' : 'Approve'}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatus(id, 'rejected'); }}
                                disabled={updating === id}
                                className="bg-white text-red-600 border border-red-200 px-6 py-2 rounded-[10px] text-[18px] font-bold transition-all hover:scale-105 disabled:opacity-50"
                                style={{ fontFamily: 'var(--font-anek-latin)' }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Chevron Edge Button */}
                    <button
                      onClick={() => setPreview(ev)}
                      className="absolute -right-7 top-1/2 -translate-y-1/2 w-[65px] h-[65px] bg-black rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform active:scale-95 z-10"
                    >
                      <ChevronRight size={36} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
