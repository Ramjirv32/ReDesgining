'use client';

import { useState } from 'react';
import SportCategoryCard from '@/components/play/SportCategoryCard';
import VenueCard from '@/components/play/VenueCard';
import FilterBar from '@/components/play/FilterBar';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';

const sportsCategories = [
  { name: 'CRICKET', image: '/play/playck.png', href: '/play/cricket' },
  { name: 'FOOTBALL', image: '/play/playfb.png' },
  { name: 'PICKLEBALL', image: '/play/playpb.png' },
  { name: 'TENNIS', image: '/play/playtens.png' },
  { name: 'BADMINTON', image: '/play/playbm.png' },
  { name: 'TABLE TENNIS', image: '/play/playtt.png' },
  { name: 'BASKETBALL', image: '/play/playbb.png' },
];

const sportsVenues = Array(8).fill({
  name: 'Name',
  location: 'Location',
  image: '/play/m.png'
});

const filters = ['Top Rated', 'Cricket', 'Pickleball', 'Badminton'];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFCED] via-white to-white font-[family-name:var(--font-anek-latin)]">
      <main className="mx-auto max-w-[1440px] px-4 md:px-10 lg:px-16 py-8 md:py-12 space-y-12 md:space-y-20">

        {/* Explore Sports Section */}
        <section className="space-y-8 md:space-y-10">
          <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold mb-6 md:mb-8 uppercase text-black tracking-normal text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>Explore Sports</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 px-2 max-w-5xl">
            {sportsCategories.map((sport, i) => (
              <SportCategoryCard
                key={i}
                name={sport.name}
                image={sport.image}
                href={sport.href}
              />
            ))}
          </div>
        </section>

        {/* All Sports Venues Section */}
        <section className="space-y-8 md:space-y-10">
          <h2 className="font-[family-name:var(--font-anek-latin)] font-semibold mb-6 md:mb-8 uppercase text-black tracking-normal text-[24px] md:text-[30px]" style={{ fontWeight: 600 }}>All Sports Venues</h2>

          {/* Filters */}
          <div>
            <FilterBar
              filters={['All', ...filters]}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </div>

          {/* Venues Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl">
            {sportsVenues.map((venue, i) => (
              <VenueCard
                key={i}
                name={venue.name}
                location={venue.location}
                image={venue.image}
              />
            ))}
          </div>
        </section>

      </main>
      <BottomBanner />
      <Footer />
    </div>
  );
}
