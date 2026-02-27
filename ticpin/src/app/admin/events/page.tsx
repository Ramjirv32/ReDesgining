'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AdminListing, ListingStatus } from '@/lib/api/admin';
import {
  CheckCircle, XCircle, Clock, ArrowLeft, MapPin, Calendar, Tag,
  X, User, Ticket, Image as ImageIcon, ExternalLink, RefreshCw, Trash2, Edit2,
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

type Tab = 'all' | ListingStatus;

function PreviewPanel({ ev, onClose, onStatus, updating, onDelete }: {
  ev: AdminListing;
  onClose: () => void;
  onStatus: (id: string, status: ListingStatus) => void;
  updating: string | null;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const id = ev.id || ev._id || '';
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[520px] h-full bg-white shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-black truncate max-w-[360px]">{ev.name || 'Event Preview'}</h2>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${STATUS_COLORS[ev.status] ?? STATUS_COLORS.draft}`}>
              {STATUS_ICONS[ev.status]}
              {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Hero image */}
          {(ev.portrait_image_url || ev.landscape_image_url) && (
            <div className="rounded-[12px] overflow-hidden">
              <img src={ev.portrait_image_url || ev.landscape_image_url} alt={ev.name} className="w-full h-[220px] object-cover" />
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {ev.category && <div className="bg-zinc-50 rounded-[10px] p-3"><p className="text-zinc-400 text-xs mb-0.5">Category</p><p className="font-semibold text-black">{ev.category}{ev.sub_category ? ` · ${ev.sub_category}` : ''}</p></div>}
            {ev.city && <div className="bg-zinc-50 rounded-[10px] p-3"><p className="text-zinc-400 text-xs mb-0.5">City</p><p className="font-semibold text-black">{ev.city}</p></div>}
            {ev.date && <div className="bg-zinc-50 rounded-[10px] p-3"><p className="text-zinc-400 text-xs mb-0.5">Date</p><p className="font-semibold text-black">{new Date(ev.date).toLocaleDateString()}</p></div>}
            {ev.time && <div className="bg-zinc-50 rounded-[10px] p-3"><p className="text-zinc-400 text-xs mb-0.5">Time</p><p className="font-semibold text-black">{ev.time}</p></div>}
            {ev.duration && <div className="bg-zinc-50 rounded-[10px] p-3"><p className="text-zinc-400 text-xs mb-0.5">Duration</p><p className="font-semibold text-black">{ev.duration}</p></div>}
            {ev.price_starts_from != null && ev.price_starts_from > 0 && <div className="bg-zinc-50 rounded-[10px] p-3"><p className="text-zinc-400 text-xs mb-0.5">Price from</p><p className="font-semibold text-black">₹{ev.price_starts_from}</p></div>}
          </div>

          {/* Venue */}
          {(ev.venue_name || ev.venue_address) && (
            <div className="bg-zinc-50 rounded-[10px] p-4">
              <div className="flex items-center gap-2 mb-1 text-zinc-400"><MapPin size={14} /><span className="text-xs font-semibold uppercase tracking-wide">Venue</span></div>
              {ev.venue_name && <p className="font-semibold text-black text-sm">{ev.venue_name}</p>}
              {ev.venue_address && <p className="text-zinc-500 text-xs mt-0.5">{ev.venue_address}</p>}
              {ev.google_map_link && <a href={ev.google_map_link} target="_blank" rel="noopener noreferrer" className="text-[#5331EA] text-xs flex items-center gap-1 mt-1.5 hover:underline"><ExternalLink size={12} /> View on Maps</a>}
            </div>
          )}

          {/* Description */}
          {ev.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">Description</p>
              <div className="text-sm text-zinc-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: ev.description }} />
            </div>
          )}

          {/* Artists */}
          {ev.artists && ev.artists.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-zinc-400"><User size={14} /><span className="text-xs font-semibold uppercase tracking-wide">Artists ({ev.artists.length})</span></div>
              <div className="space-y-3">
                {ev.artists.map((artist, i) => (
                  <div key={i} className="bg-zinc-50 rounded-[10px] p-4 flex gap-4">
                    {artist.image_url ? (
                      <img src={artist.image_url} alt={artist.name} className="w-14 h-14 rounded-full object-cover border border-zinc-200 flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#AC9BF7]/20 flex items-center justify-center flex-shrink-0">
                        <User size={22} className="text-[#5331EA]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-black text-sm">{artist.name}</p>
                      {artist.description && <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{artist.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticket Categories */}
          {ev.ticket_categories && ev.ticket_categories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-zinc-400"><Ticket size={14} /><span className="text-xs font-semibold uppercase tracking-wide">Ticket Categories ({ev.ticket_categories.length})</span></div>
              <div className="space-y-3">
                {ev.ticket_categories.map((cat, i) => (
                  <div key={i} className="bg-zinc-50 rounded-[10px] p-4 flex gap-4 items-start">
                    {cat.has_image && cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-14 h-14 rounded-[8px] object-cover border border-zinc-200 flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-[8px] bg-[#AC9BF7]/20 flex items-center justify-center flex-shrink-0">
                        <Ticket size={22} className="text-[#5331EA]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-black text-sm">{cat.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        {cat.price != null && <span className="text-xs text-zinc-500">₹{cat.price}</span>}
                        {cat.capacity != null && <span className="text-xs text-zinc-500">{cat.capacity} tickets</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.has_image ? 'bg-purple-100 text-purple-700' : 'bg-zinc-200 text-zinc-600'}`}>
                          {cat.has_image ? 'With Image' : 'Basic'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {ev.gallery_urls && ev.gallery_urls.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-zinc-400"><ImageIcon size={14} /><span className="text-xs font-semibold uppercase tracking-wide">Gallery ({ev.gallery_urls.length})</span></div>
              <div className="flex flex-wrap gap-2">
                {ev.gallery_urls.map((url, i) => <img key={i} src={url} alt="" className="w-[70px] h-[70px] object-cover rounded-[8px] border border-zinc-200" />)}
              </div>
            </div>
          )}

          {/* Event Guide */}
          {ev.guide && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">Event Guide</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {ev.guide.venue_type && <div className="bg-zinc-50 rounded-[8px] p-2.5"><span className="text-zinc-400">Venue type: </span><span className="font-medium text-black">{ev.guide.venue_type}</span></div>}
                {ev.guide.audience_type && <div className="bg-zinc-50 rounded-[8px] p-2.5"><span className="text-zinc-400">Audience: </span><span className="font-medium text-black">{ev.guide.audience_type}</span></div>}
                {ev.guide.min_age != null && <div className="bg-zinc-50 rounded-[8px] p-2.5"><span className="text-zinc-400">Min age: </span><span className="font-medium text-black">{ev.guide.min_age}+</span></div>}
                {ev.guide.languages && ev.guide.languages.length > 0 && <div className="bg-zinc-50 rounded-[8px] p-2.5"><span className="text-zinc-400">Language: </span><span className="font-medium text-black">{ev.guide.languages.join(', ')}</span></div>}
                <div className="bg-zinc-50 rounded-[8px] p-2.5"><span className="text-zinc-400">Kid-friendly: </span><span className={`font-medium ${ev.guide.is_kid_friendly ? 'text-green-600' : 'text-red-500'}`}>{ev.guide.is_kid_friendly ? 'Yes' : 'No'}</span></div>
                <div className="bg-zinc-50 rounded-[8px] p-2.5"><span className="text-zinc-400">Pet-friendly: </span><span className={`font-medium ${ev.guide.is_pet_friendly ? 'text-green-600' : 'text-red-500'}`}>{ev.guide.is_pet_friendly ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
          )}

          {/* FAQs */}
          {ev.faqs && ev.faqs.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">FAQs</p>
              <div className="space-y-2">
                {ev.faqs.map((faq, i) => (
                  <div key={i} className="bg-zinc-50 rounded-[8px] p-3 text-xs">
                    <p className="font-semibold text-black">Q: {faq.question}</p>
                    <p className="text-zinc-600 mt-0.5">A: {faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-2">
            {ev.instagram_link && <a href={ev.instagram_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs bg-pink-50 text-pink-600 border border-pink-200 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-all"><ExternalLink size={11} /> Instagram</a>}
            {ev.youtube_video_url && <a href={ev.youtube_video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-100 transition-all"><ExternalLink size={11} /> YouTube</a>}
          </div>

          {/* Payment */}
          {ev.payment && ev.payment.organizer_name && (
            <div className="bg-zinc-50 rounded-[10px] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">Payment</p>
              <div className="text-xs space-y-1 text-zinc-700">
                <p><span className="text-zinc-400">Organizer: </span>{ev.payment.organizer_name}</p>
                {ev.payment.gstin && <p><span className="text-zinc-400">GSTIN: </span>{ev.payment.gstin}</p>}
                {ev.payment.account_number && <p><span className="text-zinc-400">Acc No: </span>{'*'.repeat(Math.max(0, ev.payment.account_number.length - 4)) + ev.payment.account_number.slice(-4)}</p>}
                {ev.payment.ifsc && <p><span className="text-zinc-400">IFSC: </span>{ev.payment.ifsc}</p>}
                {ev.payment.account_type && <p><span className="text-zinc-400">Account type: </span>{ev.payment.account_type}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-white border-t border-zinc-100 px-6 py-4 space-y-3">
          {/* Edit Details */}
          <button
            onClick={() => { onClose(); router.push(`/events/edit/${id}`); }}
            className="w-full py-2 rounded-[10px] text-sm font-semibold bg-[#5331EA] text-white hover:bg-[#7B2FF7] transition-all flex items-center justify-center gap-2"
          >
            <Edit2 size={14} /> Edit Details
          </button>
          <div className="flex gap-2">
            <button disabled={ev.status === 'approved' || updating === id} onClick={() => onStatus(id, 'approved')}
              className="flex-1 py-2 rounded-[10px] text-sm font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {updating === id ? '…' : 'Approve'}
            </button>
            <button disabled={ev.status === 'rejected' || updating === id} onClick={() => onStatus(id, 'rejected')}
              className="flex-1 py-2 rounded-[10px] text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {updating === id ? '…' : 'Reject'}
            </button>
            {ev.status !== 'pending' && (
              <button disabled={updating === id} onClick={() => onStatus(id, 'pending')}
                className="flex-1 py-2 rounded-[10px] text-sm font-semibold bg-orange-400 text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Pending
              </button>
            )}
          </div>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="w-full py-2 rounded-[10px] text-sm font-semibold border border-red-300 text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2">
              <Trash2 size={14} /> Delete Event
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => onDelete(id)} className="flex-1 py-2 rounded-[10px] text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all">Confirm Delete</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-[10px] text-sm font-semibold border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-all">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
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

  const counts = {
    all: events.length,
    pending: events.filter(e => e.status === 'pending').length,
    approved: events.filter(e => e.status === 'approved').length,
    rejected: events.filter(e => e.status === 'rejected').length,
  };

  const filtered = activeTab === 'all' ? events : events.filter(e => e.status === activeTab);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="min-h-screen px-8 py-10" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)', zoom: 0.85 }}>
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-black transition-colors">
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div>
              <h1 className="text-[28px] font-bold text-black">Events Management</h1>
              <p className="text-sm text-zinc-500 mt-0.5">{counts.all} total events</p>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-black border border-zinc-200 px-3 py-2 rounded-[10px] hover:border-zinc-400 transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-[#7B2FF7] text-white shadow-md' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-[#7B2FF7] hover:text-[#7B2FF7]'}`}>
              {tab.label}
              {tab.key !== 'all' && (
                <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-zinc-100'}`}>
                  {counts[tab.key as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-zinc-400 text-lg">Loading events…</div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">No events found</div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(ev => {
              const id = getId(ev);
              const thumb = ev.portrait_image_url || ev.landscape_image_url || ev.images?.[0] || ev.image || null;
              return (
                <div key={id} className="bg-white rounded-[18px] shadow-sm border border-zinc-100 p-5 flex items-center gap-5">
                  <div className="w-20 h-20 rounded-[12px] overflow-hidden flex-shrink-0 bg-zinc-100">
                    {thumb ? (
                      <img src={thumb} alt={ev.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 text-3xl">🎭</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-black text-[16px] truncate">{ev.name || 'Untitled Event'}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                          {ev.category && <span className="flex items-center gap-1 text-xs text-zinc-500"><Tag size={11} /> {ev.category}</span>}
                          {ev.city && <span className="flex items-center gap-1 text-xs text-zinc-500"><MapPin size={11} /> {ev.city}</span>}
                          {ev.date && <span className="flex items-center gap-1 text-xs text-zinc-500"><Calendar size={11} /> {new Date(ev.date).toLocaleDateString()}</span>}
                          {ev.artists && ev.artists.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-[#5331EA] font-medium">
                              <User size={11} /> {ev.artists.length} artist{ev.artists.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {ev.ticket_categories && ev.ticket_categories.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-[#5331EA] font-medium">
                              <Ticket size={11} /> {ev.ticket_categories.length} tier{ev.ticket_categories.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[ev.status] ?? STATUS_COLORS.draft}`}>
                        {STATUS_ICONS[ev.status]}
                        {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => setPreview(ev)}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#5331EA] text-white hover:bg-[#7B2FF7] transition-all">
                        Preview
                      </button>
                      <button disabled={ev.status === 'approved' || updating === id} onClick={() => handleStatus(id, 'approved')}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        {updating === id ? '…' : 'Approve'}
                      </button>
                      <button disabled={ev.status === 'rejected' || updating === id} onClick={() => handleStatus(id, 'rejected')}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        {updating === id ? '…' : 'Reject'}
                      </button>
                      {ev.status !== 'pending' && (
                        <button disabled={updating === id} onClick={() => handleStatus(id, 'pending')}
                          className="px-4 py-1.5 rounded-full text-xs font-semibold bg-orange-400 text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                          Set Pending
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview slide-in panel */}
      {preview && (
        <PreviewPanel
          ev={preview}
          onClose={() => setPreview(null)}
          onStatus={handleStatus}
          updating={updating}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
