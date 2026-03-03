import Image from 'next/image';

interface VenueCardProps {
    id?: string;
    name: string;
    location: string;
    image: string;
    priceStartsFrom?: number;
}

export default function VenueCard({ name, location, image, priceStartsFrom }: VenueCardProps) {
    return (
        <div className="group mx-auto w-full max-w-[329px] h-[320px] transition-all duration-300 hover:-translate-y-1">
            <div className="bg-white rounded-[15px] border border-[#686868] overflow-hidden shadow-sm flex flex-col h-full hover:shadow-lg transition-shadow">
                <div className="relative w-full h-[185px] overflow-hidden">
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                </div>
                <div className="p-4 h-[135px] bg-white border-t border-[#686868] rounded-b-[15px] flex flex-col items-start justify-between font-[family-name:var(--font-anek-latin)]">
                    <div className="flex flex-col items-start w-full">
                        <div className="flex justify-between items-start w-full">
                            <h3 className="text-[22px] font-semibold text-black leading-tight line-clamp-1 truncate flex-1 uppercase tracking-tight">{name}</h3>
                            {priceStartsFrom !== undefined && (
                                <span className="text-[18px] font-bold text-black ml-2 whitespace-nowrap">₹{priceStartsFrom}</span>
                            )}
                        </div>
                        <div className="text-[15px] text-[#686868] font-medium line-clamp-1 mt-0.5 uppercase tracking-wider">
                            {location}
                        </div>
                    </div>
                    <div className="w-full flex justify-between items-center mt-auto">
                        <span className="flex items-center justify-center bg-[#D9D9D9] text-[13px] font-semibold text-black rounded-full px-4 py-1 uppercase tracking-wider">
                            Play options
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
