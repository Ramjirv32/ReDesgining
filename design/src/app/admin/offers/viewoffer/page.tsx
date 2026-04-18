'use client';
import ViewOfferForm from '../view/viewoffer';
import { useRouter } from 'next/navigation';

export default function ViewOfferPage() {
    const router = useRouter();
    return <ViewOfferForm onBack={() => router.push('/admin/offers/view')} />;
}
