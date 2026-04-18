import Link from 'next/link';

interface ArtistAvatarProps {
  id: number;
  name: string;
  image: string;
}

export default function ArtistAvatar({ id, name, image }: ArtistAvatarProps) {
  return (
    <Link href={`/events/artist/${id}`} className="flex-shrink-0 flex flex-col items-center gap-2 sm:gap-3 snap-start group cursor-pointer">
      <div
        className="w-[90px] h-[90px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px] lg:w-[170px] lg:h-[170px] xl:w-[190px] xl:h-[190px] rounded-full overflow-hidden object-center group-hover:opacity-90 transition-opacity"
      >
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover object-center"
        />
      </div>
      <p className="text-xs sm:text-sm text-gray-700 font-medium text-center group-hover:text-purple-600 transition-colors">{name}</p>
    </Link>
  );
}
