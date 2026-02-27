'use client';

interface CouponCardProps {
    discount: string;
    code: string;
}

export default function CouponCard({ discount, code }: CouponCardProps) {
    return (
        <div className="relative w-[340px] h-[142px] flex-shrink-0 cursor-pointer group">
            {/* SVG Background */}
            <div className="absolute inset-0">
                <svg width="100%" height="100%" viewBox="0 0 429 179" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M147.469 25.9839C166.634 25.9839 182.668 17.3232 186.707 5.72916C187.743 2.75314 188.261 1.26513 189.486 0.632566C190.71 2.74181e-06 192.681 0 196.625 0H290.469C353.543 0 385.081 -4.76837e-06 405.517 11.9664C407.251 12.9818 408.909 14.0515 410.477 15.172C429 28.3747 429 48.7498 429 89.5C429 130.25 429 150.625 410.477 163.828C408.909 164.949 407.251 166.018 405.517 167.034C385.081 179 353.543 179 290.469 179H196.625C192.681 179 190.71 179 189.486 178.367C188.261 177.735 187.743 176.247 186.707 173.271C182.668 161.677 166.634 153.016 147.469 153.016C128.37 153.016 112.38 161.617 108.273 173.151C107.204 176.154 106.669 177.656 105.415 178.287C104.161 178.917 102.182 178.889 98.2222 178.834C60.9336 178.308 39.0064 176.123 23.4837 167.034C21.7494 166.018 20.0937 164.949 18.5221 163.828C0 150.625 0 130.25 0 89.5C0 48.7498 0 28.3747 18.5221 15.172C20.0937 14.0515 21.7494 12.9818 23.4837 11.9664C39.0064 2.87699 60.9336 0.691743 98.2222 0.166291C102.182 0.11057 104.161 0.0825757 105.415 0.713118C106.669 1.34366 107.204 2.84553 108.273 5.84897C112.38 17.3829 128.37 25.9839 147.469 25.9839Z" fill="url(#paint0_linear_15_49)" />
                    <defs>
                        <linearGradient id="paint0_linear_15_49" x1="-559" y1="-481" x2="400" y2="166.5" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#866BFF" />
                            <stop offset="1" stopColor="#BDB1F3" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex">
                {/* Left Part */}
                <div className="w-[34%] flex flex-col items-center justify-center p-4">
                    <span className="text-sm md:text-base font-black text-white leading-tight text-center uppercase tracking-tighter">
                        FLAT<br />{discount} OFF
                    </span>
                </div>

                {/* Divider Line */}
                <div className="flex items-center justify-center">
                    <div className="w-[1px] h-[73px] bg-white"></div>
                </div>

                {/* Right Part */}
                <div className="w-[66%] flex flex-col justify-center p-6 pl-8">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Coupon Code</span>
                    <span className="text-xl md:text-2xl font-black text-white tracking-widest uppercase truncate">{code}</span>
                </div>
            </div>
        </div>
    );
}
