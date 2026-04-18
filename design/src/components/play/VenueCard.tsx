import Link from 'next/link';

interface VenueCardProps {
    id?: string;
    name: string;
    location: string;
    image: string;
}

export default function VenueCard({ id = '1', name, location, image }: VenueCardProps) {
    return (
        <Link href={`/play/${id}`} className="block">
            <div className="group cursor-pointer mx-auto w-full max-w-[329px] h-[301px]">
                <div className="bg-white rounded-[15px] border border-[#686868] overflow-hidden shadow-sm flex flex-col h-full">
                    <div className="relative w-full h-[185px] overflow-hidden">
                        <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="p-5 h-[116px] bg-white border-t border-[#686868] rounded-b-[15px] flex flex-col items-start justify-between font-[family-name:var(--font-anek-latin)]">
                        <div className="flex flex-col items-start">
                            <h3 className="text-[24px] font-medium text-black leading-tight">{name}</h3>
                            <div className="text-base text-[#686868] font-medium">
                                {location}
                            </div>
                        </div>
                        <span
                            className="flex items-center justify-center bg-[#D9D9D9] text-[15px] font-medium text-black ml-[-10px] mt-[5px]"
                            style={{
                                width: '100px',
                                height: '30px',
                                borderRadius: '15px'
                            }}
                        >
                            Play options
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
