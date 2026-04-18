'use client';

import VenueCard from '@/components/play/VenueCard';
import FilterBar from '@/components/play/FilterBar';
import BottomBanner from '@/components/layout/BottomBanner';
import Footer from '@/components/layout/Footer';


const cricketVenues = Array(8).fill({
    name: 'Name',
    location: 'Location',
    image: '/play/m.png'
});

const filters = ['Top rated'];

export default function CricketPage() {
    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-anek-latin)]">
            <main className="space-y-12 md:space-y-20">

                {/* Hero Banner Section */}
                <section className="relative w-full h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden"
                    style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F5E6A3 100%)' }}>
                    <div className="flex items-center gap-8 md:gap-12 px-4">
                        <div className="relative">
                            <img
                                src="/play/playck.png"
                                alt="Cricket"
                                className="w-[280px] md:w-[280px] h-auto object-contain drop-shadow-xl"
                            />
                        </div>
                        <div className="h-[60px] md:h-[100px] w-[2px] bg-black/20" />
                        <h1 className="text-4xl md:text-7xl font-semibold text-black">
                            CRICKET
                        </h1>
                    </div>
                </section>

                <div className="mx-auto max-w-[1440px] px-4 md:px-10 lg:px-16 space-y-12 md:space-y-16 pb-12 md:pb-20">
                    {/* Filters Section */}
                    <div className="flex items-center gap-4">
                        <FilterBar filters={filters} />
                    </div>

                    {/* All Venues Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto">
                        {cricketVenues.map((venue, i) => (
                            <VenueCard
                                key={i}
                                name={venue.name}
                                location={venue.location}
                                image={venue.image}
                            />
                        ))}
                    </div>
                </div>
            </main>

            <BottomBanner />
            <Footer />
        </div>
    );
}
