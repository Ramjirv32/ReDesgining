interface VenueCardProps {
    id?: string;
    name: string;
    location: string;
    image: string;
}

export default function VenueCard({ name, location, image }: VenueCardProps) {
    return (
        <div className="group mx-auto w-full max-w-[329px] h-[301px] transition-all duration-300 hover:-translate-y-1">
            <div className="bg-white rounded-[15px] border border-[#686868] overflow-hidden shadow-sm flex flex-col h-full hover:shadow-lg transition-shadow">
                <div className="relative w-full h-[185px] overflow-hidden">
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>
                <div className="p-5 h-[116px] bg-white border-t border-[#686868] rounded-b-[15px] flex flex-col items-start justify-between font-[family-name:var(--font-anek-latin)]">
                    <div className="flex flex-col items-start">
                        <h3 className="text-[24px] font-medium text-black leading-tight line-clamp-1">{name}</h3>
                        <div className="text-base text-[#686868] font-medium line-clamp-1">
                            {location}
                        </div>
                    </div>
                    <span
                        className="flex items-center justify-center bg-[#D9D9D9] text-[15px] font-medium text-black rounded-full px-4 py-1"
                    >
                        Play options
                    </span>
                </div>
            </div>
        </div>
    );
}
