'use client';

import { X, Search, Loader2, MapPin } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const API_KEY = "AIzaSyA0OeH_8hQ9aHlPMuiD45wtYNLGmwhLJFg";

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (locationData: any) => void;
}

const ICONS: Record<string, string> = {
    mumbai: "M10 50h30v-10h-30z M7 40h36 M20 40v-10 M30 40v-10 M15 30h20 M12 30l3-5 M38 30l-3-5 M15 25h20 M18 25v-5 M32 25v-5 M20 20h10",
    delhi: "M10 50h30 M15 50v-15 M35 50v-15 M15 35c0-10 20-10 20 0 M20 35v-5 M30 35v-5 M22 50v-5 M28 50v-5",
    bengaluru: "M5 50h40 M10 50v-20 M40 50v-20 M10 30h30 M15 30v-15 M35 30v-15 M15 15h20 M12 30l4-5 M38 30l-4-5",
    hyderabad: "M10 50h30 M15 50v-30 M35 50v-30 M15 20c0-5 5-5 5 0 M35 20c0-5-5-5-5 0 M20 50v-15 M30 50v-15 M20 35h10",
    ahmedabad: "M10 50h30 M20 50v-20 M30 50v-20 M15 30c5-10 15-10 20 0 M25 30v-10",
    chennai: "M10 50h30 M15 50l5-30 M35 50l-5-30 M20 20h10 M22 20v-5 M28 20v-5 M24 15h2",
    kolkata: "M5 50h40 M10 50l5-15 M40 50l-5-15 M15 35h20 M20 35c0-5 10-5 10 0 M25 35v-10",
    pune: "M10 50h30 M12 50v-15 M38 50v-15 M12 35l5-5h16l5 5 M22 30v-5 M28 30v-5",
    jaipur: "M10 50h30 M15 50v-10 M35 50v-10 M20 40v-10 M30 40v-10 M15 30c5-5 15-5 20 0",
    goa: "M10 50c0-10 5-15 10-15 M10 50c0-11 10-16 15-10 M10 50c5-11 15-11 20-5 M35 50v-10 M35 40c5 0 5-5 0-5 M35 40c-5 0-5-5 0-5",
    lucknow: "M10 50h30 M15 50v-20 M35 50v-20 M15 30c0-10 20-10 20 0 M20 35h10 M25 30v-5",
    chandigarh: "M10 50h30 M25 50v-30 M25 20l5 5 M25 20l-5 5 M20 25c-5 0-10 5-10 10",
};

const popularCities = [
    { name: "Ahmedabad", icon: 'ahmedabad' },
    { name: "Bengaluru", icon: 'bengaluru' },
    { name: "Chandigarh", icon: 'chandigarh' },
    { name: "Chennai", icon: 'chennai' },
    { name: "Delhi NCR", icon: 'delhi' },
    { name: "Goa", icon: 'goa' },
    { name: "Hyderabad", icon: 'hyderabad' },
    { name: "Jaipur", icon: 'jaipur' },
    { name: "Kochi", icon: 'kolkata' },
    { name: "Kolkata", icon: 'kolkata' },
    { name: "Mumbai", icon: 'mumbai' },
    { name: "Pune", icon: 'pune' }
];

