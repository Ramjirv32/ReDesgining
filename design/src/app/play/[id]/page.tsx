'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppBanner from '@/components/layout/AppBanner';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';
import { ChevronDown, MapPin, Clock, Share2 } from 'lucide-react';

export default function PlayDetailPage() {
    const params = useParams();
    const id = params?.id ?? '';
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFFCED] via-white to-white font-[family-name:var(--font-anek-latin)]">
            <main className="max-w-[1440px] mx-auto px-4 md:px-14 py-8">
                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-12">
                        <div className="relative w-full h-[350px] md:h-[500px] rounded-[30px] overflow-hidden shadow-sm">
                            <img
                                src="/login/banner.jpeg"
                                alt="Venue Banner"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/10 transition-opacity hover:opacity-0" />
                        </div>

                        <section className="space-y-4">
                            <h2 className="text-3xl font-semibold text-black">About the Venue</h2>
                            <div className="relative">
                                <p className={`text-[#686868] text-lg font-medium leading-relaxed ${!isAboutExpanded && 'line-clamp-3'}`}>
                                    Experience the finest sports infrastructure at our venue. Whether you're a professional athlete or a weekend warrior, we provide the perfect environment for your favorite sports. Our facilities are maintained to the highest standards to ensure you have the best playing experience.
                                    CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT
                                </p>
                                <button
                                    onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                                    className="flex items-center gap-1 mt-2 text-black font-bold"
                                >
                                    Show {isAboutExpanded ? 'less' : 'more'} <ChevronDown className={`transition-transform grow-0 ${isAboutExpanded ? 'rotate-180' : ''}`} size={16} />
                                </button>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-black ">Venue Guide</h2>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#D9D9D9] rounded-[10px] flex items-center justify-center text-[#686868]">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-[#686868] font-medium uppercase tracking-wider">Duration</p>
                                    <p className="text-base font-medium text-black">{`{ TIME }`}</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-black ">Gallery</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="aspect-square rounded-[20px] overflow-hidden border border-zinc-200">
                                        <img src="/play/1.png" alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div
                            className="relative w-full h-[300px] md:h-[450px] rounded-[30px] overflow-hidden shadow-sm"
                        >
                            <img
                                src="/login/banner.jpeg"
                                alt="Promo Banner"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/5" />
                        </div>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-black">Venue</h2>
                            <div className="p-6 bg-white rounded-[20px] border border-[#686868]/30 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-xl text-[#686868] font-medium">{`{ Venue Name }`}</h4>
                                    <p className="text-xl text-[#686868] font-medium">{`{ Venue Address }`}</p>
                                </div>
                                <button className="flex items-center gap-1.5 px-4 py-2 bg-transparent border border-zinc-300 rounded-[10px] text-black font-medium uppercase tracking-tight text-[18px] hover:bg-zinc-50 transition-colors">
                                    <MapPin size={18} strokeWidth={1.5} /> GET DIRECTIONS
                                </button>
                            </div>
                        </section>

                        <div className="space-y-4">
                            <div
                                className="p-6 bg-white border border-[#686868]/30 rounded-[20px] cursor-pointer"
                                onClick={() => toggleAccordion('faq')}
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-black">Frequently Asked Questions</h3>
                                    <ChevronDown className={`transition-transform text-[#686868] ${openAccordion === 'faq' ? 'rotate-180' : ''}`} />
                                </div>
                                {openAccordion === 'faq' && (
                                    <div className="mt-4 text-[#686868] text-base font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                                        Provide answers to common questions about your venue here.
                                    </div>
                                )}
                            </div>

                            <div
                                className="p-6 bg-white border border-[#686868]/30 rounded-[20px] cursor-pointer"
                                onClick={() => toggleAccordion('terms')}
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-black">Terms & Conditions</h3>
                                    <ChevronDown className={`transition-transform text-[#686868] ${openAccordion === 'terms' ? 'rotate-180' : ''}`} />
                                </div>
                                {openAccordion === 'terms' && (
                                    <div className="mt-4 text-[#686868] text-base font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                                        Detail your rules, cancellation policies, and other terms here.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-[400px]">
                        <div className="lg:sticky lg:top-32 space-y-6">
                            <div className="bg-white border border-[#686868]/30 rounded-[20px] overflow-hidden shadow-sm">
                                <div className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-semibold text-black">Turf Name</h3>
                                        <div className="space-y-1">
                                            <p className="text-xl text-[#686868] font-medium">Play options</p>
                                            <p className="text-xl text-[#686868] font-medium mt-[15px]">Location</p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-[#686868]/20">
                                        <Link href={`/play/${id}/book`} className="block w-full">
                                            <button
                                                className="w-full h-[54px] bg-black text-white rounded-[12px] flex items-center justify-center active:scale-[0.98]"
                                            >
                                                <span
                                                    style={{
                                                        transform: 'scaleY(2)',
                                                        display: 'inline-block',
                                                        fontFamily: "var(--font-anek-tamil)",
                                                        fontWeight: 600,
                                                        lineHeight: 1
                                                    }}
                                                    className="text-[18px] tracking-wider uppercase"
                                                >
                                                    BOOK SLOTS
                                                </span>
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


            </main>
            <BottomBanner />
            <Footer />
        </div>
    );
}