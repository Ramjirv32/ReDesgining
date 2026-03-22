'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useUserSession } from '@/lib/auth/user';
import { bookingApi } from '@/lib/api/booking';

const PASS_AMOUNT = 1;

/** Dynamically load a third-party payment SDK script (idempotent). */
function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(s);
    });
}

export default function PassCheckoutPage() {
    const router = useRouter();
    const session = useUserSession();

    // Indian states
    const states = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
        'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
        'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
        'Uttarakhand', 'West Bengal', 'Delhi'
    ];

    // Function to get cities for a state
    const getCitiesForState = (selectedState: string): string[] => {
        const citiesByState: Record<string, string[]> = {
            'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kurnool', 'Rajahmundry', 'Kakinada', 'Kadapa', 'Anantapur', 'Ongole', 'Vizianagaram', 'Eluru', 'Kavali', 'Nandyal', 'Chittoor', 'Hindupur', 'Machilipatnam', 'Tenali', 'Proddatur', 'Adoni', 'Chirala', 'Gudivada', 'Narasaraopet', 'Palakollu', 'Tadepalle', 'Tadepalligudem', 'Tadpatri'],
            'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Namsai', 'Bomdila', 'Roing', 'Tezu', 'Aalo', 'Ziro'],
            'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Sibsagar', 'Barpeta', 'Goalpara', 'Lakhimpur', 'Dhubri', 'Karimganj', 'North Lakhimpur'],
            'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Arrah', 'Bihar Sharif', 'Purnia', 'Begusarai', 'Katihar', 'Chhapra', 'Sasaram', 'Hajipur', 'Bettiah', 'Samastipur', 'Sitamarhi', 'Siwan', 'Munger', 'Motihari', 'Jamalpur'],
            'Chhattisgarh': ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Chirmiri', 'Dhamtari', 'Mahasamund'],
            'Goa': ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Valpoi'],
            'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi', 'Gandhidham', 'Bhuj', 'Porbandar', 'Ankleshwar', 'Bharuch', 'Patan', 'Mahesana', 'Mehsana'],
            'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Panchkula', 'Yamunanagar', 'Sonipat', 'Bhiwani', 'Sirsa', 'Jind', 'Thanesar', 'Kaithal', 'Rewari', 'Palwal', 'Hapur'],
            'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala', 'Kullu', 'Manali', 'Palampur', 'Baddi', 'Nahan', 'Una', 'Kangra', 'Hamirpur', 'Bilaspur'],
            'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Dumka', 'Phusro', 'Medininagar', 'Ramgarh', 'Sindri', 'Chaibasa', 'Jhumri Telaiya'],
            'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davangere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumkur', 'Raichur', 'Bidar', 'Hosapete', 'Chikmagalur', 'Udupi', 'Kolar', 'Gadag', 'Hassan', 'Mandya'],
            'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Malappuram', 'Kannur', 'Kasaragod', 'Pathanamthitta', 'Idukki', 'Wayanad', 'Ernakulam', 'Kottayam', 'Ponnani', 'Koyilandy', 'Ottapalam', 'Changanacheri'],
            'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Guna', 'Shivpuri', 'Vidisha', 'Chhindwara', 'Morena', 'Damoh'],
            'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Navi Mumbai', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Ahilyanagar', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Jalna', 'Bhusawal', 'Nanded'],
            'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Senapati', 'Ukhrul', 'Tamenglong'],
            'Meghalaya': ['Shillong', 'Tura', 'Nongstoin', 'Jowai', 'Baghmara', 'Williamnagar'],
            'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip'],
            'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto'],
            'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Baripada', 'Bhadrak', 'Jharsuguda', 'Jeypore', 'Bargarh', 'Jagatsinghpur', 'Paradip'],
            'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Moga', 'Firozpur', 'Phagwara', 'Gurdaspur', 'Kapurthala', 'Ropar'],
            'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Hanumangarh', 'Jaisalmer', 'Barmer', 'Churu', 'Dausa'],
            'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo'],
            'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Tirunelveli', 'Vellore', 'Thoothukudi', 'Thiruvananthapuram', 'Nagercoil', 'Thanjavur', 'Dindigul', 'Cuddalore', 'Kanchipuram', 'Kumbakonam', 'Karur', 'Sivakasi'],
            'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Jagtial', 'Bhongir'],
            'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Pratapgarh', 'Kailasahar', 'Belonia'],
            'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', 'Noida', 'Meerut', 'Aligarh', 'Bareilly', 'Gorakhpur', 'Ayodhya', 'Muzaffarnagar', 'Mathura', 'Jhansi', 'Shahjahanpur', 'Firozabad', 'Rampur', 'Faizabad'],
            'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Pithoragarh', 'Mussoorie'],
            'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Malda', 'Kharagpur', 'Haldia', 'Raiganj', 'Krishnanagar', 'Jalpaiguri', 'Purulia', 'Bankura', 'Alipurduar'],
            'Delhi': ['New Delhi', 'Delhi Cantonment', 'Narela', 'Rohini', 'Dwarka', 'Janakpuri', 'Lajpat Nagar', 'Karol Bagh', 'Shahdara']
        };
        return citiesByState[selectedState] || [];
    };

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [state, setState] = useState('');
    const [district, setDistrict] = useState('');

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [hasCheckedSession, setHasCheckedSession] = useState(false);

    useEffect(() => {
        // Wait for session to load first
        const timer = setTimeout(() => {
            setHasCheckedSession(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!hasCheckedSession) return;
        
        if (!session) {
            router.push('/pass');
            return;
        }
        
        setName(session.name || '');
        setPhone(session.phone || '');
    }, [session, hasCheckedSession, router]);

    // Handle Cashfree redirect return
    useEffect(() => {
        if (!hasCheckedSession) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const cfOrderId = urlParams.get('order_id');
        if (cfOrderId && cfOrderId.startsWith('TICPIN_')) {
            const pending = sessionStorage.getItem('ticpin_pending_pass');
            if (pending) {
                try {
                    const p = JSON.parse(pending);
                    window.history.replaceState(null, '', window.location.pathname);
                    setLoading(true);
                    setName(p.name || '');
                    setPhone(p.phone || '');
                    confirmPassPurchase(cfOrderId, p);
                } catch (e) {
                    console.error('Cashfree pass return parse error', e);
                }
            }
        }
    }, [session, hasCheckedSession]);

    const confirmPassPurchase = async (paymentId: string, data: any) => {
        try {
            const res = await fetch('/backend/api/pass/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    user_id: data.userId,
                    payment_id: paymentId,
                    name: data.name,
                    phone: data.phone,
                    address: data.address,
                    state: data.state,
                    district: data.district,
                }),
            });
            const resData = await res.json();
            if (!res.ok) throw new Error(resData.error || 'Purchase failed');
            sessionStorage.removeItem('ticpin_pending_pass');
            setSuccess(true);
            setTimeout(() => router.push('/my-pass'), 2000);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!session) return;
        if (!name.trim()) { setError('Please enter your name.'); return; }
        setError('');
        setLoading(true);

        try {
            // Step 1: Create a real payment order
            const orderRes = await bookingApi.createPaymentOrder({
                amount: PASS_AMOUNT,
                customer_phone: phone || session.phone,
                customer_email: `user_${session.phone}@ticpin.in`,
                customer_id: session.id,
                return_url: `${window.location.origin}${window.location.pathname}`,
            });

            // Step 2: Store pending pass data for after redirect (Cashfree)
            sessionStorage.setItem('ticpin_pending_pass', JSON.stringify({
                userId: session.id,
                name,
                phone,
                address,
                state,
                district,
            }));

            if (orderRes.gateway === 'cashfree') {
                await loadScript('https://sdk.cashfree.com/js/v3/cashfree.js');
                const cashfree = (window as any).Cashfree({
                    mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
                });
                cashfree.checkout({
                    paymentSessionId: orderRes.payment_session_id,
                    redirectTarget: '_self',
                });
                // Page will redirect — don't set loading false here
            } else {
                // Razorpay inline modal
                await loadScript('https://checkout.razorpay.com/v1/checkout.js');
                const options = {
                    key: orderRes.razorpay_key,
                    amount: 100,
                    currency: 'INR',
                    order_id: orderRes.order_id,
                    name: 'Ticpin',
                    description: 'Ticpin Pass (3 months)',
                    prefill: {
                        name,
                        contact: phone,
                    },
                    theme: { color: '#7B2FF7' },
                    handler: async (response: { razorpay_payment_id: string }) => {
                        await confirmPassPurchase(response.razorpay_payment_id, {
                            userId: session.id,
                            name,
                            phone,
                            address,
                            state,
                            district,
                        });
                    },
                    modal: {
                        ondismiss: () => {
                            sessionStorage.removeItem('ticpin_pending_pass');
                            setLoading(false);
                            setError('Payment was cancelled. Please try again.');
                        },
                    },
                };
                new (window as any).Razorpay(options).open();
            }
        } catch (e: unknown) {
            setLoading(false);
            setError(e instanceof Error ? e.message : 'Payment initiation failed. Please try again.');
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#ECE8FD] to-white">
                <CheckCircle className="text-[#7B2FF7]" size={64} />
                <h2 className="text-2xl font-black text-zinc-900">Pass Activated!</h2>
                <p className="text-zinc-500">Redirecting to your pass...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 50%)' }}>

            <main className="flex-1 px-4 py-10 max-w-[900px] mx-auto w-full">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 text-sm mb-8 transition"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <h1 className="text-3xl font-black text-zinc-900 mb-2">Checkout</h1>
                <p className="text-zinc-500 mb-10">Complete your Ticpin Pass purchase</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        <h2 className="text-lg font-bold text-zinc-800 mb-2">Your Details</h2>

                        {[
                            { label: 'Full Name *', value: name, set: setName, placeholder: 'Enter your name', type: 'text' },
                            { label: 'Phone', value: phone, set: setPhone, placeholder: 'Enter phone number', type: 'text' },
                            { label: 'Address', value: address, set: setAddress, placeholder: 'Street address', type: 'text' },
                        ].map(({ label, value, set, placeholder, type }) => (
                            <div key={label} className="flex flex-col gap-1">
                                <label className="text-sm text-zinc-600 font-medium">{label}</label>
                                <input
                                    type={type}
                                    value={value}
                                    onChange={e => set(e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm outline-none focus:border-[#7B2FF7] transition"
                                />
                            </div>
                        ))}

                        {/* State Dropdown */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-zinc-600 font-medium">State</label>
                            <select
                                value={state}
                                onChange={e => { setState(e.target.value); setDistrict(''); }}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm outline-none focus:border-[#7B2FF7] transition appearance-none"
                            >
                                <option value="">Select State</option>
                                {states.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* District/City Dropdown */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-zinc-600 font-medium">District</label>
                            <select
                                value={district}
                                onChange={e => setDistrict(e.target.value)}
                                disabled={!state}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm outline-none focus:border-[#7B2FF7] transition appearance-none disabled:bg-zinc-100 disabled:text-zinc-400"
                            >
                                <option value="">{state ? 'Select District' : 'Select State first'}</option>
                                {state && getCitiesForState(state).map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>

                    {/* Summary */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm sticky top-6">
                            <h2 className="text-lg font-bold text-zinc-900 mb-4">Order Summary</h2>

                            <div className="flex flex-col gap-3 mb-6 text-sm">
                                <div className="flex justify-between text-zinc-600">
                                    <span>Ticpin Pass (3 months)</span>
                                    <span className="font-semibold text-zinc-900">₹1</span>
                                </div>
                                <div className="flex justify-between text-zinc-500">
                                    <span>2 Turf Bookings</span>
                                    <span className="text-green-600 font-medium">Included</span>
                                </div>
                                <div className="flex justify-between text-zinc-500">
                                    <span>2 × ₹250 Dining Vouchers</span>
                                    <span className="text-green-600 font-medium">Included</span>
                                </div>
                                <div className="flex justify-between text-zinc-500">
                                    <span>Events Discount</span>
                                    <span className="text-green-600 font-medium">Included</span>
                                </div>
                                <div className="border-t border-zinc-100 pt-3 flex justify-between text-base font-bold text-zinc-900">
                                    <span>Total</span>
                                    <span>₹1</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePurchase}
                                disabled={loading}
                                className="w-full py-4 rounded-full text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 transition"
                                style={{ background: 'linear-gradient(135deg, #7B2FF7 0%, #5B1FD4 100%)' }}
                            >
                                {loading ? (
                                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                                ) : (
                                    'Complete Purchase'
                                )}
                            </button>
                            <p className="text-[11px] text-zinc-400 text-center mt-3">Secure checkout. No auto-renewal.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
