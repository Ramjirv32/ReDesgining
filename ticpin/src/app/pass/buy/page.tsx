'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUserSession } from '@/lib/auth/user';
import { useOrganizerSession, clearOrganizerSession } from '@/lib/auth/organizer';
import { toast } from '@/components/ui/Toast';
import { passApi, type TicpinPass } from '@/lib/api/pass';
import { profileApi, UserProfile } from '@/lib/api/profile';
import { Loader2, LogOut, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const price = 799;

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry"
];

export default function BuyPassPage() {
  const router = useRouter();
  const user = useUserSession();
  const organizer = useOrganizerSession();
  const [buying, setBuying] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [latestPass, setLatestPass] = useState<TicpinPass | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  
  const [billing, setBilling] = useState({
    name: '',
    phone: '',
    email: '',
    state: 'Tamil Nadu'
  });

  useEffect(() => {
    const timer = setTimeout(() => setHasCheckedSession(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasCheckedSession) return;
    
    // Check for Cashfree redirect return
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    if (orderId && user?.id) {
      const pending = sessionStorage.getItem('ticpin_pending_pass');
      if (pending) {
        try {
          const p = JSON.parse(pending);
          if (p.userId === user.id) {
            setBuying(true);
            const endpoint = p.latestPassId ? `/backend/api/pass/${p.latestPassId}/renew` : '/backend/api/pass/apply';
            fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user.id,
                payment_id: orderId,
                order_id: orderId,
                phone: p.phone
              })
            }).then(res => {
              if (res.ok) {
                toast.success('Pass activated successfully!');
                sessionStorage.removeItem('ticpin_pending_pass');
                router.push('/profile');
              } else {
                toast.error('Activation failed. Please contact support.');
              }
            }).catch(err => {
              console.error('Activation error:', err);
              toast.error('Something went wrong during activation.');
            }).finally(() => {
              setBuying(false);
              // Clean URL
              window.history.replaceState(null, '', window.location.pathname);
            });
          }
        } catch (e) {
          console.error('Error parsing pending pass data:', e);
        }
      }
    }

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
      
      profileApi.getProfile(user.id)
        .then(prof => {
          setProfile(prof);
          setBilling({
            name: prof.name || '',
            phone: prof.phone || user.phone || '',
            email: prof.email || '',
            state: prof.state || 'Tamil Nadu'
          });
        })
        .catch(err => {
          console.error('Profile fetch failed:', err);
          setInitialLoading(false);
        });
    } else {
      setInitialLoading(false);
    }
  }, [user, user?.id, hasCheckedSession]);

  const handleBuy = async () => {
    if (organizer) {
      setShowLogoutModal(true);
      return;
    }

    if (!user) {
      toast.error('Please login to buy Ticpin Pass');
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (latestPass?.status === 'active') {
      router.push('/profile');
      return;
    }

    if (!acceptedTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setBuying(true);
    try {
      const res = await fetch('/backend/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: price,
          customer_id: user.id,
          customer_phone: user.phone,
          customer_email: user.email || '',
          type: 'pass',
          notes: {
            user_id: user.id,
            booking_type: 'pass',
            pass_id: latestPass?.id || ''
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      // Store pending pass data for post-payment activation
      sessionStorage.setItem('ticpin_pending_pass', JSON.stringify({
        userId: user.id,
        phone: user.phone,
        latestPassId: latestPass?.id || ''
      }));

      if (data.gateway === 'razorpay') {
        const options = {
          key: data.razorpay_key,
          amount: price * 100,
          currency: 'INR',
          name: 'Ticpin',
          description: '3 Months Ticpin Pass',
          order_id: data.order_id,
          handler: async function (response: any) {
            try {
              setBuying(true);
              const endpoint = latestPass ? `/backend/api/pass/${latestPass.id}/renew` : '/backend/api/pass/apply';
              const activateRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: user.id,
                  payment_id: response.razorpay_payment_id || response.razorpay_order_id,
                  order_id: response.razorpay_order_id,
                  phone: user.phone
                })
              });

              if (!activateRes.ok) {
                const errData = await activateRes.json();
                throw new Error(errData.error || 'Failed to activate pass');
              }

              toast.success('Payment Successful! Your pass is active.');
              sessionStorage.removeItem('ticpin_pending_pass');
              router.push('/profile');
            } catch (err: any) {
              console.error('Activation Error:', err);
              toast.error('Payment succeeded but activation failed. Contact support.');
            } finally {
              setBuying(false);
            }
          },
          prefill: {
            name: user.name || '',
            email: user.email || '',
            contact: user.phone || ''
          },
          theme: {
            color: '#000000'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          toast.error('Payment failed. Please try again.');
          setBuying(false);
        });
        rzp.open();
      } else if (data.gateway === 'cashfree') {
        // Redirect to Cashfree payment page
        window.location.href = data.payment_link;
      }
    } catch (err: any) {
      console.error('Payment Error:', err);
      toast.error(err.message || 'Payment failed. Please try again.');
      setBuying(false);
    }
  };

  const handleLogout = () => {
    clearOrganizerSession();
    setShowLogoutModal(false);
    toast.success('Logged out successfully. You can now buy the pass as a user.');
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Anek Latin, sans-serif' }}>
      {/* Header */}
      <div className="relative h-[114px] bg-white border-b border-gray-300">
        <div className="absolute left-[37px] top-[37px]">
          <Image src="/WORDMARK PNG 1.png" alt="Ticpin" width={159} height={40} />
        </div>
        
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-black font-semibold" style={{ fontSize: '30px', lineHeight: '33px' }}>
            Review your Ticpin Pass
          </h1>
        </div>

        <div className="absolute right-[37px] top-[31px]">
          <div className="w-[51px] h-[51px] bg-gray-200 rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative pt-[164px] pb-8 px-4">
        <div className="max-w-[1366px] mx-auto">
          {/* Billing Details */}
          <div className="mb-8">
            <h2 className="text-black font-semibold mb-4" style={{ fontSize: '30px', lineHeight: '33px' }}>
              Billing Details
            </h2>
            <div className="w-full h-[0.5px] bg-gray-300 mb-6"></div>
            <p className="text-gray-500 mb-6" style={{ fontSize: '20px', lineHeight: '22px' }}>
              These details will be shown on your invoice *
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 mb-8">
            {/* Name */}
            <div 
              className="bg-white border border-gray-300 rounded-[10px] h-[51px] flex items-center px-4"
              style={{ width: '1306px' }}
            >
              <span className="text-black" style={{ fontSize: '20px', lineHeight: '22px' }}>
                {profile?.name || ''}
              </span>
            </div>

            {/* Phone */}
            <div 
              className="bg-gray-100 border border-gray-300 rounded-[10px] h-[51px] flex items-center px-4"
              style={{ width: '1306px' }}
            >
              <span className="text-black" style={{ fontSize: '20px', lineHeight: '22px' }}>
                {profile?.phone || user?.phone || ''}
              </span>
            </div>

            {/* Email */}
            <div 
              className="bg-white border border-gray-300 rounded-[10px] h-[51px] flex items-center px-4"
              style={{ width: '1306px' }}
            >
              <span className="text-black" style={{ fontSize: '20px', lineHeight: '22px' }}>
                {profile?.email || ''}
              </span>
            </div>

            {/* State */}
            <div className="mb-6">
              <label className="text-gray-500 mb-2 block" style={{ fontSize: '20px', lineHeight: '22px' }}>
                Select State
              </label>
              <div 
                className="bg-gray-100 border border-gray-300 rounded-[15px] h-[72px] flex items-center px-4 justify-between"
                style={{ width: '1305px' }}
              >
                <span className="text-black" style={{ fontSize: '20px', lineHeight: '22px' }}>
                  {profile?.state || 'Tamil Nadu'} ( AUTO FETCH FROM PROFILE)
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <p className="text-gray-500 mb-6" style={{ fontSize: '20px', lineHeight: '22px' }}>
              We'll mail you pass confirmation and invoices
            </p>
          </div>

          {/* Terms and Buy Button */}
          <div className="w-full h-[0.5px] bg-gray-300 mb-6" style={{ width: '1268px' }}></div>
          
          <div className="flex items-center justify-between mb-8" style={{ width: '1306px' }}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-[22px] h-[22px] border border-gray-400 rounded-[8px]"
              />
              <label htmlFor="terms" className="text-gray-500" style={{ fontSize: '20px', lineHeight: '22px' }}>
                I have read and accepted the terms and conditions
              </label>
            </div>
            
            <button
              onClick={handleBuy}
              disabled={buying || !acceptedTerms}
              className="bg-black text-white font-medium rounded-[7px] hover:scale-105 transition-all duration-200 flex items-center justify-center gap-4"
              style={{ 
                width: '263px', 
                height: '58px',
                fontSize: '32px',
                lineHeight: '64px',
                fontFamily: 'Anek Tamil Condensed, sans-serif'
              }}
            >
              {buying ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <span>Buy</span>
                  <span>₹799</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-white text-sm">TOTAL</p>
          </div>
        </div>
      </div>

      {/* Logout Modal for Organizers */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
          <div 
            className="relative bg-gray-900 border border-white/15 rounded-3xl p-8 max-w-md w-full"
            style={{ background: '#0d0630', borderRadius: '40px' }}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut size={40} className="text-white" />
              </div>
              <h2 className="text-white font-bold text-2xl mb-4">Organizer Account</h2>
              <p className="text-white/60 mb-8 leading-relaxed">
                Ticpin Pass is only available for users. Please logout from your organizer account and login as a user to continue.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleLogout}
                  className="w-full py-4 bg-white text-black rounded-full font-bold hover:bg-gray-100 transition-colors"
                >
                  Logout & Continue
                </button>
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="w-full py-4 bg-transparent text-white/40 rounded-full font-bold hover:text-white/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
