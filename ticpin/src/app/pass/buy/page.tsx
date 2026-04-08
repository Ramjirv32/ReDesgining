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

const price = 1;

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
  
  const [billing, setBilling] = useState({
    name: '',
    phone: '',
    email: '',
    state: 'Tamil Nadu'
  });

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        passApi.getLatestPass(user.id),
        profileApi.getProfile(user.id)
      ]).then(([pass, prof]) => {
        setLatestPass(pass);
        setProfile(prof);
        if (prof) {
          setBilling({
            name: prof.name || user.name || '',
            phone: prof.phone || user.phone || '',
            email: prof.email || user.email || '',
            state: prof.state || 'Tamil Nadu'
          });
        }
        setInitialLoading(false);
      }).catch(err => {
        console.error('Fetch failed:', err);
        setInitialLoading(false);
      });
    } else {
      setInitialLoading(false);
    }
  }, [user]);

  const handleBuy = async () => {
    if (organizer) {
      toast.error('Please logout from organizer account first');
      return;
    }

    if (!user) {
      toast.error('Please login to buy Ticpin Pass');
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!acceptedTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    if (latestPass?.status === 'active') {
      router.push('/profile');
      return;
    }

    setBuying(true);
    try {
      // Save/Update profile details in backend
      if (user?.id) {
        try {
          if (profile) {
            await profileApi.updateProfile(user.id, {
              name: billing.name,
              email: billing.email,
              state: billing.state,
              phone: billing.phone || user.phone
            });
          } else {
            await profileApi.createProfile({
              userId: user.id,
              name: billing.name,
              email: billing.email,
              state: billing.state,
              phone: billing.phone || user.phone
            });
          }
        } catch (profileErr: any) {
          console.error('Profile Sync Error:', profileErr);
          // If it's a conflict or already exists, we can still proceed to payment
          if (profileErr.message?.includes('already exists') || profileErr.message?.includes('conflict')) {
            console.log('Profile already exists, proceeding to order creation');
          } else {
             throw new Error('Unable to save your billing details. Please try again or contact support.');
          }
        }
      } else {
        throw new Error('User session not found. Please login again.');
      }

      const res = await fetch('/backend/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: price,
          customer_id: user.id,
          customer_phone: billing.phone || user.phone,
          customer_email: billing.email || user.email || '',
          type: 'pass',
          notes: {
            user_id: user.id,
            booking_type: 'pass',
            pass_id: latestPass?.id || '',
            billing_name: billing.name,
            billing_email: billing.email || user.email || '',
            billing_phone: billing.phone || user.phone || '',
            billing_state: billing.state
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

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
              router.push('/profile');
            } catch (err: any) {
              console.error('Activation Error:', err);
              toast.error('Payment succeeded but activation failed. Contact support.');
            } finally {
              setBuying(false);
            }
          },
          prefill: {
            name: billing.name || user.name || '',
            email: billing.email || user.email || '',
            contact: billing.phone || user.phone || ''
          },
          theme: { color: '#000000' }
        };
        const rzp = (window as any).Razorpay(options);
        rzp.open();
      /* } else if (data.gateway === 'cashfree') {
        if (!(window as any).Cashfree) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
            document.head.appendChild(script);
          });
        }

        const cashfree = (window as any).Cashfree({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
        });

        // Store pending activation data
        sessionStorage.setItem('ticpin_pending_pass', JSON.stringify({
          userId: user.id,
          phone: billing.phone || user.phone,
          latestPassId: latestPass?.id || ''
        }));

        cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          redirectTarget: '_self',
        }); */
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setBuying(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-800" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-anek-latin relative overflow-x-hidden">
      {/* Header */}
      <header className="w-full h-[114px] flex items-center justify-between px-10 border-b border-zinc-200 sticky top-0 bg-white z-50">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push('/')}>
           <Image src="/ticpin-logo-black.png" alt="TICPIN" width={110} height={24} className="h-6 w-auto object-contain" />
        </div>
        
        <h1 className="text-[30px] font-semibold text-black absolute left-1/2 -translate-x-1/2">
          Review your Ticpin Pass
        </h1>

        <div 
          className="w-[51px] h-[51px] bg-[#E1E1E1] rounded-full flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={() => router.push('/profile')}
        >
          {profile?.profilePhoto ? (
            <Image src={profile.profilePhoto} alt="Profile" width={51} height={51} className="object-cover" />
          ) : (
            <div className="text-black font-semibold text-sm">Profile</div>
          )}
        </div>
      </header>

      <main className="max-w-[1366px] mx-auto pt-[50px] pb-20 px-4">
        {/* Billing Card */}
        <div className="w-full border-2 border-[#AEAEAE] rounded-[15px] bg-white overflow-hidden mb-10">
          <div className="px-10 py-6 border-b border-zinc-200">
            <h2 className="text-[30px] font-semibold text-black">Billing Details</h2>
          </div>

          <div className="px-10 py-8 space-y-8">
            <p className="text-[20px] font-medium text-[#686868]">
              These details will be shown on your invoice *
            </p>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="w-full h-[51px] border border-[#AEAEAE] rounded-[10px] flex items-center px-4">
                <input 
                  type="text" 
                  value={billing.name} 
                  onChange={e => setBilling({...billing, name: e.target.value})}
                  className="w-full bg-transparent text-[20px] font-medium text-black outline-none placeholder-[#AEAEAE]"
                  placeholder="Full Name"
                />
              </div>

              <div className="w-full h-[51px] bg-[#F0F0F0] rounded-[10px] flex items-center px-4">
                <input 
                  type="text" 
                  value={billing.phone} 
                  disabled
                  className="w-full bg-transparent text-[20px] font-medium text-black outline-none placeholder-[#686868] cursor-not-allowed opacity-70"
                  placeholder="Contact Number"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[20px] font-medium text-[#686868] ml-1">Select State</label>
                <div className="w-full h-[72px] bg-[#F0F0F0] rounded-[15px] flex items-center px-6 relative">
                  <select 
                    value={billing.state}
                    onChange={e => setBilling({...billing, state: e.target.value})}
                    className="w-full bg-transparent text-[20px] font-medium text-black outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select State</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-6 text-[#686868]" size={24} />
                </div>
              </div>

              <div className="w-full h-[51px] border border-[#AEAEAE] rounded-[10px] flex items-center px-4">
                <input 
                  type="email" 
                  value={billing.email} 
                  onChange={e => setBilling({...billing, email: e.target.value})}
                  className="w-full bg-transparent text-[20px] font-medium text-black outline-none placeholder-[#AEAEAE]"
                  placeholder="Email Address"
                />
              </div>

              <p className="text-[20px] font-medium text-[#686868]">
                We'll mail you pass confirmation and invoices
              </p>
            </div>

            {/* Divider */}
            <div className="h-[0.5px] bg-[#AEAEAE] w-full mt-10"></div>

            {/* Terms and Buy */}
            <div className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="terms"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  className="w-[22px] h-[22px] border border-[#686868] rounded-[8px] cursor-pointer accent-black"
                />
                <label htmlFor="terms" className="text-[20px] font-medium text-[#686868] cursor-pointer">
                  I have read and accepted the <span className="text-[#3B2B9E] underline">terms and conditions</span>
                </label>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right">
                  <div className="text-[15px] font-normal text-[#686868]">TOTAL</div>
                  <div className="text-[30px] font-semibold text-black">₹{price}</div>
                </div>

                <button
                  onClick={handleBuy}
                  disabled={buying}
                  className="w-[263px] h-[58px] bg-black text-white rounded-[7px] font-medium text-[32px] flex items-center justify-center gap-4 hover:bg-zinc-800 transition-colors disabled:opacity-70"
                >
                  {buying ? <Loader2 className="animate-spin" /> : (
                    <>
                      <span>Buy</span>
                      <ChevronDown className="-rotate-90" size={24} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
