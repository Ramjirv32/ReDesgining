'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUserSession, clearUserSession } from '@/lib/auth/user';
import { useOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import { toast } from '@/components/ui/Toast';
import { passApi, type TicpinPass } from '@/lib/api/pass';
import { Loader2, LogOut } from 'lucide-react';
import Link from 'next/link';

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700" xmlns="http://www.w3.org/2000/svg">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6"/>
  </svg>
);

const SupportIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const FAQIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const DocsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const TurfIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="24" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
    <circle cx="26" cy="26" r="12" fill="none" stroke="white" strokeWidth="1.5"/>
    <line x1="26" y1="2" x2="26" y2="50" stroke="white" strokeWidth="1.2" opacity="0.5"/>
    <line x1="2" y1="26" x2="50" y2="26" stroke="white" strokeWidth="1.2" opacity="0.5"/>
    <circle cx="26" cy="26" r="2.5" fill="white"/>
  </svg>
);

const DiningIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="24" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
    <ellipse cx="26" cy="22" rx="14" ry="6" fill="none" stroke="white" strokeWidth="1.5"/>
    <rect x="12" y="22" width="28" height="3" fill="rgba(255,255,255,0.2)"/>
    <line x1="26" y1="12" x2="26" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="22" y="28" width="8" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
  </svg>
);

const TicketIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="24" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
    <rect x="10" y="18" width="32" height="16" rx="3" fill="none" stroke="white" strokeWidth="1.5"/>
    <circle cx="10" cy="26" r="3" fill="#3B2B9E"/>
    <circle cx="42" cy="26" r="3" fill="#3B2B9E"/>
    <line x1="10" y1="26" x2="42" y2="26" stroke="white" strokeWidth="1" strokeDasharray="3 2" opacity="0.5"/>
    <line x1="20" y1="22" x2="32" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="20" y1="26" x2="28" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="20" y1="30" x2="24" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const benefits = [
  {
    id: 1,
    Icon: TurfIcon,
    title: "2 FREE TURF BOOKINGS",
    desc: "Enjoy 2 free turf bookings. Book your next two games at no cost and make the most of your playtime",
  },
  {
    id: 2,
    Icon: DiningIcon,
    title: "2 DINNING VOUCHERS WORTH ₹250 EACH",
    desc: "Enjoy 2 dining vouchers worth ₹250 each. Use on dining bills above ₹1000 and save on your next two meals",
  },
  {
    id: 3,
    Icon: TicketIcon,
    title: "EARLY ACCESS + EXCLUSIVE DISCOUNTS ON EVENTS",
    desc: "Enjoy early access to premium events plus exclusive discounts on tickets and experiences. Unlock access before anyone else and save more on every booking",
  },
];

const links = [
  { id: 1, Icon: SupportIcon, label: "Chat with support", href: "/support" },
  { id: 2, Icon: FAQIcon, label: "Frequently Asked Questions", href: "/faq" },
  { id: 3, Icon: DocsIcon, label: "Terms & Conditions", href: "/terms" },
];

const socialLinks = [
  {
    name: "WhatsApp",
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347",
    viewBox: "0 0 24 24",
    fill: true,
  },
  {
    name: "Instagram",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
    viewBox: "0 0 24 24",
    fill: true,
  },
  {
    name: "Twitter/X",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.627L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z",
    viewBox: "0 0 24 24",
    fill: true,
  },
  {
    name: "YouTube",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    viewBox: "0 0 24 24",
    fill: true,
  },
  {
    name: "Facebook",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    viewBox: "0 0 24 24",
    fill: true,
  },
];

