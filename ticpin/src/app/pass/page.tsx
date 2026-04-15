'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUserSession, clearUserSession } from '@/lib/auth/user';
import { useOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import { toast } from '@/components/ui/Toast';
import { passApi, type TicpinPass } from '@/lib/api/pass';
import { Loader2, LogOut } from 'lucide-react';
import Link from 'next/link';

/* ── small shared inline components ── */
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6" /></svg>
);
const SupportIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
const FAQIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
const DocsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
);

const TurfIcon = () => (
  <svg width="40" height="40" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="24" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    <circle cx="26" cy="26" r="12" fill="none" stroke="white" strokeWidth="1.5" />
    <line x1="26" y1="2" x2="26" y2="50" stroke="white" strokeWidth="1.2" opacity="0.5" />
    <line x1="2" y1="26" x2="50" y2="26" stroke="white" strokeWidth="1.2" opacity="0.5" />
    <circle cx="26" cy="26" r="2.5" fill="white" />
  </svg>
);
const DiningIcon = () => (
  <svg width="40" height="40" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="24" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    <ellipse cx="26" cy="22" rx="14" ry="6" fill="none" stroke="white" strokeWidth="1.5" />
    <rect x="12" y="22" width="28" height="3" fill="rgba(255,255,255,0.2)" />
    <line x1="26" y1="12" x2="26" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="22" y="28" width="8" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
  </svg>
);
const TicketIcon = () => (
  <svg width="40" height="40" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="24" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    <rect x="10" y="18" width="32" height="16" rx="3" fill="none" stroke="white" strokeWidth="1.5" />
    <circle cx="10" cy="26" r="3" fill="#3B2B9E" />
    <circle cx="42" cy="26" r="3" fill="#3B2B9E" />
    <line x1="10" y1="26" x2="42" y2="26" stroke="white" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
    <line x1="20" y1="22" x2="32" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="20" y1="26" x2="28" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="20" y1="30" x2="24" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const benefits = [
  { id: 1, Icon: TurfIcon, title: "2 FREE TURF BOOKINGS", desc: "Enjoy 2 free turf bookings. Book your next two games at no cost." },
  { id: 2, Icon: DiningIcon, title: "2 DINING VOUCHERS ₹250 EACH", desc: "Enjoy 2 dining vouchers worth ₹250 each on bills above ₹1000." },
  { id: 3, Icon: TicketIcon, title: "EARLY ACCESS + EXCLUSIVE DISCOUNTS", desc: "Early access to premium events plus exclusive discounts on all tickets." },
];

const links = [
  { id: 1, Icon: SupportIcon, label: "Chat with support", href: "/support" },
  { id: 2, Icon: FAQIcon, label: "Frequently Asked Questions", href: "/faq" },
  { id: 3, Icon: DocsIcon, label: "Terms & Conditions", href: "/terms" },
];

/* ── helpers ── */
function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Manage Pass View ── */
function ManagePass({ pass, onRefresh }: { pass: TicpinPass; onRefresh: () => void }) {
  const router = useRouter();
  const days = daysLeft(pass.end_date);
  const expired = pass.status !== 'active' || days === 0;
  const turf = pass.benefits?.turf_bookings;
  const dining = pass.benefits?.dining_vouchers;

  const BenefitBar = ({ used, total, label, icon }: { used: number; total: number; label: string; icon: React.ReactNode }) => (
    <div style={{ padding: '16px 0', borderBottom: '0.5px solid rgba(255,255,255,0.12)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        {icon}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', opacity: 0.9 }}>{label}</div>
          <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>{total - used} of {total} remaining</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>{total - used}</div>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, width: `${((total - used) / total) * 100}%`, background: expired ? '#888' : 'linear-gradient(90deg, #a78bfa, #7c3aed)', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: 480, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', opacity: 0.7, marginBottom: 4 }}>TICPIN</div>
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '0.06em', lineHeight: 1, background: 'linear-gradient(135deg, #a78bfa 0%, #e0d9ff 70%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>PASS</div>
      </div>

      {/* Status Badge */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ display: 'inline-block', padding: '6px 20px', borderRadius: 99, background: expired ? 'rgba(255,100,100,0.2)' : 'rgba(100,255,180,0.15)', border: `1px solid ${expired ? 'rgba(255,100,100,0.4)' : 'rgba(100,255,180,0.35)'}`, fontSize: 13, fontWeight: 700, color: expired ? '#ff8080' : '#80ffcc', letterSpacing: '0.1em' }}>
          {expired ? 'EXPIRED' : `ACTIVE · ${days} DAYS LEFT`}
        </span>
      </div>

      {/* Pass Card */}
      <div style={{ border: '0.5px solid rgba(225,225,225,0.3)', borderRadius: 28, background: 'rgba(18,18,18,0.3)', backdropFilter: 'blur(12px)', padding: '24px 28px' }}>
        {/* Dates */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, opacity: 0.7, fontSize: 13 }}>
          <span>Started {fmtDate(pass.start_date)}</span>
          <span>Expires {fmtDate(pass.end_date)}</span>
        </div>

        {/* Benefits Usage */}
        {turf && <BenefitBar used={turf.used} total={turf.total} label="TURF BOOKINGS" icon={<TurfIcon />} />}
        {dining && <BenefitBar used={dining.used} total={dining.total} label="DINING VOUCHERS (₹250 EACH)" icon={<DiningIcon />} />}

        {/* Events Discount */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16 }}>
          <TicketIcon />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', opacity: 0.9 }}>EVENTS EARLY ACCESS</div>
            <div style={{ fontSize: 12, marginTop: 2 }}>
              <span style={{ color: pass.benefits?.events_discount_active && !expired ? '#80ffcc' : '#ff8080', fontWeight: 700 }}>
                {pass.benefits?.events_discount_active && !expired ? '✓ ACTIVE' : '✗ INACTIVE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <button
          onClick={() => router.push('/play')}
          style={{ padding: '14px 0', borderRadius: 16, background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          🏟 Book Turf
        </button>
        <button
          onClick={() => router.push('/dining')}
          style={{ padding: '14px 0', borderRadius: 16, background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          🍽 Use Dining
        </button>
      </div>

      {/* Links */}
      <div style={{ border: '0.5px solid rgba(225,225,225,0.2)', borderRadius: 20, background: 'rgba(18,18,18,0.2)', overflow: 'hidden' }}>
        {links.map((l, i) => (
          <div key={l.id}>
            <Link href={l.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><l.Icon /><span style={{ fontSize: 15, fontWeight: 500 }}>{l.label}</span></div>
              <ChevronRight />
            </Link>
            {i < links.length - 1 && <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.1)', margin: '0 20px' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function TicpinPass() {
  const router = useRouter();
  const user = useUserSession();
  const organizer = useOrganizerSession();
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [latestPass, setLatestPass] = useState<TicpinPass | null>(null);

  const price = 799;

  useEffect(() => {
    const t = setTimeout(() => setHasCheckedSession(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hasCheckedSession) return;
    if (user?.id) {
      passApi.getLatestPass(user.id)
        .then(p => { setLatestPass(p); setInitialLoading(false); })
        .catch(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, [user, user?.id, hasCheckedSession]);

  const handleBuy = () => {
    if (organizer) { setShowLogoutModal(true); return; }
    if (!user) {
      toast.error('Please login to buy Ticpin Pass');
      router.push(`/login?redirect=${encodeURIComponent('/pass/buy')}`);
      return;
    }
    router.push('/pass/buy');
  };

  const handleLogout = () => {
    clearOrganizerSession();
    setShowLogoutModal(false);
    toast.success('Logged out. You can now buy the pass.');
  };

  const isActive = latestPass?.status === 'active';

  /* wrapper */
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #1a0a5e 0%, #2d1b8e 30%, #1e1060 60%, #0d0630 100%)', fontFamily: "'Anek Latin', sans-serif", color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 40 }}>
        {children}
      </div>
      {/* Organizer logout modal */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#0d0630', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 40, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <LogOut size={40} color="white" />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Organizer Account</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, lineHeight: 1.5 }}>Ticpin Pass is only available for users. Please logout to continue.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={handleLogout} style={{ padding: 16, background: 'white', color: 'black', borderRadius: 40, border: 'none', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>Logout & Continue</button>
              <button onClick={() => setShowLogoutModal(false)} style={{ padding: 16, background: 'transparent', color: 'rgba(255,255,255,0.4)', borderRadius: 40, border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (initialLoading) {
    return (
      <Wrapper>
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={40} color="white" />
        </div>
      </Wrapper>
    );
  }

  /* ── MANAGE PASS VIEW ── */
  if (isActive && latestPass) {
    return (
      <Wrapper>
        <ManagePass pass={latestPass} onRefresh={() => {
          if (user?.id) passApi.getLatestPass(user.id).then(setLatestPass).catch(() => { });
        }} />
      </Wrapper>
    );
  }

  /* ── BUY PASS VIEW ── */
  return (
    <Wrapper>
      <div style={{ width: '100%', maxWidth: 860, padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.25em', opacity: 0.9, marginBottom: 4 }}>TICPIN</div>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1, background: 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 40%, #e0d9ff 70%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>PASS</div>
        </div>

        {/* Price */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 64, fontWeight: 700, lineHeight: 1 }}>₹{price}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2, opacity: 0.9 }}>FOR</div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2, opacity: 0.9 }}>3 MONTHS</div>
            </div>
          </div>
        </div>

        {/* Benefits Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 20, width: '100%' }}>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.5))' }} />
          <StarIcon /><span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.18em', opacity: 0.95 }}>PASS BENEFITS</span><StarIcon />
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.5))' }} />
        </div>

        {/* Benefits Card */}
        <div style={{ border: '0.5px solid rgba(225,225,225,0.3)', borderRadius: 28, background: 'rgba(18,18,18,0.25)', backdropFilter: 'blur(12px)', padding: '24px 28px', marginBottom: 16, width: '100%' }}>
          {benefits.map((b, i) => (
            <div key={b.id}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', padding: '16px 0' }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}><b.Icon /></div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, letterSpacing: '0.02em', lineHeight: 1.3 }}>{b.title}</div>
                  <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.8, lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              </div>
              {i < benefits.length - 1 && <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.15)' }} />}
            </div>
          ))}
          <div style={{ textAlign: 'center', marginTop: 12, opacity: 0.6, fontSize: 12 }}>T&amp;C applies</div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.65, marginBottom: 20 }}>*Offer handling charge will be applied at checkout</div>

        {/* Links Card */}
        <div style={{ border: '0.5px solid rgba(225,225,225,0.25)', borderRadius: 24, background: 'rgba(18,18,18,0.2)', overflow: 'hidden', marginBottom: 20, width: '100%' }}>
          {links.map((l, i) => (
            <div key={l.id}>
              <Link href={l.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><l.Icon /><span style={{ fontSize: 16, fontWeight: 500 }}>{l.label}</span></div>
                <ChevronRight />
              </Link>
              {i < links.length - 1 && <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.18)', margin: '0 24px' }} />}
            </div>
          ))}
        </div>

        {/* Buy Button */}
        <button
          onClick={handleBuy}
          style={{ width: '100%', padding: '18px 0', borderRadius: 60, background: 'white', border: 'none', fontSize: 20, fontWeight: 700, letterSpacing: '0.06em', color: '#000', cursor: 'pointer', marginBottom: 32 }}
        >
          PROCEED TO PAYMENT
        </button>
      </div>
    </Wrapper>
  );
}