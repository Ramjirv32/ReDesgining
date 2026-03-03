import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1440px] mx-auto px-4 md:px-10 lg:px-16 py-8 md:py-12 space-y-12 md:space-y-20">
                {/* Explore Sports Skeleton */}
                <section className="space-y-8 md:space-y-10">
                    <Skeleton variant="text" className="h-10 w-48 mb-6" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 px-2 max-w-5xl">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="w-[172px] h-[235px] bg-zinc-100 rounded-[30px] animate-pulse mx-auto" />
                        ))}
                    </div>
                </section>

                {/* All Sports Venues Skeleton */}
                <section className="space-y-8 md:space-y-10">
                    <Skeleton variant="text" className="h-10 w-64 mb-6" />

                    {/* Filters Skeleton */}
                    <div className="flex gap-3 overflow-hidden pb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-10 w-24 bg-zinc-100 rounded-full animate-pulse shrink-0" />
                        ))}
                    </div>

                    {/* Venues Grid Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="w-full max-w-[329px] h-[320px] bg-zinc-100 rounded-[15px] animate-pulse" />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
