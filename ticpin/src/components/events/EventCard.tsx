import Link from 'next/link';

interface EventCardProps {
  id?: string;
  name: string;
  location: string;
  date: string;
  time: string;
  ticketPrice: string;
  image: string;
}

export default function EventCard({
  id = '1',
  name,
  location,
  date,
  time,
  ticketPrice,
  image,
}: EventCardProps) {
  return (
    <Link href={`/events/${id}`} className="block h-full">
      <div
        className="overflow-hidden cursor-pointer w-full sm:w-auto flex flex-col hover:shadow-lg transition-all"
        style={{
          width: '285px',
          height: '560px',
          background: 'white',
          borderRadius: '10px',
          border: '1px solid #686868'
        }}
      >
        <div className="flex-shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center"
          style={{ height: '380px' }}
        >
          <img
            src={image}
            alt={name}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="text-xs font-semibold text-purple-600 mb-2">
            {date} / {time}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
            {name}
          </h3>
          <p className="text-sm text-gray-600 mb-3">{location}</p>
          <p className="text-xs text-gray-500 mt-auto">
            Tickets starting at <span className="font-semibold text-gray-700">{ticketPrice}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
