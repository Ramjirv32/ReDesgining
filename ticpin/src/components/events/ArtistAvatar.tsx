import Link from 'next/link';

interface ArtistAvatarProps {
  id?: string;
  name: string;
  image?: string;
}

export default function ArtistAvatar({ id, name, image }: ArtistAvatarProps) {
  // Use id if available, otherwise name (slugified)
  const artistId = id || encodeURIComponent(name);

  return (
    <Link href={`/events/artist/${artistId}`} className="block" onClick={() => window.scrollTo(0, 0)}>
      <div className="flex-shrink-0 flex flex-col items-center gap-2 sm:gap-3 snap-start cursor-pointer hover:opacity-80 transition-opacity">
        <div className="w-[90px] h-[90px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px] lg:w-[170px] lg:h-[170px] xl:w-[190px] xl:h-[190px] rounded-full overflow-hidden bg-[#f3f0fd] flex items-center justify-center">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover object-center" />
          ) : (
            <span className="text-4xl font-bold text-[#7B2FF7] opacity-40 uppercase select-none">
              {name.charAt(0)}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-700 font-medium text-center">{name}</p>
      </div>
    </Link>
  );
}
