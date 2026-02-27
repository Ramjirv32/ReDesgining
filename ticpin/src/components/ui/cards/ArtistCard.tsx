'use client';

interface ArtistCardProps {
    name: string;
    image?: string;
}

export default function ArtistCard({ name, image }: ArtistCardProps) {
    return (
        <div className="flex flex-col items-center gap-4 group cursor-pointer flex-shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-zinc-200 overflow-hidden bg-zinc-100 shadow-sm transition-all group-hover:shadow-lg group-hover:scale-105">
                {image ? (
                    <img src={image} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-zinc-200" />
                )}
            </div>
            <span className="text-sm font-black text-zinc-900 group-hover:text-primary transition-colors">{name}</span>
        </div>
    );
}