export default function TicpinPass() {
    const router = useRouter();
    const user = useUserSession();
    const organizer = useOrganizerSession();
    const [buying, setBuying] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [hasCheckedSession, setHasCheckedSession] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [latestPass, setLatestPass] = useState<TicpinPass | null>(null);

    const price = 799;

    useEffect(() => {
        const timer = setTimeout(() => setHasCheckedSession(true), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!hasCheckedSession) return;
        
        if (user?.id) {
            passApi.getLatestPass(user.id)
                .then(pass => {
                    setLatestPass(pass);
                    setInitialLoading(false);
                })
                .catch(err => {
                    console.error('Latest pass fetch failed:', err);
                    setInitialLoading(false);
                });
        } else {
            setInitialLoading(false);
        }
    }, [user, user?.id, hasCheckedSession]);

    const handleBuy = () => {
        if (organizer) {
            setShowLogoutModal(true);
            return;
        }

        if (!user) {
            toast.error('Please login to buy Ticpin Pass');
            router.push(`/login?redirect=${encodeURIComponent('/pass/buy')}`);
            return;
        }

        if (latestPass?.status === 'active') {
            router.push('/profile');
            return;
        }

        router.push('/pass/buy');
    };

    const handleLogout = () => {
        clearOrganizerSession();
        setShowLogoutModal(false);
        toast.success('Logged out successfully. You can now buy the pass as a user.');
    };

  return (
    <div style={{
      height: "calc(100vh - 80px)",
      background: "linear-gradient(180deg, #1a0a5e 0%, #2d1b8e 30%, #1e1060 60%, #0d0630 100%)",
      fontFamily: "'Anek Latin', sans-serif",
      fontStyle: "normal",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflow: "hidden",
    }}>

      {/* Grid overlay */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 860, padding: "0 20px", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", paddingTop: 20, paddingBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.25em", color: "rgba(255,255,255,0.9)", marginBottom: 4 }}>
            TICPIN
          </div>
          <div style={{
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "0.05em",
            lineHeight: 1,
            background: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 40%, #e0d9ff 70%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "none",
          }}>
            PASS
          </div>
        </div>

        {/* Price */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: 64, fontWeight: 700, lineHeight: 1 }}>₹{price}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2, opacity: 0.9 }}>FOR</div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2, opacity: 0.9 }}>3 MONTHS</div>
            </div>
          </div>
        </div>

        {/* Pass Benefits Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ height: 1, width: 140, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.5))" }} />
          <StarIcon />
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.18em", opacity: 0.95 }}>PASS BENEFITS</span>
          <StarIcon />
          <div style={{ height: 1, width: 140, background: "linear-gradient(to left, transparent, rgba(255,255,255,0.5))" }} />
        </div>

        {/* Benefits Card */}
        <div style={{
          border: "0.5px solid rgba(225,225,225,0.3)",
          borderRadius: 28,
          background: "rgba(18,18,18,0.25)",
          backdropFilter: "blur(12px)",
          padding: "24px 28px",
          marginBottom: 16,
        }}>
          {benefits.map((b, i) => (
            <div key={b.id}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "16px 0" }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <b.Icon />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, letterSpacing: "0.02em", lineHeight: 1.3 }}>
                    {b.title}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.8, lineHeight: 1.5 }}>
                    {b.desc}
                  </div>
                </div>
              </div>
              {i < benefits.length - 1 && (
                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.15)" }} />
              )}
            </div>
          ))}

          {/* T&C and offer note */}
          <div style={{ textAlign: "center", marginTop: 12, opacity: 0.6, fontSize: 12 }}>
            T&amp;C applies
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 12, opacity: 0.65, marginBottom: 20 }}>
          *Offer handling charge will be applied at checkout
        </div>

        {/* Links Card */}
        <div style={{
          border: "0.5px solid rgba(225,225,225,0.25)",
          borderRadius: 24,
          background: "rgba(18,18,18,0.2)",
          overflow: "hidden",
          marginBottom: 20,
        }}>
          {links.map((l, i) => (
            <div key={l.id}>
              <Link
                href={l.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 24px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  textDecoration: "none",
                  color: "inherit"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <l.Icon />
                  <span style={{ fontSize: 16, fontWeight: 500 }}>{l.label}</span>
                </div>
                <ChevronRight />
              </Link>
              {i < links.length - 1 && (
                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.18)", margin: "0 24px" }} />
              )}
            </div>
          ))}
        </div>

        {/* Buy Button */}
        <button
          onClick={handleBuy}
          disabled={initialLoading}
          style={{
            width: "100%",
            padding: "18px 0",
            borderRadius: 60,
            background: "white",
            border: "none",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "#000",
            cursor: "pointer",
            transition: "transform 0.1s, opacity 0.1s",
            opacity: initialLoading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px"
          }}
          onMouseEnter={e => { if (!initialLoading) e.currentTarget.style.opacity = "0.92"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {initialLoading ? (
            <Loader2 className="animate-spin" />
          ) : latestPass?.status === 'active' ? (
            "VIEW YOUR PASS"
          ) : (
            "PROCEED TO PAYMENT"
          )}
        </button>

        {/* Social Icons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 24 }}>
          {socialLinks.map((s) => (
            <div
              key={s.name}
              title={s.name}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            >
              <svg width="14" height="14" viewBox={s.viewBox} fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d={s.path} fill="white" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Logout Modal for Organizers */}
      {showLogoutModal && (
          <div style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(4px)"
          }}>
              <div style={{
                  background: "#0d0630",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 40,
                  padding: "40px",
                  maxWidth: "400px",
                  width: "100%",
                  textAlign: "center"
              }}>
                  <div style={{
                      width: "80px",
                      height: "80px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px"
                  }}>
                      <LogOut size={40} color="white" />
                  </div>
                  <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "16px" }}>Organizer Account</h2>
                  <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "32px", lineHeight: 1.5 }}>
                      Ticpin Pass is only available for users. Please logout to continue.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <button 
                          onClick={handleLogout}
                          style={{
                              padding: "16px",
                              background: "white",
                              color: "black",
                              borderRadius: "40px",
                              border: "none",
                              fontSize: "18px",
                              fontWeight: 700,
                              cursor: "pointer"
                          }}
                      >
                          Logout & Continue
                      </button>
                      <button 
                          onClick={() => setShowLogoutModal(false)}
                          style={{
                              padding: "16px",
                              background: "transparent",
                              color: "rgba(255,255,255,0.4)",
                              borderRadius: "40px",
                              border: "none",
                              fontSize: "16px",
                              fontWeight: 600,
                              cursor: "pointer"
                          }}
                      >
                          Cancel
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}