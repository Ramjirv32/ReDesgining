'use client';
import ViewCouponForm from '../view/viewcoupon';
import { useRouter } from 'next/navigation';

export default function ViewCouponPage() {
    const router = useRouter();
    return <ViewCouponForm onBack={() => router.push('/admin/offers/view')} />;
}
