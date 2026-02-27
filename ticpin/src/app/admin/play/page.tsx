'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AdminListing, ListingStatus } from '@/lib/api/admin';
import {
  CheckCircle, XCircle, Clock, ArrowLeft, MapPin, Tag, Eye, Pencil, Trash2, X,
  ExternalLink, Users, Info, CreditCard, Phone, Mail, BookOpen, AlertTriangle,
} from 'lucide-react';

const STATUS_CFG: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle size={12} /> },
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: <Clock size={12} /> },
  rejected: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     icon: <XCircle size={12} /> },
  draft:    { bg: 'bg-zinc-50',    text: 'text-zinc-500',    border: 'border-zinc-200',    icon: <Clock size={12} /> },
};

type Tab = 'all' | ListingStatus;
const getId = (item: AdminListing) => item.id || item._id || '';
const fmtDate = (d?: string) => { if (!d) return '—'; try { const dt = new Date(d); if (isNaN(dt.getTime()) || dt.getFullYear() < 2000) return '—'; return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return '—'; } };
const fmtCurrency = (n?: number) => n ? `₹${n.toLocaleString('en-IN')}` : '—';

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.icon}{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <div className="space-y-3"><div className="flex items-center gap-2"><span className="text-zinc-400">{icon}</span><h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{title}</h3></div>{children}</div>;
}
function GF({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] uppercase font-semibold text-zinc-400">{label}</p><p className="text-sm font-medium text-black">{value}</p></div>;
}
function LinkChip({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#7B2FF7] border border-purple-200 bg-purple-50 px-2.5 py-1 rounded-full hover:bg-purple-100 transition-colors font-medium"><ExternalLink size={10}/>{label}</a>;
}

function PreviewModal({ ev, onClose, onStatusChange }: { ev: AdminListing; onClose: () => void; onStatusChange: (id: string, s: ListingStatus) => void }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const thumb = ev.portrait_image_url || ev.landscape_image_url || ev.images?.[0] || ev.image || null;
  const gallery = ev.gallery_urls?.length ? ev.gallery_urls : (ev.images ?? []);
  const handleStatus = async (status: ListingStatus) => {
    const id = getId(ev); setUpdating(status);
    try { await adminApi.updatePlayStatus(id, status); onStatusChange(id, status); } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); } finally { setUpdating(null); }
  };
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50 backdrop-blur-sm" />
      <div className="w-full max-w-[680px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Admin Preview</span>
            <StatusBadge status={ev.status} />
          </div>
          <div className="flex items-center gap-2">
            <button disabled={ev.status === 'approved' || !!updating} onClick={() => handleStatus('approved')} className="px-3 py-1.5 text-[11px] font-semibold rounded-full bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">{updating === 'approved' ? '…' : '✓ Approve'}</button>
            <button disabled={ev.status === 'rejected' || !!updating} onClick={() => handleStatus('rejected')} className="px-3 py-1.5 text-[11px] font-semibold rounded-full bg-red-400 text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">{updating === 'rejected' ? '…' : '✕ Reject'}</button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors ml-2"><X size={16}/></button>
          </div>
        </div>
        <div className="p-6 space-y-7">
          {thumb && <div className="w-full h-[220px] rounded-[18px] overflow-hidden bg-zinc-100"><img src={thumb} alt={ev.name} className="w-full h-full object-cover"/></div>}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-black">{ev.name || 'Untitled Venue'}</h2>
            <div className="flex flex-wrap gap-2">
              {ev.category && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full font-medium">{ev.category}{ev.sub_category ? ` · ${ev.sub_category}` : ''}</span>}
              {ev.city && <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium"><MapPin size={10}/>{ev.city}</span>}
              {ev.price_starts_from ? <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-medium">{fmtCurrency(ev.price_starts_from)} onwards</span> : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([['Date', fmtDate(ev.date)],['Time', ev.time||'—'],['Duration', ev.duration||'—'],['Venue', ev.venue_name||'—'],['Address', ev.venue_address||'—'],['Sport', ev.sport_type||'—'],['Created', fmtDate(ev.created_at)]] as [string,string][]).map(([l,v]) => (
              <div key={l} className="bg-zinc-50 rounded-[12px] p-3"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{l}</p><p className="text-sm font-medium text-black break-words">{v}</p></div>
            ))}
          </div>
          {(ev.google_map_link || ev.instagram_link || ev.youtube_video_url) && <Section icon={<ExternalLink size={14}/>} title="Links"><div className="flex flex-wrap gap-2">{ev.google_map_link && <LinkChip href={ev.google_map_link} label="Google Maps"/>}{ev.instagram_link && <LinkChip href={ev.instagram_link} label="Instagram"/>}{ev.youtube_video_url && <LinkChip href={ev.youtube_video_url} label="YouTube"/>}</div></Section>}
          {ev.guide && <Section icon={<Users size={14}/>} title="Event Guide"><div className="grid grid-cols-2 gap-3">{ev.guide.languages?.length ? <GF label="Languages" value={ev.guide.languages.join(', ')}/> : null}{ev.guide.min_age != null && <GF label="Min Age" value={String(ev.guide.min_age)}/>}{ev.guide.venue_type && <GF label="Venue Type" value={ev.guide.venue_type}/>}{ev.guide.is_kid_friendly != null && <GF label="Kid Friendly" value={ev.guide.is_kid_friendly?'Yes':'No'}/>}{ev.guide.is_pet_friendly != null && <GF label="Pet Friendly" value={ev.guide.is_pet_friendly?'Yes':'No'}/>}</div></Section>}
          {(ev.gallery_urls?.length ?? 0) > 0 && <Section icon={<Tag size={14}/>} title={`Gallery (${ev.gallery_urls?.length})`}><div className="grid grid-cols-3 gap-2">{ev.gallery_urls?.map((url,i) => <div key={i} className="aspect-square rounded-[10px] overflow-hidden bg-zinc-100"><img src={url} alt={`g${i}`} className="w-full h-full object-cover"/></div>)}</div></Section>}
          {ev.faqs?.length ? <Section icon={<BookOpen size={14}/>} title="FAQs"><div className="space-y-2">{ev.faqs.map((faq,i) => <div key={i} className="bg-zinc-50 rounded-[12px] p-3"><p className="text-sm font-semibold text-black">{faq.question}</p><p className="text-sm text-zinc-500 mt-1">{faq.answer}</p></div>)}</div></Section> : null}
          {ev.payment && (ev.payment.account_number || ev.payment.organizer_name) && <Section icon={<CreditCard size={14}/>} title="Payment Details"><div className="grid grid-cols-2 gap-3">{ev.payment.organizer_name && <GF label="Organizer Name" value={ev.payment.organizer_name}/>}{ev.payment.gstin && <GF label="GSTIN" value={ev.payment.gstin}/>}{ev.payment.account_number && <GF label="Account No." value={ev.payment.account_number}/>}{ev.payment.ifsc && <GF label="IFSC" value={ev.payment.ifsc}/>}</div></Section>}
          <div className="pt-4 border-t border-zinc-100 space-y-1">
            <p className="text-[11px] text-zinc-400 font-mono">Organizer ID: {ev.organizer_id||'—'}</p>
            <p className="text-[11px] text-zinc-400 font-mono">Listing ID: {getId(ev)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPlayPage() {
  const router = useRouter();
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdminListing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await adminApi.listPlay(); setListings(Array.isArray(data) ? data : []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id: string, status: ListingStatus) => {
    setUpdating(id);
    try { await adminApi.updatePlayStatus(id, status); setListings(prev => prev.map(i => getId(i) === id ? { ...i, status } : i)); setPreview(prev => prev && getId(prev) === id ? { ...prev, status } : prev); }
    catch (e) { alert(e instanceof Error ? e.message : 'Update failed'); } finally { setUpdating(null); }
  };
  const handleDelete = async (id: string) => {
    setDeleting(id); setConfirmDelete(null);
    try { await adminApi.deletePlay(id); setListings(prev => prev.filter(i => getId(i) !== id)); }
    catch (e) { alert(e instanceof Error ? e.message : 'Delete failed'); } finally { setDeleting(null); }
  };

  const counts = { all: listings.length, pending: listings.filter(e => e.status==='pending').length, approved: listings.filter(e => e.status==='approved').length, rejected: listings.filter(e => e.status==='rejected').length };
  const filtered = activeTab === 'all' ? listings : listings.filter(e => e.status === activeTab);
  const tabs: { key: Tab; label: string }[] = [{ key:'all',label:'All'},{key:'pending',label:'Pending'},{key:'approved',label:'Approved'},{key:'rejected',label:'Rejected'}];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)', zoom: 0.85 }}>
      {preview && <PreviewModal ev={preview} onClose={() => setPreview(null)} onStatusChange={(id, s) => { setListings(prev => prev.map(i => getId(i) === id ? { ...i, status: s } : i)); setPreview(prev => prev ? { ...prev, status: s } : prev); }} />}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-[20px] shadow-2xl p-8 w-full max-w-sm space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto"><Trash2 size={22} className="text-red-500"/></div>
            <h3 className="text-lg font-bold text-black text-center">Delete this play listing?</h3>
            <p className="text-sm text-zinc-500 text-center">This action cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-full border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-[1240px] mx-auto px-8 py-10">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors shadow-sm"><ArrowLeft size={17}/></button>
          <div>
            <h1 className="text-[26px] font-bold text-black">Play Management</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{counts.all} listings · {counts.pending} pending review</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-6">
          {tabs.map(tab => { const count = counts[tab.key as keyof typeof counts]; const active = activeTab === tab.key; return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${active ? 'bg-[#7B2FF7] text-white shadow-md shadow-purple-200' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-[#7B2FF7] hover:text-[#7B2FF7]'}`}>
              {tab.label}
              {tab.key !== 'all' && <span className={`text-[11px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${active?'bg-white/20 text-white':'bg-zinc-100 text-zinc-500'}`}>{count}</span>}
            </button>);})}
          <button onClick={load} className="ml-auto text-xs text-zinc-400 hover:text-[#7B2FF7] transition-colors font-medium px-3 py-1.5 rounded-full bg-white border border-zinc-200">↻ Refresh</button>
        </div>
        {loading ? <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-[20px] h-[120px] animate-pulse"/>)}</div>
        : error ? <div className="text-center py-20 text-red-500 font-medium">{error}</div>
        : filtered.length === 0 ? <div className="text-center py-20 text-zinc-400">No play listings in this category</div>
        : <div className="flex flex-col gap-3">
          {filtered.map(item => {
            const id = getId(item);
            const thumb = item.portrait_image_url || item.images?.[0] || item.image || null;
            const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.draft;
            const isUpd = updating === id; const isDel = deleting === id;
            return (
              <div key={id} className="bg-white rounded-[20px] border border-zinc-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex items-stretch">
                  <div className="w-[100px] flex-shrink-0 bg-zinc-100">
                    {thumb ? <img src={thumb} alt={item.name} className="w-full h-full min-h-[120px] object-cover"/>
                    : <div className="w-full min-h-[120px] flex items-center justify-center text-4xl bg-gradient-to-br from-purple-50 to-blue-50">🏆</div>}
                  </div>
                  <div className="flex-1 px-5 py-4 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <h3 className="font-bold text-black text-[15px] leading-snug truncate">{item.name || 'Untitled Venue'}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          {item.category && <span className="flex items-center gap-1 text-[11px] text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-full"><Tag size={9}/>{item.category}</span>}
                          {item.city && <span className="flex items-center gap-1 text-[11px] text-zinc-500"><MapPin size={9}/>{item.city}</span>}
                          {item.venue_name && <span className="text-[11px] text-zinc-400 truncate max-w-[180px]">{item.venue_name}</span>}
                          {item.price_starts_from ? <span className="text-[11px] text-emerald-600 font-semibold">{fmtCurrency(item.price_starts_from)}</span> : null}
                        </div>
                      </div>
                      <span className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.icon}{item.status.charAt(0).toUpperCase()+item.status.slice(1)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-50">
                      <button onClick={() => setPreview(item)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full bg-purple-50 text-[#7B2FF7] border border-purple-200 hover:bg-purple-100 transition-colors"><Eye size={12}/>Preview</button>
                      <button onClick={() => router.push(`/play/edit/${id}`)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors"><Pencil size={12}/>Edit</button>
                      <div className="w-px h-4 bg-zinc-200 mx-0.5"/>
                      <button disabled={item.status==='approved'||isUpd} onClick={() => handleStatus(id,'approved')} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><CheckCircle size={11}/>{isUpd?'…':'Approve'}</button>
                      <button disabled={item.status==='rejected'||isUpd} onClick={() => handleStatus(id,'rejected')} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full bg-red-400 text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><XCircle size={11}/>{isUpd?'…':'Reject'}</button>
                      {item.status!=='pending' && <button disabled={isUpd} onClick={() => handleStatus(id,'pending')} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full bg-amber-400 text-white hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><Clock size={11}/>Pending</button>}
                      <button disabled={isDel} onClick={() => setConfirmDelete(id)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 disabled:opacity-40 transition-colors"><Trash2 size={11}/>{isDel?'…':'Delete'}</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>}
      </div>
    </div>
  );
}
