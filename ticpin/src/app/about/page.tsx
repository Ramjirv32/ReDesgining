'use client';

import React from 'react';
import { ChevronLeft, Info, Star, Compass, ShieldCheck, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const features = [
  {
    icon: <Compass className="w-6 h-6 text-[#866BFF]" />,
    title: "Discovery Made Easy",
    description: "Find the best dining spots, exclusive events, and play arenas in your city, all in one place."
  },
  {
    icon: <Star className="w-6 h-6 text-[#FFB800]" />,
    title: "Premium Experiences",
    description: "From rooftop bars to live concerts, we curate only the most premium experiences for you."
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-[#00C853]" />,
    title: "Seamless Bookings",
    description: "Book tables, tickets, or courts instantly with our secure and lightning-fast checkout."
  },
  {
    icon: <Heart className="w-6 h-6 text-[#F50057]" />,
    title: "Member Perks",
    description: "Get the Ticpin Pass for exclusive discounts, priority access, and VIP treatment."
  }
];

export default function AboutUsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-sans pb-20 overflow-y-auto" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md px-[15px] pt-6 pb-4 flex items-center gap-[10px] border-b border-[#D0D0D0]/30 shadow-sm">
        <button
          onClick={() => router.back()}
          className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center border border-[#D0D0D0] shadow-sm active:scale-90 transition-all"
        >
          <ChevronLeft size={20} className="text-black" />
        </button>
        <h1 className="text-[18px] font-semibold text-black">About Us</h1>
      </header>

      {/* Main Content */}
      <main className="pt-[100px] px-4">
        {/* Banner Section */}
        <div className="relative w-full h-[200px] rounded-[24px] overflow-hidden mb-8 shadow-xl">
           <div className="absolute inset-0 bg-gradient-to-br from-[#7B2FF7] to-[#3A1A8C]" />
           <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
             <div className="relative w-[140px] h-[40px] mb-4">
                <Image src="/ticpin-logo-black.png" alt="Ticpin Logo" fill className="object-contain brightness-0 invert" />
             </div>
             <p className="text-white/80 text-[14px] leading-relaxed max-w-xs">
               Your ultimate wingman for dining, events, and sports experiences.
             </p>
           </div>
        </div>

        {/* Story Section */}
        <section className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-[#D0D0D0]/20">
          <h2 className="text-[20px] font-bold text-black mb-4 flex items-center gap-2">
            Our Story <span className="w-2 h-2 bg-[#866BFF] rounded-full" />
          </h2>
          <p className="text-zinc-600 text-[15px] leading-relaxed mb-4">
            Founded with a vision to revolutionize how people experience their leisure time, Ticpin is your all-in-one destination for discovery and bookings.
          </p>
          <p className="text-zinc-600 text-[15px] leading-relaxed">
            Whether you're looking for a romantic rooftop dinner, a high-octane pickleball game, or the hottest concert in town, we've got you covered. We bridge the gap between choice and convenience.
          </p>
        </section>

        {/* Why Choose Us */}
        <section className="space-y-4 mb-8">
          <h2 className="text-[18px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-2">Why Ticpin?</h2>
          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-[20px] p-5 flex items-start gap-4 shadow-sm border border-[#D0D0D0]/10 hover:border-[#866BFF]/30 transition-all">
                <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-black mb-1">{feature.title}</h3>
                  <p className="text-[14px] text-zinc-500 leading-snug">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vision Section */}
        <section className="bg-black text-white rounded-[24px] p-8 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
          
          <h2 className="text-[22px] font-bold mb-4 relative z-10">Experience More.</h2>
          <p className="text-zinc-400 text-[15px] leading-relaxed relative z-10">
            "Life is about creating memories through shared experiences. We're here to make sure those experiences are nothing short of extraordinary."
          </p>
        </section>
        
        <div className="text-center py-10">
          <p className="text-zinc-400 text-[13px]">© 2024 Ticpin. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
