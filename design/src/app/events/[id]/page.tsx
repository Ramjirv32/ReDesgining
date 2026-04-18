'use client';

import { useState, useEffect } from 'react';
import Footer from '@/components/layout/Footer';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Share2, MapPin, Calendar, Clock, Star, HelpCircle, ChevronDown, ChevronRight, CheckCircle2, Search, Timer, Ticket } from 'lucide-react';
import MobileEventDetails from '@/components/MobileEventDetails';
import { events } from '@/data/mockData';

export default function EventDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const event = events.find(e => String(e.id) === id) || events[0];

    const galleryImages = [
        '/events/events-1/ticpinbanner.jpg',
        '/events/events-1/ticpinbanner.jpg',
        '/events/events-1/ticpinbanner.jpg',
        '/events/events-1/ticpinbanner.jpg',
    ];

    if (isMobile) {
        return <MobileEventDetails event={event} />;
    }

    return (
        <div className="min-h-screen font-[family-name:var(--font-anek-latin)]" style={{ background: 'linear-gradient(180deg, #ECE8FD 0%, #FFFFFF 100%)' }}>

            <main className="max-w-[1440px] mx-auto px-4 md:px-14 py-8 space-y-12">

                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-12">
                        {/* Banner */}
                        <div className="relative w-full h-[350px] md:h-[500px] rounded-[30px] overflow-hidden shadow-sm">
                            <img
                                src="/events/events-1/ticpinbanner.jpg"
                                className="absolute inset-0 w-full h-full object-cover"
                                alt="Event Banner"
                            />
                            <div className="absolute inset-0 bg-black/10 transition-opacity hover:opacity-0" />
                        </div>

                        {/* About Section */}
                        <section className="space-y-4">
                            <h2 className="text-3xl font-semibold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>About the Event</h2>
                            <div className="relative">
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-[10px]">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} className="text-[26px] font-semibold text-[#686868] leading-[29px]" style={{ fontFamily: 'var(--font-anek-latin)' }}>CONTENT</div>
                                    ))}
                                </div>
                                <button className="flex items-center gap-1 mt-4 text-black font-bold" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    Show more <ChevronDown className="transition-transform" size={16} />
                                </button>
                            </div>
                        </section>

                        <div className="w-full h-[1px] bg-[#686868]/30" />

                        {/* Overview Section */}
                        <section className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-semibold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Event Overview</h2>
                                <button className="text-[16px] font-semibold text-black flex items-center gap-2" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                    <span>See all</span>
                                    <ChevronRight className="w-[15px] h-[15px]" strokeWidth={2} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-[56px] h-[56px] bg-[#FFFBFB] rounded-[15px] shadow-sm flex items-center justify-center border border-[#AEAEAE]/10">
                                        <div className="w-[18px] h-[18px] border-2 border-black rounded-full" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Language</span>
                                        <span className="text-[20px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>{`{ DETAILS }`}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5">
                                    <div className="w-[56px] h-[56px] bg-[#FFFBFB] rounded-[15px] shadow-sm flex items-center justify-center border border-[#AEAEAE]/10">
                                        <Timer className="w-[21px] h-[25px] text-[#686868]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Duration</span>
                                        <span className="text-[20px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>{`{ DETAILS }`}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5">
                                    <div className="w-[56px] h-[56px] bg-[#FFFBFB] rounded-[15px] shadow-sm flex items-center justify-center border border-[#AEAEAE]/10">
                                        <Ticket className="w-[24px] h-[24px] text-[#686868]" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-medium text-[#686868]" style={{ fontFamily: 'var(--font-anek-latin)' }}>Tickets Needed For</span>
                                        <span className="text-[20px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>{`{ DETAILS }`}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Artist Section */}
                        <section className="space-y-6">
                            <h2 className="text-3xl font-semibold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Artist</h2>
                            <div className="flex items-center gap-10">
                                <div className="w-[169px] h-[169px] bg-white rounded-[15px] shadow-sm border border-[#AEAEAE]/20" />
                                <span className="text-[24px] font-medium text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>{`{ ARTIST NAME }`}</span>
                            </div>
                        </section>

                        {/* Gallery Section */}
                        <section className="space-y-6">
                            <h2 className="text-3xl font-semibold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Gallery</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {galleryImages.map((src, i) => (
                                    <div key={i} className="aspect-square rounded-[20px] overflow-hidden border border-zinc-200 shadow-sm">
                                        <img src={src} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                                    </div>
                                ))}
                            </div>
                            {/* Banner below gallery */}
                            <div className="relative w-full h-[300px] md:h-[450px] rounded-[30px] overflow-hidden shadow-sm mt-8">
                                <img src="/events/events-1/ticpinbanner.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Gallery Banner" />
                            </div>
                        </section>

                        {/* Venue Section */}
                        <section className="space-y-6">
                            <h2 className="text-3xl font-semibold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Venue</h2>
                            <div className="p-6 bg-white rounded-[20px] border border-[#AEAEAE]/30 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-xl text-[#686868] font-medium" style={{ fontFamily: 'var(--font-anek-latin)' }}>{`{ Venue Name }`}</h4>
                                    <p className="text-xl text-[#686868] font-medium" style={{ fontFamily: 'var(--font-anek-latin)' }}>{`{ Venue Address }`}</p>
                                </div>
                                <button
                                    className="flex items-center gap-1.5 px-4 py-2 bg-transparent border border-zinc-300 rounded-[10px] text-black uppercase tracking-tight hover:bg-zinc-50 transition-colors"
                                    style={{
                                        fontFamily: 'var(--font-anek-tamil)',
                                        fontWeight: 500,
                                        fontSize: '18px'
                                    }}
                                >
                                    <MapPin size={18} strokeWidth={1.5} /> GET DIRECTIONS
                                </button>
                            </div>
                        </section>

                        {/* FAQ and Terms */}
                        <div className="space-y-4">
                            <div className="p-6 bg-white border border-[#AEAEAE]/30 rounded-[20px] flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-colors">
                                <span className="text-xl font-semibold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Frequently Asked Questions</span>
                                <ChevronDown className="w-5 h-5 text-[#686868]" />
                            </div>
                            <div className="p-6 bg-white border border-[#AEAEAE]/30 rounded-[20px] flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-colors">
                                <span className="text-xl font-semibold text-black" style={{ fontFamily: 'var(--font-anek-latin)' }}>Event Terms & Conditions</span>
                                <ChevronDown className="w-5 h-5 text-[#686868]" />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Booking Card */}
                    <div className="w-full lg:w-[400px]">
                        <div className="lg:sticky lg:top-32 space-y-6">
                            <div className="bg-white border border-[#AEAEAE]/30 rounded-[20px] overflow-hidden shadow-sm">
                                <div className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <h1 className="text-3xl font-semibold text-black leading-tight" style={{ fontFamily: 'var(--font-anek-latin)' }}>Event Name</h1>
                                        <div className="space-y-2">
                                            <p className="text-xl text-[#686868] font-medium" style={{ fontFamily: 'var(--font-anek-latin)' }}>Category</p>
                                            <p className="text-xl text-[#686868] font-medium" style={{ fontFamily: 'var(--font-anek-latin)' }}>Date / Time</p>
                                            <p className="text-xl text-[#686868] font-medium" style={{ fontFamily: 'var(--font-anek-latin)' }}>Location</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[#AEAEAE]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div style={{ fontFamily: 'var(--font-anek-latin)' }}>
                                                <span className="text-xs font-medium text-[#686868] tracking-wide uppercase">Starts from</span>
                                                <span className="text-2xl font-bold text-black block">₹7,999</span>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/events/${id}/book`)}
                                                className="w-[160px] h-[46px] bg-black text-white rounded-[10px] flex items-center justify-center active:scale-[0.98] transition-all"
                                            >
                                                <span
                                                    style={{
                                                        fontFamily: "var(--font-anek-tamil)",
                                                        fontWeight: 600,
                                                        lineHeight: 1
                                                    }}
                                                    className="text-[16px] tracking-wider uppercase"
                                                >
                                                    BOOK TICKETS
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


            </main>

            {/* Custom Footer as per CSS */}
            <footer className="w-full h-[410px] bg-[#2A2A2A] relative overflow-hidden text-white px-[80px] pt-[136px]">
                <div className="flex justify-between">
                    <div>
                        <img src="/ticpin-logo-black.png" alt="TICPIN" className="h-[40px] w-auto brightness-0 invert" />
                    </div>
                    <div className="flex gap-[40px] text-[16px] font-semibold" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        <a href="#" className="hover:text-purple-300">Terms & Conditions</a>
                        <a href="#" className="hover:text-purple-300">Privacy Policy</a>
                        <a href="#" className="hover:text-purple-300">Contact Us</a>
                        <a href="#" className="hover:text-purple-300">List your events</a>
                    </div>
                    <div className="w-[110px] h-[110px] bg-[#D9D9D9] rounded-[15px] flex items-center justify-center">
                        <span className="text-black text-[36px] font-semibold">QR</span>
                    </div>
                </div>

                <div className="absolute bottom-[20px] left-[80px] right-[80px]">
                    <div className="w-full h-[1px] bg-white mb-[20px]" />
                    <div className="flex justify-between items-center text-[#686868] text-[16px] font-medium" style={{ fontFamily: 'var(--font-anek-latin)' }}>
                        <p className="max-w-[900px]">
                            By accessing this page, you confirm that you have read, understood, and agreed to our Terms of Service, Cookie Policy, Privacy Policy, and Content Guidelines. All rights reserved.
                        </p>
                        <div className="flex gap-4">
                            {/* Social icons would go here */}
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer">
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                    <Share2 className="w-4 h-4 text-black" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}