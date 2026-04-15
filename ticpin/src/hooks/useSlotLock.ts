'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SlotLock {
    id: string;
    lock_key: string;
    type: string;
    reference_id: string;
    date: string;
    slot: string;
    court_name?: string;
    expires_at: string;
}

export function useSlotLock(type: 'play' | 'event' | 'dining') {
    const [lockKey, setLockKey] = useState<string>('');
    const [locks, setLocks] = useState<SlotLock[]>([]);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // 1. Persistent lock key
    useEffect(() => {
        let key = localStorage.getItem('ticpin_lock_key');
        if (!key) {
            key = window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('ticpin_lock_key', key);
        }
        setLockKey(key);
    }, []);

    // 2. Fetch locks
    const fetchLocks = useCallback(async () => {
        if (!lockKey) return;
        try {
            const res = await fetch(`/backend/api/booking/lock/status?lock_key=${lockKey}&type=${type}`);
            if (res.ok) {
                const data = await res.json();
                setLocks(data.locks || []);
            }
        } catch (err) {
            console.error('Failed to fetch locks:', err);
        } finally {
            setLoading(false);
        }
    }, [lockKey, type]);

    useEffect(() => {
        if (lockKey) {
            fetchLocks();
        }
    }, [lockKey, fetchLocks]);

    // 3. Countdown timer
    useEffect(() => {
        if (locks.length === 0) {
            setTimeRemaining(0);
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            let maxRemaining = 0;
            let countExpired = 0;

            locks.forEach(lock => {
                const expiresAt = new Date(lock.expires_at).getTime();
                const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
                if (remaining > maxRemaining) {
                    maxRemaining = remaining;
                }
                if (remaining === 0) {
                    countExpired++;
                }
            });

            setTimeRemaining(maxRemaining);

            if (countExpired > 0 && maxRemaining === 0) {
                setLocks([]);
                sessionStorage.removeItem('ticpin_cart');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [locks]);

    // 4. APIs
    const lockSlot = async (referenceId: string, date: string, slot: string, courtName?: string) => {
        if (!lockKey) return false;
        try {
            const res = await fetch('/backend/api/booking/lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lock_key: lockKey,
                    type,
                    reference_id: referenceId,
                    date,
                    slot,
                    court_name: courtName || ''
                })
            });
            
            if (res.ok) {
                await fetchLocks();
                return true;
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to lock slot');
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const unlockSlot = async (referenceId: string, date: string, slot: string, courtName?: string) => {
        if (!lockKey) return false;
        try {
            const res = await fetch('/backend/api/booking/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lock_key: lockKey,
                    type,
                    reference_id: referenceId,
                    date,
                    slot,
                    court_name: courtName || ''
                })
            });
            if (res.ok) {
                await fetchLocks();
                return true;
            }
            return false;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    return {
        lockKey,
        locks,
        timeRemaining,
        loading,
        lockSlot,
        unlockSlot,
        refreshLocks: fetchLocks
    };
}
