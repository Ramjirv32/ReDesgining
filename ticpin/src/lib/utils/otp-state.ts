
const OTP_COOLDOWN = 180; // 3 minutes

export const getOTPSentAt = (email: string, vertical: string): number | null => {
    if (typeof window === 'undefined') return null;
    const key = `otp_sent_at_${vertical}_${email}`;
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : null;
};

export const setOTPSentAt = (email: string, vertical: string) => {
    if (typeof window === 'undefined') return;
    const key = `otp_sent_at_${vertical}_${email}`;
    localStorage.setItem(key, Date.now().toString());
};

export const clearOTPSentAt = (email: string, vertical: string) => {
    if (typeof window === 'undefined') return;
    const key = `otp_sent_at_${vertical}_${email}`;
    localStorage.removeItem(key);
};

export const getRemainingCooldown = (email: string, vertical: string): number => {
    const sentAt = getOTPSentAt(email, vertical);
    if (!sentAt) return 0;
    
    const elapsed = Math.floor((Date.now() - sentAt) / 1000);
    const remaining = OTP_COOLDOWN - elapsed;
    return remaining > 0 ? remaining : 0;
};
