import Link from 'next/link';
import Image from 'next/image';

const categories = [
  {
    title: 'Music',
    icon: '/events/Events 1.svg',
    color: '#A1BFFF',
    href: '/events/music',
    padding: 'p-10'
  },
  {
    title: 'Comedy',
    icon: '/events/Comedy Icon.jpg 1.svg',
    color: '#FFCA74',
    href: '/events/comedy',
    padding: 'p-6'
  },
  {
    title: 'Shows',
    icon: '/events/Performance Icon 1.svg',
    color: '#FFCECD',
    href: '/events/performance',
    padding: 'p-10'
  },
  {
    title: 'Sports',
    icon: '/events/Sports Icon 2.svg',
    color: '#FFE58A',
    href: '/events/sports',
    padding: 'p-10'
  },
  {
    title: 'Food & Drinks',
    icon: '/events/Dining 1.svg',
    color: '#8290D5',
    href: '/events/food-drinks',
    padding: 'p-10'
  },
  {
    title: 'Night Life',
    icon: '/events/Night Life Icon 1.svg',
    color: '#FAFDAA',
    href: '/events/night-life',
    padding: 'p-10'
  },
  {
    title: 'Fests & Fairs',
    icon: '/events/Fests & Fairs Icon 1.svg',
    color: '#FFC799',
    href: '/events/fests-fairs',
    padding: 'p-10'
  },
  {
    title: 'Screenings',
    icon: '/events/Projector Icon 1.svg',
    color: '#B4E9FF',
    href: '/events/screenings',
    padding: 'p-10'
  },
  {
    title: 'Fitness',
    icon: '/events/Dumbells Icon 1.svg',
    color: '#98C5FF',
    href: '/events/fitness',
    padding: 'p-10'
  },
  {
    title: 'Open Mic',
    icon: '/events/Open Mic Icon 1.svg',
    color: '#FFEF96',
    href: '/events/open-mic',
    padding: 'p-10'
  }
];

export default function ExploreCard() {
  return (
    <div className="flex flex-wrap gap-6 md:gap-8 justify-center sm:justify-start">
      {categories.map((cat, index) => (
        <Link
          key={index}
          href={cat.href}
          className="group block"
        >
          <div
            className="w-[173px] h-[232px] rounded-[30px] border border-[#E1E1E1] relative overflow-hidden flex flex-col items-center pt-6 transition-all duration-300 hover:shadow-lg"
            style={{
              background: `linear-gradient(180deg, #FFFFFF 0%, ${cat.color} 100%)`
            }}
          >
            <h3 className="text-[18px] md:text-[22px] font-medium text-black text-center z-10 px-2 leading-tight">
              {cat.title}
            </h3>
            <div className={`flex-1 w-full flex items-center justify-center ${cat.padding || 'p-10'}`}>
              <Image
                src={cat.icon}
                alt={cat.title}
                width={140}
                height={140}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
