'use client';
import CreateCouponForm from '../create/createcoupon';
import { useRouter } from 'next/navigation';

export default function CreateCouponPage() {
    const router = useRouter();
    return <CreateCouponForm onBack={() => router.push('/admin/offers/create')} />;
}
