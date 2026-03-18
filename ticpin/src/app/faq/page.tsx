'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, Search, MessageCircle, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

const faqs = [
  {
    category: "Dining",
    questions: [
      { q: "How do I book a table?", a: "Find your favorite restaurant, choose a date, time, and number of guests, and tap 'Book Now' to secure your table." },
      { q: "Is there a booking fee?", a: "Many restaurants offer free bookings, but some premium spots may require a small reservation fee that is often deductible from your final bill." },
      { q: "Can I cancel my reservation?", a: "Yes, you can cancel your booking directly from your profile. Please check the specific restaurant's cancellation policy for any potential charges." }
    ]
  },
  {
    category: "Events",
    questions: [
      { q: "How will I receive my tickets?", a: "Your digital tickets will be available immediately under 'Event Tickets' in your profile after successful payment." },
      { q: "Are tickets refundable?", a: "Event ticket refund policies vary by organizer. You can view the specific event's refund policy on its details page." },
      { q: "Do I need to print my ticket?", a: "No, a QR code on your phone is sufficient. Simply present your ticket at the event entrance." }
    ]
  },
  {
    category: "Play",
    questions: [
      { q: "How do I book a sports venue?", a: "Select your sport, browse available slots at nearby venues, and complete your booking in just a few taps." },
      { q: "What sports are supported?", a: "Currently, we support Pickleball, Tennis, Cricket Turf, and Football Turf bookings, with more being added soon!" },
      { q: "Can I reschedule a booking?", a: "Rescheduling is possible if the venue has available slots. Check the specific venue's policy for details." }
    ]
  },
  {
    category: "Ticpin Pass",
    questions: [
      { q: "What is the Ticpin Pass?", a: "The Ticpin Pass is our premium membership that offers exclusive discounts, priority access to high-demand events, and zero booking fees on select venues." },
      { q: "How long is it valid?", a: "Our standard pass is valid for 12 months from the date of purchase." }
    ]
  }
];

export default function FAQPage() {
  const router = useRouter();
  const [openIdx, setOpenIdx] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggle = (idx: string) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-sans pb-20 overflow-y-auto" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md px-[15px] pt-6 pb-4 flex items-center justify-between border-b border-[#D0D0D0]/30 shadow-sm">
        <div className="flex items-center gap-[10px]">
          <button
            onClick={() => router.back()}
            className="w-[31px] h-[31px] bg-white rounded-full flex items-center justify-center border border-[#D0D0D0] shadow-sm active:scale-90 transition-all font-semibold"
          >
            <ChevronLeft size={20} className="text-black" />
          </button>
          <h1 className="text-[18px] font-semibold text-black">FAQ</h1>
        </div>
        
        <button 
          onClick={() => router.push('/chat-with-us')}
          className="w-[31px] h-[31px] bg-black rounded-full flex items-center justify-center border border-black shadow-sm active:scale-90 transition-all"
        >
          <MessageCircle size={16} className="text-white" />
        </button>
      </header>

      {/* Hero Section */}
      <section className="pt-[110px] pb-10 px-4 bg-gradient-to-b from-white to-[#F1F1F1]">
        <h2 className="text-[28px] font-bold text-black mb-6 text-center leading-tight">
          How can we help?
        </h2>
        
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-4 group transition-all">
          <div className="absolute inset-x-0 bottom-0 h-[50px] bg-black/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative h-[56px] bg-white rounded-full border border-black/10 shadow-sm flex items-center px-6 gap-3 group-focus-within:border-black transition-all">
            <Search size={20} className="text-zinc-400 group-focus-within:text-black transition-colors" />
            <input 
              type="text" 
              placeholder="Search for questions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[16px] text-black font-medium placeholder:font-normal placeholder:text-zinc-400"
            />
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <main className="px-4 space-y-8 pb-[100px]">
        {faqs.map((group, groupIdx) => {
          const filteredQuestions = group.questions.filter(q => 
            q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
            q.a.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          if (filteredQuestions.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-[14px] font-bold text-zinc-400 uppercase tracking-widest pl-2">
                {group.category}
              </h3>
              <div className="bg-white rounded-[24px] overflow-hidden border border-[#D0D0D0]/20 shadow-sm">
                {filteredQuestions.map((faq, faqIdx) => {
                  const id = `${groupIdx}-${faqIdx}`;
                  const isOpen = openIdx === id;
                  return (
                    <div key={faqIdx} className="border-b border-[#F1F1F1] last:border-none">
                      <button 
                        onClick={() => toggle(id)}
                        className="w-full flex items-center justify-between p-5 text-left active:bg-zinc-50 transition-colors"
                      >
                        <span className="text-[16px] font-bold text-black leading-snug">
                          {faq.q}
                        </span>
                        <div className={`p-1 rounded-full bg-zinc-50 border border-zinc-100 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                             <ChevronDown size={14} className="text-zinc-400" />
                        </div>
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                         <div className="p-5 pt-0 text-[15px] text-zinc-500 leading-relaxed font-medium">
                           {faq.a}
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* Still Have Questions? */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 z-40">
        <div className="bg-black rounded-full h-[70px] flex items-center justify-between px-6 shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-[#866BFF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="relative z-10 flex flex-col">
              <span className="text-white font-bold text-[15px]">Still have questions?</span>
              <span className="text-zinc-400 text-[12px]">Our team is here to help</span>
           </div>
           <button 
              onClick={() => router.push('/chat-with-us')}
              className="relative z-10 h-10 px-5 bg-white rounded-full text-black font-bold text-[14px] flex items-center gap-2 active:scale-95 transition-all shadow-md"
            >
             Chat with us
           </button>
        </div>
      </footer>
    </div>
  );
}
