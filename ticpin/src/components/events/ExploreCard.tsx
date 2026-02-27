import Link from 'next/link';

export default function ExploreCard() {
  const gradientStyle = {
    background: 'linear-gradient(105.73deg, #866BFF -160.73%, #BDB1F3 93.19%)'
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {/* Music Card */}
      <Link href="/events/music" className="block flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
        <div className="w-[173px] h-[232px] rounded-[30px] overflow-hidden" style={gradientStyle}>
          <h1 className="text-xl md:text-2xl font-medium text-black text-center pt-5">Music</h1>
          <div className="mt-4"></div>
          <img
            src="/events/eventsmusic.png"
            alt="Music"
            className="w-[164px] h-[183px] ml-[40px] "
          />
        </div>
      </Link>

      {/* Comedy Card */}
      <Link href="/events/comedy" className="block flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
        <div className="w-[173px] h-[232px] rounded-[30px] overflow-hidden relative" style={gradientStyle}>
          <h1 className="text-xl md:text-2xl font-medium text-black text-center pt-5 relative z-10">Comedy</h1>
          <img
            src="/events/eventcomdey.png"
            alt="Comedy"
            className="absolute bottom-[20px] right-[10px] w-[110px] h-auto object-contain"
          />
        </div>
      </Link>

      {/* Performance Card */}
      <Link href="/events/performance" className="block flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
        <div className="w-[173px] h-[232px] rounded-[30px] overflow-hidden" style={gradientStyle}>
          <h1 className="text-xl md:text-2xl font-medium text-black text-center pt-5">Performance</h1>
          <div className="mt-4"></div>
          <img
            src="/events/eventperfomance.png"
            alt="Performance"
            className="w-[179px] h-[183px] ml-[26px] mt-[30px]"
          />
        </div>
      </Link>

      {/* Sports Card */}
      <Link href="/events/sports" className="block flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
        <div className="w-[173px] h-[232px] rounded-[30px] overflow-hidden" style={gradientStyle}>
          <h1 className="text-xl md:text-2xl font-medium text-black text-center pt-5">Sports</h1>
          <div className="mt-4"></div>
          <img
            src="/events/eventssports.png"
            alt="Sports"
            className="w-[179px] h-[183px] ml-[26px]  mt-[35px]"
          />
        </div>
      </Link>
    </div>
  );
}
