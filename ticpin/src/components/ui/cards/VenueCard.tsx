import Image from 'next/image'
import type { Venue } from '@/data/venues'

interface VenueCardProps {
  venue: Venue
}

export default function VenueCard({ venue }: VenueCardProps) {
  return (
    <div className="relative w-full bg-white rounded-[15px] border border-[#686868] overflow-hidden" style={{ height: '430px' }}>
      {/* Image Section */}
      <div className="relative w-full h-52 rounded-tl-[15px] rounded-bl-[15px] overflow-hidden">
        <Image
          src={venue.image || "/placeholder.svg"}
          alt={venue.name}
          fill
          className="object-cover"
        />
      </div>
      
      {/* Content Section - White box at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#686868] rounded-br-[15px] rounded-bl-[15px] px-5 py-4">
        {/* Name */}
        <h3 className="text-black text-2xl font-medium font-['Anek_Latin'] line-clamp-1 mb-1">
          {venue.name}
        </h3>
        
        {/* Location */}
        <p className="text-[#686868] text-base font-medium font-['Anek_Latin'] line-clamp-1 mb-4">
          {venue.location}
        </p>
        
        {/* Play Options Button */}
        <button className="px-4 py-1.5 bg-[#D9D9D9] text-black text-xs font-medium font-['Anek_Latin'] rounded-full hover:bg-gray-300 transition-colors">
          Play options
        </button>
      </div>
    </div>
  )
}
