'use client';
import CreateOfferForm from '../create/createoffer';
import { useRouter } from 'next/navigation';

export default function CreateOfferPage() {
    const router = useRouter();
    return <CreateOfferForm onBack={() => router.push('/admin/offers/create')} />;
}
