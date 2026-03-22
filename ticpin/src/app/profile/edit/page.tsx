'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserSession } from '@/lib/auth/user';
import { useIdentityStore } from '@/store/useIdentityStore';
import { profileApi, UserProfile, GPS, NotificationPreferences } from '@/lib/api/profile';
import { useUpdateProfile } from '@/lib/hooks/useProfile';
import { 
    ChevronLeft, Save, User, Mail, Phone, MapPin, Globe, 
    Calendar, UserCircle, Bell, Languages, Camera, Map,
    CheckCircle2, AlertCircle, X, Shield
} from 'lucide-react';
function EditUserProfileContent() {
    const router = useRouter();
    const userSession = useUserSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hasCheckedSession, setHasCheckedSession] = useState(false);
    const [verifyingEmail, setVerifyingEmail] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [emailVerified, setEmailVerified] = useState(true); 
    const [originalEmail, setOriginalEmail] = useState('');
    const [formData, setFormData] = useState<UserProfile>({
        userId: userSession?.id ?? '',
        phone: userSession?.phone ?? '',
        name: userSession?.name ?? '',
        email: '',
        address: '',
        street: '',
        city: '',
        state: '',
        district: '',
        dob: '',
        gender: '',
        preferredLanguage: 'English',
        notificationPreferences: {
            email: true,
            push: true,
            sms: false
        },
        gps: { lat: 0, lng: 0 },
        profilePhoto: userSession?.profilePhoto ?? ''
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        // Wait for session to load - don't redirect immediately
        const timer = setTimeout(() => {
            setHasCheckedSession(true);
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Only check session after we've checked once
        if (!hasCheckedSession) return;
        
        if (!userSession) {
            router.replace('/');
            return;
        }
        
        // Fetch profile in background but don't block UI
        let isMounted = true;
        
        const fetchProfile = async () => {
            try {
                const profile = await profileApi.getProfile(userSession.id);
                if (profile && isMounted) {
                    setFormData(prev => ({
                        ...prev,
                        ...profile,
                        notificationPreferences: profile.notificationPreferences || prev.notificationPreferences,
                        gps: profile.gps || prev.gps
                    }));
                    setOriginalEmail(profile.email || '');
                    setEmailVerified(!!profile.email);
                }
            } catch (err) {
                console.error('Failed to fetch user profile:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProfile();
        
        return () => {
            isMounted = false;
        };
    }, [userSession, hasCheckedSession, router]);

    const handleEmailChange = (newEmail: string) => {
        setFormData(prev => ({ ...prev, email: newEmail }));
        if (newEmail !== originalEmail) {
            setEmailVerified(false);
            setOtpSent(false);
        } else {
            setEmailVerified(true);
        }
    };

    const handleSendOTP = async () => {
        if (!formData.email) return;
        setVerifyingEmail(true);
        try {
            await fetch('/backend/api/user/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            setOtpSent(true);
            setSuccess('OTP sent to your email');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to send OTP');
        } finally {
            setVerifyingEmail(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) return;
        setVerifyingEmail(true);
        try {
            const res = await fetch('/backend/api/user/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp })
            });
            if (res.ok) {
                setEmailVerified(true);
                setOtpSent(false);
                setSuccess('Email verified successfully');
                setOriginalEmail(formData.email || '');
            } else {
                throw new Error('Invalid OTP');
            }
        } catch (err: any) {
            setError(err.message || 'OTP verification failed');
        } finally {
            setVerifyingEmail(false);
        }
    };

    const { loginUser } = useIdentityStore();
    const updateProfile = useUpdateProfile();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userSession) return;
        if (formData.email && !emailVerified) {
            setError('Please verify your email first');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await updateProfile.mutateAsync({
                userId: userSession.id,
                data: formData
            });

            // Update global session as well
            loginUser({
                ...userSession,
                name: formData.name,
                profilePhoto: formData.profilePhoto
            });

            setSuccess('Profile updated successfully!');
            setTimeout(() => {
                setSuccess('');
                router.push('/profile');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userSession) return;
        
        setSaving(true);
        try {
            const { url } = await profileApi.uploadPhoto(userSession.id, file);
            setFormData(prev => ({ ...prev, profilePhoto: url }));
            
            // Sync navbar immediately
            loginUser({
                ...userSession,
                profilePhoto: url
            });

            setSuccess('Photo uploaded successfully');
        } catch (err) {
            setError('Photo upload failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !hasCheckedSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5331EA]"></div>
            </div>
        );
    }

    // After loading, check if user is logged in
    if (!userSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5331EA]"></div>
            </div>
        );
    }

    const states = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
        'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
        'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
        'Uttarakhand', 'West Bengal', 'Delhi'
    ];

    const allCities = [
        'Abohar', 'Abu Road', 'Achalpur', 'Adilabad', 'Adoni', 'Agartala', 'Agra', 'Ahilyanagar', 'Ahmedabad', 'Airoli',
        'Aizawl', 'Ajmer', 'Akola', 'Akot', 'Alandur', 'Alappuzha', 'Aligarh', 'Alipur Duar', 'Allinagaram', 'Alwar',
        'Amalapuram', 'Amalner', 'Amaravati', 'Ambajogai', 'Ambala', 'Ambala Sadar', 'Ambarnath', 'Ambattur', 'Ambikapur', 'Ambur',
        'Amravati', 'Amreli', 'Amritsar', 'Amroha', 'Amur', 'Anaiyur', 'Anakapalle', 'Anand', 'Anantapur', 'Anantnag',
        'Anjangaon', 'Anjar', 'Ankleshwar', 'Aonla', 'Arakkonam', 'Arambagh', 'Araria', 'Arcot', 'Arni', 'Arrah',
        'Arsikere', 'Aruppukkottai', 'Arwal', 'Asansol', 'Ashoknagar', 'Ashoknagar Kalyangarh', 'Ashta', 'Attili', 'Attur', 'Auraiya',
        'Aurangabad', 'Avadi', 'Avaniyapuram', 'Ayodhya', 'Azamgarh', 'Bada Barabil', 'Badagara', 'Badlapur', 'Badvel', 'Bagaha',
        'Bagalkot', 'Bagbera', 'Bahadurgarh', 'Baharampur', 'Baheri', 'Bahraigh', 'Baidyabati', 'Balaghat', 'Balangir', 'Balasore',
        'Bali', 'Ballari', 'Ballarpur', 'Balotra', 'Balrampur', 'Balurghat', 'Banda', 'Bangaon', 'Bangarda Chhota', 'Bankra',
        'Bankura', 'Bansbaria', 'Banswara', 'Bapatla', 'Baprola', 'Barakpur', 'Baramati', 'Baramula', 'Baran', 'Baranagar',
        'Barasat', 'Barauni', 'Baraut', 'Barbil', 'Barddhaman', 'Bardoli', 'Bareilly', 'Bargarh', 'Barh', 'Bari',
        'Baripada', 'Barmer', 'Barnala', 'Barshi', 'Baruipur', 'Baruni', 'Barwani', 'Basavakalyan', 'Basirhat City', 'Basmat',
        'Basoda', 'Basti', 'Batala', 'Bathinda', 'Bawana', 'Beawar', 'Beed', 'Begampur', 'Begusarai', 'Bela',
        'Belagavi', 'Bellampalli', 'Bengaluru', 'Benipur', 'Bettiah', 'Betul', 'Beypore', 'Bhabhua', 'Bhadohi', 'Bhadrachalam',
        'Bhadrak', 'Bhadravati', 'Bhadreswar', 'Bhagalpur', 'Bhalswa Jahangirpur', 'Bhandara', 'Bharatpur', 'Bharuch', 'Bhatapara', 'Bhatpara',
        'Bhavnagar', 'Bhawanipatna', 'Bhayandar', 'Bhetia', 'Bhilai', 'Bhilai Charoda', 'Bhilwara', 'Bhimavaram', 'Bhimunipatnam', 'Bhind',
        'Bhiwadi', 'Bhiwandi', 'Bhiwani', 'Bhongir', 'Bhopal', 'Bhubaneswar', 'Bhuj', 'Bhusawal', 'Bidar', 'Bihar Sharif',
        'Bihat', 'Bijnor', 'Bikaner', 'Bilaspur', 'Bilimora', 'Bina', 'Birgaon', 'Bisalpur', 'Bishnupur', 'Biswan',
        'Bobbili', 'Bodhan', 'Bodinayakkanur', 'Bokaro', 'Bolpur', 'Bongaigaon', 'Borivli', 'Borsad', 'Botad', 'Brahmapur',
        'Brajarajnagar', 'Budaun', 'Budge Budge', 'Bulandshahr', 'Buldana', 'Bundi', 'Burari', 'Burhanpur', 'Buxar', 'Byasanagar',
        'Chaibasa', 'Chakradharpur', 'Chalisgaon', 'Challakere', 'Chamrajnagar', 'Chanda', 'Chandannagar', 'Chandigarh', 'Chandpur', 'Chanduasi',
        'Changanacheri', 'Channapatna', 'Chapra', 'Charkhi Dadri', 'Chas', 'Chaumu', 'Chengalpattu', 'Chennai', 'Cheruvannur', 'Chhatarpur',
        'Chhibramau', 'Chhindwara', 'Chidambaram', 'Chik Ballapur', 'Chikhli', 'Chikmagalur', 'Chilakalurupet', 'Chilla Soroda Bangar', 'Chinnachowk', 'Chintamani',
        'Chiplun', 'Chirala', 'Chirmiri', 'Chitradurga', 'Chittoor', 'Chittorgarh', 'Chopda', 'Choudwar', 'Churu', 'Closepet',
        'Coimbatore', 'Contai', 'Cuddalore', 'Cumbum', 'Cuttack', 'Dabhel', 'Dabhoi', 'Dabra', 'Dabwali', 'Dadri',
        'Dahanu', 'Dalupura', 'Dam Dam', 'Damoh', 'Dandeli', 'Darbhanga', 'Darjiling', 'Datia', 'Daudnagar', 'Dausa',
        'Davangere', 'Deesa', 'Deglur', 'Dehradun', 'Delhi', 'Delhi Cantonment', 'Deoband', 'Deoghar', 'Deolali', 'Deoli',
        'Deoria', 'Devakottai', 'Dewas', 'Dhamtari', 'Dhanbad', 'Dhar', 'Dharapuram', 'Dharashiv', 'Dharavi', 'Dharmapuri',
        'Dharmavaram', 'Dhaulpur', 'Dhenkanal', 'Dholka', 'Dhone', 'Dhoraji', 'Dhrangadhra', 'Dhubri', 'Dhule', 'Dhulian',
        'Dhuri', 'Dibrugarh', 'Didwana', 'Dimapur', 'Dinapore', 'Dinapur Nizamat', 'Dindigul', 'Diphu', 'Doddaballapura', 'Dohad',
        'Dombivali', 'Dumraon', 'Durg', 'Durgapur', 'Edattala', 'Electronic City Phase I', 'Eluru', 'Emmiganur', 'Erode', 'Etah',
        'Etawa', 'Etawah', 'Faridabad', 'Faridkot', 'Faridpur', 'Farrukhabad', 'Fatehabad', 'Fatehpur', 'Fatwa', 'Fazilka',
        'Firozabad', 'Firozpur', 'Forbesganj', 'Fyzabad', 'Gadag', 'Gadag-Betageri', 'Gaddi Annaram', 'Gadwal', 'Gajraula', 'Gajuwaka',
        'Gandhidham', 'Gandhinagar', 'Gangapur', 'Gangarampur', 'Gangavati', 'Gangoh', 'Gangtok', 'Garhchiroli', 'Gaya', 'Gharroli',
        'Ghatal', 'Ghaziabad', 'Ghazipur', 'Giridih', 'Goalpara', 'Gobichettipalayam', 'Gobindgarh', 'Godhra', 'Gohad', 'Gohana',
        'Gokak', 'Gokalpur', 'Gola Gokarannath', 'Gonda City', 'Gondal', 'Gondia', 'Gopalganj', 'Gorakhpur', 'Goyerkata', 'Greater Noida',
        'Gudivada', 'Gudiyatham', 'Gudur', 'Gumla', 'Guna', 'Gundupalaiyam', 'Guntakal', 'Guntur', 'Gurdaspur', 'Gurugram',
        'Guwahati', 'Gwalior', 'Gyanpur', 'Habra', 'Hajipur', 'Haldia', 'Haldwani', 'Halisahar', 'Halol', 'Hansi',
        'Hanumangarh', 'Hapur', 'Harda', 'Hardoi', 'Haridwar', 'Harihar', 'Hasanpur', 'Hashtsal', 'Hassan', 'Hathras',
        'Haveri', 'Hazaribagh', 'Hilsa', 'Himatnagar', 'Hindaun', 'Hindupur', 'Hinganghat', 'Hingoli', 'Hiriyur', 'Hisar',
        'Hodal', 'Hosapete', 'Hoshiarpur', 'Hoskote', 'Hosur', 'Howrah', 'Hubballi', 'Hugli', 'Hunsur', 'Hyderabad',
        'Ichalkaranji', 'Idaiyarpalaiyam', 'Idappadi', 'Ilkal', 'Imphal', 'Indore', 'Islampur', 'Itanagar', 'Itarsi', 'Jabalpur',
        'Jafarabad', 'Jagadhri', 'Jagdalpur', 'Jaggaiahpet', 'Jagraon', 'Jagtial', 'Jahanabad', 'Jahangirabad', 'Jaigaon', 'Jaipur',
        'Jaisalmer', 'Jaitpur', 'Jalandhar', 'Jalaun', 'Jalgaon', 'Jalna', 'Jalor', 'Jalpaiguri', 'Jamalpur', 'Jamkhandi',
        'Jammu', 'Jamnagar', 'Jamshedpur', 'Jamui', 'Jamuria', 'Jangaon', 'Jangipur', 'Jaora', 'Jatani', 'Jaunpur',
        'Jetpur', 'Jeypore', 'Jhalawar', 'Jhansi', 'Jhargram', 'Jharia', 'Jharsuguda', 'Jhumri Telaiya', 'Jhunjhunun', 'Jind',
        'Jodhpur', 'Jorhat', 'Junagadh', 'Kadapa', 'Kadayanallur', 'Kadi', 'Kadiri', 'Kagaznagar', 'Kairana', 'Kaithal',
        'Kakinada', 'Kalaburagi', 'Kalamassery', 'Kaliyaganj', 'Kallakurichi', 'Kalna', 'Kalol', 'Kalyan', 'Kalyani', 'Kamareddi',
        'Kamarhati', 'Kamthi', 'Kanakapura', 'Kanayannur', 'Kanchipuram', 'Kanchrapara', 'Kandi', 'Kandukur', 'Kanhangad', 'Kannauj',
        'Kannur', 'Kanpur', 'Kapas Herd', 'Kapurthala Town', 'Karad', 'Karaikal', 'Karaikkudi', 'Karanja', 'Karauli', 'Karawalnagar',
        'Karimganj', 'Karimnagar', 'Karnal', 'Karol Bagh', 'Karur', 'Karwar', 'Kasaragod', 'Kasganj', 'Kashipur', 'Kasibugga',
        'Kasipalaiyam', 'Kathua', 'Katihar', 'Katoya', 'Katras', 'Kavali', 'Kavanur', 'Kayamkulam', 'Keonjhargarh', 'Keshod',
        'Khadki', 'Khagaul', 'Khajoori Khas', 'Khambhat', 'Khamgaon', 'Khammam', 'Khanapuram Haveli', 'Khandwa', 'Khanna', 'Kharagpur',
        'Kharakvasla', 'Kharar', 'Khardah', 'Kharghar', 'Khargone', 'Khatauli', 'Khopoli', 'Khurai', 'Khurja', 'Kirari Sulemannagar',
        'Kiratpur', 'Kishanganj', 'Kishangarh', 'Koch Bihar', 'Kochi', 'Kodar', 'Kodungallur', 'Kohima', 'Kolar', 'Kolhapur',
        'Kolkata', 'Kollam', 'Kollegal', 'Konch', 'Konnagar', 'Kopargaon', 'Koppal', 'Koratla', 'Korba', 'Kosi',
        'Kota', 'Kotharia', 'Kotkapura', 'Kot Kapura', 'Kottagudem', 'Kottayam', 'Kovilpatti', 'Koyilandy', 'Kozhikode', 'Krishnagiri',
        'Krishnanagar', 'Kuchaman', 'Kukatpally', 'Kulti', 'Kumarapalayam', 'Kumbakonam', 'Kundla', 'Kuniyamuttur', 'Kunnamkulam', 'Kurichchi',
        'Kurnool', 'Kushinagar', 'Ladnun', 'Laharpur', 'Lakhimpur', 'Lal Bahadur Nagar', 'Lalitpur', 'Latur', 'Laxmangarh', 'Lohardaga',
        'Lonavla', 'Loni', 'Luckeesarai', 'Lucknow', 'Ludhiana', 'Lunglei', 'Macherla', 'Machilipatnam', 'Madanapalle', 'Madgaon',
        'Madhavaram', 'Madhepura', 'Madhubani', 'Madhupur', 'Madhurampur Dehri', 'Madhyamgram', 'Madurai', 'Maduravoyal', 'Mahasamund', 'Mahbubnagar',
        'Mahesana', 'Maheshtala', 'Mahoba', 'Mahuva', 'Mainpuri', 'Makrana', 'Malappuram', 'Malda', 'Malegaon', 'Maler Kotla',
        'Malkajgiri', 'Malkapur', 'Malout', 'Mancherial', 'Mandamarri', 'Mandapeta', 'Mandi Dabwali', 'Mandideep', 'Mandla', 'Mandoli',
        'Mandsaur', 'Mandvi', 'Mandya', 'Mangalagiri', 'Mangaluru', 'Mango', 'Mangrol', 'Manjeri', 'Manmad', 'Mannarakkat',
        'Mannargudi', 'Mansa', 'Maraimalainagar', 'Markapur', 'Masaurhi Buzurg', 'Mathura', 'Mau', 'Mawana', 'Mawlai-Mawiong', 'Mayiladuthurai',
        'Medininagar', 'Medinipur', 'Meerut', 'Metpalle', 'Mettupalayam', 'Mettur', 'Mhow', 'Miryalaguda', 'Mirzapur', 'Mithepur',
        'Modasa', 'Moga', 'Mohali', 'Mokameh', 'Molarband', 'Moonniyur', 'Moradabad', 'Morena', 'Mormugao', 'Morvi',
        'Mothihari', 'Mubarakpur', 'Mudhol', 'Mughal Sarai', 'Mukandpur', 'Muktsar', 'Mulbagal', 'Mulugu', 'Mumbai', 'Mundka',
        'Munger', 'Munnar', 'Muradnagar', 'Murwara', 'Mustafabad', 'Muzaffarnagar', 'Muzaffarpur', 'Mysuru', 'Nabha', 'Nadiad',
        'Nagaon', 'Nagapattinam', 'Nagari', 'Nagaur', 'Nagda', 'Nagercoil', 'Nagina', 'Nagpur', 'Naihati', 'Najafgarh',
        'Najibabad', 'Naksalbari', 'Nalgonda', 'Nallur', 'Namakkal', 'Nanded', 'Nandurbar', 'Nandyal', 'Nangloi Jat', 'Nanjangud',
        'Narasapur', 'Narasaraopet', 'Narela', 'Narmadapuram', 'Narnaul', 'Narsimhapur', 'Narwana', 'Nashik', 'Nasirabad', 'Navadwip',
        'Navi Mumbai', 'Navsari', 'Nawabganj', 'Nawada', 'Nawalgarh', 'Naya Gaon', 'Nedumangad', 'Neelankarai', 'Nellore', 'Nerkunram',
        'Nerupperichchal', 'New Delhi', 'Neyveli', 'Neyyattinkara', 'Nimach', 'Nimbahera', 'Nipani', 'Nirmal', 'Nithari', 'Nizamabad',
        'Noida', 'Nokha', 'North Lakhimpur', 'Nowrangapur', 'Nuzvid', 'Obra', 'Okha', 'Ongole', 'Ooty', 'Orai',
        'Ottapalam', 'Ozar', 'Pachora', 'Palakkad', 'Palakollu', 'Palani', 'Palanpur', 'Palasa', 'Palghar', 'Pali',
        'Palitana', 'Pallavaram', 'Pallichal', 'Palmaner', 'Paloncha', 'Palwal', 'Palwancha', 'Pammal', 'Panchkula', 'Pandharpur',
        'Panihati', 'Panipat', 'Panipat Taraf Makhdum Zadgan', 'Panjim', 'Panna', 'Panruti', 'Panvel', 'Paradip Garh', 'Paralakhemundi', 'Paramagudi',
        'Parbhani', 'Parli Vaijnath', 'Parvatipuram', 'Patan', 'Pathankot', 'Patiala', 'Patna', 'Pattukkottai', 'Payyanur', 'Peranampattu',
        'Periya Semur', 'Petlad', 'Phagwara', 'Phaltan', 'Phulwari Sharif', 'Phusro', 'Piduguralla', 'Pilibhit', 'Pilkhua', 'Pimpri',
        'Pimpri-Chinchwad', 'Pithampur', 'Pithapuram', 'Pollachi', 'Ponnani', 'Ponnur', 'Ponnuru', 'Poonamalle', 'Porbandar', 'Port Blair',
        'Prayagraj', 'Proddatur', 'Puducherry', 'Pudukkottai', 'Pulivendla', 'Puliyankudi', 'Pul Pehlad', 'Punasa', 'Pune', 'Punganuru',
        'Puri', 'Purnia', 'Puruliya', 'Pusad', 'Puth Kalan', 'Puttur', 'Quthbullapur', 'Rabkavi', 'Rabkavi-Banhatti', 'Raebareli',
        'Raghogarh', 'Raichur', 'Raiganj', 'Raigarh', 'Raipur', 'Rajamahendravaram', 'Rajapalayam', 'Rajgangpur', 'Rajgarh', 'Rajkot',
        'Raj-Nandgaon', 'Rajpura', 'Rajpur Sonarpur', 'Rajsamand', 'Ramagundam', 'Ramanathapuram', 'Ramapuram', 'Ramgarh', 'Ramgundam', 'Ramnagar',
        'Rampur', 'Rampura Phul', 'Rampur Hat', 'Ranaghat', 'Ranchi', 'Ranebennur', 'Raniganj', 'Ranipet', 'Rasapudipalem', 'Rasipuram',
        'Ratangarh', 'Rath', 'Ratlam', 'Ratnagiri', 'Raurkela Industrial Township', 'Raxaul', 'Rayachoti', 'Rayadrug', 'Rayagada', 'Razampeta',
        'Renukut', 'Repalle', 'Rewa', 'Rewari', 'Rishikesh', 'Rishra', 'Robertsonpet', 'Roha', 'Rohini', 'Rohtak',
        'Roorkee', 'Ropar', 'Roshanpura', 'Rourkela', 'Rudrapur', 'Sadatpur Gujran', 'Sagar', 'Saharanpur', 'Saharsa', 'Sahaswan',
        'Sahibabad Daulotpur', 'Sahibganj', 'Salem', 'Salur', 'Samalkot', 'Samana', 'Samastipur', 'Sambalpur', 'Sambhal', 'Sanand',
        'Sandila', 'Sangamner', 'Sangareddi', 'Sangli', 'Sangrur', 'Sankarankovil', 'Sardarshahr', 'Sarni', 'Sasaram', 'Satara',
        'Satna', 'Sattenapalle', 'Saugor', 'Saunda', 'Savarkundla', 'Sawai Madhopur', 'Secunderabad', 'Sehore', 'Sendhwa', 'Seoni',
        'Serilingampalle', 'Shahabad', 'Shahada', 'Shahdol', 'Shahjanpur', 'Shahpur', 'Shahuwadi', 'Shajapur', 'Shamli', 'Shantipur',
        'Shegaon', 'Sheikhpura', 'Shella', 'Sheopur', 'Sherkot', 'Shikohabad', 'Shillong', 'Shimla', 'Shirpur', 'Shivaji Nagar',
        'Shivamogga', 'Shivpuri', 'Sholapur', 'Shorapur', 'Shrirampur', 'Shujalpur', 'Shyamnagar', 'Sibsagar', 'Siddhapur', 'Siddipet',
        'Sidhi', 'Sidlaghatta', 'Sihor', 'Sikandarabad', 'Sikar', 'Silchar', 'Siliguri', 'Sillod', 'Silvassa', 'Sindhnur',
        'Singrauli', 'Sinnar', 'Sira', 'Sirhind', 'Sironj', 'Sirsa', 'Sirsi', 'Sirsilla', 'Siruguppa', 'Sitamarhi',
        'Sitapur', 'Siuri', 'Sivakasi', 'Siwan', 'Sonipat', 'Sopur', 'Soyibug', 'Sri Dungargarh', 'Sri Ganganagar', 'Srikakulam',
        'Srikalahasti', 'Srinagar', 'Srivilliputhur', 'Sujangarh', 'Sultanganj', 'Sultanpur', 'Sultan Pur Majra', 'Sunabeda', 'Sunam', 'Supaul',
        'Surat', 'Suratgarh', 'Surendranagar', 'Suriapet', 'Tadepalle', 'Tadepalligudem', 'Tadpatri', 'Taj Pul', 'Talegaon Dabhade', 'Taliparamba',
        'Tambaram', 'Tanda', 'Tandoni', 'Tandur', 'Tanuku', 'Tarn Taran', 'Teghra', 'Tellicherry', 'Teni', 'Tennala',
        'Tezpur', 'Thane', 'Thanesar', 'Thanjavur', 'Thenali', 'Thenkasi', 'Thiruvananthapuram', 'Thiruvarur', 'Thodupuzha', 'Thoothukudi',
        'Thrissur', 'Tikamgarh', 'Tilhar', 'Tindivanam', 'Tinsukia', 'Tiptur', 'Tiruchengode', 'Tiruchirappalli', 'Tirumangalam', 'Tirunelveli',
        'Tirupati', 'Tirupattur', 'Tirupparangunram', 'Tiruppur', 'Tirur', 'Tirurangadi', 'Tiruttangal', 'Tiruvalla', 'Tiruvallur', 'Tiruvannamalai',
        'Tiruvottiyur', 'Titagarh', 'Tohana', 'Tonk', 'Tripunittura', 'Tumkur', 'Tundla', 'Tuni', 'Tura', 'Udaipur',
        'Udgir', 'Udhampur', 'Udumalaippettai', 'Udupi', 'Ujhani', 'Ujjain', 'Ulhasnagar', 'Ullagaram', 'Ullal', 'Uluberiya',
        'Umred', 'Una', 'Unjha', 'Unnao', 'Upleta', 'Uppal Kalan', 'Urun-Islampur', 'Vadodara', 'Valparai', 'Valsad',
        'Vaniyambadi', 'Vapi', 'Varanasi', 'Vasco da Gama', 'Vazhakkala', 'Vejalpur', 'Velampalaiyam', 'Vellore', 'Venkatagiri', 'Veraval',
        'Vidisha', 'Vijalpor', 'Vijayapura', 'Vijayawada', 'Vikarabad', 'Villupuram', 'Vinukonda', 'Viramgam', 'Virapandi', 'Virappanchathiram',
        'Virar', 'Viraraghavapuram', 'Virudhachalam', 'Virudunagar', 'Visakhapatnam', 'Visnagar', 'Vizianagaram', 'Vriddhachalam', 'Vrindavan', 'Wadgaon Kolhati',
        'Wani', 'Wanparti', 'Warangal', 'Wardha', 'Wari', 'Washim', 'Wokha', 'Yadgir', 'Yamuna Nagar', 'Yanam',
        'Yavatmal', 'Yelahanka', 'Zahirabad', 'Zerakpur', 'Ziauddin Pur'
    ];

    const citiesByState: Record<string, string[]> = {
        'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kurnool', 'Rajahmundry', 'Kakinada', 'Kadapa', 'Anantapur', 'Ongole', 'Vizianagaram', 'Eluru', 'Kavali', 'Nandyal', 'Chittoor', 'Hindupur', 'Machilipatnam', 'Tenali', 'Proddatur', 'Adoni', 'Anantapur', 'Chirala', 'Gudivada', 'Kadapa', 'Narasaraopet', 'Palakollu', 'Rajamahendravaram', 'Tadepalle', 'Tadepalligudem', 'Tadpatri'],
        'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Namsai', 'Bomdila', 'Roing', 'Tezu', 'Aalo', 'Ziro'],
        'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Sibsagar', 'Barpeta', 'Goalpara', 'Lakhimpur', 'Dhubri', 'Karimganj', 'North Lakhimpur'],
        'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Arrah', 'Bihar Sharif', 'Purnia', 'Begusarai', 'Katihar', 'Chhapra', 'Sasaram', 'Hajipur', 'Bettiah', 'Samastipur', 'Sitamarhi', 'Siwan', 'Munger', 'Motihari', 'Jamalpur'],
        'Chhattisgarh': ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Chirmiri', 'Dhamtari', 'Mahasamund'],
        'Goa': ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Valpoi'],
        'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi', 'Gandhidham', 'Bhuj', 'Porbandar', 'Ankleshwar', 'Bharuch', 'Patan', 'Mahesana', 'Mehsana', 'Bhavnagar'],
        'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Panchkula', 'Yamunanagar', 'Sonipat', 'Bhiwani', 'Sirsa', 'Jind', 'Thanesar', 'Kaithal', 'Rewari', 'Palwal', 'Hapur'],
        'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala', 'Kullu', 'Manali', 'Palampur', 'Baddi', 'Nahan', 'Una', 'Kangra', 'Hamirpur', 'Bilaspur'],
        'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Dumka', 'Phusro', 'Medininagar', 'Ramgarh', 'Sindri', 'Chaibasa', 'Jhumri Telaiya'],
        'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davangere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumkur', 'Raichur', 'Bidar', 'Hosapete', 'Chikmagalur', 'Udupi', 'Kolar', 'Gadag', 'Hassan', 'Mandya'],
        'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Malappuram', 'Kannur', 'Kasaragod', 'Pathanamthitta', 'Idukki', 'Wayanad', 'Ernakulam', 'Kottayam', 'Ponnani', 'Koyilandy', 'Ottapalam', 'Changanacheri'],
        'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Guna', 'Shivpuri', 'Vidisha', 'Chhindwara', 'Morena', 'Damoh'],
        'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Navi Mumbai', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Ahilyanagar', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Jalna', 'Bhusawal', 'Nanded'],
        'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Senapati', 'Ukhrul', 'Tamenglong'],
        'Meghalaya': ['Shillong', 'Tura', 'Nongstoin', 'Jowai', 'Baghmara', 'Williamnagar', 'Nongpoh', 'Resubelpara'],
        'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Lawngtlai'],
        'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Mon', 'Kiphire', 'Phek'],
        'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Brahmapur', 'Baripada', 'Jharsuguda', 'Bargarh', 'Jeypore', 'Rayagada', 'Jagatsinghpur'],
        'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Gurdaspur', 'Firozpur', 'Sangrur', 'Batala', 'Moga', 'Kapurthala', 'Fazilka', 'Khanna'],
        'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Sikar', 'Bharatpur', 'Pali', 'Bhilwara', 'Baran', 'Tonk', 'Jaisalmer', 'Hanumangarh', 'Sri Ganganagar', 'Chittorgarh', 'Beawar'],
        'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Jorethang', 'Naya Bazar'],
        'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode', 'Tiruppur', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Karur', 'Namakkal', 'Nagercoil', 'Kanchipuram', 'Tirunelveli', 'Tiruvannamalai', 'Kanyakumari', 'Cuddalore', 'Thiruvananthapuram', 'Ooty', 'Kumbakonam', 'Nellore', 'Ambattur', 'Avadi', 'Tambaram'],
        'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Siddipet', 'Miryalaguda', 'Jagtial', 'Nirmal', 'Kamareddi', 'Kothagudem'],
        'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Pratapgarh', 'Kailasahar', 'Belonia', 'Khowai', 'Teliamura'],
        'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', 'Noida', 'Meerut', 'Bareilly', 'Aligarh', 'Gorakhpur', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Ayodhya', 'Saharanpur', 'Firozabad', 'Shahjahanpur', 'Rampur', 'Modinagar', 'Hapur', 'Sitapur', 'Faizabad', 'Etawah', 'Amroha', 'Bahraich'],
        'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Pithoragarh', 'Almora', 'Nainital', 'Mussoorie'],
        'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Kharagpur', 'Malda', 'Haldia', 'Baharampur', 'Kalyani', 'Habra', 'Barasat', 'Serampore', 'Barrackpore', 'Chandannagar', 'Uluberia', 'Shantipur'],
        'Delhi': ['New Delhi', 'Delhi', 'Najafgarh', 'Rohini', 'Dwarka', 'Kalkaji', 'Janakpuri', 'Rajouri Garden', 'Lajpat Nagar', 'Karol Bagh']
    };

    const getCitiesForState = (state: string) => {
        return citiesByState[state] || allCities.filter(city => {
            // Smart filtering based on common city prefixes and patterns
            const statePatterns: Record<string, string[]> = {
                'Andhra Pradesh': ['Viz', 'Guntur', 'Kurnool', 'Anantapur', 'Nellore', 'Kadapa', 'Rajahmundry', 'Ongole', 'Chittoor', 'Eluru', 'Machilipatnam', 'Tenali', 'Proddatur'],
                'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga', 'Tumkur', 'Udupi', 'Raichur', 'Bidar', 'Hassan', 'Mandya', 'Kolar', 'Gadag', 'Chikmagalur', 'Hospet'],
                'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Erode', 'Tiruppur', 'Vellore', 'Tuticorin', 'Dindigul', 'Thanjavur', 'Karur', 'Namakkal', 'Nagercoil', 'Kanchipuram', 'Tirunelveli', 'Tiruvannamalai', 'Cuddalore', 'Ooty', 'Kumbakonam', 'Ambattur', 'Avadi', 'Tambaram'],
                'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Malappuram', 'Kannur', 'Kasaragod', 'Pathanamthitta', 'Idukki', 'Wayanad', 'Ernakulam', 'Kottayam'],
                'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Navi Mumbai', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar', 'Dhule', 'Chandrapur', 'Parbhani', 'Jalna', 'Bhusawal', 'Nanded'],
                'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi', 'Gandhidham', 'Bhuj', 'Porbandar', 'Ankleshwar', 'Bharuch', 'Patan', 'Mahesana'],
                'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Sikar', 'Bharatpur', 'Pali', 'Bhilwara', 'Baran', 'Tonk', 'Jaisalmer', 'Hanumangarh', 'Ganganagar'],
                'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Gurdaspur', 'Firozpur', 'Sangrur', 'Batala', 'Moga', 'Kapurthala'],
                'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Panchkula', 'Yamunanagar', 'Sonipat', 'Bhiwani', 'Sirsa', 'Jind'],
                'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Allahabad', 'Noida', 'Meerut', 'Bareilly', 'Aligarh', 'Gorakhpur', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Modinagar', 'Hapur', 'Ayodhya'],
                'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Arrah', 'Bihar Sharif', 'Purnia', 'Begusarai', 'Katihar', 'Chhapra'],
                'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Kharagpur', 'Malda', 'Haldia', 'Baharampur'],
                'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Brahmapur', 'Baripada'],
                'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Sibsagar', 'Barpeta'],
                'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Siddipet'],
                'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara'],
                'Chhattisgarh': ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh'],
                'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Dumka'],
                'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala', 'Kullu', 'Manali', 'Palampur', 'Baddi'],
                'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh'],
                'Goa': ['Panaji', 'Vasco', 'Margao', 'Mapusa', 'Ponda'],
                'Delhi': ['Delhi', 'New Delhi', 'Najafgarh', 'Rohini', 'Dwarka', 'Kalkaji', 'Janakpuri', 'Rajouri', 'Lajpat', 'Karol Bagh']
            };
            const patterns = statePatterns[state] || [];
            return patterns.some(pattern => city.toLowerCase().includes(pattern.toLowerCase()));
        });
    };

    const languages = ['English', 'Tamil', 'Hindi', 'Malayalam', 'Kannada', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Odia', 'Assamese'];
    const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-[family-name:var(--font-anek-latin)] py-8 px-4 md:px-8 pb-24">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors font-semibold"
                    >
                        <ChevronLeft size={20} />
                        Back to Profile
                    </button>
                    <h1 className="text-2xl font-bold text-zinc-900">Edit {formData.name || 'Your'} Profile</h1>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* Photo Section */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-zinc-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-zinc-300">
                                {formData.profilePhoto ? (
                                    <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} />
                                )}
                            </div>
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-zinc-900 text-white p-2.5 rounded-full border-4 border-white shadow-lg hover:scale-110 transition-transform active:scale-95"
                            >
                                <Camera size={18} />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handlePhotoUpload} 
                                className="hidden" 
                                accept="image/*"
                            />
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-xl font-bold text-zinc-900">Your Avatar</h2>
                            <p className="text-zinc-500 text-sm max-w-xs">
                                Choose a photo that represents you. This will be visible on your passes.
                            </p>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-8">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-3 border-b border-zinc-50 pb-6">
                            Personal Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Your name"
                                    className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Phone (Protected)</label>
                                <input
                                    type="tel"
                                    disabled
                                    value={formData.phone}
                                    className="w-full h-14 px-5 rounded-[18px] border border-zinc-100 bg-zinc-50 text-zinc-400 font-medium cursor-not-allowed"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1 flex justify-between">
                                    Email Address
                                    {formData.email && (emailVerified ? (
                                        <span className="text-green-600 flex items-center gap-1 text-[10px] font-black uppercase">
                                            <CheckCircle2 size={12} /> Verified
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 flex items-center gap-1 text-[10px] font-black uppercase">
                                            <AlertCircle size={12} /> Pending
                                        </span>
                                    ))}
                                </label>
                                <div className="flex flex-col md:flex-row gap-3">
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => handleEmailChange(e.target.value)}
                                        placeholder="Add your email"
                                        className="flex-1 h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                    />
                                    {formData.email && !emailVerified && !otpSent && (
                                        <button 
                                            type="button"
                                            onClick={handleSendOTP}
                                            disabled={verifyingEmail}
                                            className="h-14 px-8 rounded-[18px] bg-zinc-900 text-white font-bold hover:bg-black transition-all disabled:opacity-50"
                                        >
                                            Verify
                                        </button>
                                    )}
                                </div>

                                {otpSent && (
                                    <div className="mt-4 p-5 bg-zinc-50 rounded-[22px] border border-zinc-100">
                                        <div className="flex flex-col md:flex-row items-center gap-4">
                                            <input 
                                                type="text"
                                                maxLength={6}
                                                value={otp}
                                                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                                className="flex-1 h-12 px-5 text-center text-xl tracking-[0.5em] font-bold rounded-xl border border-zinc-200 outline-none focus:border-zinc-900"
                                                placeholder="OTP"
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleVerifyOTP}
                                                className="h-12 px-8 rounded-xl bg-green-600 text-white font-bold"
                                            >
                                                Confirm
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={formData.dob}
                                    onChange={e => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                                    className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Gender</label>
                                <select
                                    value={formData.gender}
                                    onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                    className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium appearance-none bg-white"
                                >
                                    <option value="">Select</option>
                                    {genders.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 space-y-8">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-3 border-b border-zinc-50 pb-6">
                            Address & Map Pin
                        </h3>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">Street / Apartment</label>
                                    <input
                                        type="text"
                                        value={formData.street}
                                        onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
                                        placeholder="Street name"
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">District / Area</label>
                                    <input
                                        type="text"
                                        value={formData.district}
                                        onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
                                        placeholder="District"
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">State</label>
                                    <select
                                        value={formData.state}
                                        onChange={e => setFormData(prev => ({ ...prev, state: e.target.value, city: '' }))}
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium appearance-none bg-white"
                                    >
                                        <option value="">Select State</option>
                                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 ml-1">City</label>
                                    <select
                                        value={formData.city}
                                        onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        disabled={!formData.state}
                                        className="w-full h-14 px-5 rounded-[18px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium appearance-none bg-white disabled:bg-zinc-50 disabled:text-zinc-400"
                                    >
                                        <option value="">{formData.state ? 'Select City' : 'Select State First'}</option>
                                        {formData.state && getCitiesForState(formData.state).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 ml-1">Residential Address</label>
                                <textarea
                                    rows={2}
                                    value={formData.address}
                                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Enter your local address"
                                    className="w-full p-5 rounded-[22px] border border-zinc-200 focus:border-zinc-900 outline-none font-medium"
                                />
                            </div>

                            <button 
                                type="button"
                                onClick={() => alert('GPS Picker placeholder')}
                                className="w-full p-5 bg-zinc-50 rounded-[22px] border border-dashed border-zinc-300 flex items-center justify-between hover:bg-zinc-100 transition-all font-bold text-zinc-600"
                            >
                                <span className="flex items-center gap-3"><MapPin size={20} className="text-zinc-400" /> Pin current location</span>
                                <span className="text-[10px] bg-zinc-200 px-2.5 py-1 rounded-full uppercase tracking-widest">Open Map</span>
                            </button>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-zinc-100 flex justify-center z-50">
                        <div className="max-w-4xl w-full flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/profile')}
                                className="flex-1 h-14 rounded-2xl font-bold bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-all"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-[2] h-14 rounded-2xl font-bold bg-zinc-900 text-white shadow-xl shadow-zinc-900/10 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
                            >
                                {saving ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                Save Profile
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function EditUserProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <EditUserProfileContent />
        </Suspense>
    );
}
