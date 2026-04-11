'use client';

import { useState, useEffect } from 'react';

interface UserPass {
  id: string;
  status: string;
  end_date: string;
  benefits: {
    events_discount_active: boolean;
    turf_bookings: {
      total: number;
      used: number;
      remaining: number;
    };
    dining_vouchers: {
      total: number;
      used: number;
      remaining: number;
      value_each: number;
    };
  };
}

export function useUserPass() {
  const [userPass, setUserPass] = useState<UserPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const checkUserPass = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user session
        const res = await fetch('/backend/api/auth/session');
        const sessionData = await res.json();
        
        if (!sessionData || !sessionData.userId) {
          setUserPass(null);
          setLoading(false);
          return;
        }

        const passRes = await fetch(`/backend/api/pass/user/${sessionData.userId}/latest`);
        if (passRes.ok) {
          const passData = await passRes.json();
          if (passData && passData.status === 'active') {
            setUserPass(passData);
          } else {
            setUserPass(null);
          }
        } else {
          setUserPass(null);
        }
      } catch (err) {
        console.error('Error checking user pass:', err);
        setError('Failed to check pass status');
        setUserPass(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserPass();
  }, [refreshKey]);

  const hasActivePass = userPass?.status === 'active' && !isPassExpired(userPass);
  const hasDiscountBenefit = userPass?.benefits?.events_discount_active;
  const canApplyDiscount = hasActivePass && hasDiscountBenefit;

  return {
    userPass,
    loading,
    error,
    hasActivePass,
    hasDiscountBenefit,
    canApplyDiscount,
    refreshPass: () => setRefreshKey(prev => prev + 1)
  };
}

function isPassExpired(pass: UserPass): boolean {
  return new Date(pass.end_date) < new Date();
}

export default useUserPass;