const ALL_CITIES = [
    "Abohar", "Abu Road", "Achalpur", "Adilabad", "Adoni", "Agartala", "Agra", "Ahilyanagar", "Ahmedabad", "Airoli", "Aizawl", "Ajmer", "Akola", "Akot", "Alandur", "Alappuzha", "Aligarh", "Alipur Duar", "Allinagaram", "Alwar", "Amalapuram", "Amalner", "Amaravati", "Ambajogai", "Ambala", "Ambala Sadar", "Ambarnath", "Ambattur", "Ambikapur", "Ambur", "Amravati", "Amreli", "Amritsar", "Amroha", "Amur", "Anaiyur", "Anakapalle", "Anand", "Anantapur", "Anantapur", "Anantnag", "Anjangaon", "Anjar", "Ankleshwar", "Aonla", "Arakkonam", "Arambagh", "Araria", "Arcot", "Arni", "Arrah", "Arsikere", "Aruppukkottai", "Arwal", "Asansol", "Ashoknagar", "Ashoknagar Kalyangarh", "Ashta", "Attili", "Attur", "Auraiya", "Aurangabad", "Avadi", "Avaniyapuram", "Ayodhya", "Azamgarh", "Bada Barabil", "Badagara", "Badlapur", "Badvel", "Bagaha", "Bagalkot", "Bagbera", "Bahadurgarh", "Baharampur", "Baheri", "Bahraigh", "Baidyabati", "Balaghat", "Balangir", "Balasore", "Bali", "Ballari", "Ballarpur", "Balotra", "Balrampur", "Balurghat", "Banda", "Bangaon", "Bangarda Chhota", "Bankra", "Bankura", "Bansbaria", "Banswara", "Bapatla", "Baprola", "Barakpur", "Baramati", "Baramula", "Baran", "Baranagar", "Barasat", "Barauni", "Baraut", "Barbil", "Barddhaman", "Bardoli", "Bareilly", "Bargarh", "Barh", "Bari", "Baripada", "Barmer", "Barnala", "Baruipur", "Baruni", "Barwani", "Basavakalyan", "Basirhat City", "Basmat", "Basoda", "Basti", "Batala", "Bathinda", "Bawana", "Beawar", "Beed", "Begumpur", "Begusarai", "Bela", "Belagavi", "Bellampalli", "Bengaluru", "Benipur", "Bettiah", "Betul", "Beypore", "Bhabhua", "Bhadohi", "Bhadrachalam", "Bhadrak", "Bhadravati", "Bhadreswar", "Bhagalpur", "Bhalswa Jahangirpur", "Bhandara", "Bharatpur", "Bharuch", "Bhatapara", "Bhatpara", "Bhavnagar", "Bhawanipatna", "Bhayandar", "Bhetia", "Bhilai", "Bhilai Charoda", "Bhilwara", "Bhimavaram", "Bhimunipatnam", "Bhind", "Bhiwadi", "Bhiwandi", "Bhiwani", "Bhongir", "Bhopal", "Bhubaneswar", "Bhuj", "Bhusawal", "Bidar", "Bihar Sharif", "Bihat", "Bijnor", "Bikaner", "Bilaspur", "Bilimora", "Bina", "Birgaon", "Bisalpur", "Bishnupur", "Biswan", "Bobbili", "Bodhan", "Bodinayakkanur", "Bokaro", "Bolpur", "Bongaigaon", "Borivli", "Borsad", "Botad", "Brahmapur", "Brajarajnagar", "Budaun", "Budge Budge", "Bulandshahr", "Buldana", "Bundi", "Burari", "Burhanpur", "Buxar", "Byasanagar", "Chaibasa", "Chakradharpur", "Chalisgaon", "Challakere", "Chamrajnagar", "Chanda", "Chandannagar", "Chandigarh", "Chandpur", "Chanduasi", "Changanacheri", "Channapatna", "Chapra", "Charkhi Dadri", "Chas", "Chaumu", "Chengalpattu", "Chennai", "Cheruvannur", "Chhatarpur", "Chhibramau", "Chhindwara", "Chidambaram", "Chik Ballapur", "Chikhli", "Chikmagalur", "Chilakalurupet", "Chilla Soroda Bangar", "Chinnachowk", "Chintamani", "Chiplun", "Chirala", "Chirmiri", "Chitradurga", "Chittoor", "Chittorgarh", "Chopda", "Choudwar", "Churu", "Closepet", "Coimbatore", "Contai", "Cuddalore", "Cumbum", "Cuttack", "Dabhel", "Dabhoi", "Dabra", "Dabwali", "Dadri", "Dahanu", "Dalupura", "Dam Dam", "Damoh", "Dandeli", "Darbhanga", "Darjiling", "Datia", "Daudnagar", "Dausa", "Davangere", "Deesa", "Deglur", "Dehradun", "Delhi", "Delhi Cantonment", "Deoband", "Deoghar", "Deolali", "Deoli", "Deoria", "Devakottai", "Dewas", "Dhamtari", "Dhanbad", "Dhar", "Dharapuram", "Dharashiv", "Dharavi", "Dharmapuri", "Dharmavaram", "Dhaulpur", "Dhenkanal", "Dholka", "Dhone", "Dhoraji", "Dhrangadhra", "Dhubri", "Dhule", "Dhulian", "Dhuri", "Dibrugarh", "Didwana", "Dimapur", "Dinapore", "Dinapur Nizamat", "Dindigul", "Diphu", "Doddaballapura", "Dohad", "Dombivali", "Dumraon", "Durg", "Durgapur", "Edattala", "Electronic City Phase I", "Eluru", "Emmiganur", "Erode", "Etah", "Etawa", "Etawah", "Faridabad", "Faridkot", "Faridpur", "Farrukhabad", "Fatehabad", "Fatehpur", "Fatwa", "Fazilka", "Firozabad", "Firozpur", "Forbesganj", "Fyzabad", "Gadag", "Gadag-Betageri", "Gaddi Annaram", "Gadwal", "Gajraula", "Gajuwaka", "Gandhidham", "Gandhinagar", "Gangapur", "Gangarampur", "Gangavati", "Gangoh", "Gangtok", "Garhchiroli", "Gaya", "Gharroli", "Ghatal", "Ghaziabad", "Ghazipur", "Giridih", "Goalpara", "Gobichettipalayam", "Gobindgarh", "Godhra", "Gohad", "Gohana", "Gokak", "Gokalpur", "Gola Gokarannath", "Gonda City", "Gondal", "Gondia", "Gopalganj", "Gorakhpur", "Goyerkata", "Greater Noida", "Gudivada", "Gudiyatham", "Gudur", "Gumla", "Guna", "Gundupalaiyam", "Guntakal", "Guntur", "Gurdaspur", "Gurugram", "Guwahati", "Gwalior", "Gyanpur", "Habra", "Hajipur", "Haldia", "Haldwani", "Halisahar", "Halol", "Hansi", "Hanumangarh", "Hapur", "Harda", "Hardoi", "Haridwar", "Harihar", "Hasanpur", "Hashtsal", "Hassan", "Hathras", "Haveri", "Hazaribagh", "Hilsa", "Himatnagar", "Hindaun", "Hindupur", "Hinganghat", "Hingoli", "Hiriyur", "Hisar", "Hodal", "Hosapete", "Hoshiarpur", "Hoskote", "Hosur", "Howrah", "Hubballi", "Hugli", "Hunsur", "Hyderabad", "Ichalkaranji", "Idaiyarpalaiyam", "Idappadi", "Ilkal", "Imphal", "Indore", "Islampur", "Itanagar", "Itarsi", "Jabalpur", "Jafarabad", "Jagadhri", "Jagdalpur", "Jaggaiahpet", "Jagraon", "Jagtial", "Jahanabad", "Jahangirabad", "Jaigaon", "Jaipur", "Jaisalmer", "Jaitpur", "Jalandhar", "Jalaun", "Jalgaon", "Jalna", "Jalor", "Jalpaiguri", "Jamalpur", "Jamkhandi", "Jammu", "Jamnagar", "Jamshedpur", "Jamui", "Jamuria", "Jangaon", "Jangipur", "Jaora", "Jatani", "Jaunpur", "Jetpur", "Jeypore", "Jhalawar", "Jhansi", "Jhargram", "Jharia", "Jharsuguda", "Jhumri Telaiya", "Jhunjhunun", "Jind", "Jodhpur", "Jorhat", "Junagadh", "Kadapa", "Kadayanallur", "Kadi", "Kadiri", "Kagaznagar", "Kairana", "Kaithal", "Kakinada", "Kalaburagi", "Kalamassery", "Kaliyaganj", "Kallakurichi", "Kalna", "Kalol", "Kalyan", "Kalyani", "Kamareddi", "Kamarhati", "Kamthi", "Kanakapura", "Kanayannur", "Kanchipuram", "Kanchrapara", "Kandi", "Kandukur", "Kanhangad", "Kannauj", "Kannur", "Kanpur", "Kapas Herd", "Kapurthala Town", "Karad", "Karaikal", "Karaikkudi", "Karanja", "Karauli", "Karawalnagar", "Karimganj", "Karimnagar", "Karnal", "Karol Bagh", "Karur", "Karwar", "Kasaragod", "Kasganj", "Kashipur", "Kasibugga", "Kasipalaiyam", "Kathua", "Katihar", "Katoya", "Katras", "Kavali", "Kavanur", "Kayamkulam", "Keonjhargarh", "Keshod", "Khadki", "Khagaul", "Khajoori Khas", "Khambhat", "Khamgaon", "Khammam", "Khanapuram Haveli", "Khandwa", "Khanna", "Kharagpur", "Kharakvasla", "Kharar", "Khardah", "Kharghar", "Khargone", "Khatauli", "Khopoli", "Khurai", "Khurja", "Kirari Sulemannagar", "Kiratpur", "Kishanganj", "Kishangarh", "Koch Bihar", "Kochi", "Kodar", "Kodungallur", "Kohima", "Kolar", "Kolhapur", "Kolkata", "Kollam", "Kollegal", "Konch", "Konnagar", "Kopargaon", "Koppal", "Koratla", "Korba", "Kosi", "Kota", "Kotharia", "Kotkapura", "Kot Kapura", "Kottagudem", "Kottayam", "Kovilpatti", "Koyilandy", "Kozhikode", "Krishnagiri", "Krishnanagar", "Kuchaman", "Kukatpally", "Kulti", "Kumarapalayam", "Kumbakonam", "Kundla", "Kuniyamuttur", "Kunnamkulam", "Kurichchi", "Kurnool", "Kushinagar", "Ladnun", "Laharpur", "Lakhimpur", "Lal Bahadur Nagar", "Lalitpur", "Latur", "Laxmangarh", "Lohardaga", "Lonavla", "Loni", "Luckeesarai", "Lucknow", "Ludhiana", "Lunglei", "Macherla", "Machilipatnam", "Madanapalle", "Madgaon", "Madhavaram", "Madhepura", "Madhubani", "Madhupur", "Madhurampur Dehri", "Madhyamgram", "Madurai", "Maduravoyal", "Mahasamund", "Mahbubnagar", "Mahesana", "Maheshtala", "Mahoba", "Mahuva", "Mainpuri", "Makrana", "Malappuram", "Malda", "Malegaon", "Maler Kotla", "Malkajgiri", "Malkapur", "Malout", "Mancherial", "Mandamarri", "Mandapeta", "Mandi Dabwali", "Mandideep", "Mandla", "Mandoli", "Mandsaur", "Mandvi", "Mandya", "Mangalagiri", "Mangaluru", "Mango", "Mangrol", "Manjeri", "Manjeri", "Manmad", "Mannarakkat", "Mannargudi", "Mansa", "Maraimalainagar", "Markapur", "Masaurhi Buzurg", "Mathura", "Mau", "Mawana", "Mawlai-Mawiong", "Mayiladuthurai", "Medininagar", "Medinipur", "Meerut", "Metpalle", "Mettupalayam", "Mettur", "Mhow", "Miryalaguda", "Mirzapur", "Mithepur", "Modasa", "Moga", "Mohali", "Mokameh", "Molarband", "Moonniyur", "Moradabad", "Morena", "Mormugao", "Morvi", "Mothihari", "Mubarakpur", "Mudhol", "Mughal Sarai", "Mukandpur", "Muktsar", "Mulbagal", "Mulugu", "Mumbai", "Mundka", "Munger", "Munnar", "Muradnagar", "Murwara", "Mustafabad", "Muzaffarnagar", "Muzaffarpur", "Mysuru", "Nabha", "Nadiad", "Nagaon", "Nagapattinam", "Nagari", "Nagaur", "Nagda", "Nagercoil", "Nagina", "Nagpur", "Naihati", "Najafgarh", "Najibabad", "Naksalbari", "Nalgonda", "Nallur", "Namakkal", "Nanded", "Nandurbar", "Nandyal", "Nangloi Jat", "Nanjangud", "Narasapur", "Narasaraopet", "Narela", "Narmadapuram", "Narnaul", "Narsimhapur", "Narwana", "Nashik", "Nasirabad", "Navadwip", "Navi Mumbai", "Navsari", "Nawabganj", "Nawada", "Nawalgarh", "Naya Gaon", "Nedumangad", "Neelankarai", "Nellore", "Nerkunram", "Nerupperichchal", "New Delhi", "Neyveli", "Neyyattinkara", "Nimach", "Nimbahera", "Nipani", "Nirmal", "Nithari", "Nizamabad", "Noida", "Nokha", "North Lakhimpur", "Nowrangapur", "Nuzvid", "Obra", "Okha", "Ongole", "Ooty", "Orai", "Ottapalam", "Ozar", "Pachora", "Palakkad", "Palakollu", "Palani", "Palanpur", "Palasa", "Palghar", "Pali", "Palitana", "Pallavaram", "Pallichal", "Palmaner", "Paloncha", "Palwal", "Palwancha", "Pammal", "Panchkula", "Pandharpur", "Panihati", "Panipat", "Panipat Taraf Makhdum Zadgan", "Panjim", "Panna", "Panruti", "Panvel", "Paradip Garh", "Paralakhemundi", "Paramagudi", "Parbhani", "Parli Vaijnath", "Parvatipuram", "Patan", "Pathankot", "Patiala", "Patna", "Pattukkottai", "Payyanur", "Peranampattu", "Periya Semur", "Petlad", "Phagwara", "Phaltan", "Phulwari Sharif", "Phusro", "Piduguralla", "Pilibhit", "Pilkhua", "Pimpri", "Pimpri-Chinchwad", "Pithampur", "Pithapuram", "Pollachi", "Ponnani", "Ponnur", "Ponnuru", "Poonamalle", "Porbandar", "Port Blair", "Prayagraj", "Proddatur", "Puducherry", "Pudukkottai", "Pulivendla", "Puliyankudi", "Pul Pehlad", "Punasa", "Pune", "Punganuru", "Puri", "Purnia", "Puruliya", "Pusad", "Puth Kalan", "Puttur", "Quthbullapur", "Rabkavi", "Rabkavi-Banhatti", "Raebareli", "Raghogarh", "Raichur", "Raiganj", "Raigarh", "Raipur", "Rajamahendravaram", "Rajapalayam", "Rajgangpur", "Rajgarh", "Rajkot", "Raj-Nandgaon", "Rajpura", "Rajpur Sonarpur", "Rajsamand", "Ramagundam", "Ramanathapuram", "Ramapuram", "Ramgarh", "Ramgundam", "Ramnagar", "Rampur", "Rampura Phul", "Rampur Hat", "Ranaghat", "Ranchi", "Ranebennur", "Raniganj", "Ranipet", "Rasapudipalem", "Rasipuram", "Ratangarh", "Rath", "Ratlam", "Ratnagiri", "Raurkela Industrial Township", "Raxaul", "Rayachoti", "Rayadrug", "Rayagada", "Razampeta", "Renukut", "Repalle", "Rewa", "Rewari", "Rishikesh", "Rishra", "Robertsonpet", "Roha", "Rohini", "Rohtak", "Roorkee", "Ropar", "Roshanpura", "Rourkela", "Rudrapur", "Sadatpur Gujran", "Sagar", "Saharanpur", "Saharsa", "Sahaswan", "Sahibabad Daulotpur", "Sahibganj", "Salem", "Salur", "Samalkot", "Samana", "Samastipur", "Sambalpur", "Sambhal", "Sanand", "Sandila", "Sangamner", "Sangareddi", "Sangli", "Sangrur", "Sankarankovil", "Sardarshahr", "Sarni", "Sasaram", "Satara", "Satna", "Sattenapalle", "Saugor", "Saunda", "Savarkundla", "Sawai Madhopur", "Secunderabad", "Sehore", "Sendhwa", "Seoni", "Serilingampalle", "Shahabad", "Shahada", "Shahdol", "Shahjanpur", "Shahpur", "Shahuwadi", "Shajapur", "Shamli", "Shantipur", "Shegaon", "Sheikhpura", "Shella", "Sheopur", "Sherkot", "Shikohabad", "Shillong", "Shimla", "Shirpur", "Shivaji Nagar", "Shivamogga", "Shivpuri", "Sholapur", "Shorapur", "Shrirampur", "Shujalpur", "Shyamnagar", "Sibsagar", "Siddhapur", "Siddipet", "Sidhi", "Sidlaghatta", "Sihor", "Sikandarabad", "Sikar", "Silchar", "Siliguri", "Sillod", "Silvassa", "Sindhnur", "Singrauli", "Sinnar", "Sira", "Sirhind", "Sironj", "Sirsa", "Sirsi", "Sirsilla", "Siruguppa", "Sitamarhi", "Sitapur", "Siuri", "Sivakasi", "Siwan", "Sonipat", "Sopur", "Soyibug", "Sri Dungargarh", "Sri Ganganagar", "Srikakulam", "Srikalahasti", "Srinagar", "Srivilliputhur", "Sujangarh", "Sultanganj", "Sultanpur", "Sultan Pur Majra", "Sunabeda", "Sunam", "Supaul", "Surat", "Suratgarh", "Surendranagar", "Suriapet", "Tadepalle", "Tadepalligudem", "Tadpatri", "Taj Pul", "Talegaon Dabhade", "Taliparamba", "Tambaram", "Tanda", "Tandoni", "Tandur", "Tanuku", "Tarn Taran", "Teghra", "Tellicherry", "Teni", "Tennala", "Tezpur", "Thane", "Thanesar", "Thanjavur", "Thenali", "Thenkasi", "Thiruvananthapuram", "Thiruvarur", "Thodupuzha", "Thoothukudi", "Thrissur", "Tikamgarh", "Tilhar", "Tindivanam", "Tinsukia", "Tiptur", "Tiruchengode", "Tiruchirappalli", "Tirumangalam", "Tirunelveli", "Tirupati", "Tirupattur", "Tirupparangunram", "Tiruppur", "Tirur", "Tirurangadi", "Tiruttangal", "Tiruvalla", "Tiruvallur", "Tiruvannamalai", "Tiruvottiyur", "Titagarh", "Tohana", "Tonk", "Tripunittura", "Tumkur", "Tundla", "Tuni", "Tura", "Udaipur", "Udgir", "Udhampur", "Udumalaippettai", "Udupi", "Ujhani", "Ujjain", "Ulhasnagar", "Ullagaram", "Ullal", "Uluberiya", "Umred", "Una", "Unjha", "Unnao", "Upleta", "Uppal Kalan", "Urun-Islampur", "Vadodara", "Valparai", "Valsad", "Vaniyambadi", "Vapi", "Varanasi", "Vasco da Gama", "Vazhakkala", "Vejalpur", "Velampalaiyam", "Vellore", "Venkatagiri", "Veraval", "Vidisha", "Vijalpor", "Vijayapura", "Vijayawada", "Vikarabad", "Villupuram", "Vinukonda", "Viramgam", "Virapandi", "Virappanchathiram", "Virar", "Viraraghavapuram", "Virudhachalam", "Virudunagar", "Visakhapatnam", "Visnagar", "Vizianagaram", "Vriddhachalam", "Vrindavan", "Wadgaon Kolhati", "Wani", "Wanparti", "Warangal", "Wardha", "Wari", "Washim", "Wokha", "Yadgir", "Yamuna Nagar", "Yanam", "Yavatmal", "Yelahanka", "Zahirabad", "Zerakpur", "Ziauddin Pur"
];

