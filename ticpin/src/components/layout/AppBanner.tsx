'use client';

interface AppBannerProps {
    title?: string;
    subtitle?: string;
    bgImage?: string;
}

export default function AppBanner({
    title = "DOWNLOAD APP",
    subtitle = "Experience everything on mobile",
    bgImage = "/login/banner.jpeg"
}: AppBannerProps) {
    return (
        <div className="h-[300px] md:h-[459px] w-full max-w-[1361px] mx-auto bg-[#1a1a1a] rounded-[20px] md:rounded-[30px] flex items-center justify-center overflow-hidden relative group border border-zinc-200 mt-12 sm:mt-16">
            <div
                className="absolute inset-0 opacity-20 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                style={{ backgroundImage: `url('${bgImage}')` }}
            />
        </div>
    );
}
