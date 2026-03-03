import Image from 'next/image';

interface FilterButtonProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export default function FilterButton({ label, active = false, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-base font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${active
        ? 'bg-[#d9d9d9] opacity-100 text-black shadow-inner'
        : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      style={{
        border: '1px solid #a4a4a4',
        borderRadius: '21px'
      }}
    >
      {label === 'Filters' && (
        <Image src="/filter 1.png" alt="Filter" width={18} height={18} className="object-contain" />
      )}
      {label}
      {label === 'Filters' && (
        <Image src="/filter arrow.svg" alt="arrow" width={10} height={6} className="ml-1" />
      )}
    </button>
  );
}
