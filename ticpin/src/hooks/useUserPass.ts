'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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

  useEffect(() => {
    const checkUserPass = async () => {
      if (!auth) {
        setLoading(false);
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
        if (!user) {
          setUserPass(null);
          setLoading(false);
          setError(null);
          return;
        }

        try {
          setLoading(true);
          setError(null);

          const response = await fetch(`/backend/api/pass/user/${user.uid}`, {
            headers: {
              'Authorization': `Bearer ${await user.getIdToken()}`
            }
          });

          if (response.ok) {
            const passData = await response.json();
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
      });

      return unsubscribe;
    };

    checkUserPass();
  }, []);

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
    refreshPass: () => {
      // Force refresh by re-triggering the effect
      setLoading(true);
    }
  };
}

function isPassExpired(pass: UserPass): boolean {
  return new Date(pass.end_date) < new Date();
}

export default useUserPass;