export default function LocationModal({ isOpen, onClose, onSelect }: LocationModalProps) {
    const [search, setSearch] = useState('');
    const [activeLetter, setActiveLetter] = useState('A');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setSearch('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    async function fetchLocationDetails(lat: number | null, lng: number | null, cityName: string | null = null) {
        setIsLoading(true);

        try {
            let url;
            if (cityName) {
                url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityName + ", India")}&key=${API_KEY}`;
            } else {
                url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (!data.results || data.results.length === 0) {
                throw new Error("No results found");
            }

            let area = "";
            let locality = "";
            let district = "";
            let state = "";

            // Loop through results to find the most specific one (usually first, but we check all components)
            for (const result of data.results) {
                const components = result.address_components;

                components.forEach((c: any) => {
                    const types = c.types;

                    if (!area && (types.includes("sublocality") || types.includes("sublocality_level_1") || types.includes("neighborhood"))) {
                        area = c.long_name;
                    }
                    if (!locality && types.includes("locality")) {
                        locality = c.long_name;
                    }
                    if (!district && types.includes("administrative_area_level_2")) {
                        district = c.long_name;
                    }
                    if (!state && types.includes("administrative_area_level_1")) {
                        state = c.long_name;
                    }
                });

                // If we found a locality, we probably have the best result
                if (locality) break;
            }

            // India-specific refinement (e.g. Tiruppur case)
            if (!locality && district) locality = district;
            if (!district && locality) district = locality;
            if (!area && locality) area = locality;

            const finalLocality = locality || (cityName || "Not found");
            const finalDistrict = district || "Not found";

            const cityLabel = locality || (district || (cityName || "Not found"));
            const label = cityLabel && state ? `${cityLabel}, ${state}` : (cityLabel || state || "Not found");
            const locationData = {
                name: area || cityLabel,
                display_name: data.results[0]?.formatted_address || label,
                district: district || "",
                state: state || ""
            };
            onSelect?.(locationData);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error fetching location details. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleSelect = (name: string) => {
        setSearch(name);
        fetchLocationDetails(null, null, name);
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => fetchLocationDetails(pos.coords.latitude, pos.coords.longitude),
            () => alert("Location access denied or unavailable."),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const filteredCities = ALL_CITIES.filter(c =>
        search
            ? c.toLowerCase().includes(search.toLowerCase())
            : c.startsWith(activeLetter)
    );

    const showSearchResults = search.trim().length > 0;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-[900px] bg-white rounded-[24px] shadow-2xl animate-in fade-in zoom-in duration-300 relative flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="p-10 pb-4 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute right-8 top-8 p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-[18px] font-semibold text-zinc-800 mb-6">Select Location</h2>

                    {/* Search */}
                    <div className="relative mb-5">
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search city, area or locality"
                            className="w-full h-[56px] px-5 border border-zinc-200 rounded-[12px] text-[16px] focus:outline-none focus:border-[#9d7fce] focus:ring-4 focus:ring-[#9d7fce]/10 transition-all"
                        />
                    </div>

                    {/* Current Location Button */}
                    <button
                        onClick={handleCurrentLocation}
                        className="flex items-center gap-2.5 text-[#9d7fce] font-semibold text-[15px] hover:opacity-80 transition-all mb-5"
                    >
                        <MapPin size={20} />
                        Use Current Location
                    </button>

                    {/* Loader */}
                    {isLoading && (
                        <div className="flex justify-start mb-5">
                            <Loader2 className="w-6 h-6 text-[#9d7fce] animate-spin" />
                            <span className="ml-2 text-zinc-500 text-sm">Detecting location...</span>
                        </div>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto px-10 pb-10 flex-1 space-y-12 [scrollbar-width:none] [::-webkit-scrollbar]:hidden">
                    {!showSearchResults ? (
                        <>
                            {/* Popular */}
                            <div>
                                <h3 className="text-[18px] font-semibold text-zinc-800 mb-5">Popular Cities</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                                    {popularCities.map(city => (
                                        <button
                                            key={city.name}
                                            onClick={() => handleSelect(city.name)}
                                            className="flex flex-col items-center justify-center p-5 bg-[#f4edf9] border border-transparent rounded-[16px] hover:bg-white hover:border-[#9d7fce] hover:shadow-lg transition-all group"
                                        >
                                            <svg className="w-[60px] h-[60px] mb-3 text-[#9d7fce]" viewBox="0 0 60 60">
                                                <path fill="none" stroke="currentColor" strokeWidth="1.5" d={ICONS[city.icon]} />
                                            </svg>
                                            <span className="text-[14px] font-semibold text-zinc-800">{city.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* All Cities Index */}
                            <div className="space-y-6">
                                <h3 className="text-[18px] font-semibold text-zinc-800">All Cities</h3>
                                <div className="flex flex-wrap gap-3">
                                    {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => (
                                        <button
                                            key={l}
                                            onClick={() => setActiveLetter(l)}
                                            className={`text-[14px] font-semibold transition-colors ${activeLetter === l ? 'text-[#9d7fce]' : 'text-zinc-300 hover:text-[#9d7fce]'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6">
                                    {filteredCities.map((city, idx) => (
                                        <button
                                            key={`${city}-${idx}`}
                                            onClick={() => handleSelect(city)}
                                            className="text-left text-[15px] font-medium text-zinc-600 hover:text-[#9d7fce] py-1.5 transition-colors"
                                        >
                                            {city}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Search Results */
                        <div>
                            <h3 className="text-[18px] font-semibold text-zinc-800 mb-5">Search Results</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6">
                                {filteredCities.length > 0 ? (
                                    filteredCities.map((city, idx) => (
                                        <button
                                            key={`${city}-${idx}`}
                                            onClick={() => handleSelect(city)}
                                            className="text-left text-[15px] font-medium text-zinc-600 hover:text-[#9d7fce] py-1.5 transition-colors"
                                        >
                                            {city}
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-full py-10 text-center text-zinc-400">No cities found for "{search}"</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
