interface SportCardProps {
  name: string
}

export default function SportCard({ name }: SportCardProps) {
  return (
    <div
      className="rounded-[30px] p-5 flex flex-col items-start justify-start cursor-pointer relative overflow-hidden shrink-0 border border-gray-300 transition-all duration-300 hover:scale-105 hover:shadow-xl"
      style={{
        width: '180px',
        height: '234px',
        background: 'linear-gradient(135deg, #E7C200 0%, #FFEF9A 100%)'
      }}
    >
      {/* Title at the top-left */}
      <h3 className="text-[20px] font-bold text-black leading-tight">
        {name}
      </h3>

      {/* Central Icon Placeholder (Rotated squircle) */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-20 h-20 bg-[#FFEF9A] rounded-[24px] rotate-45 flex items-center justify-center border border-[#E7C200]/20">
          <div className="w-14 h-14 bg-[#FFF8D6] rounded-[12px] rotate-0" />
        </div>
      </div>

      {/* Optional bottom branding placeholder */}
      <div className="absolute bottom-6 left-6">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#E7C200] text-[10px] font-bold">N</div>
      </div>
    </div>
  )
}
